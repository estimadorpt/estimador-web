import { 
  PresidentialTrajectoriesData, 
  PresidentialRunoffPairsData,
  PresidentialRunoffPair 
} from '@/types';

/**
 * Compute runoff pair probabilities at a specific date index from trajectories data.
 * 
 * For each sample trajectory at the given date, determines which two candidates
 * would finish 1st and 2nd (go to second round), then counts the frequency of each pair.
 * 
 * @param trajectories - Trajectories data with samples for each candidate over time
 * @param dateIndex - Index in the dates array to compute runoff pairs at
 * @returns Runoff pairs data structure compatible with PresidentialRunoffPairsData
 */
export function computeRunoffPairsAtDate(
  trajectories: PresidentialTrajectoriesData,
  dateIndex: number
): PresidentialRunoffPairsData {
  const candidates = Object.keys(trajectories.candidates);
  const nSamples = trajectories.n_samples;
  
  // Count occurrences of each pair going to runoff
  const pairCounts: Record<string, number> = {};
  
  for (let sampleIdx = 0; sampleIdx < nSamples; sampleIdx++) {
    // Get each candidate's value at this date for this sample
    const sampleValues: { name: string; value: number }[] = [];
    
    for (const candidate of candidates) {
      const candidateData = trajectories.candidates[candidate];
      // Check if this sample exists
      if (candidateData.trajectories[sampleIdx]) {
        const value = candidateData.trajectories[sampleIdx][dateIndex];
        if (value !== undefined) {
          sampleValues.push({ name: candidate, value });
        }
      }
    }
    
    // Sort by value descending and get top 2
    sampleValues.sort((a, b) => b.value - a.value);
    
    if (sampleValues.length >= 2) {
      const first = sampleValues[0].name;
      const second = sampleValues[1].name;
      
      // Create canonical pair key (alphabetically sorted)
      const pair = [first, second].sort().join('|');
      pairCounts[pair] = (pairCounts[pair] || 0) + 1;
    }
  }
  
  // Convert to pairs array with probabilities
  const pairs: PresidentialRunoffPair[] = Object.entries(pairCounts)
    .map(([pairKey, count]) => {
      const [candidate_a, candidate_b] = pairKey.split('|');
      return {
        candidate_a,
        candidate_b,
        probability: count / nSamples,
        color_a: trajectories.candidates[candidate_a]?.color || '#808080',
        color_b: trajectories.candidates[candidate_b]?.color || '#808080',
      };
    })
    .sort((a, b) => b.probability - a.probability);
  
  // Build matrix for top candidates (those with >1% runoff chance)
  const candidatesInRunoff = new Set<string>();
  for (const pair of pairs) {
    if (pair.probability >= 0.01) {
      candidatesInRunoff.add(pair.candidate_a);
      candidatesInRunoff.add(pair.candidate_b);
    }
  }
  
  // Order candidates by their total probability of being in a runoff
  const candidateProbabilities: Record<string, number> = {};
  for (const pair of pairs) {
    candidateProbabilities[pair.candidate_a] = 
      (candidateProbabilities[pair.candidate_a] || 0) + pair.probability;
    candidateProbabilities[pair.candidate_b] = 
      (candidateProbabilities[pair.candidate_b] || 0) + pair.probability;
  }
  
  const candidateOrder = Array.from(candidatesInRunoff)
    .sort((a, b) => (candidateProbabilities[b] || 0) - (candidateProbabilities[a] || 0));
  
  // Build probability matrix
  const n = candidateOrder.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (const pair of pairs) {
    const i = candidateOrder.indexOf(pair.candidate_a);
    const j = candidateOrder.indexOf(pair.candidate_b);
    if (i >= 0 && j >= 0) {
      matrix[i][j] = pair.probability;
      matrix[j][i] = pair.probability;
    }
  }
  
  return {
    election_date: trajectories.election_date,
    pairs,
    matrix: {
      candidates: candidateOrder,
      colors: candidateOrder.map(c => trajectories.candidates[c]?.color || '#808080'),
      probabilities: matrix,
    },
  };
}

/**
 * Compute runoff pairs at the cutoff date (last poll date).
 * 
 * @param trajectories - Trajectories data
 * @param cutoffDate - Date string to use as cutoff (last poll date)
 * @returns Runoff pairs data at the cutoff date
 */
export function computeRunoffPairsAtCutoff(
  trajectories: PresidentialTrajectoriesData,
  cutoffDate: string | null
): PresidentialRunoffPairsData {
  if (!cutoffDate || !trajectories.dates || trajectories.dates.length === 0) {
    // Fall back to last date in trajectories
    const lastIndex = trajectories.dates.length - 1;
    return computeRunoffPairsAtDate(trajectories, lastIndex);
  }
  
  // Find the index for the cutoff date
  const cutoffDateObj = new Date(cutoffDate);
  let cutoffIndex = trajectories.dates.findIndex(
    d => new Date(d) > cutoffDateObj
  ) - 1;
  
  // Handle edge cases
  if (cutoffIndex < 0) {
    cutoffIndex = trajectories.dates.length - 1;
  }
  
  return computeRunoffPairsAtDate(trajectories, cutoffIndex);
}

