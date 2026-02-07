"use client";

import React from 'react';
import { SecondRoundWinProbabilityData, SecondRoundValidVotesData } from '@/types';

interface SecondRoundWinnerCardsProps {
  winProbability: SecondRoundWinProbabilityData;
  validVotes: SecondRoundValidVotesData;
  translations: {
    winProbability: string;
    validVoteShare: string;
    versus: string;
  };
}

export function SecondRoundWinnerCards({
  winProbability,
  validVotes,
  translations,
}: SecondRoundWinnerCardsProps) {
  const formatPercent = (value: number) => {
    const pct = value * 100;
    if (pct > 99) return '>99%';
    if (pct < 0.01) return '<0.01%';
    if (pct < 1) return `${pct.toFixed(2)}%`;
    return `${pct.toFixed(1)}%`;
  };

  const formatCI = (lower: number, upper: number) => {
    return `${(lower * 100).toFixed(1)}% - ${(upper * 100).toFixed(1)}%`;
  };

  // Get candidates
  const candidates = winProbability.candidates;
  const validVotesCandidates = validVotes.candidates;

  if (candidates.length < 2) {
    return null;
  }

  const [candidateA, candidateB] = candidates;
  const validVotesA = validVotesCandidates.find(c => c.name === candidateA.name);
  const validVotesB = validVotesCandidates.find(c => c.name === candidateB.name);

  return (
    <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-8" data-testid="winner-cards">
      {/* Candidate A Card */}
      <div className="flex-1 max-w-md bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div
          className="h-2"
          style={{ backgroundColor: candidateA.color }}
        />
        <div className="p-6">
          <h3 className="text-lg font-bold text-stone-900 mb-1">
            {candidateA.name}
          </h3>
          <div className="text-4xl font-black mb-2" style={{ color: candidateA.color }}>
            {formatPercent(candidateA.win_probability)}
          </div>
          <div className="text-xs uppercase tracking-wide text-stone-500 mb-4">
            {translations.winProbability}
          </div>
          {validVotesA && (
            <div className="pt-4 border-t border-stone-100">
              <div className="text-sm text-stone-600">
                <span className="font-semibold">{formatPercent(validVotesA.mean)}</span>
                <span className="text-stone-400 ml-1">({formatCI(validVotesA.ci_lower, validVotesA.ci_upper)})</span>
              </div>
              <div className="text-xs text-stone-400 uppercase tracking-wide">
                {translations.validVoteShare}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VS Divider */}
      <div className="flex items-center justify-center">
        <span className="text-xl font-bold text-stone-400">
          {translations.versus}
        </span>
      </div>

      {/* Candidate B Card */}
      <div className="flex-1 max-w-md bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div
          className="h-2"
          style={{ backgroundColor: candidateB.color }}
        />
        <div className="p-6">
          <h3 className="text-lg font-bold text-stone-900 mb-1">
            {candidateB.name}
          </h3>
          <div className="text-4xl font-black mb-2" style={{ color: candidateB.color }}>
            {formatPercent(candidateB.win_probability)}
          </div>
          <div className="text-xs uppercase tracking-wide text-stone-500 mb-4">
            {translations.winProbability}
          </div>
          {validVotesB && (
            <div className="pt-4 border-t border-stone-100">
              <div className="text-sm text-stone-600">
                <span className="font-semibold">{formatPercent(validVotesB.mean)}</span>
                <span className="text-stone-400 ml-1">({formatCI(validVotesB.ci_lower, validVotesB.ci_upper)})</span>
              </div>
              <div className="text-xs text-stone-400 uppercase tracking-wide">
                {translations.validVoteShare}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
