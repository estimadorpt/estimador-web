// Pure helpers behind the club page's what-ifs (its frame, the other games
// that weigh on it, the final duel) and the match page's impact panel, kept
// out of the components so they can be tested without JSX.

import { relevantObjective, type ClubObjective } from '@/lib/football-fixtures';
import type { NextMatchdayScenarioMatch, NextMatchdayScenarios } from '@/types/football';

/* ----------------------------------------------------------- the frame */

/** From this title chance up, a club's page is about the title. */
export const TITLE_DEFAULT_FROM = 0.01;
/** Below the title line, a club's page is about relegation from the same 1%
 * (the line the club page folds its figures at). */
export const RELEGATION_FRAME_FROM = 0.01;

export type ClubFrame = 'title' | 'relegation';

/**
 * The one race a club's page is about, the same on every part of it (the
 * next game's stakes, the timeline, the scenario builder, the other games
 * that weigh on it, the final duel): the title from 1% of title chance, else
 * relegation (17th or 18th) from 1%, else none. Casa Pia's page used to
 * switch between "despromoção 53%" and "permanência 47%" for one fact
 * (review, October 2026); it now says "despromoção" throughout. A club with
 * neither race above 1% (mid-table) has no what-if to read: null.
 */
export function clubFrame(probs: { p_champion?: number; p_relegation?: number } | undefined): ClubFrame | null {
  if ((probs?.p_champion ?? 0) >= TITLE_DEFAULT_FROM) return 'title';
  if ((probs?.p_relegation ?? 0) >= RELEGATION_FRAME_FROM) return 'relegation';
  return null;
}

/** The probability field a frame reads. */
export function frameMetric(frame: ClubFrame): 'p_champion' | 'p_relegation' {
  return frame === 'title' ? 'p_champion' : 'p_relegation';
}

/** Whether a higher value of the frame's chance is good news for the club. */
export function frameUpIsGood(frame: ClubFrame): boolean {
  return frame === 'title';
}

/**
 * The objective a match page's impact panel reads for a club: its frame,
 * the same rule as its club page, and for a club in neither race the most
 * telling other figure (top three, or relegation under 1%), so the panel
 * still has something to draw.
 */
export function clubObjective(probs: TeamProbs | undefined): ClubObjective {
  const frame = clubFrame(probs);
  return frame ? frameMetric(frame) : (relevantObjective(probs) ?? 'p_top3');
}

/* --------------------------------------------- other games that weigh */

/** Below this spread between results, a game's effect on a club is within
 * the Monte Carlo noise of thin conditional buckets (audit FA2-06): the
 * simulator's line, kept when its list moved to the club pages. */
export const RIVAL_GAME_MIN_SWING = 0.03;

export interface RivalGame {
  /** Index in next_matchday_scenarios.matches (and in the supported fixtures). */
  index: number;
  home: string;
  away: string;
  matchday: number;
  /** The club's frame chance if the home side wins, if they draw, if the away side wins. */
  home_win: number;
  draw: number;
  away_win: number;
  /** Largest minus smallest of the three. */
  swing: number;
}

/**
 * The games of other clubs, in the published round, whose result moves this
 * club's frame chance by RIVAL_GAME_MIN_SWING or more: "Outros jogos que
 * pesam". Never one of the club's own games (its next game has its own
 * section; a rival's game against it is that same game seen from the other
 * side, audit FA2-01). In the file's order; callers order them by kickoff.
 */
export function rivalGames(team: string, frame: ClubFrame, nms: NextMatchdayScenarios | null | undefined): RivalGame[] {
  if (!nms) return [];
  const metric = frameMetric(frame);
  const base = nms.baseline[team]?.[metric];
  if (typeof base !== 'number') return [];
  const out: RivalGame[] = [];
  nms.matches.forEach((match, index) => {
    if (match.home_team === team || match.away_team === team) return;
    const value = (o: 'H' | 'D' | 'A') => {
      const v = match.conditionals?.[o]?.teams?.[team]?.[metric];
      return typeof v === 'number' ? v : base;
    };
    const [h, d, a] = [value('H'), value('D'), value('A')];
    const swing = Math.max(h, d, a) - Math.min(h, d, a);
    if (swing < RIVAL_GAME_MIN_SWING) return;
    out.push({ index, home: match.home_team, away: match.away_team, matchday: match.matchday, home_win: h, draw: d, away_win: a, swing });
  });
  return out;
}

/**
 * The club the final duel opens on: the other club whose chance in the same
 * race is closest to this one's, among those at 1% or more. Null when no
 * other club is in the race, or the club has no frame.
 */
export function duelRival(
  team: string,
  frame: ClubFrame | null,
  table: Array<{ team: string; p_champion: number; p_relegation: number }>,
): string | null {
  if (!frame) return null;
  const metric = frameMetric(frame);
  const own = table.find(r => r.team === team)?.[metric];
  if (typeof own !== 'number') return null;
  const others = table
    .filter(r => r.team !== team && r[metric] >= (frame === 'title' ? TITLE_DEFAULT_FROM : RELEGATION_FRAME_FROM))
    .sort((a, b) => Math.abs(a[metric] - own) - Math.abs(b[metric] - own) || b[metric] - a[metric]);
  return others[0]?.team ?? null;
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
    const objective = clubObjective(baseline[team]);
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
