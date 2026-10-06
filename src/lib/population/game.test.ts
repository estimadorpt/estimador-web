import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CLUE_ORDER,
  COMPASS,
  MAX_GUESSES,
  answerOrder,
  applyGuess,
  chunkOf,
  cluesOpen,
  compass8,
  computeStats,
  dateOfDay,
  daysBetween,
  emptyStore,
  formatCountdown,
  formatGameDate,
  formatKm,
  guessFeedback,
  initialBearing,
  lisbonDate,
  maxPairDistanceKm,
  msUntilNextLisbonMidnight,
  newRecord,
  parseStore,
  proximity,
  proximityScale,
  putRecord,
  recordFor,
  shareText,
  todayIndex,
  type GamePlace,
  type GameRecord,
  type GameStore,
} from './game';
import { haversineKm, indexPlaces } from './places';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { GameEntry, GameIndex, PopulationPlaces } from '@/types/population';

const DATA = path.resolve(import.meta.dirname, '../../../public/data', POPULATION_DATA_DIR);
const index = JSON.parse(readFileSync(path.join(DATA, 'game/index.json'), 'utf8')) as GameIndex;
const places = indexPlaces(JSON.parse(readFileSync(path.join(DATA, 'places.json'), 'utf8')) as PopulationPlaces);

const EMOJI = /\p{Extended_Pictographic}/u;

describe('the Lisbon calendar', () => {
  it('reads the date in Lisbon, not UTC, on both sides of midnight', () => {
    // Summer time (UTC+1): 23:00 UTC is already the next day in Lisbon.
    expect(lisbonDate(new Date('2026-10-05T22:59:59Z'))).toBe('2026-10-05');
    expect(lisbonDate(new Date('2026-10-05T23:00:00Z'))).toBe('2026-10-06');
    // Winter time (UTC+0): midnight in Lisbon is midnight UTC.
    expect(lisbonDate(new Date('2026-12-31T23:59:59Z'))).toBe('2026-12-31');
    expect(lisbonDate(new Date('2027-01-01T00:00:00Z'))).toBe('2027-01-01');
  });

  it('counts game days from the epoch', () => {
    expect(index.epoch).toBe('2026-10-05');
    expect(todayIndex(index.epoch, new Date('2026-10-05T12:00:00Z'))).toBe(0);
    expect(todayIndex(index.epoch, new Date('2026-10-04T23:00:00Z'))).toBe(0); // 00:00 on the 5th in Lisbon
    expect(todayIndex(index.epoch, new Date('2026-10-04T22:59:59Z'))).toBe(0); // before the epoch: clamped
    expect(todayIndex(index.epoch, new Date('2026-10-05T23:00:00Z'))).toBe(1);
    expect(todayIndex(index.epoch, new Date('2027-01-01T00:00:00Z'))).toBe(88);
    expect(daysBetween('2026-10-05', '2026-10-01')).toBe(-4);
  });

  it('keeps whole days across the clock changes', () => {
    // Clocks go back on 25 Oct 2026 and forward on 28 Mar 2027 (01:00 UTC).
    expect(todayIndex(index.epoch, new Date('2026-10-24T22:59:59Z'))).toBe(19);
    expect(todayIndex(index.epoch, new Date('2026-10-24T23:00:00Z'))).toBe(20); // 25 Oct, 00:00 WEST
    expect(todayIndex(index.epoch, new Date('2026-10-25T23:59:59Z'))).toBe(20); // 25 Oct, 23:59 WET
    expect(todayIndex(index.epoch, new Date('2026-10-26T00:00:00Z'))).toBe(21);
    expect(lisbonDate(new Date('2027-03-27T23:59:59Z'))).toBe('2027-03-27');
    expect(lisbonDate(new Date('2027-03-28T00:00:00Z'))).toBe('2027-03-28');
    expect(lisbonDate(new Date('2027-03-28T22:59:59Z'))).toBe('2027-03-28');
    expect(lisbonDate(new Date('2027-03-28T23:00:00Z'))).toBe('2027-03-29');
  });

  it('maps day numbers back to dates', () => {
    expect(dateOfDay(index.epoch, 0)).toBe('2026-10-05');
    expect(dateOfDay(index.epoch, 27)).toBe('2026-11-01');
    expect(dateOfDay(index.epoch, 88)).toBe('2027-01-01');
    for (let day = 0; day < 800; day += 37) expect(daysBetween(index.epoch, dateOfDay(index.epoch, day))).toBe(day);
  });

  it('counts down to the next midnight in Lisbon, including 23- and 25-hour days', () => {
    expect(msUntilNextLisbonMidnight(new Date('2026-10-05T12:00:00Z'))).toBe(11 * 3600_000); // 13:00 WEST
    expect(msUntilNextLisbonMidnight(new Date('2026-10-05T22:59:59Z'))).toBe(1000);
    expect(msUntilNextLisbonMidnight(new Date('2026-10-05T23:00:00Z'))).toBe(24 * 3600_000);
    // 25 October is 25 hours long.
    expect(msUntilNextLisbonMidnight(new Date('2026-10-24T23:00:00Z'))).toBe(25 * 3600_000);
    // 28 March 2027 is 23 hours long.
    expect(msUntilNextLisbonMidnight(new Date('2027-03-28T00:00:00Z'))).toBe(23 * 3600_000);
    expect(msUntilNextLisbonMidnight(new Date('2026-12-31T23:30:00Z'))).toBe(30 * 60_000);
  });

  it('formats the countdown', () => {
    expect(formatCountdown(11 * 3600_000 + 5 * 60_000 + 9_000)).toBe('11:05:09');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });
});

