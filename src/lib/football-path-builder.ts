// The club page's "Cria o teu cenário": how a club's season target (title,
// or staying up) moves when the reader fixes the result of some of its
// remaining matches.
//
// The published scenarios (mdNN_scenarios.json → critical_paths) give, for
// every remaining match, the result's overall probability P(o) and its
// probability inside the simulated seasons where the club reaches its target,
// P(o | T). Bayes' rule turns those into the exact answer for one pick:
//
//   P(T | o) = P(o | T) · P(T) / P(o)
//
// which is the same number the scenario conditionals publish for the next
// matchday (Benfica beating Vitória in md08: 25,2%, against 22,4% today).
// Several picks are combined in odds form, one likelihood ratio per pick,
//
//   odds(T | picks) = odds(T) · Π P(o | T) / P(o | ¬T),
//
// which treats the picked results as independent once the target is known.
// That is an approximation (the file holds no joint distribution of several
// results), and the builder says so on the page; for a single pick it is exact.
//
// The previous version read a points-to-probability lookup at the expected
// points total. Evaluating that curve at the mean, rather than averaging it
// over the remaining results, put every scenario on a lower scale than the
// page's own baseline, so picking a win could lower the title chance
// (audit UXM-01: Benfica 22% → 13% after a win).

import type { CriticalPathMatch } from '@/types/football';

export type PathOutcome = 'W' | 'D' | 'L';

/** Smallest probability a term may take before it is used as a divisor. */
const EPS = 1e-6;

function clamp01(p: number): number {
  return Math.min(1 - EPS, Math.max(EPS, p));
}

function overall(m: CriticalPathMatch, o: PathOutcome): number {
  return o === 'W' ? m.p_win_overall : o === 'D' ? m.p_draw_overall : m.p_loss_overall;
}

function givenTarget(m: CriticalPathMatch, o: PathOutcome): number {
  return o === 'W' ? m.p_win_given_target : o === 'D' ? m.p_draw_given_target : m.p_loss_given_target;
}

/**
 * The likelihood ratio P(o | T) / P(o | ¬T) for one result, with
 * P(o | ¬T) = (P(o) − P(o | T)·P(T)) / (1 − P(T)). Monte Carlo noise can push
 * that numerator to zero or below for a near-certain target, so each term is
 * clamped before dividing. A win can only help a club towards its own target
 * and a loss can only hurt it, so the ratio is held at ≥ 1 for a win and ≤ 1
 * for a loss: anything else is sampling noise, not football.
 */
export function likelihoodRatio(m: CriticalPathMatch, o: PathOutcome, pTarget: number): number {
  const pT = clamp01(pTarget);
  const pO = clamp01(overall(m, o));
  const pOgivenT = clamp01(givenTarget(m, o));
  const pOgivenNotT = clamp01((pO - pOgivenT * pT) / (1 - pT));
  const lr = pOgivenT / pOgivenNotT;
  if (o === 'W') return Math.max(1, lr);
  if (o === 'L') return Math.min(1, lr);
  return lr;
}

function toOdds(p: number): number {
  const c = clamp01(p);
  return c / (1 - c);
}

function fromOdds(odds: number): number {
  return odds / (1 + odds);
}

/**
 * P(target) after fixing the given results, `selections` keyed by the
 * match's index in `matches`. With no selection it is `pCurrent` exactly; a
 * target already at 0 or 1 stays there.
 */
export function scenarioProbability(
  pCurrent: number,
  matches: CriticalPathMatch[],
  selections: Record<number, PathOutcome | undefined>,
): number {
  if (pCurrent <= 0) return 0;
  if (pCurrent >= 1) return 1;
  let odds = toOdds(pCurrent);
  let picked = false;
  for (const [key, outcome] of Object.entries(selections)) {
    const m = matches[Number(key)];
    if (!m || !outcome) continue;
    odds *= likelihoodRatio(m, outcome, pCurrent);
    picked = true;
  }
  return picked ? fromOdds(odds) : pCurrent;
}

/**
 * The running probability down the list: row i shows P(target) after the
 * picks in rows 0..i, so the reader sees each pick's own step.
 */
export function runningProbabilities(
  pCurrent: number,
  matches: CriticalPathMatch[],
  selections: Record<number, PathOutcome | undefined>,
): number[] {
  const out: number[] = [];
  const partial: Record<number, PathOutcome | undefined> = {};
  for (let i = 0; i < matches.length; i++) {
    if (selections[i]) partial[i] = selections[i];
    out.push(scenarioProbability(pCurrent, matches, partial));
  }
  return out;
}

/** Points the picked results are worth (3 a win, 1 a draw). */
export function pickedPoints(selections: Record<number, PathOutcome | undefined>): number {
  return Object.values(selections).reduce((sum, o) => sum + (o === 'W' ? 3 : o === 'D' ? 1 : 0), 0);
}

/** Expected points from a set of matches, at their overall result probabilities. */
export function expectedPoints(matches: CriticalPathMatch[]): number {
  return matches.reduce((sum, m) => sum + 3 * m.p_win_overall + m.p_draw_overall, 0);
}
