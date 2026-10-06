/**
 * Freguesia misteriosa: the pure logic of the daily game.
 *
 * - Which day it is, on the Lisbon calendar, and which candidate that day
 *   plays (`order = day % candidates`, read from one chunk of 32).
 * - The four parishes on the board: the day's answer and three others drawn
 *   from places.json by a seeded generator, so every device and every reload
 *   shows the same four (`gameChoices`). They are chosen by place and by INE's
 *   resident count only (so that size gives nothing away), never by a
 *   published figure.
 * - The state machine (one clue open at the start; a wrong pick, or "Ver a
 *   próxima pista", opens the next; a right pick ends the game), the share
 *   text (no emoji) and the player's stats, which live only in their browser.
 *
 * Nothing here reads a population cell: the game's own numbers are the clue a
 * player answered on and their record, never a statistic about a place.
 */
import { ordinal } from '@/lib/typography';
import type { Locale } from './labels';
import type { PortraitRecipe } from '@/types/population';

export const GAME_TIME_ZONE = 'Europe/Lisbon';
export const GAME_STORAGE_KEY = 'estimador:misteriosa:v2';
/** Parishes on the board: the answer and three others. */
export const CHOICE_COUNT = 4;

/** The clues, in the order they open: one at the start, then one per wrong pick or "next clue". */
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


/** How many clues there are; the most a game can open. */
export const CLUE_COUNT = CLUE_ORDER.length;

// ---- the four on the board ---------------------------------------------------------

/** What `gameChoices` needs of a parish: where it is and INE's resident count (Censos 2021). */
export interface ChoicePlace {
  code: string;
  name: string;
  /** District id ("01"…"18") or autonomous region ("azores", "madeira"). */
  region: string;
  /** INE, Censos 2021: residents. Used only to place the answer among the four by size. */
  censusPopulation: number;
}

export const onIslands = (place: { region: string }) => place.region === 'azores' || place.region === 'madeira';

/** INE residents, then code: a total order, so "smaller" and "larger" than the answer are always defined. */
function bySize(a: ChoicePlace, b: ChoicePlace): number {
  return a.censusPopulation - b.censusPopulation || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0);
}

/** FNV-1a over a string: a 32-bit seed. */
function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a small, fast PRNG with a 32-bit state; returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * The three other parishes on a day's board, in the order they were drawn.
 * Seeded by the day number and the answer's code, so the same day gives the
 * same four everywhere, every time.
 *
 * Size is no clue: the answer's place among the four by INE residents
 * (smallest, second, third, largest) is drawn first, each equally likely, and
 * then that many of the others are drawn from the parishes with fewer
 * residents than the answer and the rest from those with more. (A first
 * draft spread the four across at least three INE resident bands; since 86%
 * of the deck's answers have fewer than 5 000 residents, that kept putting a
 * town beside them, and the largest of the four was the answer on 11% of days.)
 *
 * Each slot is drawn from every parish still eligible (in places.json order),
 * under three rules, in order of priority:
 *   1. the four are in four different districts or autonomous regions;
 *   2. the slot comes from its side of the answer (fewer or more residents);
 *   3. at most one of the four is on the Azores or Madeira.
 * If no parish satisfies all three for a slot, the last is relaxed, then the
 * second; the first always holds (there are 20 regions). `game.test.ts`
 * checks the rules and the spread of the answer's size rank on every day.
 *
 * No published figure, share or statistic is read: the four differ by place
 * and by INE's count of residents, and are shown in alphabetical order.
 */
export function gameChoices(day: number, answerCode: string, places: readonly ChoicePlace[]): string[] {
  const answer = places.find(place => place.code === answerCode);
  if (!answer) throw new Error(`Unknown answer ${answerCode}`);
  const random = mulberry32(hash32(`${day}:${answerCode}`));
  const smaller = places.filter(place => bySize(place, answer) < 0);
  const larger = places.filter(place => bySize(place, answer) > 0);
  // How many of the other three have fewer residents than the answer: 0–3, uniform.
  let needSmaller = Math.floor(random() * CHOICE_COUNT);
  const chosen: ChoicePlace[] = [answer];

  while (chosen.length < CHOICE_COUNT) {
    const regions = new Set(chosen.map(p => p.region));
    const island = chosen.some(onIslands);
    // A region already on the board also rules out the answer and every parish already drawn.
    const fits = (candidate: ChoicePlace, strict: boolean) =>
      !regions.has(candidate.region) && !(strict && island && onIslands(candidate));
    const [side, other] = needSmaller > 0 ? [smaller, larger] : [larger, smaller];
    let eligible: ChoicePlace[] = [];
    for (const [pool, strict] of [[side, true], [side, false], [other, true], [other, false]] as const) {
      eligible = pool.filter(candidate => fits(candidate, strict));
      if (eligible.length > 0) break;
    }
    if (eligible.length === 0) throw new Error('Not enough parishes for a board');
    chosen.push(eligible[Math.floor(random() * eligible.length)]);
    if (needSmaller > 0) needSmaller--;
  }
  return chosen.slice(1).map(place => place.code);
}

