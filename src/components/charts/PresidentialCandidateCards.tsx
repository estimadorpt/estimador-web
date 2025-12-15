"use client";

import React, { useMemo } from 'react';
import { PresidentialWinProbabilitiesData, PresidentialForecastData, PresidentialTrendsData, PresidentialSnapshotProbabilitiesData } from '@/types';
import { presidentialCandidateParties, partyColors } from '@/lib/config/colors';

interface PresidentialCandidateCardsProps {
  winProbabilities: PresidentialWinProbabilitiesData;
  forecast: PresidentialForecastData;
  trends?: PresidentialTrendsData;
  snapshotProbabilities?: PresidentialSnapshotProbabilitiesData;
  cutoffDate?: string;
  maxCandidates?: number;
  translations?: {
    chanceOfLeading: string;
    voteShare: string;
    partyLabel: string;
  };
}

export function PresidentialCandidateCards({
  winProbabilities,
  forecast,
  trends,
  snapshotProbabilities,
  cutoffDate,
  maxCandidates = 5,
  translations = {
    chanceOfLeading: 'Chance of leading',
    voteShare: 'Vote share',
    partyLabel: 'Party',
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

  // Get leading probabilities from snapshot data (computed from joint posterior)
  const leadingProbabilities = useMemo(() => {
    if (!snapshotProbabilities || cutoffIndex < 0) return null;
    
    const probs: Record<string, number> = {};
    for (const [name, data] of Object.entries(snapshotProbabilities.candidates)) {
      probs[name] = data.leading_probability[cutoffIndex];
    }
    return probs;
  }, [snapshotProbabilities, cutoffIndex]);

  // Combine data from both sources, using trends data at cutoff if available
  const candidateData = winProbabilities.candidates
    .slice(0, maxCandidates)
    .map(wp => {
      const forecastData = forecast.candidates.find(f => f.name === wp.name);
      const party = presidentialCandidateParties[wp.name];
      
      // Get values at cutoff date from trends if available
      let displayMean = forecastData?.mean || 0;
      let displayCI = forecastData ? (forecastData.ci_upper - forecastData.ci_lower) / 2 : 0;
      let displayLeadingProb = wp.leading_probability;
      
      if (trends && cutoffIndex >= 0 && trends.candidates[wp.name]) {
        const trendData = trends.candidates[wp.name];
        displayMean = trendData.mean[cutoffIndex];
        // Use ci_25 and ci_75 for a tighter interval display
        const ciLow = trendData.ci_25[cutoffIndex];
        const ciHigh = trendData.ci_75[cutoffIndex];
        displayCI = (ciHigh - ciLow) / 2;
        
        // Use computed probability at cutoff if available
        if (leadingProbabilities && leadingProbabilities[wp.name] !== undefined) {
          displayLeadingProb = leadingProbabilities[wp.name];
        }
      }
      
      return {
        ...wp,
        forecastData,
        displayMean,
        displayCI,
        displayLeadingProb,
        party,
        partyColor: party ? partyColors[party as keyof typeof partyColors] : null,
      };
    })
    // Re-sort by leading probability at cutoff
    .sort((a, b) => b.displayLeadingProb - a.displayLeadingProb);

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatPercentRounded = (value: number) => {
    const pct = value * 100;
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

          {/* Win probability - big number */}
          <div className="mb-2">
            <div 
              className="text-4xl font-black tabular-nums tracking-tighter"
              style={{ color: candidate.color }}
            >
              {formatPercentRounded(candidate.displayLeadingProb)}
            </div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wide">
              {translations.chanceOfLeading}
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
    if (pct >= 99.5) return '>99%';
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

