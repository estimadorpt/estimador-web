import { ElectionConfig, ContestantData } from '@/types';
import { getParliamentaryContestants, presidentialCandidateColors, presidentialCandidateNames, presidentialCandidateParties, presidentialCandidateOrder } from './colors';

// Presidential election 2026 (archived forecast: both rounds have taken place)
export const PRESIDENTIAL_2026: ElectionConfig = {
  type: 'presidential',
  id: 'presidential-2026',
  // Sentence case, as everywhere on the site (the homepage panel prints it).
  name: 'Eleições presidenciais 2026',
  date: '2026-01-18',
  description: 'Eleição do Presidente da República',
  isActive: false,
  rounds: 2,
  geographicLevel: 'national'
};

// Second-round (runoff) date, confirmed against second_round_trends.json /
// second_round_forecast.json ("election_date": "2026-02-08"). The first-round
// date above (PRESIDENTIAL_2026.date) must never be reused to label the runoff.
export const PRESIDENTIAL_2026_SECOND_ROUND_DATE = '2026-02-08';

// Parliamentary election 2025
export const PARLIAMENTARY_2025: ElectionConfig = {
  type: 'parliamentary',
  id: 'parliamentary-2025',
  name: 'Eleições legislativas 2025',
  date: '2025-05-18',
  description: 'Eleições para a Assembleia da República',
  isActive: false, // Previous election
  geographicLevel: 'district'
};

/**
 * The day the archived parliamentary forecast was made. The published files
 * carry the election-day projection (national_trends.json ends on 18 May), not
 * the run date; the final model run is `dynamic_gp_run_20250516_090447`, and
 * the comparison exported with it was stamped 2025-05-16T14:06. Owner to
 * confirm if a later run was ever published.
 */
export const PARLIAMENTARY_2025_FORECAST_CUTOFF = '2025-05-16';

/**
 * Official results, linked from each archive without figures: the archives do
 * not restate results the site has not verified. SGMAI publishes each
 * election, and each presidential round, at its own address.
 */
export const OFFICIAL_RESULTS: Record<string, ReadonlyArray<{ round: 1 | 2 | null; href: string }>> = {
  'parliamentary-2025': [{ round: null, href: 'https://www.eleicoes.mai.gov.pt/legislativas2025/' }],
  'presidential-2026': [
    { round: 1, href: 'https://www.eleicoes.mai.gov.pt/presidenciais2026_1S/' },
    { round: 2, href: 'https://www.eleicoes.mai.gov.pt/presidenciais2026_2S/' },
  ],
};

// All available elections
export const ALL_ELECTIONS = [
  PRESIDENTIAL_2026,
  PARLIAMENTARY_2025
];

// Active elections (currently being forecast)
export const ACTIVE_ELECTIONS = ALL_ELECTIONS.filter(election => election.isActive);

// Get election by ID
export function getElectionById(id: string): ElectionConfig | undefined {
  return ALL_ELECTIONS.find(election => election.id === id);
}

// Get elections by type
export function getElectionsByType(type: string): ElectionConfig[] {
  return ALL_ELECTIONS.filter(election => election.type === type);
}

// The election the elections context opens on. Every configured election is
// an archive: this is the most recent one, not an upcoming election.
export function getCurrentElection(): ElectionConfig {
  return PRESIDENTIAL_2026;
}

// The next election after `now`, or undefined when none is configured. It
// never falls back to a past election, so nothing can present an archive as
// upcoming.
export function getNextElection(now: Date = new Date()): ElectionConfig | undefined {
  return ALL_ELECTIONS
    .filter(e => new Date(e.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
}

// Get contestants for an election (works for both parties and candidates)
export function getElectionContestants(electionId: string): ContestantData[] {
  const election = getElectionById(electionId);
  
  if (!election) return [];
  
  // For parliamentary elections, convert parties to contestants
  if (election.type === 'parliamentary') {
    // Import and convert party data from the colors config
    return getParliamentaryContestants();
  }
  
  // For presidential elections, convert candidates to contestants
  if (election.type === 'presidential') {
    return getPresidentialContestants();
  }
  
  // For other election types, return empty array (to be implemented when needed)
  return [];
}

// Get presidential candidates as contestants
export function getPresidentialContestants(): ContestantData[] {
  return presidentialCandidateOrder.map(candidateId => ({
    id: candidateId,
    name: presidentialCandidateNames[candidateId],
    shortName: candidateId,
    type: 'candidate' as const,
    color: presidentialCandidateColors[candidateId],
    party: presidentialCandidateParties[candidateId] || undefined,
    isIncumbent: false
  }));
}