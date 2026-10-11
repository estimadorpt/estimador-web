/**
 * "Contra o Modelo": pure logic for the weekly prediction game.
 *
 * The game has no server and no account. The reader's picks live in their
 * own browser (localStorage, one versioned key), and each game is scored
 * against the results published in game_fixtures.json: the page carries
 * them from the build, and re-reads that same published file when a game
 * the reader picked has been played since (`awaitingResults`,
 * `withPublishedResults`).
 *
 * Dependency-free apart from one constant, and free of React/DOM/Next
 * imports, so it can be unit tested in isolation. Everything that touches
 * localStorage is guarded and returns a value rather than throwing.
 *
 * Team names are always the RAW names used in the published JSON
 * ('Famalicao', 'Vitoria SC'). Display names are applied at render time
 * only, so stored picks survive a change to the display map.
 */
import { ROUND_SETTLE_MS } from '@/lib/football-status';

/* --------------------------------------------------------------- outcomes */

export type Outcome = 'H' | 'D' | 'A';

/** [p_home, p_draw, p_away]: the order the model publishes and RPS assumes. */
export type ProbVector = [number, number, number];

export const OUTCOMES: readonly Outcome[] = ['H', 'D', 'A'];

const OUTCOME_INDEX: Record<Outcome, 0 | 1 | 2> = { H: 0, D: 1, A: 2 };

export function outcomeIndex(outcome: Outcome): 0 | 1 | 2 {
  return OUTCOME_INDEX[outcome];
}

/** Outcome of a finished match from the score line. */
export function matchOutcome(homeGoals: number, awayGoals: number): Outcome {
  if (homeGoals > awayGoals) return 'H';
  if (homeGoals === awayGoals) return 'D';
  return 'A';
}

/* -------------------------------------------------------------------- RPS */

/**
 * Ranked Probability Score for one ordered three-outcome forecast: the
 * measure that decides, game by game, whose forecast was closer.
 *
 * Mirrors `rps_single` in the model repo
 * (src/liga_predict/model/evaluate.py):
 *
 *     RPS = (1/2) * sum_{k=1}^{2} (cumP_k - cumO_k)^2
 *
 * Lower is better; range [0, 1]. The cumulative form is what makes RPS
 * *ordered*: predicting a home win when the away side wins is punished harder
 * than predicting a draw, because the miss spans two categories.
 */
export function rps(probs: ProbVector, outcome: Outcome): number {
  const idx = OUTCOME_INDEX[outcome];

  const cumP1 = probs[0];
  const cumP2 = probs[0] + probs[1];

  const cumO1 = idx === 0 ? 1 : 0;
  const cumO2 = idx <= 1 ? 1 : 0;

  const d1 = cumP1 - cumO1;
  const d2 = cumP2 - cumO2;

  return 0.5 * (d1 * d1 + d2 * d2);
}

/* ------------------------------------------------- probability bookkeeping */

const EPS = 1e-9;

/** Drop non-finite values and negatives; scale is left to the caller. */
function nonNegative(x: unknown): number {
  const n = Number(x);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * Rescale to sum 1. Falls back to a uniform vector for degenerate input.
 *
 * Only the lower bound is guarded: capping at 1 before dividing would destroy
 * the ratio between components, turning [2, 1, 1] into a uniform vector.
 */
export function normalizeProbs(v: readonly number[]): ProbVector {
  const a = nonNegative(v[0]);
  const b = nonNegative(v[1]);
  const c = nonNegative(v[2]);
  const total = a + b + c;
  if (!(total > EPS)) return [1 / 3, 1 / 3, 1 / 3];
  return [a / total, b / total, c / total];
}

export function isProbVector(v: unknown): v is ProbVector {
  if (!Array.isArray(v) || v.length !== 3) return false;
  if (!v.every(x => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1)) {
    return false;
  }
  const total = (v as number[]).reduce((s, x) => s + x, 0);
  return Math.abs(total - 1) < 1e-6;
}

/**
 * Integer percentages that still add up to 100 (largest remainder), for the
 * reader's own split, which they read as three numbers that make a whole.
 * Display only: scoring always uses the underlying floats.
 */
export function toPercents(v: ProbVector): [number, number, number] {
  const scaled = v.map(x => x * 100);
  const floors = scaled.map(Math.floor);
  let rest = 100 - floors.reduce((s, x) => s + x, 0);

  const order = scaled
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);

  const out = [...floors];
  for (const { i } of order) {
    if (rest <= 0) break;
    out[i] += 1;
    rest -= 1;
  }
  return out as [number, number, number];
}

