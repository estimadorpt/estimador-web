import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CHOICE_COUNT,
  CLUE_COUNT,
  CLUE_ORDER,
  GAME_STORAGE_KEY,
  answerOrder,
  applyPick,
  chunkOf,
  cluesOpen,
  computeStats,
  dateOfDay,
  daysBetween,
  emptyStore,
  formatCountdown,
  formatGameDate,
  gameChoices,
  lisbonDate,
  msUntilNextLisbonMidnight,
  newRecord,
  onIslands,
  openNextClue,
  orderChoices,
  parseStore,
  putRecord,
  recordFor,
  shareMessage,
  shareText,
  todayIndex,
  wrongPicks,
  type GameRecord,
  type GameStore,
} from './game';
import { indexPlaces } from './places';
import { POPULATION_DATA_DIR, POPULATION_GAME_EPOCH } from '@/lib/config/population';
import type { GameEntry, GameIndex, PopulationPlaces } from '@/types/population';

const DATA = path.resolve(import.meta.dirname, '../../../public/data', POPULATION_DATA_DIR);
const index = JSON.parse(readFileSync(path.join(DATA, 'game/index.json'), 'utf8')) as GameIndex;
const placesJson = JSON.parse(readFileSync(path.join(DATA, 'places.json'), 'utf8')) as PopulationPlaces;
const places = indexPlaces(placesJson);
const readChunk = (chunk: number) => JSON.parse(readFileSync(path.join(DATA, `game/chunk-${String(chunk).padStart(3, '0')}.json`), 'utf8')) as GameEntry[];
/** Every candidate, by its order in the deck. */
const deck = Array.from({ length: index.chunks }, (_, chunk) => readChunk(chunk)).flat().sort((a, b) => a.order - b.order);

const EMOJI = /\p{Extended_Pictographic}/u;

