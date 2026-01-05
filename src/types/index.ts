// Election type definitions
export type ElectionType = 'parliamentary' | 'presidential' | 'european' | 'municipal';

export interface ElectionConfig {
  type: ElectionType;
  id: string;
  name: string;
  date: string;
  description: string;
  isActive: boolean;
  rounds?: number; // For presidential elections
  geographicLevel: 'national' | 'district' | 'municipality' | 'european';
}

// Candidate data for presidential and municipal elections
export interface CandidateData {
  id: string;
  name: string;
  party?: string;
  coalition?: string[];
  color: string;
  isIncumbent?: boolean;
}

// Flexible contest data that works for parties or candidates
export interface ContestantData {
  id: string;
  name: string;
  shortName?: string;
  type: 'party' | 'candidate' | 'coalition';
  color: string;
  party?: string; // For candidates
  coalition?: string[]; // For coalitions
  isIncumbent?: boolean;
}

// Updated seat data to be more flexible
export interface SeatData {
  [contestantId: string]: number;
}

export interface TrendData {
  date: string;
  party: string;
  metric: string;
  value: number;
}

// Enhanced trend data with election context (for future use)
export interface ElectionTrendData {
  date: string;
  electionId: string;
  contestant: string; // Can be party or candidate ID
  metric: string;
  value: number;
  round?: number; // For multi-round elections
}

// Geographic forecast data
export interface DistrictForecast {
  NAME_1: string;
  district_id: string;
  electionId: string;
  [key: string]: any;
}

export interface ContestedSeat {
  district: string;
  margin: number;
  electionId: string;
  [key: string]: any;
}

// Presidential election specific types
export interface PresidentialRoundData {
  round: number;
  date: string;
  contestants: ContestantData[];
  polling: TrendData[];
  forecast?: {
    winner?: string;
    margin?: number;
    probability?: number;
  };
}

export interface PresidentialElection extends ElectionConfig {
  type: 'presidential';
  rounds: number;
  roundsData: PresidentialRoundData[];
}

// Presidential forecast data (from presidential_forecast.json)
export interface PresidentialCandidateForecast {
  name: string;
  color: string;
  mean: number;
  median: number;
  ci_lower: number;
  ci_upper: number;
  ci_10: number;
  ci_90: number;
}

export interface PresidentialForecastData {
  election_date: string;
  updated_at: string;
  candidates: PresidentialCandidateForecast[];
}

// Presidential win probabilities (from presidential_win_probabilities.json)
export interface PresidentialWinProbability {
  name: string;
  color: string;
  leading_probability: number;
  first_round_win_probability: number;
  mean_support: number;
}

export interface PresidentialWinProbabilitiesData {
  election_date: string;
  second_round_probability: number;
  candidates: PresidentialWinProbability[];
}

// Presidential trends (from presidential_trends.json)
export interface PresidentialCandidateTrend {
  color: string;
  mean: number[];
  ci_05: number[];
  ci_95: number[];
  ci_25: number[];
  ci_75: number[];
}

export interface PresidentialTrendsData {
  election_date: string;
  dates: string[];
  candidates: Record<string, PresidentialCandidateTrend>;
}

// Presidential snapshot leader probabilities over time
// (from presidential_snapshot_probabilities.json)
export interface PresidentialCandidateSnapshotProbabilities {
  color: string;
  leading_probability: number[];
}

export interface PresidentialSnapshotProbabilitiesData {
  election_date: string;
  dates: string[];
  metric: string;
  candidates: Record<string, PresidentialCandidateSnapshotProbabilities>;
}

// Presidential trajectories for spaghetti plot (from presidential_trajectories.json)
export interface PresidentialCandidateTrajectories {
  color: string;
  trajectories: number[][];
}

export interface PresidentialTrajectoriesData {
  election_date: string;
  dates: string[];
  n_samples: number;
  candidates: Record<string, PresidentialCandidateTrajectories>;
}

// Presidential polls (from presidential_polls.json)
export interface PresidentialPoll {
  date: string;
  pollster: string;
  sample_size: number | null;
  [candidateName: string]: string | number | null;
}

export interface PresidentialPollsData {
  polls: PresidentialPoll[];
}

// Presidential house effects (from presidential_house_effects.json)
export interface PresidentialHouseEffect {
  mean: number;
  ci_lower: number;
  ci_upper: number;
  color: string;
}

export interface PresidentialHouseEffectsData {
  pollsters: string[];
  candidates: string[];
  effects: Record<string, Record<string, PresidentialHouseEffect>>;
}

// Presidential head-to-head data (from presidential_head_to_head.json)
export interface PresidentialHeadToHeadData {
  election_date: string;
  candidate_a: string;
  candidate_b: string;
  color_a: string;
  color_b: string;
  dates: string[];
  probability_a_leads: number[];
}

// Presidential runoff pairs data (from presidential_runoff_pairs.json)
export interface PresidentialRunoffPair {
  candidate_a: string;
  candidate_b: string;
  probability: number;
  color_a: string;
  color_b: string;
}

export interface PresidentialRunoffMatrix {
  candidates: string[];
  colors: string[];
  probabilities: number[][];
}

export interface PresidentialRunoffPairsData {
  election_date: string;
  pairs: PresidentialRunoffPair[];
  matrix: PresidentialRunoffMatrix;
}

// Presidential changes since last poll (from presidential_changes.json)
export interface PresidentialCandidateChange {
  name: string;
  color: string;
  current: number;
  previous: number;
  change: number;
  change_pp: number;
}

export interface PresidentialChangesData {
  current_date: string;
  previous_date: string;
  n_polls_current: number;
  n_polls_previous: number;
  total_polls: number;
  candidates: PresidentialCandidateChange[];
}

// Presidential runoff probability changes (from presidential_runoff_changes.json)
export interface PresidentialRunoffChangesData {
  current_date: string;
  previous_date: string;
  candidates: PresidentialCandidateChange[];
}

// Municipal election types
export interface MunicipalElection extends ElectionConfig {
  type: 'municipal';
  municipalities: string[];
  positions: ('mayor' | 'assembly')[];
}

// European election types  
export interface EuropeanElection extends ElectionConfig {
  type: 'european';
  constituencies: string[];
  politicalGroups: string[];
}