/* ------------------------------------------------------- pick + certainty */

/**
 * How sure the reader is of the outcome they picked. A pick is one tap: the
 * outcome, at the middle step; the certainty is optional and moves the share
 * the picked outcome gets. The reader never sets a free split.
 */
export type Confidence = 'leve' | 'media' | 'alta';

export const CONFIDENCE_LEVELS: readonly Confidence[] = ['leve', 'media', 'alta'];

/** The step a pick starts at. */
export const DEFAULT_CONFIDENCE: Confidence = 'media';

/** Probability handed to the picked outcome at each certainty step. */
export const CONFIDENCE_WEIGHT: Record<Confidence, number> = {
  leve: 0.4,
  media: 0.55,
  alta: 0.7,
};

/**
 * Long-run Liga Portugal 1X2 base rates. Used only when the reader picks the
 * draw, to split the leftover between a home and an away win.
 */
const NEUTRAL_PRIOR: ProbVector = [0.45, 0.27, 0.28];

/**
 * Share of the leftover that goes to the draw when the reader picks a side.
 * Splitting by the base rates instead left an away pick with home at 0.45
 * of the rest against a draw at 0.27 (F19): someone who backs the visitors
 * is not saying the hosts are the likelier alternative. The draw gets at
 * least the unpicked side's share.
 */
const DRAW_SHARE_OF_REST = 0.55;

/** Turn a (pick, certainty) pair into a full probability vector. */
export function probsFromPick(pick: Outcome, confidence: Confidence): ProbVector {
  const idx = OUTCOME_INDEX[pick];
  const p = CONFIDENCE_WEIGHT[confidence];
  const rest = 1 - p;

  const out: number[] = [0, 0, 0];
  out[idx] = p;
  if (pick === 'D') {
    const sides = NEUTRAL_PRIOR[0] + NEUTRAL_PRIOR[2];
    out[0] = rest * (NEUTRAL_PRIOR[0] / sides);
    out[2] = rest * (NEUTRAL_PRIOR[2] / sides);
  } else {
    out[1] = rest * DRAW_SHARE_OF_REST;
    out[idx === 0 ? 2 : 0] = rest * (1 - DRAW_SHARE_OF_REST);
  }
  return normalizeProbs(out);
}

/* -------------------------------------------------------------- game data */

/** Stable identity for a fixture: the ordered pair of raw team names. */
export function fixtureKey(home: string, away: string): string {
  return `${home}|${away}`;
}

export interface FixtureResult {
  homeGoals: number;
  awayGoals: number;
  outcome: Outcome;
}

export interface GameFixture {
  key: string;
  home: string;
  away: string;
  /** The model's published 1X2 for this fixture, frozen when its round opened: the opponent. */
  model: ProbVector;
  /** Naive ISO timestamp as published, or null when unknown. */
  kickoff: string | null;
  /**
   * When the game stops taking picks for this fixture (game_fixtures.json
   * `locks_at`). Equal to the kickoff once it is confirmed; an unconfirmed
   * kickoff locks at the earliest plausible slot of its round. Optional: the
   * fallback built from the md files has no lock times.
   */
  locksAt?: string | null;
  /** False while the kickoff is a placeholder ("horário por confirmar"). */
  kickoffConfirmed?: boolean;
  /** The manifest's fixture id (`md08-moreirense-vs-gil-vicente`), when known. */
  id?: string;
  /** Which publication froze these probabilities (`md07.json@10877c9`). */
  probsSource?: string | null;
  result: FixtureResult | null;
}

export interface GameRound {
  matchday: number;
  fixtures: GameFixture[];
}

export interface PredictionGameData {
  season: string;
  generatedAt: string;
  /** Ascending by matchday. */
  rounds: GameRound[];
}

/* ------------------------------------------------------------ lock states */

export type LockReason = 'open' | 'kickoff' | 'results';

export interface RoundLock {
  locked: boolean;
  reason: LockReason;
  /** Epoch ms of the first kickoff, when a timestamp was published. */
  lockAt: number | null;
}

