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

// Calculate bloc A greater than bloc B probability
export function calculateBlocAGreaterThanBlocBProbability(
  simulationData: SeatData[],
  blocAParties: string[],
  blocBParties: string[]
): number {
  if (!simulationData || simulationData.length === 0) return 0;
  
  let successCount = 0;
  for (const simulation of simulationData) {
    const blocATotal = blocAParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
    const blocBTotal = blocBParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
    if (blocATotal > blocBTotal) successCount++;
  }
  
  return successCount / simulationData.length;
}

// Format probability as percentage
export function formatProbabilityPercent(probability: number): string {
  const pct = probability * 100;
  if (pct > 99) return '>99%';
  if (pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}
