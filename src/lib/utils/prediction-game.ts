/**
 * "Contra o Modelo" — pure logic for the weekly prediction game.
 *
 * Deliberately dependency-free and free of React/DOM/Next imports so it can be
 * unit tested in isolation. Everything that touches localStorage is guarded and
 * returns a value rather than throwing.
 *
 * Team names are always the RAW names used in the published JSON
 * ('Famalicao', 'Vitoria SC'). Display names are applied at render time only —
 * stored picks must survive a change to the display map.
 */

/* --------------------------------------------------------------- outcomes */

export type Outcome = 'H' | 'D' | 'A';

/** [p_home, p_draw, p_away] — the order the model publishes and RPS assumes. */
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
 * Ranked Probability Score for one ordered three-outcome forecast.
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

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

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
 * Integer percentages that still add up to 100 (largest remainder).
 * Display only — scoring always uses the underlying floats.
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

/* ---------------------------------------------------- pick + confidence UI */

export type Confidence = 'leve' | 'media' | 'alta';

export const CONFIDENCE_LEVELS: readonly Confidence[] = ['leve', 'media', 'alta'];

/** Probability handed to the picked outcome at each confidence step. */
const CONFIDENCE_WEIGHT: Record<Confidence, number> = {
  leve: 0.4,
  media: 0.55,
  alta: 0.7,
};

/**
 * Long-run Liga Portugal 1X2 base rates. Used only to split the leftover
 * probability between the two outcomes the user did NOT pick, so that
 * "home win, slight favourite" doesn't imply an absurd draw/away split.
 */
const NEUTRAL_PRIOR: ProbVector = [0.45, 0.27, 0.28];

/** Turn a (pick, confidence) pair into a full probability vector. */
export function probsFromPick(pick: Outcome, confidence: Confidence): ProbVector {
  const idx = OUTCOME_INDEX[pick];
  const p = CONFIDENCE_WEIGHT[confidence];

  const otherIdx = [0, 1, 2].filter(i => i !== idx) as [number, number];
  const priorSum = NEUTRAL_PRIOR[otherIdx[0]] + NEUTRAL_PRIOR[otherIdx[1]];

  const out: number[] = [0, 0, 0];
  out[idx] = p;
  for (const i of otherIdx) {
    out[i] = priorSum > EPS
      ? (1 - p) * (NEUTRAL_PRIOR[i] / priorSum)
      : (1 - p) / 2;
  }
  return normalizeProbs(out);
}

/**
 * Move one slider and absorb the difference in the other two, keeping the sum
 * at exactly 1. The untouched pair keeps its internal ratio; when it has
 * collapsed to zero the leftover is split evenly.
 */
