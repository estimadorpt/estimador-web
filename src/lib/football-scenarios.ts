// Pure helpers behind the club scenario cards and the match page's impact
// panel, kept out of the components so they can be tested without JSX.

import { relevantObjective, type ClubObjective } from '@/lib/football-fixtures';
import type { NarrativeScenario, NextMatchdayScenarioMatch, ScenarioRivalCondition } from '@/types/football';

/** A rival result counts as part of the scenario only when it happens in at
 * least this share of the scenario's simulations (audit FA2-01): 53% against
 * 48% overall is a tendency, not something that "has to happen". */
export const RIVAL_CONDITION_MIN_SHARE = 0.9;

/**
 * The rival results that come with a scenario almost every time. Two kinds
 * of row are left out (audit FA2-01, PUB2-11):
 *  - any game the club itself plays ("Porto perde pontos vs Benfica (J24)" on
 *    Benfica's page is Benfica's own game seen from the other side, whether
 *    or not it is one of the scenario's steps);
 *  - any result that happens in fewer than RIVAL_CONDITION_MIN_SHARE of the
 *    scenario's simulations.
 */
export function rivalConditionsWithoutOwnMatches(
  team: string,
  scenario: NarrativeScenario,
): ScenarioRivalCondition[] {
  return (scenario.rival_conditions ?? []).filter(
    rc => rc.opponent !== team && rc.rival !== team && rc.p_rival_drops_in_scenario >= RIVAL_CONDITION_MIN_SHARE,
  );
}

export type TeamProbs = { p_champion: number; p_top3: number; p_relegation: number };

/** One club's objective now and after each of its own three results. "Win"
 * is the club's own result, whichever side of the fixture it plays on. */
export function impactStakes(
  scenario: NextMatchdayScenarioMatch,
  baseline: Record<string, TeamProbs>,
  team: string,
  home: string,
  objective: ClubObjective,
): { baseline: number; win: number; draw: number; loss: number } | null {
  const isHome = team === home;
  const winOutcome: 'H' | 'A' = isHome ? 'H' : 'A';
  const lossOutcome: 'H' | 'A' = isHome ? 'A' : 'H';
  const base = baseline[team]?.[objective];
  const win = scenario.conditionals?.[winOutcome]?.teams?.[team]?.[objective];
  const draw = scenario.conditionals?.D?.teams?.[team]?.[objective];
  const loss = scenario.conditionals?.[lossOutcome]?.teams?.[team]?.[objective];
  if (typeof base !== 'number' || typeof win !== 'number' || typeof draw !== 'number' || typeof loss !== 'number') {
    return null;
  }
  return { baseline: base, win, draw, loss };
}

/**
 * The side whose own stakes this match moves most, so the panel opens on the
 * club the hub's badge named (audit FA2-M2): Rio Ave–Nacional opens on
 * Nacional's relegation, not Rio Ave's.
 */
export function initialImpactSide(
  scenario: NextMatchdayScenarioMatch | null,
  baseline: Record<string, TeamProbs> | null,
  home: string,
  away: string,
): 'home' | 'away' {
  if (!scenario?.conditionals || !baseline) return 'home';
  const swing = (team: string) => {
    const objective = relevantObjective(baseline[team]) ?? 'p_top3';
    const st = impactStakes(scenario, baseline, team, home, objective);
    return st ? Math.max(st.win, st.draw, st.loss) - Math.min(st.win, st.draw, st.loss) : 0;
  };
  return swing(away) > swing(home) ? 'away' : 'home';
}

/* ------------------------------------------------------------ the duel */

export interface DuelBin {
  /** Inclusive range of the points difference (A − B). */
  lo: number;
  hi: number;
  count: number;
  side: 'a' | 'b' | 'tie';
}

/**
 * The head-to-head histogram's bins (audit PUB2-09): a bar of its own for a
 * tie on points, then `half` equal ranges on each side ("1 a 7", "8 a 14"…),
 * so the middle bar is exactly "empate em pontos" and never a −3..+3 bin
 * that mixes both clubs ahead with real ties.
 */
export function duelBins(diffs: number[], half = 4): DuelBin[] {
  const maxAbs = Math.max(1, ...diffs.map(d => Math.abs(d)));
  const w = Math.max(1, Math.ceil(maxAbs / half));
  const bins: DuelBin[] = [];
  for (let k = half; k >= 1; k--) bins.push({ lo: -k * w, hi: -(k - 1) * w - 1, count: 0, side: 'b' });
  bins.push({ lo: 0, hi: 0, count: 0, side: 'tie' });
  for (let k = 1; k <= half; k++) bins.push({ lo: (k - 1) * w + 1, hi: k * w, count: 0, side: 'a' });
  for (const d of diffs) {
    const bin = bins.find(b => d >= b.lo && d <= b.hi) ?? (d > 0 ? bins[bins.length - 1] : bins[0]);
    bin.count++;
  }
  return bins;
}

/** Half-width of a 95% interval for a share p estimated from n draws. */
export function samplingMargin(p: number, n: number): number {
  if (n <= 0) return 0;
  return 1.96 * Math.sqrt((p * (1 - p)) / n);
}
