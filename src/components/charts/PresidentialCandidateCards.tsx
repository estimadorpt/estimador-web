"use client";

import React from 'react';
import { PresidentialWinProbabilitiesData, PresidentialForecastData } from '@/types';
import { presidentialCandidateParties, partyColors } from '@/lib/config/colors';

interface PresidentialCandidateCardsProps {
  winProbabilities: PresidentialWinProbabilitiesData;
  forecast: PresidentialForecastData;
  maxCandidates?: number;
  translations?: {
    chanceOfLeading: string;
    voteShare: string;
    partyLabel: string;
  };
}

// Momentum badge component
function MomentumBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        ↑
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
        ↓
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      →
    </span>
  );
}

export function PresidentialCandidateCards({
  winProbabilities,
  forecast,
  maxCandidates = 5,
  translations = {
    chanceOfLeading: 'Chance of leading',
    voteShare: 'Vote share',
    partyLabel: 'Party',
  },
}: PresidentialCandidateCardsProps) {
  // Combine data from both sources
  const candidateData = winProbabilities.candidates
    .slice(0, maxCandidates)
    .map(wp => {
      const forecastData = forecast.candidates.find(f => f.name === wp.name);
      const party = presidentialCandidateParties[wp.name];
      
      return {
        ...wp,
        forecastData,
        party,
        partyColor: party ? partyColors[party as keyof typeof partyColors] : null,
      };
    });

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
              {formatPercentRounded(candidate.leading_probability)}
            </div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wide">
              {translations.chanceOfLeading}
            </div>
          </div>

          {/* Vote share range */}
          {candidate.forecastData && (
            <div className="pt-2 mt-2 border-t border-stone-100">
              <div className="text-sm tabular-nums">
                <span className="font-semibold text-stone-800">
                  {formatPercent(candidate.forecastData.mean)}
                </span>
                <span className="text-stone-400 text-xs ml-1">
                  ±{formatPercent((candidate.forecastData.ci_upper - candidate.forecastData.ci_lower) / 2)}
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

