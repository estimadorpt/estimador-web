"use client";

import React, { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { PresidentialWinProbabilitiesData, PresidentialForecastData, PresidentialTrendsData, PresidentialSnapshotProbabilitiesData, PresidentialChangesData, PresidentialRunoffPairsData, PresidentialRunoffChangesData } from '@/types';
import { presidentialCandidateParties, partyColors } from '@/lib/config/colors';
import { credibleIntervalLabel, estimateHorizonLabel, formatElectionPercent, formatElectionProbability } from '@/lib/election-display';

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
  cutoffDate,
  maxCandidates = 5,
  translations = {
    chanceOfRunoff: 'Runoff odds',
    voteShare: 'Vote share',
    partyLabel: 'Party',
    sinceLastPoll: 'since last poll',
  },
}: PresidentialCandidateCardsProps) {
  const locale = useLocale();
  const pt = locale !== 'en';
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
      // Which horizon/quantile the displayed vote share actually reflects,
      // so the card can say so instead of leaving two differently-scoped
      // numbers looking equivalent (product-usability-diagnosis-2026-09-17 §7).
      let horizon: 'current' | 'electionDay' = 'electionDay';
      let intervalLabel = credibleIntervalLabel(.025, .975, locale);

      if (trends && cutoffIndex >= 0 && trends.candidates[wp.name]) {
        const trendData = trends.candidates[wp.name];
        displayMean = trendData.mean[cutoffIndex];
        // Use ci_25 and ci_75 for a tighter interval display
        const ciLow = trendData.ci_25[cutoffIndex];
        const ciHigh = trendData.ci_75[cutoffIndex];
        displayCI = (ciHigh - ciLow) / 2;
        horizon = 'current';
        intervalLabel = credibleIntervalLabel(.25, .75, locale);
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
        horizon,
        intervalLabel,
        displayRunoffProb,
        party,
        partyColor: party ? partyColors[party as keyof typeof partyColors] : null,
        runoffChange_pp: runoffChange?.change_pp || 0,
      };
    })
    // Sort by runoff probability
    .sort((a, b) => b.displayRunoffProb - a.displayRunoffProb);

  const formatPercentRounded = (value: number) => formatElectionProbability(value, locale);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-stone-200 border-y border-stone-200">
      {candidateData.map((candidate, index) => (
        <div
          key={candidate.name}
          className={`p-4 ${index === 0 ? 'bg-stone-50' : 'bg-cream'}`}
        >
          {/* Color indicator + name */}
          <div className="flex items-start gap-2 mb-3">
            <div 
              className="w-1 h-12 flex-shrink-0"
              style={{ backgroundColor: candidate.color }}
            />
            <div className="min-w-0">
              <h3 className="text-stone-900 text-sm leading-tight">
                {candidate.name}
              </h3>
              <div className="flex items-center gap-2">
                {candidate.party ? (
                  <span className="text-xs text-stone-500">{candidate.party}</span>
                ) : (
                  <span className="text-xs text-stone-500">{pt ? 'Indep.' : 'Ind.'}</span>
                )}
                {index === 0 && (
                  <span className="text-[11px] font-bold text-stone-500 uppercase">
                    · {pt ? 'À frente' : 'Leading'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Runoff probability - big number */}
          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              {/* Ink, not the candidate colour: several candidate colours
                  (pink, cyan, orange) fail contrast on cream. The colour stays
                  on the bar beside the name. */}
              <div className="text-4xl font-display font-extrabold tabular-nums tracking-tighter text-ink">
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
            <div className="text-[11px] text-stone-500 uppercase tracking-wide">
              {translations.chanceOfRunoff}
            </div>
          </div>

          {/* Vote share range */}
          {candidate.displayMean > 0 && (
            <div className="pt-2 mt-2 border-t border-stone-100">
              <div className="text-sm tabular-nums">
                <span className="font-semibold text-stone-800">
                  {formatElectionPercent(candidate.displayMean, locale)}
                </span>
                <span className="text-stone-500 text-xs ml-1">
                  ±{formatElectionPercent(candidate.displayCI, locale)}
                </span>
              </div>
              <div className="text-[11px] text-stone-500 uppercase tracking-wide">
                {translations.voteShare}
              </div>
              <div className="text-[11px] text-stone-500">
                {estimateHorizonLabel(candidate.horizon, locale)} · {candidate.intervalLabel}
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
  locale: string;
  translations: {
    secondRoundNeeded: string;
    probabilityLabel: string;
  };
}

/**
 * The first-round archive's headline: how likely a runoff was. Neutral ink
 * throughout; amber is reserved for caveats, not for a high value.
 */
export function SecondRoundIndicator({ probability, locale, translations }: SecondRoundIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-1 h-12 bg-ink" aria-hidden="true" />
        <div>
          <div className="text-lg font-bold text-stone-900">{translations.secondRoundNeeded}</div>
          <div className="text-sm text-stone-500">{translations.probabilityLabel}</div>
        </div>
      </div>
      <div className="text-5xl font-display font-extrabold tabular-nums tracking-tighter text-ink">
        {formatElectionProbability(probability, locale)}
      </div>
    </div>
  );
}
