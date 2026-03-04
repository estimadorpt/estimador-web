// Liga Portugal prediction data types
// Matches JSON schema from liga-predict model output

export interface TeamStanding {
  team: string;
  mean_pts: number;
  std_pts: number;
  mean_gd: number;
  p_champion: number;
  p_top3: number;
  p_relegation: number;
  p_champion_lo?: number;
  p_champion_hi?: number;
  p_relegation_lo?: number;
  p_relegation_hi?: number;
}

export interface MatchPrediction {
  home: string;
  away: string;
  p_home: number;
  p_draw: number;
  p_away: number;
}

export interface NextMatchday {
  matchday: number;
  matches: MatchPrediction[];
}

export type PositionProbs = Record<string, number[]>;

export interface LigaPrediction {
  season: string;
  matchday: number;
  model: string;
  n_sims: number;
  timestamp: string;
  table: TeamStanding[];
  position_probs: PositionProbs;
  next_matchday: NextMatchday;
}

export interface DecisiveMatch {
  home_team: string;
  away_team: string;
  matchday: number;
  most_affected_team: string;
  p_champ_if_H: number;
  p_champ_if_D: number;
  p_champ_if_A: number;
  p_champ_baseline: number;
  title_swing: number;
  most_affected_relegation_team?: string;
  p_releg_if_H?: number;
  p_releg_if_D?: number;
  p_releg_if_A?: number;
  p_releg_baseline?: number;
  relegation_swing?: number;
}

export interface CriticalPathMatch {
  opponent: string;
  venue: 'H' | 'A';
  matchday: number;
  p_win_overall: number;
  p_draw_overall: number;
  p_loss_overall: number;
  p_win_given_target: number;
  p_draw_given_target: number;
  p_loss_given_target: number;
  win_uplift: number;
}

export interface CriticalPath {
  target: 'champion' | 'survival';
  p_current: number;
  matches: CriticalPathMatch[];
}

// Victory paths: progressive funnel + rival conditions
export interface VictoryPathStep {
  opponent: string;
  venue: 'H' | 'A';
  matchday: number;
  p_win_overall: number;
  p_win_given_target: number;
  win_uplift: number;
  remaining_sims: number;
  pct_of_target: number;
}

export interface RivalCondition {
  rival: string;
  opponent: string;
  matchday: number;
  p_rival_drops_overall: number;
  p_rival_drops_given_target: number;
  drop_uplift: number;
}

export interface VictoryPath {
  target: 'champion' | 'survival';
  n_target: number;
  n_sims: number;
  p_current: number;
  funnel: VictoryPathStep[];
  rival_conditions: RivalCondition[];
}

export interface ScenarioData {
  season: string;
  matchday: number;
  n_sims: number;
  timestamp: string;
  decisive_matches: DecisiveMatch[];
  critical_paths: Record<string, CriticalPath>;
  victory_paths?: Record<string, VictoryPath>;
  survival_paths?: Record<string, VictoryPath>;
}

// Historical data: array of predictions per matchday for time-series charts
export type LigaHistorical = LigaPrediction[];