describe('the day’s parish', () => {
  it('cycles through every candidate', () => {
    expect(answerOrder(0, index.candidates)).toBe(0);
    expect(answerOrder(index.candidates, index.candidates)).toBe(0);
    expect(answerOrder(index.candidates + 5, index.candidates)).toBe(5);
    expect(answerOrder(-1, index.candidates)).toBe(index.candidates - 1);
  });

  it('finds each candidate in its chunk, and only there', () => {
    expect(index.chunk_size).toBe(32);
    expect(chunkOf(0, 32)).toBe(0);
    expect(chunkOf(31, 32)).toBe(0);
    expect(chunkOf(32, 32)).toBe(1);
    expect(chunkOf(index.candidates - 1, index.chunk_size)).toBe(index.chunks - 1);
    for (const day of [0, 1, 31, 32, 500, index.candidates - 1, index.candidates + 40]) {
      const order = answerOrder(day, index.candidates);
      const chunk = chunkOf(order, index.chunk_size);
      const entries = JSON.parse(readFileSync(path.join(DATA, `game/chunk-${String(chunk).padStart(3, '0')}.json`), 'utf8')) as GameEntry[];
      const entry = entries.find(e => e.order === order);
      expect(entry, `day ${day}`).toBeDefined();
      expect(places.byCode.has(entry!.code)).toBe(true);
      for (const recipes of CLUE_ORDER) for (const recipe of recipes) expect(entry!.responses[recipe]).toBeDefined();
    }
  });

  it('draws from every parish, of any tier, each answering with its own figures', () => {
    expect(index.candidates).toBe(places.parishes.length);
    expect(index.chunks).toBe(Math.ceil(index.candidates / index.chunk_size));
    expect([...index.eligible_tiers].sort()).toEqual(['A', 'B', 'C']);
    const read = (chunk: number) => JSON.parse(readFileSync(path.join(DATA, `game/chunk-${String(chunk).padStart(3, '0')}.json`), 'utf8')) as GameEntry[];
    const entries = Array.from({ length: index.chunks }, (_, chunk) => read(chunk)).flat();
    expect(new Set(entries.map(e => e.code)).size).toBe(index.candidates);
    const tiers = { A: 0, B: 0, C: 0 };
    for (const entry of entries) {
      tiers[entry.tier] += 1;
      expect(entry.tier).toBe(places.byCode.get(entry.code)!.tier);
      for (const response of Object.values(entry.responses)) {
        expect(response.decision).toBe('publish');
        expect(response.resolved_tier).toBe(entry.tier);
        expect(response.cells.every(cell => cell.length === 3)).toBe(true);
      }
    }
    expect(tiers).toEqual({ A: 776, B: 705, C: 1611 });
    // Day 0 (the publication date) is a tier C parish.
    const first = read(0).find(e => e.order === answerOrder(0, index.candidates))!;
    expect(first.code).toBe('030857');
    expect(first.tier).toBe('C');
  });
});

