import { ElectionConfig, ContestantData } from '@/types';
import { presidentialCandidateColors, presidentialCandidateNames, presidentialCandidateParties, presidentialCandidateOrder } from './colors';

// Presidential election 2026 (next election - homepage)
export const PRESIDENTIAL_2026: ElectionConfig = {
  type: 'presidential',
  id: 'presidential-2026',
  name: 'Eleições Presidenciais 2026',
  date: '2026-01-18',
  description: 'Eleição do Presidente da República',
  isActive: true,
  rounds: 2,
  geographicLevel: 'national'
};

// Parliamentary election 2025
export const PARLIAMENTARY_2025: ElectionConfig = {
  type: 'parliamentary',
  id: 'parliamentary-2025',
  name: 'Eleições Legislativas 2025',
  date: '2025-05-18',
  description: 'Eleições para a Assembleia da República',
  isActive: false, // Previous election
  geographicLevel: 'district'
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

// Get current active election (for default views)
export function getCurrentElection(): ElectionConfig {
  // Presidential 2026 is the next election and should be the default
  return PRESIDENTIAL_2026;
}

// Get the next upcoming election
export function getNextElection(): ElectionConfig {
  const now = new Date();
  const upcoming = ALL_ELECTIONS
    .filter(e => new Date(e.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return upcoming[0] || PRESIDENTIAL_2026;
}

// Get contestants for an election (works for both parties and candidates)
export function getElectionContestants(electionId: string): ContestantData[] {
  const election = getElectionById(electionId);
  
  if (!election) return [];
  
  // For parliamentary elections, convert parties to contestants
  if (election.type === 'parliamentary') {
    // Import and convert party data from the colors config
    const { getParliamentaryContestants } = require('@/lib/config/colors');
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