/**
 * Kickoff timestamps in game_fixtures.json carry a zone (`…Z`). The md files
 * once published them naive (`2026-08-10T19:15:00`), from a tz-less pandas
 * Timestamp, in Portuguese local time. Rather than ship a timezone database
 * a naive stamp is read as UTC+01:00: exact during Portuguese summer time and
 * one hour EARLY in winter. Erring early is the safe direction: the lock can
 * never open after kickoff.
 */
export function parseKickoff(kickoff: string | null | undefined): number | null {
  if (!kickoff) return null;
  const trimmed = kickoff.trim();
  if (!trimmed) return null;

  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const ms = Date.parse(hasZone ? trimmed : `${trimmed}+01:00`);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * A round locks as a unit.
 *
 * 1. Any published result means the round has demonstrably started: lock,
 *    whatever the clock says.
 * 2. Otherwise lock at the earliest known lock time (or kickoff).
 * 3. With neither signal the round is open.
 */
export function roundLockState(round: GameRound, nowMs: number): RoundLock {
  // The published lock time wins over the kickoff: for an unconfirmed kickoff
  // the lock sits at the earliest plausible slot of the round, which is the
  // safe side of a placeholder.
  const kickoffs = round.fixtures
    .map(f => parseKickoff(f.locksAt ?? f.kickoff))
    .filter((ms): ms is number => ms !== null);
  const lockAt = kickoffs.length > 0 ? Math.min(...kickoffs) : null;

  if (round.fixtures.some(f => f.result !== null)) {
    return { locked: true, reason: 'results', lockAt };
  }
  if (lockAt !== null && nowMs >= lockAt) {
    return { locked: true, reason: 'kickoff', lockAt };
  }
  return { locked: false, reason: 'open', lockAt };
}

/** First round still open for picks, or null when everything is locked. */
export function findOpenRound(
  data: PredictionGameData,
  nowMs: number,
): GameRound | null {
  for (const round of data.rounds) {
    if (!roundLockState(round, nowMs).locked) return round;
  }
  return null;
}

/**
 * Whether a game has been played by the reader's clock: its confirmed
 * kickoff plus the site's settle time (two hours, ROUND_SETTLE_MS), the
 * instant the Liga pages say "Jogo disputado".
 */
export function playedByClock(fixture: GameFixture, nowMs: number): boolean {
  if (fixture.result) return true;
  if (fixture.kickoffConfirmed === false) return false;
  const kickoff = parseKickoff(fixture.kickoff);
  return kickoff !== null && nowMs >= kickoff + ROUND_SETTLE_MS;
}

/* ----------------------------------------------------------------- picks */

export interface StoredPick {
  /** The scored quantity. Always a normalised [pH, pD, pA]. */
  p: ProbVector;
  /** The outcome picked and its certainty, so the picker reopens where it was left. */
  pick?: Outcome;
  conf?: Confidence;
}

export type PickMap = Record<string, StoredPick>;

/**
 * The outcome a stored pick backs: the one the reader chose, or, for a pick
 * stored without it (an older free split), the outcome its split favours.
 */
export function pickedOutcome(stored: StoredPick): Outcome {
  if (stored.pick) return stored.pick;
  const p = stored.p;
  const top = p.indexOf(Math.max(...p));
  return OUTCOMES[top] ?? 'H';
}

/* --------------------------------------------------------------- scoring */

/** Who was closer on one game, or why the game does not count (yet). */
export type GameStatus =
  /** Played and picked: the reader's forecast was closer. */
  | 'closer'
  /** Played and picked: the model's forecast was closer. */
  | 'model'
  /** Played and picked: exactly as close as each other. */
  | 'level'
  /** Played, not picked: it does not count. */
  | 'unpicked'
  /** No result yet (picked or not). */
  | 'unplayed';

export interface GameVerdict {
  fixture: GameFixture;
  /** The reader's forecast, normalised, or null when they did not pick this game. */
  user: ProbVector | null;
  /** The outcome the reader picked, or null. */
  pick: Outcome | null;
  status: GameStatus;
  userRps: number | null;
  modelRps: number | null;
}

export interface RoundTally {
  matchday: number;
  games: GameVerdict[];
  /** Games the reader picked. */
  picked: number;
  /** Games picked and played: the denominator of "em 5 de 9 jogos". */
  scored: number;
  /** Games where the reader was closer than the model. */
  closer: number;
  /** Games where the model was closer. */
  modelCloser: number;
  /** Games scored level. */
  level: number;
  /** The round's games still without a result, picked or not. */
  remaining: GameFixture[];
  /** Every game of the round has a result. */
  complete: boolean;
  /**
   * Who took the round: the reader when closer in more games than the
   * model, the model when the other way round, level when even. Null while
   * nothing the reader picked has been played.
   */
  outcome: 'won' | 'lost' | 'level' | null;
}

/** Two RPS values this close are the same forecast quality. */
const RPS_TIE = 1e-12;

/**
 * Score one round on the games the reader picked, game by game: whose
 * forecast was closer to what happened, by RPS (the rule the game always
 * had). Unpicked games do not count; unplayed ones wait.
 */
export function tallyRound(round: GameRound, picks: PickMap): RoundTally {
  const games: GameVerdict[] = round.fixtures.map(fixture => {
    const stored = picks[fixture.key];
    const user = stored ? normalizeProbs(stored.p) : null;
    const pick = stored ? pickedOutcome(stored) : null;
    if (!fixture.result) return { fixture, user, pick, status: 'unplayed', userRps: null, modelRps: null };
    if (!user) return { fixture, user, pick, status: 'unpicked', userRps: null, modelRps: null };
    const userRps = rps(user, fixture.result.outcome);
    const modelRps = rps(fixture.model, fixture.result.outcome);
    const status: GameStatus =
      Math.abs(userRps - modelRps) <= RPS_TIE ? 'level' : userRps < modelRps ? 'closer' : 'model';
    return { fixture, user, pick, status, userRps, modelRps };
  });

  const count = (s: GameStatus) => games.filter(g => g.status === s).length;
  const closer = count('closer');
  const modelCloser = count('model');
  const level = count('level');
  const scored = closer + modelCloser + level;

  return {
    matchday: round.matchday,
    games,
    picked: games.filter(g => g.user !== null).length,
    scored,
    closer,
    modelCloser,
    level,
    remaining: round.fixtures.filter(f => !f.result),
    complete: round.fixtures.length > 0 && round.fixtures.every(f => f.result !== null),
    outcome: scored === 0 ? null : closer > modelCloser ? 'won' : closer < modelCloser ? 'lost' : 'level',
  };
}

export interface SeasonTally {
  /** Every round the reader picked at least one game of, ascending. */
  rounds: RoundTally[];
  /** Completed rounds (every game played) with at least one game scored. */
  completed: number;
  /** Completed rounds the reader took. */
  won: number;
  /** Completed rounds that ended level. */
  level: number;
}

/**
 * The season line counts completed rounds only: a round with a game still to
 * play (a postponed one included) is reported "até agora" and joins the count
 * when its last game is in.
 */
export function tallySeason(data: PredictionGameData, picks: PickMap): SeasonTally {
  const rounds = data.rounds.map(r => tallyRound(r, picks)).filter(r => r.picked > 0);
  const completed = rounds.filter(r => r.complete && r.scored > 0);
  return {
    rounds,
    completed: completed.length,
    won: completed.filter(r => r.outcome === 'won').length,
    level: completed.filter(r => r.outcome === 'level').length,
  };
}

/* ------------------------------------------------ results since the build */

/** The parts of game_fixtures.json the browser re-reads. */
export interface ManifestResultsLike {
  season?: string;
  matchdays?: Array<{
    matchday: number;
    fixtures?: Array<{ home: string; away: string; home_goals?: number | null; away_goals?: number | null }>;
  }>;
}

/**
 * True when a game the reader picked is played by their clock but the page
 * has no result for it: the page was built before it, and the published
 * game_fixtures.json may be newer than the page (a tab left open, a page
 * restored from the browser's cache).
 */
export function awaitingResults(data: PredictionGameData, picks: PickMap, nowMs: number): boolean {
  return data.rounds.some(r =>
    r.fixtures.some(f => !f.result && picks[f.key] !== undefined && playedByClock(f, nowMs)),
  );
}

const isGoals = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/**
 * The page's rounds with the results of a newer copy of game_fixtures.json
 * filled in, by matchday and ordered pair. Nothing else is taken from it:
 * the model's frozen 1X2 never changes once a round opens, and a round the
 * page does not know waits for the next build. A manifest for another season
 * changes nothing. Returns the same object when nothing changed.
 */
export function withPublishedResults(data: PredictionGameData, manifest: ManifestResultsLike | null): PredictionGameData {
  if (!manifest || !Array.isArray(manifest.matchdays)) return data;
  if (manifest.season && data.season && manifest.season !== data.season) return data;

  const results = new Map<string, FixtureResult>();
  for (const md of manifest.matchdays) {
    for (const fx of md?.fixtures ?? []) {
      if (!fx || !isGoals(fx.home_goals) || !isGoals(fx.away_goals)) continue;
      results.set(`${md.matchday}|${fixtureKey(fx.home, fx.away)}`, {
        homeGoals: fx.home_goals,
        awayGoals: fx.away_goals,
        outcome: matchOutcome(fx.home_goals, fx.away_goals),
      });
    }
  }

  let changed = false;
  const rounds = data.rounds.map(round => {
    let roundChanged = false;
    const fixtures = round.fixtures.map(f => {
      const fresh = results.get(`${round.matchday}|${f.key}`);
      if (!fresh) return f;
      if (f.result && f.result.homeGoals === fresh.homeGoals && f.result.awayGoals === fresh.awayGoals) return f;
      roundChanged = true;
      return { ...f, result: fresh };
    });
    if (!roundChanged) return round;
    changed = true;
    return { ...round, fixtures };
  });
  return changed ? { ...data, rounds } : data;
}

/* --------------------------------------------------------- persistence */

export const STORAGE_VERSION = 1;
/** The game's one localStorage key; the picks never leave the browser. */
export const STORAGE_KEY = `estimador:contra-o-modelo:v${STORAGE_VERSION}`;

/**
 * Keys an earlier version of the game wrote and nothing reads any more: the
 * season server's player id and the secret that went with it. Removed on
 * the reader's next visit.
 */
export const RETIRED_KEYS: readonly string[] = ['estimador:contra-o-modelo:player:v1'];

export interface StoredGame {
  version: number;
  season: string;
  picks: PickMap;
}

/**
 * Parse whatever is in localStorage into a usable pick map.
 *
 * Returns null for anything unusable: bad JSON, an older schema, a different
 * season, a hand-edited blob. Individual malformed picks are dropped rather
 * than poisoning the whole store, so one bad entry never costs a season.
 */
export function parseStoredGame(raw: string | null, season: string): StoredGame | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;

  if (obj.version !== STORAGE_VERSION) return null;
  if (obj.season !== season) return null;
  if (typeof obj.picks !== 'object' || obj.picks === null || Array.isArray(obj.picks)) return null;

  const picks: PickMap = {};
  for (const [key, value] of Object.entries(obj.picks as Record<string, unknown>)) {
    if (!key.includes('|')) continue;
    if (typeof value !== 'object' || value === null) continue;
    const entry = value as Record<string, unknown>;
    if (!isProbVector(entry.p)) continue;

    const pick: StoredPick = { p: normalizeProbs(entry.p) };
    if (entry.pick === 'H' || entry.pick === 'D' || entry.pick === 'A') {
      pick.pick = entry.pick;
    }
    if (entry.conf === 'leve' || entry.conf === 'media' || entry.conf === 'alta') {
      pick.conf = entry.conf;
    }
    picks[key] = pick;
  }

  return { version: STORAGE_VERSION, season, picks };
}

export function serializeGame(season: string, picks: PickMap): string {
  return JSON.stringify({ version: STORAGE_VERSION, season, picks });
}

/** Read persisted picks. Never throws: private mode, blocked storage and SSR all yield {}. */
export function loadPicks(season: string): PickMap {
  if (typeof window === 'undefined') return {};
  try {
    return parseStoredGame(window.localStorage.getItem(STORAGE_KEY), season)?.picks ?? {};
  } catch {
    return {};
  }
}

/** Persist picks. Never throws: a full or blocked store is a silent no-op. */
export function savePicks(season: string, picks: PickMap): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeGame(season, picks));
    return true;
  } catch {
    /* quota exceeded or storage disabled: the game just won't persist */
    return false;
  }
}

/** Wipe the saved game. Never throws. */
export function clearPicks(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing we can do */
  }
}

/** Remove what earlier versions of the game left behind. Never throws. */
export function forgetRetiredKeys(): void {
  if (typeof window === 'undefined') return;
  for (const key of RETIRED_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* blocked storage: nothing to remove either */
    }
  }
}
