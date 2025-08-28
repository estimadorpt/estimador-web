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