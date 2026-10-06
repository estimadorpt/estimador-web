import { SeatData } from '@/types';

// Calculate bloc majority probability
export function calculateBlocMajorityProbability(
  simulationData: SeatData[], 
  blocParties: string[], 
  threshold: number
): number {
  if (!simulationData || simulationData.length === 0) return 0;
  
  let successCount = 0;
  for (const simulation of simulationData) {
    const blocTotal = blocParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
    if (blocTotal >= threshold) successCount++;
  }
  
  return successCount / simulationData.length;
}

// Calculate party most seats probability  
export function calculatePartyMostSeatsProbability(
  simulationData: SeatData[],
  targetParty: string,
  competitorParties: string[]
): number {
  if (!simulationData || simulationData.length === 0) return 0;
  
  let successCount = 0;
  for (const simulation of simulationData) {
    const targetSeats = simulation[targetParty] || 0;
    const isWinning = competitorParties.every(competitor => 
      targetSeats > (simulation[competitor] || 0)
    );
    if (isWinning) successCount++;
  }
  
  return successCount / simulationData.length;
}