describe('geography of a guess', () => {
  it('measures bearings clockwise from north', () => {
    const lisbon = { lat: 38.72, lon: -9.14 };
    expect(initialBearing(lisbon, { lat: 41.15, lon: -9.14 })).toBeCloseTo(0, 5);
    expect(initialBearing(lisbon, { lat: 36.0, lon: -9.14 })).toBeCloseTo(180, 5);
    expect(initialBearing(lisbon, { lat: 38.72, lon: -7.0 })).toBeGreaterThan(85);
    expect(initialBearing(lisbon, { lat: 38.72, lon: -7.0 })).toBeLessThan(95);
    expect(initialBearing(lisbon, { lat: 38.72, lon: -11.0 })).toBeGreaterThan(265);
  });

  it('rounds bearings to eight points', () => {
    expect(compass8(0)).toBe('N');
    expect(compass8(22.4)).toBe('N');
    expect(compass8(22.6)).toBe('NE');
    expect(compass8(90)).toBe('E');
    expect(compass8(180)).toBe('S');
    expect(compass8(200)).toBe('S');
    expect(compass8(247)).toBe('SW');
    expect(compass8(292)).toBe('W');
    expect(compass8(293)).toBe('NW');
    expect(compass8(337.4)).toBe('NW');
    expect(compass8(337.6)).toBe('N');
    expect(compass8(359.9)).toBe('N');
    expect(compass8(-45)).toBe('NW');
    for (const point of Object.values(COMPASS)) expect(compass8(point.deg)).toBe(Object.entries(COMPASS).find(([, v]) => v === point)![0]);
  });

  it('finds the widest pair of parishes, as every pair would', () => {
    const points = places.parishes;
    const fast = maxPairDistanceKm(points);
    let brute = 0;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const d = haversineKm(points[i], points[j]);
        if (d > brute) brute = d;
      }
    }
    expect(fast).toBeCloseTo(brute, 6);
    expect(fast).toBeGreaterThan(1500); // Azores to the mainland
  });

  it('scores proximity between 0 and 100', () => {
    expect(proximity(0, 2000)).toBe(100);
    expect(proximity(1000, 2000)).toBe(50);
    expect(proximity(2000, 2000)).toBe(0);
    expect(proximity(2500, 2000)).toBe(0);
    expect(proximity(-1, 2000)).toBe(100);
  });

  it('describes a guess against the answer', () => {
    const answer: GamePlace = { code: '110601', municipality: '1106', region: '11', lat: 38.72, lon: -9.14 };
    const neighbour: GamePlace = { code: '110602', municipality: '1106', region: '11', lat: 38.75, lon: -9.14 };
    const porto: GamePlace = { code: '131201', municipality: '1312', region: '13', lat: 41.15, lon: -8.61 };
    const near = guessFeedback(neighbour, answer, 2000);
    expect(near.correct).toBe(false);
    expect(Math.round(near.distanceKm)).toBe(3);
    expect(near.compass).toBe('S');
    expect(near.sameMunicipality).toBe(true);
    expect(near.sameRegion).toBe(true);
    const far = guessFeedback(porto, answer, 2000);
    expect(far.compass).toBe('S');
    expect(far.sameMunicipality).toBe(false);
    expect(far.sameRegion).toBe(false);
    expect(far.proximity).toBeLessThan(near.proximity);
    const hit = guessFeedback(answer, answer, 2000);
    expect(hit).toMatchObject({ correct: true, distanceKm: 0, bearing: null, compass: null, proximity: 100 });
  });

  it('scales mainland guesses to the mainland (pub-PP-07: Sagres is not 76% close to Bragança)', () => {
    const scale = proximityScale(places.parishes);
    expect(scale.mainland).toBeLessThan(800);
    expect(scale.all).toBeGreaterThan(1500);
    const sagres: GamePlace = { code: '081501', municipality: '0815', region: '08', lat: 37.01, lon: -8.94 };
    const braganca: GamePlace = { code: '040201', municipality: '0402', region: '04', lat: 41.81, lon: -6.76 };
    const mainland = guessFeedback(sagres, braganca, scale);
    expect(mainland.proximity).toBeLessThan(40);
    // A guess on an island is still measured against the whole country.
    const azores: GamePlace = { code: '420101', municipality: '4201', region: 'azores', lat: 37.74, lon: -25.67 };
    expect(guessFeedback(azores, braganca, scale).proximity).toBeCloseTo(proximity(haversineKm(azores, braganca), scale.all), 6);
  });
});

