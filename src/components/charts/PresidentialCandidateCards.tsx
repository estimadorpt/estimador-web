"use client";

import React, { useMemo } from 'react';
import { PresidentialWinProbabilitiesData, PresidentialForecastData, PresidentialTrendsData, PresidentialSnapshotProbabilitiesData, PresidentialChangesData, PresidentialRunoffPairsData, PresidentialRunoffChangesData } from '@/types';
import { presidentialCandidateParties, partyColors } from '@/lib/config/colors';

interface PresidentialCandidateCardsProps {
  winProbabilities: PresidentialWinProbabilitiesData;
  forecast: PresidentialForecastData;
  trends?: PresidentialTrendsData;
  snapshotProbabilities?: PresidentialSnapshotProbabilitiesData;
  runoffPairs?: PresidentialRunoffPairsData;
  runoffChanges?: PresidentialRunoffChangesData | null;
  changes?: PresidentialChangesData | null;
  cutoffDate?: string;
  maxCandidates?: number;
  translations?: {
    chanceOfRunoff: string;
    voteShare: string;
    partyLabel: string;
    sinceLastPoll: string;
  };
}

// Compute runoff probability for each candidate by summing all pairs where they appear
function computeRunoffProbabilities(pairs: PresidentialRunoffPairsData['pairs']): Record<string, { probability: number; color: string }> {
  const probs: Record<string, { probability: number; color: string }> = {};
  
  for (const pair of pairs) {
    // Add probability to candidate_a
    if (!probs[pair.candidate_a]) {
      probs[pair.candidate_a] = { probability: 0, color: pair.color_a };
    }
    probs[pair.candidate_a].probability += pair.probability;
    
    // Add probability to candidate_b
    if (!probs[pair.candidate_b]) {
      probs[pair.candidate_b] = { probability: 0, color: pair.color_b };
    }
    probs[pair.candidate_b].probability += pair.probability;
  }
  
  return probs;
}