export function setSliderValue(
  current: ProbVector,
  index: 0 | 1 | 2,
  value: number,
): ProbVector {
  const target = clamp01(value);
  const rest = 1 - target;

  const others = [0, 1, 2].filter(i => i !== index) as [number, number];
  const othersSum = current[others[0]] + current[others[1]];

  const out: number[] = [0, 0, 0];
  out[index] = target;
  if (othersSum > EPS) {
    for (const i of others) out[i] = rest * (current[i] / othersSum);
  } else {
    for (const i of others) out[i] = rest / 2;
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
  /** The model's published 1X2 for this fixture — the opponent. */
  model: ProbVector;
  /** Naive ISO timestamp as published, or null when unknown. */
  kickoff: string | null;
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
 * Kickoff timestamps arrive naive (`2026-08-10T19:15:00`) because the model
 * serialises a tz-less pandas Timestamp. They are Portuguese local time.
 * Rather than ship a timezone database we read a naive stamp as UTC+01:00:
 * exact during Portuguese summer time and one hour EARLY in winter. Erring
 * early is the safe direction — the lock can never open after kickoff.
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
 * 1. Any published result means the round has demonstrably started — lock,
 *    whatever the clock says. This is the fallback the brief asks for and the
 *    only signal available for a next matchday, which carries no timestamps.
 * 2. Otherwise lock at the earliest known kickoff.
 * 3. With neither signal the round is open.
 */
export function roundLockState(round: GameRound, nowMs: number): RoundLock {
  const kickoffs = round.fixtures
    .map(f => parseKickoff(f.kickoff))
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

/* ----------------------------------------------------------------- picks */

export interface StoredPick {
  /** The scored quantity. Always a normalised [pH, pD, pA]. */
  p: ProbVector;
  /** Remembered UI state so the quick picker reopens where it was left. */
  pick?: Outcome;
  conf?: Confidence;
  mode?: 'quick' | 'fine';
}

export type PickMap = Record<string, StoredPick>;

/* --------------------------------------------------------------- scoring */

export interface FixtureScore {
  key: string;
  home: string;
  away: string;
  user: ProbVector;
  model: ProbVector;
  outcome: Outcome;
  userRps: number;
  modelRps: number;
  /** Positive when the user was closer than the model on this match. */
  edge: number;
}

export interface RoundScore {
  matchday: number;
  scored: FixtureScore[];
  /** Fixtures picked whose result has not been published yet. */
  pending: number;
  /** Fixtures already decided that the user never picked. */
  missed: number;
  userTotal: number;
  modelTotal: number;
  userMean: number | null;
  modelMean: number | null;
  /** Every fixture of the round has a result. */
  complete: boolean;
  /** null while nothing is scoreable. Ties count as NOT beating the model. */
  beatModel: boolean | null;
}

/**
 * Score one round on the fixtures the user actually picked. The model is
 * scored on exactly the same subset, so a partial entry is still a fair
 * comparison — it is simply a comparison over fewer matches.
 */
export function scoreRound(round: GameRound, picks: PickMap): RoundScore {
  const scored: FixtureScore[] = [];
  let pending = 0;
  let missed = 0;

  for (const fixture of round.fixtures) {
    const pick = picks[fixture.key];
    if (!pick) {
      if (fixture.result) missed += 1;
      continue;
    }
    if (!fixture.result) {
      pending += 1;
      continue;
    }
    const user = normalizeProbs(pick.p);
    const userRps = rps(user, fixture.result.outcome);
    const modelRps = rps(fixture.model, fixture.result.outcome);
    scored.push({
      key: fixture.key,
      home: fixture.home,
      away: fixture.away,
      user,
      model: fixture.model,
      outcome: fixture.result.outcome,
      userRps,
      modelRps,
      edge: modelRps - userRps,
    });
  }

  const userTotal = scored.reduce((s, f) => s + f.userRps, 0);
  const modelTotal = scored.reduce((s, f) => s + f.modelRps, 0);
  const n = scored.length;

  return {
    matchday: round.matchday,
    scored,
    pending,
    missed,
    userTotal,
    modelTotal,
    userMean: n > 0 ? userTotal / n : null,
    modelMean: n > 0 ? modelTotal / n : null,
    complete: round.fixtures.length > 0 && round.fixtures.every(f => f.result !== null),
    beatModel: n > 0 ? userTotal < modelTotal : null,
  };
}

export interface SeasonScore {
  rounds: RoundScore[];
  /** Rounds fully played with at least one scored pick. */
  roundsCounted: number;
  roundsWon: number;
  matchesScored: number;
  userTotal: number;
  modelTotal: number;
  userMean: number | null;
  modelMean: number | null;
  /**
   * Brier-style skill against the model: 1 - user/model. Positive means the
   * user is ahead. null when the model scored a perfect 0 (no reference).
   */
  skill: number | null;
}

export function scoreSeason(
  data: PredictionGameData,
  picks: PickMap,
): SeasonScore {
  const rounds = data.rounds.map(r => scoreRound(r, picks));

  const counted = rounds.filter(r => r.complete && r.scored.length > 0);
  const userTotal = rounds.reduce((s, r) => s + r.userTotal, 0);
  const modelTotal = rounds.reduce((s, r) => s + r.modelTotal, 0);
  const matchesScored = rounds.reduce((s, r) => s + r.scored.length, 0);

  return {
    rounds,
    roundsCounted: counted.length,
    roundsWon: counted.filter(r => r.beatModel === true).length,
    matchesScored,
    userTotal,
    modelTotal,
    userMean: matchesScored > 0 ? userTotal / matchesScored : null,
    modelMean: matchesScored > 0 ? modelTotal / matchesScored : null,
    skill: modelTotal > 0 ? 1 - userTotal / modelTotal : null,
  };
}

/* --------------------------------------------------------- persistence */

export const STORAGE_VERSION = 1;
export const STORAGE_KEY = `estimador:contra-o-modelo:v${STORAGE_VERSION}`;

export interface StoredGame {
  version: number;
  season: string;
  picks: PickMap;
}

/**
 * Parse whatever is in localStorage into a usable pick map.
 *
 * Returns null for anything unusable — bad JSON, an older schema, a different
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

  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  if (obj.version !== STORAGE_VERSION) return null;
  if (obj.season !== season) return null;
  if (typeof obj.picks !== 'object' || obj.picks === null) return null;

  const picks: PickMap = {};
  for (const [key, value] of Object.entries(obj.picks as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue;
    const entry = value as Record<string, unknown>;
    if (!isProbVector(entry.p)) continue;

    const pick: StoredPick = { p: normalizeProbs(entry.p) };
    if (entry.pick === 'H' || entry.pick === 'D' || entry.pick === 'A') {
      pick.pick = entry.pick;
    }
    if (
      entry.conf === 'leve' || entry.conf === 'media' || entry.conf === 'alta'
    ) {
      pick.conf = entry.conf;
    }
    if (entry.mode === 'quick' || entry.mode === 'fine') {
      pick.mode = entry.mode;
    }
    picks[key] = pick;
  }

  return { version: STORAGE_VERSION, season, picks };
}

export function serializeGame(season: string, picks: PickMap): string {
  return JSON.stringify({ version: STORAGE_VERSION, season, picks });
}

/** Read persisted picks. Never throws — private mode and SSR both yield {}. */
export function loadPicks(season: string): PickMap {
  if (typeof window === 'undefined') return {};
  try {
    return parseStoredGame(window.localStorage.getItem(STORAGE_KEY), season)?.picks ?? {};
  } catch {
    return {};
  }
}

/** Persist picks. Never throws — a full or blocked store is a silent no-op. */
export function savePicks(season: string, picks: PickMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeGame(season, picks));
  } catch {
    /* quota exceeded or storage disabled — the game just won't persist */
  }
}

/** Wipe the saved game, including any stale schema versions. */
export function clearPicks(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    for (let v = 1; v <= STORAGE_VERSION; v += 1) {
      window.localStorage.removeItem(`estimador:contra-o-modelo:v${v}`);
    }
  } catch {
    /* nothing we can do */
  }
}
