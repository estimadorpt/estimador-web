import { ElectionConfig, ContestantData } from '@/types';

// Current active parliamentary election (2025)
export const PARLIAMENTARY_2025: ElectionConfig = {
  type: 'parliamentary',
  id: 'parliamentary-2025',
  name: 'Eleições Legislativas 2025',
  date: '2025-05-18',
  description: 'Eleições para a Assembleia da República',
  isActive: true,
  geographicLevel: 'district'
};

// All available elections
export const ALL_ELECTIONS = [
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
  return ACTIVE_ELECTIONS[0] || PARLIAMENTARY_2025;
}

// Get contestants for an election (works for both parties and candidates)
export function getElectionContestants(electionId: string): ContestantData[] {
  const election = getElectionById(electionId);
  
  if (!election) return [];
  
  // For parliamentary elections, convert parties to contestants
  if (election.type === 'parliamentary') {
    // Import party data and convert to ContestantData format
    // This will be expanded when we integrate with existing party config
    return [];
  }
  
  return [];
}