describe('the Lisbon calendar', () => {
  // The calendar arithmetic, on a fixed epoch (the game's own is checked below).
  const EPOCH = '2026-10-05';

  it('starts the game on launch day: game/index.json carries POPULATION_GAME_EPOCH', () => {
    // scripts/sync-population.py reads the constant; if either moves alone, this fails.
    expect(index.epoch).toBe(POPULATION_GAME_EPOCH);
    // On launch day, in Lisbon, the board is N.º 1 and plays the curated day-0 parish.
    const launch = new Date(`${POPULATION_GAME_EPOCH}T00:00:00+01:00`);
    expect(todayIndex(index.epoch, launch)).toBe(0);
    expect(todayIndex(index.epoch, new Date(launch.getTime() + 23.9 * 3600_000))).toBe(0);
    expect(todayIndex(index.epoch, new Date(launch.getTime() + 24 * 3600_000))).toBe(1);
    expect(dateOfDay(index.epoch, 0)).toBe(POPULATION_GAME_EPOCH);
    expect(answerOrder(0, index.candidates)).toBe(0);
  });

  it('reads the date in Lisbon, not UTC, on both sides of midnight', () => {
    // Summer time (UTC+1): 23:00 UTC is already the next day in Lisbon.
    expect(lisbonDate(new Date('2026-10-05T22:59:59Z'))).toBe('2026-10-05');
    expect(lisbonDate(new Date('2026-10-05T23:00:00Z'))).toBe('2026-10-06');
    // Winter time (UTC+0): midnight in Lisbon is midnight UTC.
    expect(lisbonDate(new Date('2026-12-31T23:59:59Z'))).toBe('2026-12-31');
    expect(lisbonDate(new Date('2027-01-01T00:00:00Z'))).toBe('2027-01-01');
  });

  it('counts game days from the epoch', () => {
    expect(todayIndex(EPOCH, new Date('2026-10-05T12:00:00Z'))).toBe(0);
    expect(todayIndex(EPOCH, new Date('2026-10-04T23:00:00Z'))).toBe(0); // 00:00 on the 5th in Lisbon
    expect(todayIndex(EPOCH, new Date('2026-10-04T22:59:59Z'))).toBe(0); // before the epoch: clamped
    expect(todayIndex(EPOCH, new Date('2026-10-05T23:00:00Z'))).toBe(1);
    expect(todayIndex(EPOCH, new Date('2027-01-01T00:00:00Z'))).toBe(88);
    expect(daysBetween('2026-10-05', '2026-10-01')).toBe(-4);
  });

  it('keeps whole days across the clock changes', () => {
    // Clocks go back on 25 Oct 2026 and forward on 28 Mar 2027 (01:00 UTC).
    expect(todayIndex(EPOCH, new Date('2026-10-24T22:59:59Z'))).toBe(19);
    expect(todayIndex(EPOCH, new Date('2026-10-24T23:00:00Z'))).toBe(20); // 25 Oct, 00:00 WEST
    expect(todayIndex(EPOCH, new Date('2026-10-25T23:59:59Z'))).toBe(20); // 25 Oct, 23:59 WET
    expect(todayIndex(EPOCH, new Date('2026-10-26T00:00:00Z'))).toBe(21);
    expect(lisbonDate(new Date('2027-03-27T23:59:59Z'))).toBe('2027-03-27');
    expect(lisbonDate(new Date('2027-03-28T00:00:00Z'))).toBe('2027-03-28');
    expect(lisbonDate(new Date('2027-03-28T22:59:59Z'))).toBe('2027-03-28');
    expect(lisbonDate(new Date('2027-03-28T23:00:00Z'))).toBe('2027-03-29');
  });

  it('maps day numbers back to dates', () => {
    expect(dateOfDay(EPOCH, 0)).toBe('2026-10-05');
    expect(dateOfDay(EPOCH, 27)).toBe('2026-11-01');
    expect(dateOfDay(EPOCH, 88)).toBe('2027-01-01');
    for (let day = 0; day < 800; day += 37) expect(daysBetween(EPOCH, dateOfDay(EPOCH, day))).toBe(day);
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

describe('the four on the board', () => {
  const answerOf = (day: number) => deck[answerOrder(day, index.candidates)].code;

  it('gives the same three every time, never the answer, all different', () => {
    const answer = answerOf(0);
    const first = gameChoices(0, answer, places.parishes);
    expect(first).toHaveLength(CHOICE_COUNT - 1);
    expect(gameChoices(0, answer, places.parishes)).toEqual(first);
    expect(first).not.toContain(answer);
    expect(new Set(first).size).toBe(3);
    // A different day with the same answer draws differently (the seed has both).
    expect(gameChoices(index.candidates, answer, places.parishes)).not.toEqual(first);
  });

  it('holds every constraint on every day of the deck (all 3,092), without relaxing any', () => {
    expect(deck).toHaveLength(index.candidates);
    for (let day = 0; day < index.candidates; day++) {
      const answer = answerOf(day);
      const others = gameChoices(day, answer, places.parishes);
      const four = [answer, ...others].map(code => places.byCode.get(code)!);
      expect(four.every(Boolean), `day ${day}`).toBe(true);
      expect(new Set(four.map(p => p.code)).size, `day ${day}: distinct`).toBe(4);
      expect(new Set(four.map(p => p.region)).size, `day ${day}: regions`).toBe(4);
      expect(four.filter(onIslands).length, `day ${day}: islands`).toBeLessThanOrEqual(1);
    }
  });

  it('gives size away on no day: the answer is the smallest, second, third or largest of the four about equally often', () => {
    // INE residents, then code, as gameChoices orders them. By chance alone each place is 25%.
    const ranks = [0, 0, 0, 0];
    for (let day = 0; day < index.candidates; day++) {
      const answer = places.byCode.get(answerOf(day))!;
      const others = gameChoices(day, answer.code, places.parishes).map(code => places.byCode.get(code)!);
      const below = others.filter(p => p.censusPopulation < answer.censusPopulation
        || (p.censusPopulation === answer.censusPopulation && p.code < answer.code)).length;
      ranks[below]++;
    }
    for (const [position, count] of ranks.entries()) {
      expect(Math.abs(100 * count / index.candidates - 25), `position ${position + 1}: ${count} days`).toBeLessThanOrEqual(3);
    }
  });

  it('is stable while places.json keeps its order, and depends on nothing but the places', () => {
    const answer = answerOf(7);
    const copy = indexPlaces(JSON.parse(JSON.stringify(placesJson)) as PopulationPlaces);
    expect(gameChoices(7, answer, copy.parishes)).toEqual(gameChoices(7, answer, places.parishes));
    // Only the place's code, name, region and INE count are read: nothing from a response.
    const bare = places.parishes.map(({ code, name, region, censusPopulation }) => ({ code, name, region, censusPopulation }));
    expect(gameChoices(7, answer, bare)).toEqual(gameChoices(7, answer, places.parishes));
  });

  it('lists the four alphabetically (Portuguese collation), then by code for twin names', () => {
    const list = orderChoices([
      { code: '2', name: 'Évora' },
      { code: '1', name: 'Lagoa' },
      { code: '0', name: 'Lagoa' },
      { code: '3', name: 'Abiul' },
      { code: '4', name: 'Égua' },
    ]);
    expect(list.map(p => `${p.name}${p.code}`)).toEqual(['Abiul3', 'Égua4', 'Évora2', 'Lagoa0', 'Lagoa1']);
  });

  it('refuses an answer that is not a parish', () => {
    expect(() => gameChoices(0, 'XXXXXX', places.parishes)).toThrow();
  });
});

describe('the game’s state', () => {
  const ANSWER = 'A';
  const BOARD = ['A', 'B', 'C', 'D'];

  it('starts with one clue open', () => {
    const record = newRecord(0, true);
    expect(record).toEqual({ day: 0, picks: [], cluesOpened: 1, status: 'playing', live: true });
    expect(cluesOpen(record)).toBe(1);
  });

  it('wins on the clue that is open', () => {
    const won = applyPick(newRecord(0, true), 'A', ANSWER, BOARD);
    expect(won).toMatchObject({ status: 'won', picks: ['A'], cluesOpened: 1 });
    expect(cluesOpen(won)).toBe(CLUE_COUNT);
  });

  it('opens the next clue on a wrong pick, and keeps the pick', () => {
    let r = applyPick(newRecord(0, true), 'B', ANSWER, BOARD);
    expect(r).toMatchObject({ status: 'playing', picks: ['B'], cluesOpened: 2 });
    r = applyPick(r, 'C', ANSWER, BOARD);
    r = applyPick(r, 'A', ANSWER, BOARD);
    expect(r).toMatchObject({ status: 'won', picks: ['B', 'C', 'A'], cluesOpened: 3 });
    expect(wrongPicks(r, ANSWER)).toBe(2);
  });

  it('opens a clue without a pick, and it counts', () => {
    let r = openNextClue(newRecord(0, true));
    expect(r.cluesOpened).toBe(2);
    r = applyPick(r, 'A', ANSWER, BOARD);
    expect(r).toMatchObject({ status: 'won', cluesOpened: 2, picks: ['A'] });
    expect(wrongPicks(r, ANSWER)).toBe(0);
  });

  it('never opens more than six clues, and always ends by elimination at worst', () => {
    let r = newRecord(0, true);
    for (let i = 0; i < 10; i++) r = openNextClue(r);
    expect(r.cluesOpened).toBe(CLUE_COUNT);
    expect(openNextClue(r)).toBe(r);
    for (const code of ['B', 'C', 'D']) r = applyPick(r, code, ANSWER, BOARD);
    expect(r).toMatchObject({ status: 'playing', cluesOpened: CLUE_COUNT });
    r = applyPick(r, 'A', ANSWER, BOARD);
    expect(r).toMatchObject({ status: 'won', cluesOpened: CLUE_COUNT, picks: ['B', 'C', 'D', 'A'] });
  });

  it('ignores repeated, empty and off-board picks, and anything after the end', () => {
    const r = applyPick(newRecord(0, true), 'B', ANSWER, BOARD);
    expect(applyPick(r, 'B', ANSWER, BOARD)).toBe(r);
    expect(applyPick(r, '', ANSWER, BOARD)).toBe(r);
    expect(applyPick(r, 'Z', ANSWER, BOARD)).toBe(r);
    const won = applyPick(r, 'A', ANSWER, BOARD);
    expect(applyPick(won, 'C', ANSWER, BOARD)).toBe(won);
    expect(openNextClue(won)).toBe(won);
  });
});

describe('share text', () => {
  const date = '2026-10-06';
  const won = (picks: string[], cluesOpened: number): GameRecord => ({ day: 0, picks, cluesOpened, status: 'won', live: true });

  it('says the number, the date, the clue and the wrong picks, in Portuguese', () => {
    expect(shareText({ date, day: 0, record: won(['A'], 1), answer: 'A', locale: 'pt' }))
      .toBe('Freguesia misteriosa n.º 1 (6 out. 2026): acertei à 1.ª pista, sem erros. https://estimador.pt/pt/populacao/misteriosa/');
    expect(shareText({ date, day: 4, record: won(['B', 'A'], 3), answer: 'A', locale: 'pt' }))
      .toBe('Freguesia misteriosa n.º 5 (6 out. 2026): acertei à 3.ª pista, com 1 erro. https://estimador.pt/pt/populacao/misteriosa/');
    expect(shareMessage({ date, day: 0, record: won(['B', 'C', 'A'], 3), answer: 'A', locale: 'pt' }).text)
      .toBe('Freguesia misteriosa n.º 1 (6 out. 2026): acertei à 3.ª pista, com 2 erros.');
  });

  it('says it in English', () => {
    expect(shareText({ date, day: 0, record: won(['A'], 2), answer: 'A', locale: 'en' }))
      .toBe('Mystery parish No. 1 (6 Oct 2026): got it on clue 2, no wrong picks. https://estimador.pt/en/populacao/misteriosa/');
    expect(shareMessage({ date, day: 0, record: won(['B', 'A'], 2), answer: 'A', locale: 'en' }).text).toContain('1 wrong pick.');
    expect(shareMessage({ date, day: 0, record: won(['B', 'C', 'D', 'A'], 6), answer: 'A', locale: 'en' }).text).toContain('on clue 6, 3 wrong picks.');
  });

  it('gives a share sheet the address as its own https link (PUB2-16)', () => {
    const message = shareMessage({ date, day: 0, record: won(['A'], 1), answer: 'A', locale: 'pt' });
    expect(message.url).toBe('https://estimador.pt/pt/populacao/misteriosa/');
    expect(message.text).not.toContain('http');
    expect(message.title).toBe('Freguesia misteriosa');
  });

  it('never has an emoji, an exclamation mark or a parish name', () => {
    const answer = deck[0].code;
    const name = places.byCode.get(answer)!.name;
    for (const locale of ['pt', 'en'] as const) {
      for (let k = 1; k <= 6; k++) {
        const text = shareText({ date, day: 0, record: won(['X', answer], k), answer, locale });
        expect(text).not.toMatch(EMOJI);
        expect(text).not.toContain('!');
        expect(text).not.toContain(name);
      }
    }
  });

  it('formats dates per locale', () => {
    expect(formatGameDate('2026-10-05', 'pt')).toBe('5 out. 2026');
    expect(formatGameDate('2026-10-05', 'en')).toBe('5 Oct 2026');
  });
});

describe('stored results and stats', () => {
  const finished = (day: number, cluesOpened = 2, live = true): GameRecord =>
    ({ day, picks: ['A'], cluesOpened, status: 'won', live });

  const store = (...records: GameRecord[]): GameStore => records.reduce(putRecord, emptyStore());

  it('keeps its own key, the second version', () => {
    expect(GAME_STORAGE_KEY).toBe('estimador:misteriosa:v2');
  });

  it('reads back what it wrote and survives junk, ignoring the first version’s records', () => {
    const s = store(finished(0), { ...newRecord(1, true), picks: ['B'], cluesOpened: 2 });
    expect(parseStore(JSON.stringify(s))).toEqual(s);
    expect(parseStore(null)).toEqual(emptyStore());
    expect(parseStore('not json')).toEqual(emptyStore());
    // A v1 store (guesses, lost games) is not read.
    expect(parseStore('{"v":1,"records":{"0":{"day":0,"guesses":["X"],"status":"lost","live":true}}}')).toEqual(emptyStore());
    // Malformed records are dropped one by one.
    expect(parseStore('{"v":2,"records":{"4":{"day":5,"picks":[],"cluesOpened":1,"status":"won","live":true},"6":{"day":6},"7":{"day":7,"picks":[],"cluesOpened":9,"status":"playing","live":true},"8":{"day":8,"picks":[],"cluesOpened":1,"status":"lost","live":true}}}')).toEqual(emptyStore());
  });

  it('keeps one record per day and never turns practice into a live game', () => {
    let s = putRecord(emptyStore(), newRecord(2, false));
    s = putRecord(s, { ...finished(2), live: true });
    expect(Object.keys(s.records)).toEqual(['2']);
    expect(s.records['2'].live).toBe(false);
    // A live game finished after midnight stays live.
    let t = putRecord(emptyStore(), newRecord(5, true));
    t = putRecord(t, finished(5, 2, false));
    expect(t.records['5'].live).toBe(true);
  });

  it('makes today live and earlier days practice', () => {
    expect(recordFor(emptyStore(), 7, 7).live).toBe(true);
    expect(recordFor(emptyStore(), 6, 7).live).toBe(false);
    const s = store(finished(6));
    expect(recordFor(s, 6, 7)).toBe(s.records['6']);
  });

  it('counts games played and the distribution by clue, from live games only', () => {
    const s = store(
      finished(0, 1), finished(1, 2), finished(2, 2),
      finished(4, 6), finished(5, 3),
      finished(6, 1, false), // practice
      { ...newRecord(3, true), cluesOpened: 4 }, // unfinished
    );
    const stats = computeStats(s, 6);
    expect(stats).toMatchObject({ played: 5, currentStreak: 2 });
    expect(stats.distribution).toEqual([1, 2, 1, 0, 0, 1]);
  });

  it('keeps the streak alive until today is finished, and breaks it on a missed day', () => {
    const base = store(finished(4), finished(5));
    expect(computeStats(base, 6).currentStreak).toBe(2); // today not played yet
    expect(computeStats(putRecord(base, openNextClue(newRecord(6, true))), 6).currentStreak).toBe(2); // in progress
    expect(computeStats(putRecord(base, finished(6)), 6).currentStreak).toBe(3);
    expect(computeStats(base, 7).currentStreak).toBe(0); // missed day 6
    expect(computeStats(emptyStore(), 0)).toEqual({ played: 0, currentStreak: 0, distribution: [0, 0, 0, 0, 0, 0] });
  });
});