describe('the guess state machine', () => {
  const answer = 'ANSWER';

  it('opens one clue at the start and one per miss', () => {
    let record = newRecord(0, true);
    expect(cluesOpen(record, answer)).toBe(1);
    for (let i = 1; i <= 5; i++) {
      record = applyGuess(record, `MISS${i}`, answer);
      expect(record.status).toBe('playing');
      expect(cluesOpen(record, answer)).toBe(1 + i);
    }
    expect(CLUE_ORDER).toHaveLength(6);
  });

  it('loses on the sixth miss and then ignores guesses', () => {
    let record = newRecord(0, true);
    for (let i = 1; i <= MAX_GUESSES; i++) record = applyGuess(record, `MISS${i}`, answer);
    expect(record.status).toBe('lost');
    expect(record.guesses).toHaveLength(6);
    expect(cluesOpen(record, answer)).toBe(6);
    expect(applyGuess(record, answer, answer)).toBe(record);
  });

  it('wins on the right parish, at any guess', () => {
    let record = newRecord(3, false);
    record = applyGuess(record, 'MISS1', answer);
    record = applyGuess(record, answer, answer);
    expect(record).toEqual({ day: 3, guesses: ['MISS1', answer], status: 'won', live: false });
    expect(applyGuess(record, 'MISS2', answer)).toBe(record);
    expect(applyGuess(newRecord(0, true), answer, answer).status).toBe('won');
  });

  it('ignores repeated and empty guesses', () => {
    const record = applyGuess(newRecord(0, true), 'MISS1', answer);
    expect(applyGuess(record, 'MISS1', answer)).toBe(record);
    expect(applyGuess(record, '', answer)).toBe(record);
  });
});

describe('share text', () => {
  const feedback = [
    { code: 'A', correct: false, distanceKm: 411.6, bearing: 40, compass: 'NE' as const, proximity: 80, sameMunicipality: false, sameRegion: false },
    { code: 'B', correct: false, distanceKm: 37.2, bearing: 310, compass: 'NW' as const, proximity: 98, sameMunicipality: false, sameRegion: true },
    { code: 'C', correct: true, distanceKm: 0, bearing: null, compass: null, proximity: 100, sameMunicipality: true, sameRegion: true },
  ];
  const won: GameRecord = { day: 0, guesses: ['A', 'B', 'C'], status: 'won', live: true };

  it('says the date, the score and each miss, in Portuguese', () => {
    expect(shareText({ date: '2026-10-05', record: won, feedback, locale: 'pt' })).toBe(
      'Freguesia misteriosa · 5 out. 2026\n3/6\n⇗ 412 km\n⇖ 37 km\nacertei\nestimador.pt/pt/populacao/misteriosa/',
    );
  });

  it('says it in English, and marks a loss', () => {
    const lost: GameRecord = { day: 1, guesses: ['A', 'B', 'D', 'E', 'F', 'G'], status: 'lost', live: true };
    const misses = Array.from({ length: 6 }, (_, i) => ({ ...feedback[0], code: String(i), distanceKm: 1234.4 }));
    const text = shareText({ date: '2026-10-06', record: lost, feedback: misses, locale: 'en' });
    expect(text.split('\n')).toEqual([
      'Mystery parish · 6 Oct 2026', 'X/6',
      ...Array(6).fill('⇗ 1,234 km'),
      'missed it', 'estimador.pt/en/populacao/misteriosa/',
    ]);
  });

  it('never contains an emoji, whatever the directions', () => {
    for (const locale of ['pt', 'en'] as const) {
      const all = Object.keys(COMPASS).map((compass, i) => ({ ...feedback[0], code: String(i), compass: compass as keyof typeof COMPASS }));
      const text = shareText({ date: '2026-10-05', record: { day: 0, guesses: all.map(a => a.code), status: 'lost', live: true }, feedback: all, locale });
      expect(text).not.toMatch(EMOJI);
      expect(text).not.toMatch(/\p{Emoji_Presentation}/u);
      expect(text).not.toContain('️');
      for (const { arrow } of Object.values(COMPASS)) expect(arrow).not.toMatch(EMOJI);
    }
  });

  it('never names a guess', () => {
    const text = shareText({ date: '2026-10-05', record: won, feedback, locale: 'pt' });
    for (const code of ['A', 'B', 'C']) expect(text).not.toMatch(new RegExp(`\\b${code}\\b`));
  });

  it('formats dates and distances per locale', () => {
    expect(formatGameDate('2026-12-01', 'pt')).toBe('1 dez. 2026');
    expect(formatGameDate('2026-05-31', 'en')).toBe('31 May 2026');
    expect(formatKm(0.4, 'pt')).toBe('0 km');
    expect(formatKm(1500.6, 'en')).toBe('1,501 km');
    expect(formatKm(1234.2, 'pt')).toBe('1\u00A0234 km');
  });
});

