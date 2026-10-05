import type { NextMatchdayScenarios } from '@/types/football';
export type Outcome = 'H' | 'D' | 'A';
export interface FootballExplorationState {
  team?: string;
  objective?: Objective;
  selection?: { index: number; outcome: Outcome };
}

/** Read one reproducible, single-match conditional choice from a shared URL. */
export function readFootballExplorationState(
  search: string,
  version: string,
  data: NextMatchdayScenarios,
): { state: FootballExplorationState; resetForVersion: boolean } {
  const params = new URLSearchParams(search);
  if (params.get('v') !== version) {
    return { state: {}, resetForVersion: params.has('v') };
  }

  const team = params.get('team');
  const objective = params.get('goal') === 'p_relegation' ? 'p_relegation' : 'p_champion';
  const pick = params.get('pick');
  const [rawIndex, rawOutcome] = pick?.split(':') ?? [];
  const index = Number(rawIndex);
  const outcome = rawOutcome === 'H' || rawOutcome === 'D' || rawOutcome === 'A' ? rawOutcome : undefined;

  return {
    state: {
      ...(team && Object.hasOwn(data.baseline, team) ? { team } : {}),
      objective,
      ...(Number.isInteger(index) && index >= 0 && index < data.matches.length && outcome
        ? { selection: { index, outcome } }
        : {}),
    },
    resetForVersion: false,
  };
}

/** Preserve unrelated query parameters while writing the versioned single-match state. */
export function writeFootballExplorationState(
  search: string,
  version: string,
  state: Required<Pick<FootballExplorationState, 'team' | 'objective'>> & Pick<FootballExplorationState, 'selection'>,
): string {
  const params = new URLSearchParams(search);
  params.set('v', version);
  params.set('team', state.team);
  params.set('goal', state.objective);
  if (state.selection) params.set('pick', `${state.selection.index}:${state.selection.outcome}`);
  else params.delete('pick');
  // Old links used picks; removing it prevents an ambiguous multi-match state.
  params.delete('picks');
  return params.toString();
}
/** One history-write's team/objective/pick, serialized the same way the URL
 * carries it, so it can be compared across renders. */
export interface UrlWriteState {
  team: string;
  objective: string;
  /** `"<index>:<outcome>"`, or `''` when nothing is selected. */
  pick: string;
}

/**
 * Whether a URL-state write should push a new history entry rather than
 * replace the current one. Only a selection change on an otherwise-unchanged
 * team and objective earns a history entry, so Back undoes one scenario pick
 * at a time; browsing through teams or objectives replaces in place instead
 * — otherwise every dropdown change would spam history (diagnosis §5/12
 * "Simulator": "Reload and browser Back should preserve the question").
 */
export function shouldPushSelectionState(prev: UrlWriteState, next: UrlWriteState): boolean {
  return prev.team === next.team && prev.objective === next.objective && prev.pick !== next.pick;
}

export type Objective = 'p_champion' | 'p_relegation';
/** Conditional forecasts for a single match; never add independent effects. */
export function conditionalProbabilities(data: NextMatchdayScenarios, selection?: {index:number; outcome:Outcome}) {
  const conditional = selection && data.matches[selection.index]?.conditionals[selection.outcome];
  return Object.fromEntries(Object.entries(data.baseline).map(([team,base]) => [team, {...base, ...conditional?.teams[team]}]));
}
/** Rank by outcome sensitivity, not an assertion that a match caused past changes. */
export function rankMatches(data: NextMatchdayScenarios, team:string, objective:Objective) {
  return data.matches.map((match,index)=>{
    const values = (['H','D','A'] as const).map(outcome=>match.conditionals[outcome].teams[team]?.[objective] ?? data.baseline[team]?.[objective] ?? 0);
    return {match,index,swing:Math.max(...values)-Math.min(...values)};
  }).sort((a,b)=>b.swing-a.swing||a.index-b.index);
}
