/**
 * Freguesia misteriosa: the pure logic of the daily game.
 *
 * - Which day it is, on the Lisbon calendar, and which candidate that day
 *   plays (`order = day % candidates`, read from one chunk of 32).
 * - What a guess says: great-circle distance, an eight-point direction from
 *   the guess towards the answer, a proximity score against the widest pair of
 *   parishes, and whether the guess shares the answer's município or region.
 * - The guess state machine (six guesses, one clue per miss), the share text
 *   (no emoji) and the player's stats, which live only in their browser.
 *
 * Nothing here reads a population cell: the game's own numbers are distances
 * and the player's record, never a statistic about a place.
 */
import { formatCount } from './format';
import { haversineKm } from './places';
import type { Locale } from './labels';
import type { PortraitRecipe } from '@/types/population';

export const MAX_GUESSES = 6;
export const GAME_TIME_ZONE = 'Europe/Lisbon';
export const GAME_STORAGE_KEY = 'estimador:misteriosa:v1';

/** The clues, in the order they open: one at the start, then one per wrong guess. */
export const CLUE_ORDER: ReadonlyArray<readonly PortraitRecipe[]> = [
  ['age'],
  ['household_size'],
  ['household_type'],
  ['education'],
  ['employment'],
  ['elders_alone', 'multigenerational'],
];

const DAY_MS = 86_400_000;

// ---- the Lisbon calendar -------------------------------------------------------

const lisbonParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: GAME_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function wallClock(instant: Date) {
  const parts: Record<string, number> = {};
  for (const part of lisbonParts.formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return parts as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

const pad = (value: number) => String(value).padStart(2, '0');

/** The calendar date in Lisbon at an instant, as YYYY-MM-DD. */
export function lisbonDate(now: Date): string {
  const { year, month, day } = wallClock(now);
  return `${year}-${pad(month)}-${pad(day)}`;
}

function utcDay(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

/** Whole calendar days from `epoch` to `date` (both YYYY-MM-DD). Negative before the epoch. */
export function daysBetween(epoch: string, date: string): number {
  return Math.round(utcDay(date) - utcDay(epoch));
}

/** Today's game number in Lisbon: 0 on the epoch, never negative. */
export function todayIndex(epoch: string, now: Date = new Date()): number {
  return Math.max(0, daysBetween(epoch, lisbonDate(now)));
}

/** The calendar date of game `day`. */
export function dateOfDay(epoch: string, day: number): string {
  const ms = (utcDay(epoch) + day) * DAY_MS;
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Lisbon's offset from UTC at an instant, in milliseconds (0 in winter, one hour in summer). */
function lisbonOffset(instant: number): number {
  const w = wallClock(new Date(instant));
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(instant / 1000) * 1000;
}

/**
 * Milliseconds until the next midnight in Lisbon. Days are 23 or 25 hours
 * long at the clock changes; Lisbon changes its clocks at 01:00 UTC, so
 * midnight itself is never skipped or repeated.
 */
export function msUntilNextLisbonMidnight(now: Date): number {
  const tomorrow = dateOfDay(lisbonDate(now), 1);
  const naive = utcDay(tomorrow) * DAY_MS; // tomorrow 00:00 read as if it were UTC
  let instant = naive - lisbonOffset(naive);
  instant = naive - lisbonOffset(instant);
  return Math.max(0, instant - now.getTime());
}

/** The candidate a day plays. */
export function answerOrder(day: number, candidates: number): number {
  if (candidates <= 0) throw new Error('No candidates');
  return ((day % candidates) + candidates) % candidates;
}

/** The chunk file that holds a candidate. */
export function chunkOf(order: number, chunkSize: number): number {
  return Math.floor(order / chunkSize);
}

// ---- geography of a guess ---------------------------------------------------------

export type Compass = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
const COMPASS_ORDER: Compass[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/**
 * The eight points: their angle (for rotating an arrow), a text arrow for the
 * share text, and words. The text arrows are the double arrows (U+21D0–21D9):
 * the single diagonal arrows ↖↗↘↙ are emoji code points that many apps draw
 * as coloured pictures.
 */
export const COMPASS: Record<Compass, { deg: number; arrow: string; pt: string; en: string }> = {
  N: { deg: 0, arrow: '⇑', pt: 'a norte', en: 'north' },
  NE: { deg: 45, arrow: '⇗', pt: 'a nordeste', en: 'north-east' },
  E: { deg: 90, arrow: '⇒', pt: 'a este', en: 'east' },
  SE: { deg: 135, arrow: '⇘', pt: 'a sudeste', en: 'south-east' },
  S: { deg: 180, arrow: '⇓', pt: 'a sul', en: 'south' },
  SW: { deg: 225, arrow: '⇙', pt: 'a sudoeste', en: 'south-west' },
  W: { deg: 270, arrow: '⇐', pt: 'a oeste', en: 'west' },
  NW: { deg: 315, arrow: '⇖', pt: 'a noroeste', en: 'north-west' },
};

interface Point { lat: number; lon: number }

/** Initial great-circle bearing from `from` towards `to`, in degrees clockwise from north, [0, 360). */
export function initialBearing(from: Point, to: Point): number {
  const rad = Math.PI / 180;
  const φ1 = from.lat * rad;
  const φ2 = to.lat * rad;
  const Δλ = (to.lon - from.lon) * rad;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const deg = Math.atan2(y, x) / rad;
  return (deg + 360) % 360;
}

/** The nearest of the eight compass points (each owns 45°, centred on it). */
export function compass8(bearing: number): Compass {
  const normal = ((bearing % 360) + 360) % 360;
  return COMPASS_ORDER[Math.round(normal / 45) % 8];
}

/**
 * The widest distance between any two points, computed once. The farthest
 * point from any point lies on the convex hull (on a plane; Portugal is small
 * enough that the squeezed lon/lat plane keeps that true in practice, and the
 * tests check it against every pair), so only point × hull pairs are measured.
 */
export function maxPairDistanceKm(points: Point[]): number {
  if (points.length < 2) return 0;
  const squeeze = Math.cos((39 * Math.PI) / 180);
  const planar = points.map((p, i) => ({ x: p.lon * squeeze, y: p.lat, i }));
  planar.sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: typeof planar[0], a: typeof planar[0], b: typeof planar[0]) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: typeof planar = [];
  for (const p of planar) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: typeof planar = [];
  for (let k = planar.length - 1; k >= 0; k--) {
    const p = planar[k];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)].map(p => points[p.i]);
  let best = 0;
  for (const p of points) {
    for (const h of hull) {
      const d = haversineKm(p, h);
      if (d > best) best = d;
    }
  }
  return best;
}

/** 100 × (1 − d / maxD), clamped to [0, 100]. */
export function proximity(distanceKm: number, maxDistanceKm: number): number {
  if (maxDistanceKm <= 0) return distanceKm <= 0 ? 100 : 0;
  return Math.min(100, Math.max(0, 100 * (1 - distanceKm / maxDistanceKm)));
}

export interface GamePlace extends Point {
  code: string;
  municipality: string;
  region: string;
}

export interface GuessFeedback {
  code: string;
  correct: boolean;
  distanceKm: number;
  /** Bearing from the guess towards the answer; null when the guess is the answer. */
  bearing: number | null;
  compass: Compass | null;
  proximity: number;
  sameMunicipality: boolean;
  sameRegion: boolean;
}

/**
 * What proximity is measured against: the widest pair of parishes on the
 * mainland when the answer is on the mainland, and the widest pair in the
 * whole country when the answer is on the islands. Against the whole country
 * (the Azores reach 1,800 km from the Algarve) a guess 500 km off on the
 * mainland would still score ~75%. The scale follows the answer alone, so one
 * game has one scale and proximity never rises with distance: a guess on the
 * islands for a mainland answer is past the mainland's widest pair and scores
 * 0% (PUB3-02: Funchal at 1,236 km scored 41% while Faro at 491 km scored 15%).
 */
export interface ProximityScale { all: number; mainland: number }

const onMainland = (place: { region: string }) => place.region !== 'azores' && place.region !== 'madeira';

export function proximityScale(places: Array<Point & { region: string }>): ProximityScale {
  return { all: maxPairDistanceKm(places), mainland: maxPairDistanceKm(places.filter(onMainland)) };
}

export function guessFeedback(guess: GamePlace, answer: GamePlace, scale: number | ProximityScale): GuessFeedback {
  const correct = guess.code === answer.code;
  const maxDistanceKm = typeof scale === 'number'
    ? scale
    : onMainland(answer) ? scale.mainland : scale.all;
  const distanceKm = correct ? 0 : haversineKm(guess, answer);
  const bearing = correct ? null : initialBearing(guess, answer);
  return {
    code: guess.code,
    correct,
    distanceKm,
    bearing,
    compass: bearing === null ? null : compass8(bearing),
    proximity: correct ? 100 : proximity(distanceKm, maxDistanceKm),
    sameMunicipality: guess.municipality === answer.municipality,
    sameRegion: guess.region === answer.region,
  };
}

// ---- the game's state ------------------------------------------------------------

export type GameStatus = 'playing' | 'won' | 'lost';

/** One day's game, as stored. */
export interface GameRecord {
  day: number;
  /** Parish codes guessed, in order. */
  guesses: string[];
  status: GameStatus;
  /** Played on its own day (counts for stats); false for a practice game from "Dias anteriores". */
  live: boolean;
}

export function newRecord(day: number, live: boolean): GameRecord {
  return { day, guesses: [], status: 'playing', live };
}

/**
 * Add a guess. A finished game, a repeated guess or an empty code changes
 * nothing; the right parish wins; the sixth miss loses.
 */
export function applyGuess(record: GameRecord, code: string, answer: string): GameRecord {
  if (record.status !== 'playing' || !code || record.guesses.includes(code)) return record;
  const guesses = [...record.guesses, code];
  const status: GameStatus = code === answer ? 'won' : guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
  return { ...record, guesses, status };
}

export function wrongGuesses(record: GameRecord, answer: string): number {
  return record.guesses.filter(code => code !== answer).length;
}

/** How many clues are open: one at the start, one more per miss, all six once the game ends. */
export function cluesOpen(record: GameRecord, answer: string): number {
  if (record.status !== 'playing') return CLUE_ORDER.length;
  return Math.min(CLUE_ORDER.length, 1 + wrongGuesses(record, answer));
}

// ---- share text ---------------------------------------------------------------------

const MONTHS: Record<Locale, string[]> = {
  pt: ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** "5 out. 2026" / "5 Oct 2026". */
export function formatGameDate(date: string, locale: Locale): string {
  const [year, month, day] = date.split('-').map(Number);
  return `${day} ${MONTHS[locale][month - 1]} ${year}`;
}

export function formatKm(distanceKm: number, locale: Locale): string {
  const km = Math.round(distanceKm);
  return `${formatCount(km, locale)} km`;
}

export const GAME_NAME: Record<Locale, string> = { pt: 'Freguesia misteriosa', en: 'Mystery parish' };

/** The game's address, with its scheme so every app makes it a link. */
export function gameUrl(locale: Locale, site = 'https://estimador.pt'): string {
  return `${site}/${locale}/populacao/misteriosa/`;
}

export interface ShareMessage {
  title: string;
  /** Everything but the address (the share sheet takes the address on its own). */
  text: string;
  url: string;
}

/**
 * What a player shares: the game and its number ("n.º 2", as the board shows
 * it), the date, the score, one line per miss (direction and distance, never a
 * name) and the address, with https so it is a link everywhere. No emoji.
 * `day` counts from 0, like the board's day.
 */
export function shareMessage({ date, day, record, feedback, locale, site }: {
  date: string;
  day: number;
  record: GameRecord;
  feedback: GuessFeedback[];
  locale: Locale;
  site?: string;
}): ShareMessage {
  const score = record.status === 'won' ? `${record.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const lines = feedback
    .filter(item => !item.correct)
    .map(item => `${COMPASS[item.compass ?? 'N'].arrow} ${formatKm(item.distanceKm, locale)}`);
  const ending = record.status === 'won'
    ? (locale === 'pt' ? 'acertei' : 'got it')
    : (locale === 'pt' ? 'não acertei' : 'missed it');
  const number = locale === 'pt' ? `n.º ${day + 1}` : `No. ${day + 1}`;
  return {
    title: GAME_NAME[locale],
    text: [`${GAME_NAME[locale]} ${number} · ${formatGameDate(date, locale)}`, score, ...lines, ending].join('\n'),
    url: gameUrl(locale, site),
  };
}

/** The same, as one block of text (for the clipboard): the message, then the address. */
export function shareText(input: Parameters<typeof shareMessage>[0]): string {
  const message = shareMessage(input);
  return `${message.text}\n${message.url}`;
}

// ---- stored results and stats -----------------------------------------------------

export interface GameStore {
  v: 1;
  /** One record per game day, keyed by the day number. */
  records: Record<string, GameRecord>;
}

export const emptyStore = (): GameStore => ({ v: 1, records: {} });

function isRecord(value: unknown): value is GameRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<GameRecord>;
  return Number.isInteger(r.day) && Array.isArray(r.guesses) && r.guesses.every(g => typeof g === 'string')
    && (r.status === 'playing' || r.status === 'won' || r.status === 'lost') && typeof r.live === 'boolean';
}

/** Read the stored JSON, dropping anything malformed rather than failing. */
export function parseStore(raw: string | null | undefined): GameStore {
  if (!raw) return emptyStore();
  try {
    const data = JSON.parse(raw) as Partial<GameStore>;
    if (!data || data.v !== 1 || typeof data.records !== 'object' || data.records === null) return emptyStore();
    const records: Record<string, GameRecord> = {};
    for (const [key, value] of Object.entries(data.records)) {
      if (isRecord(value) && String(value.day) === key) records[key] = { ...value, guesses: value.guesses.slice(0, MAX_GUESSES) };
    }
    return { v: 1, records };
  } catch {
    return emptyStore();
  }
}

/**
 * Store a day's record (one per day). A game that started on its own day
 * stays live when it is finished later; a practice game never becomes live.
 */
export function putRecord(store: GameStore, record: GameRecord): GameStore {
  const previous = store.records[String(record.day)];
  const live = previous ? previous.live : record.live;
  return { v: 1, records: { ...store.records, [String(record.day)]: { ...record, live } } };
}

/** The record for a day, or a fresh one: live only when the day is today. */
export function recordFor(store: GameStore, day: number, today: number): GameRecord {
  return store.records[String(day)] ?? newRecord(day, day === today);
}

export interface GameStats {
  played: number;
  won: number;
  currentStreak: number;
  bestStreak: number;
  /** Wins by number of guesses: index 0 is a first-guess win. */
  distribution: number[];
  lost: number;
}

/**
 * Stats over live games only (practice games from earlier days do not count).
 * The current streak runs back from today, or from yesterday while today's
 * game is unfinished.
 */
export function computeStats(store: GameStore, today: number): GameStats {
  const live = Object.values(store.records).filter(r => r.live && r.status !== 'playing');
  const won = live.filter(r => r.status === 'won');
  const distribution = Array.from({ length: MAX_GUESSES }, (_, i) => won.filter(r => r.guesses.length === i + 1).length);
  const wonDays = new Set(won.map(r => r.day));

  let bestStreak = 0;
  let run = 0;
  const days = [...wonDays].sort((a, b) => a - b);
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
  }

  const todayRecord = store.records[String(today)];
  let start = today;
  if (!todayRecord || !todayRecord.live || todayRecord.status === 'playing') start = today - 1;
  let currentStreak = 0;
  for (let d = start; wonDays.has(d); d--) currentStreak++;

  return { played: live.length, won: won.length, currentStreak, bestStreak, distribution, lost: live.length - won.length };
}

/** "05:12:09" until the next game. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
