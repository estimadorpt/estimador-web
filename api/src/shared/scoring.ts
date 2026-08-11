/**
 * Scoring for the season-long prediction game.
 *
 * `rps` is a line-for-line mirror of `rps_single` in the model repo
 * (estimador-football/src/liga_predict/model/evaluate.py). The two must never
 * drift: a player's season standing is only meaningful if the yardstick used
 * on them is the yardstick used on the model.
 *
 * Deliberately dependency-free — no Azure, no Node built-ins — so it can be
 * unit tested by the site's vitest run without an Azure Functions host.
 */

export type Outcome = 'H' | 'D' | 'A';

/** [p_home, p_draw, p_away] — the order the model publishes and RPS assumes. */
export type ProbVector = [number, number, number];

const OUTCOME_INDEX: Record<Outcome, 0 | 1 | 2> = { H: 0, D: 1, A: 2 };

/** Outcome of a finished match from the score line. */
export function outcomeOf(homeGoals: number, awayGoals: number): Outcome {
  if (homeGoals > awayGoals) return 'H';
  if (homeGoals === awayGoals) return 'D';
  return 'A';
}

/**
 * Ranked Probability Score for one ordered three-outcome forecast.
 *
 *     RPS = (1/2) * sum_{k=1}^{2} (cumP_k - cumO_k)^2
 *
 * Lower is better; range [0, 1]. The cumulative form is what makes RPS
 * *ordered* — calling a home win when the away side wins costs more than
 * calling a draw, because the miss spans two categories.
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

const EPS = 1e-9;

function nonNegative(x: unknown): number {
  const n = Number(x);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * Rescale to sum 1. Falls back to uniform for degenerate input.
 *
 * Only the lower bound is guarded: capping at 1 before dividing would destroy
 * the ratio between components, turning [2, 1, 1] into a uniform vector.
 */
export function normalizeProbs(v: readonly unknown[] | null | undefined): ProbVector {
  const a = nonNegative(v?.[0]);
  const b = nonNegative(v?.[1]);
  const c = nonNegative(v?.[2]);
  const total = a + b + c;
  if (!(total > EPS)) return [1 / 3, 1 / 3, 1 / 3];
  return [a / total, b / total, c / total];
}

/** A client-supplied vector is only usable if it is three finite numbers. */
export function isUsableProbVector(v: unknown): v is readonly number[] {
  if (!Array.isArray(v) || v.length !== 3) return false;
  if (!v.every(x => typeof x === 'number' && Number.isFinite(x) && x >= 0)) return false;
  return (v as number[]).reduce((s, x) => s + x, 0) > EPS;
}

/* ------------------------------------------------------------ round scoring */

export interface ScorableFixture {
  id: string;
  /** The model's frozen probabilities. Null when the fixture was never priced. */
  model: ProbVector | null;
  /** Null until the result is published. */
  outcome: Outcome | null;
}

export interface RoundScore {
  /** Fixtures that had both a pick and a result. */
  matches: number;
  userTotal: number;
  modelTotal: number;
  /** Ties count as NOT beating the model — the model keeps the tiebreak. */
  beatModel: boolean;
}

/**
 * Score one matchday for one player.
 *
 * The model is scored on exactly the same subset of fixtures the player
 * picked, so a partial entry is still a fair head-to-head — it is simply a
 * comparison over fewer matches.
 */
export function scoreRound(
  fixtures: readonly ScorableFixture[],
  picks: Readonly<Record<string, readonly number[]>>,
): RoundScore {
  let matches = 0;
  let userTotal = 0;
  let modelTotal = 0;

  for (const fixture of fixtures) {
    if (!fixture.model || !fixture.outcome) continue;
    const raw = picks[fixture.id];
    if (!isUsableProbVector(raw)) continue;

    matches += 1;
    userTotal += rps(normalizeProbs(raw), fixture.outcome);
    modelTotal += rps(fixture.model, fixture.outcome);
  }

  return {
    matches,
    userTotal,
    modelTotal,
    beatModel: matches > 0 && userTotal < modelTotal,
  };
}

/** The model's own score over every scorable fixture of a matchday. */
export function scoreModelSlate(fixtures: readonly ScorableFixture[]): {
  matches: number;
  total: number;
} {
  let matches = 0;
  let total = 0;
  for (const fixture of fixtures) {
    if (!fixture.model || !fixture.outcome) continue;
    matches += 1;
    total += rps(fixture.model, fixture.outcome);
  }
  return { matches, total };
}

/* -------------------------------------------------------- season aggregate */

export interface MatchdayScoreRow {
  matchday: number;
  matches: number;
  userTotal: number;
  modelTotal: number;
  beatModel: boolean;
}

export interface SeasonAggregate {
  matches: number;
  matchdays: number;
  userTotal: number;
  modelTotal: number;
  userMean: number | null;
  modelMean: number | null;
  roundsWon: number;
  roundsCounted: number;
  /** Total RPS the player saved against the model. Positive is good. */
  edge: number;
}

export function aggregateSeason(rows: readonly MatchdayScoreRow[]): SeasonAggregate {
  const counted = rows.filter(r => r.matches > 0);
  const matches = counted.reduce((s, r) => s + r.matches, 0);
  const userTotal = counted.reduce((s, r) => s + r.userTotal, 0);
  const modelTotal = counted.reduce((s, r) => s + r.modelTotal, 0);

  return {
    matches,
    matchdays: counted.length,
    userTotal,
    modelTotal,
    userMean: matches > 0 ? userTotal / matches : null,
    modelMean: matches > 0 ? modelTotal / matches : null,
    roundsWon: counted.filter(r => r.beatModel).length,
    roundsCounted: counted.length,
    edge: modelTotal - userTotal,
  };
}

/**
 * Leaderboard order: lowest mean RPS first.
 *
 * Ranking on the *total* would reward sitting matchdays out, so the total is
 * reported but the mean is what sorts. Ties break towards whoever played more
 * matchdays, then on name so the order is stable across requests.
 */
export function compareLeaderboard(
  a: { userMean: number | null; matchdays: number; displayName: string },
  b: { userMean: number | null; matchdays: number; displayName: string },
): number {
  const am = a.userMean;
  const bm = b.userMean;
  if (am === null && bm === null) return a.displayName.localeCompare(b.displayName);
  if (am === null) return 1;
  if (bm === null) return -1;
  if (am !== bm) return am - bm;
  if (a.matchdays !== b.matchdays) return b.matchdays - a.matchdays;
  return a.displayName.localeCompare(b.displayName);
}