export function PresidentialCandidateCards({
  winProbabilities,
  forecast,
  trends,
  snapshotProbabilities,
  runoffPairs,
  runoffChanges,
  changes,
  cutoffDate,
  maxCandidates = 5,
  translations = {
    chanceOfRunoff: 'Runoff odds',
    voteShare: 'Vote share',
    partyLabel: 'Party',
    sinceLastPoll: 'since last poll',
  },
}: PresidentialCandidateCardsProps) {
  // Calculate cutoff index for trends/snapshot data
  const cutoffIndex = useMemo(() => {
    if (!cutoffDate) return -1;
    const dates = snapshotProbabilities?.dates || trends?.dates;
    if (!dates) return -1;
    const cutoff = new Date(cutoffDate);
    const idx = dates.findIndex(d => new Date(d) > cutoff);
    return idx === -1 ? dates.length - 1 : idx - 1;
  }, [snapshotProbabilities, trends, cutoffDate]);

  // Compute runoff probabilities from pairs data
  const runoffProbabilities = useMemo(() => {
    if (!runoffPairs?.pairs?.length) return null;
    return computeRunoffProbabilities(runoffPairs.pairs);
  }, [runoffPairs]);

  // Build a map of runoff changes by candidate name
  const runoffChangesMap = useMemo(() => {
    if (!runoffChanges) return {};
    const map: Record<string, { change: number; change_pp: number }> = {};
    for (const c of runoffChanges.candidates) {
      map[c.name] = { change: c.change, change_pp: c.change_pp };
    }
    return map;
  }, [runoffChanges]);

  // Combine data from sources, prioritizing runoff probabilities
  const candidateData = winProbabilities.candidates
    .slice(0, maxCandidates)
    .map(wp => {
      const forecastData = forecast.candidates.find(f => f.name === wp.name);
      const party = presidentialCandidateParties[wp.name];
      
      // Get values at cutoff date from trends if available
      let displayMean = forecastData?.mean || 0;
      let displayCI = forecastData ? (forecastData.ci_upper - forecastData.ci_lower) / 2 : 0;
      
      if (trends && cutoffIndex >= 0 && trends.candidates[wp.name]) {
        const trendData = trends.candidates[wp.name];
        displayMean = trendData.mean[cutoffIndex];
        // Use ci_25 and ci_75 for a tighter interval display
        const ciLow = trendData.ci_25[cutoffIndex];
        const ciHigh = trendData.ci_75[cutoffIndex];
        displayCI = (ciHigh - ciLow) / 2;
      }
      
      // Use runoff probability if available, otherwise fall back to leading probability
      const runoffProb = runoffProbabilities?.[wp.name]?.probability ?? 0;
      const displayRunoffProb = runoffProb > 0 ? runoffProb : wp.leading_probability;
      
      // Get runoff probability change since last poll
      const runoffChange = runoffChangesMap[wp.name];
      
      return {
        ...wp,
        forecastData,
        displayMean,
        displayCI,
        displayRunoffProb,
        party,
        partyColor: party ? partyColors[party as keyof typeof partyColors] : null,
        runoffChange_pp: runoffChange?.change_pp || 0,
      };
    })
    // Sort by runoff probability
    .sort((a, b) => b.displayRunoffProb - a.displayRunoffProb);

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatPercentRounded = (value: number) => {
    const pct = value * 100;
    if (pct > 99) return '>99%';
    if (pct < 1) return '<1%';
    return `${Math.round(pct)}%`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-stone-200 border-y border-stone-200">
      {candidateData.map((candidate, index) => (
        <div
          key={candidate.name}
          className={`p-4 ${index === 0 ? 'bg-stone-50' : 'bg-white'}`}
        >
          {/* Color indicator + name */}
          <div className="flex items-start gap-2 mb-3">
            <div 
              className="w-1 h-12 flex-shrink-0"
              style={{ backgroundColor: candidate.color }}
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-900 text-sm leading-tight truncate">
                {candidate.name}
              </h3>
              <div className="flex items-center gap-2">
                {candidate.party ? (
                  <span className="text-xs text-stone-500">{candidate.party}</span>
                ) : (
                  <span className="text-xs text-stone-400">Ind.</span>
                )}
                {index === 0 && (
                  <span className="text-[10px] font-bold text-stone-500 uppercase">
                    · Leader
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Runoff probability - big number */}
          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <div 
                className="text-4xl font-black tabular-nums tracking-tighter"
                style={{ color: candidate.color }}
              >
                {formatPercentRounded(candidate.displayRunoffProb)}
              </div>
              {/* Change indicator */}
              {candidate.runoffChange_pp !== 0 && Math.abs(candidate.runoffChange_pp) >= 1 && (
                <div 
                  className={`text-sm font-semibold tabular-nums ${
                    candidate.runoffChange_pp > 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {candidate.runoffChange_pp > 0 ? '↑' : '↓'}
                  {Math.abs(Math.round(candidate.runoffChange_pp))}
                </div>
              )}
            </div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wide">
              {translations.chanceOfRunoff}
            </div>
          </div>

          {/* Vote share range */}
          {candidate.displayMean > 0 && (
            <div className="pt-2 mt-2 border-t border-stone-100">
              <div className="text-sm tabular-nums">
                <span className="font-semibold text-stone-800">
                  {formatPercent(candidate.displayMean)}
                </span>
                <span className="text-stone-400 text-xs ml-1">
                  ±{formatPercent(candidate.displayCI)}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wide">
                {translations.voteShare}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Second round indicator component
interface SecondRoundIndicatorProps {
  probability: number;
  translations?: {
    secondRoundNeeded: string;
    probabilityLabel: string;
  };
}

export function SecondRoundIndicator({
  probability,
  translations = {
    secondRoundNeeded: 'Second round needed',
    probabilityLabel: 'Probability',
  },
}: SecondRoundIndicatorProps) {
  const formatPercent = (value: number) => {
    const pct = value * 100;
    if (pct > 99) return '>99%';
    if (pct < 1) return '<1%';
    return `${Math.round(pct)}%`;
  };

  const isHighProbability = probability > 0.9;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div 
          className={`w-2 h-12 ${isHighProbability ? 'bg-amber-500' : 'bg-emerald-500'}`}
        />
        <div>
          <div className="text-lg font-bold text-stone-900">
            {translations.secondRoundNeeded}
          </div>
          <div className="text-sm text-stone-500">
            {translations.probabilityLabel}
          </div>
        </div>
      </div>
      <div 
        className={`text-5xl font-black tabular-nums tracking-tighter ${
          isHighProbability ? 'text-amber-600' : 'text-emerald-600'
        }`}
      >
        {formatPercent(probability)}
      </div>
    </div>
  );
}