describe('stored results and stats', () => {
  const finished = (day: number, status: 'won' | 'lost', guesses = 3, live = true): GameRecord =>
    ({ day, guesses: Array.from({ length: status === 'lost' ? 6 : guesses }, (_, i) => `G${i}`), status, live });

  const store = (...records: GameRecord[]): GameStore => records.reduce(putRecord, emptyStore());

  it('reads back what it wrote and survives junk', () => {
    const s = store(finished(0, 'won'), finished(1, 'lost'));
    expect(parseStore(JSON.stringify(s))).toEqual(s);
    expect(parseStore(null)).toEqual(emptyStore());
    expect(parseStore('not json')).toEqual(emptyStore());
    expect(parseStore('{"v":2,"records":{}}')).toEqual(emptyStore());
    expect(parseStore('{"v":1,"records":{"4":{"day":5,"guesses":[],"status":"won","live":true},"6":{"day":6}}}')).toEqual(emptyStore());
  });

  it('keeps one record per day and never turns practice into a live game', () => {
    let s = putRecord(emptyStore(), newRecord(2, false));
    s = putRecord(s, { ...finished(2, 'won'), live: true });
    expect(Object.keys(s.records)).toEqual(['2']);
    expect(s.records['2'].live).toBe(false);
    // A live game finished after midnight stays live.
    let t = putRecord(emptyStore(), newRecord(5, true));
    t = putRecord(t, finished(5, 'won', 2, false));
    expect(t.records['5'].live).toBe(true);
  });

  it('makes today live and earlier days practice', () => {
    expect(recordFor(emptyStore(), 7, 7).live).toBe(true);
    expect(recordFor(emptyStore(), 6, 7).live).toBe(false);
    const s = store(finished(6, 'won'));
    expect(recordFor(s, 6, 7)).toBe(s.records['6']);
  });

  it('counts played, won, streaks and the distribution from live games only', () => {
    const s = store(
      finished(0, 'won', 1), finished(1, 'won', 2), finished(2, 'won', 2),
      finished(3, 'lost'),
      finished(4, 'won', 6), finished(5, 'won', 3),
      finished(6, 'won', 1, false), // practice
    );
    const stats = computeStats(s, 6);
    expect(stats).toMatchObject({ played: 6, won: 5, lost: 1, bestStreak: 3, currentStreak: 2 });
    expect(stats.distribution).toEqual([1, 2, 1, 0, 0, 1]);
  });

  it('keeps the streak alive until today is finished, and breaks it on a loss or a gap', () => {
    const base = store(finished(4, 'won'), finished(5, 'won'));
    expect(computeStats(base, 6).currentStreak).toBe(2); // today not played yet
    expect(computeStats(putRecord(base, applyGuess(newRecord(6, true), 'X', 'Y')), 6).currentStreak).toBe(2); // in progress
    expect(computeStats(putRecord(base, finished(6, 'won')), 6).currentStreak).toBe(3);
    expect(computeStats(putRecord(base, finished(6, 'lost')), 6).currentStreak).toBe(0);
    expect(computeStats(base, 7).currentStreak).toBe(0); // missed day 6
    expect(computeStats(base, 7).bestStreak).toBe(2);
    expect(computeStats(emptyStore(), 0)).toEqual({ played: 0, won: 0, currentStreak: 0, bestStreak: 0, distribution: [0, 0, 0, 0, 0, 0], lost: 0 });
  });
});