const collator = new Intl.Collator('pt', { sensitivity: 'base' });

/**
 * The four as the board lists them: alphabetical by name (Portuguese
 * collation, in both languages, so the numbers on the map match), then by
 * code where two parishes share a name.
 */
export function orderChoices<T extends { code: string; name: string }>(choices: readonly T[]): T[] {
  return [...choices].sort((a, b) => collator.compare(a.name, b.name) || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
}

// ---- the game's state ------------------------------------------------------------

export type GameStatus = 'playing' | 'won';

/** One day's game, as stored. */
export interface GameRecord {
  day: number;
  /** Parish codes picked, in order: the wrong ones, then the answer once found. */
  picks: string[];
  /** Clues open (1–6). */
  cluesOpened: number;
  status: GameStatus;
  /** Played on its own day (counts for stats); false for a practice game from "Dias anteriores". */
  live: boolean;
}

export function newRecord(day: number, live: boolean): GameRecord {
  return { day, picks: [], cluesOpened: 1, status: 'playing', live };
}

/**
 * Pick one of the four. A finished game, a parish already picked, an empty
 * code or one not on the board changes nothing; the answer wins on the clue
 * that is open; a wrong pick opens the next clue (up to the sixth).
 */
export function applyPick(record: GameRecord, code: string, answer: string, board?: readonly string[]): GameRecord {
  if (record.status !== 'playing' || !code || record.picks.includes(code)) return record;
  if (board && !board.includes(code)) return record;
  const picks = [...record.picks, code];
  if (code === answer) return { ...record, picks, status: 'won' };
  return { ...record, picks, cluesOpened: Math.min(CLUE_COUNT, record.cluesOpened + 1) };
}

/** "Ver a próxima pista": opens one more clue without a pick (it counts). */
export function openNextClue(record: GameRecord): GameRecord {
  if (record.status !== 'playing' || record.cluesOpened >= CLUE_COUNT) return record;
  return { ...record, cluesOpened: record.cluesOpened + 1 };
}

export function wrongPicks(record: GameRecord, answer: string): number {
  return record.picks.filter(code => code !== answer).length;
}

/** How many clues are on show: those opened while playing, all six once the game is over. */
export function cluesOpen(record: GameRecord): number {
  return record.status === 'playing' ? record.cluesOpened : CLUE_COUNT;
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

export const GAME_NAME: Record<Locale, string> = { pt: 'Freguesia misteriosa', en: 'Mystery parish' };

/** The game's address, with its scheme so every app makes it a link. */
export function gameUrl(locale: Locale, site = 'https://estimador.pt'): string {
  return `${site}/${locale}/populacao/misteriosa/`;
}

/** "à 2.ª pista" / "on clue 2". */
export function clueOrdinal(clue: number, locale: Locale): string {
  return locale === 'pt' ? `à ${ordinal(clue, 'pt', 'f')} pista` : `on clue ${clue}`;
}

/** "sem erros", "com 1 erro", "com 2 erros" / "no wrong picks", "1 wrong pick", "2 wrong picks". */
export function errorsPhrase(errors: number, locale: Locale): string {
  if (locale === 'pt') return errors === 0 ? 'sem erros' : errors === 1 ? 'com 1 erro' : `com ${errors} erros`;
  return errors === 0 ? 'no wrong picks' : errors === 1 ? '1 wrong pick' : `${errors} wrong picks`;
}

export interface ShareMessage {
  title: string;
  /** Everything but the address (the share sheet takes the address on its own). */
  text: string;
  url: string;
}

/**
 * What a player shares: the game and its number ("n.º 2", as the board shows
 * it), the date, the clue they got it on and how many wrong picks it took,
 * then the address, with https so it is a link everywhere. No emoji, no
 * exclamation mark, never a parish's name. `day` counts from 0, like the
 * board's day.
 *   pt: "Freguesia misteriosa n.º 1 (6 out. 2026): acertei à 2.ª pista, com 1 erro."
 *   en: "Mystery parish No. 1 (6 Oct 2026): got it on clue 2, 1 wrong pick."
 */
export function shareMessage({ date, day, record, answer, locale, site }: {
  date: string;
  day: number;
  record: GameRecord;
  answer: string;
  locale: Locale;
  site?: string;
}): ShareMessage {
  const number = locale === 'pt' ? `n.º ${day + 1}` : `No. ${day + 1}`;
  const errors = errorsPhrase(wrongPicks(record, answer), locale);
  const verb = locale === 'pt' ? 'acertei' : 'got it';
  return {
    title: GAME_NAME[locale],
    text: `${GAME_NAME[locale]} ${number} (${formatGameDate(date, locale)}): ${verb} ${clueOrdinal(record.cluesOpened, locale)}, ${errors}.`,
    url: gameUrl(locale, site),
  };
}

/** The same, as one line (for the clipboard): the message, then the address. */
export function shareText(input: Parameters<typeof shareMessage>[0]): string {
  const message = shareMessage(input);
  return `${message.text} ${message.url}`;
}

// ---- stored results and stats -----------------------------------------------------

export interface GameStore {
  v: 2;
  /** One record per game day, keyed by the day number. */
  records: Record<string, GameRecord>;
}

export const emptyStore = (): GameStore => ({ v: 2, records: {} });

function isRecord(value: unknown): value is GameRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<GameRecord>;
  return Number.isInteger(r.day) && Array.isArray(r.picks) && r.picks.every(g => typeof g === 'string')
    && Number.isInteger(r.cluesOpened) && (r.cluesOpened as number) >= 1 && (r.cluesOpened as number) <= CLUE_COUNT
    && (r.status === 'playing' || r.status === 'won') && typeof r.live === 'boolean';
}

/**
 * Read the stored JSON, dropping anything malformed rather than failing. The
 * first version's records (another key, another shape) are never read.
 */
export function parseStore(raw: string | null | undefined): GameStore {
  if (!raw) return emptyStore();
  try {
    const data = JSON.parse(raw) as { v?: unknown; records?: unknown };
    if (!data || data.v !== 2 || typeof data.records !== 'object' || data.records === null) return emptyStore();
    const records: Record<string, GameRecord> = {};
    for (const [key, value] of Object.entries(data.records)) {
      if (isRecord(value) && String(value.day) === key) records[key] = { ...value, picks: value.picks.slice(0, CHOICE_COUNT) };
    }
    return { v: 2, records };
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
  return { v: 2, records: { ...store.records, [String(record.day)]: { ...record, live } } };
}

/** The record for a day, or a fresh one: live only when the day is today. */
export function recordFor(store: GameStore, day: number, today: number): GameRecord {
  return store.records[String(day)] ?? newRecord(day, day === today);
}

export interface GameStats {
  /** Live games finished (every finished game is found: there is no lost game). */
  played: number;
  currentStreak: number;
  /** Games by the clue they were answered on: index 0 is the first clue. */
  distribution: number[];
}

/**
 * Stats over live games only (practice games from earlier days do not count).
 * The current streak counts consecutive days played to the end, running back
 * from today, or from yesterday while today's game is unfinished.
 */
export function computeStats(store: GameStore, today: number): GameStats {
  const done = Object.values(store.records).filter(r => r.live && r.status === 'won');
  const distribution = Array.from({ length: CLUE_COUNT }, (_, i) => done.filter(r => r.cluesOpened === i + 1).length);
  const doneDays = new Set(done.map(r => r.day));

  const todayRecord = store.records[String(today)];
  let start = today;
  if (!todayRecord || !todayRecord.live || todayRecord.status !== 'won') start = today - 1;
  let currentStreak = 0;
  for (let d = start; doneDays.has(d); d--) currentStreak++;

  return { played: done.length, currentStreak, distribution };
}

/** "05:12:09" until the next game. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
