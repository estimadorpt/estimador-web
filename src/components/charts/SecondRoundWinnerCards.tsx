"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import { SecondRoundWinProbabilityData, SecondRoundValidVotesData } from '@/types';
import { formatElectionPercent, formatElectionProbability } from '@/lib/election-display';

interface SecondRoundWinnerCardsProps {
  winProbability: SecondRoundWinProbabilityData;
  validVotes: SecondRoundValidVotesData;
  translations: {
    winProbability: string;
    validVoteShare: string;
    validVotesNote: string;
    versus: string;
    /** Names the interval printed in brackets, e.g. a 95% credible interval. */
    intervalLabel: string;
  };
}

export function SecondRoundWinnerCards({
  winProbability,
  validVotes,
  translations,
}: SecondRoundWinnerCardsProps) {
  const locale = useLocale();
  // Win probabilities are whole percentages bounded by <1% and >99%: 8000
  // simulations cannot support more precision, or a claim of certainty.
  const formatProbability = (value: number) => formatElectionProbability(value, locale);
  const formatPercent = (value: number) => formatElectionPercent(value, locale);

  const formatCI = (lower: number, upper: number) => {
    return `${formatElectionPercent(lower, locale)}–${formatElectionPercent(upper, locale)}`;
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12" data-testid="winner-cards">
      {/* Candidate A Card */}
      <div className="min-w-0 border-t border-line">
        <div
          className="mt-5 h-1 w-8 rounded"
          style={{ backgroundColor: candidateA.color }}
        />
        <div className="py-4">
          <h3 className="text-lg text-stone-900 mb-1">
            {candidateA.name}
          </h3>
          <div className="text-4xl md:text-5xl text-ink tabular-nums font-display font-extrabold mb-2">
            {formatProbability(candidateA.win_probability)}
          </div>
          <div className="text-xs uppercase tracking-wide text-stone-500 mb-4">
            {translations.winProbability}
          </div>
          {validVotesA && (
            <div className="pt-4 border-t border-stone-100">
              <div className="text-sm text-stone-600">
                <span className="font-semibold">{formatPercent(validVotesA.mean)}</span>
                <span className="text-stone-500 ml-1">({formatCI(validVotesA.ci_lower, validVotesA.ci_upper)})</span>
              </div>
              <div className="text-xs text-stone-500 uppercase tracking-wide">
                {translations.validVoteShare}
              </div>
              <div className="text-[11px] text-stone-500">
                {translations.intervalLabel} · {translations.validVotesNote}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Candidate B Card */}
      <div className="min-w-0 border-t border-line">
        <div
          className="mt-5 h-1 w-8 rounded"
          style={{ backgroundColor: candidateB.color }}
        />
        <div className="py-4">
          <h3 className="text-lg text-stone-900 mb-1">
            {candidateB.name}
          </h3>
          <div className="text-4xl md:text-5xl text-ink tabular-nums font-display font-extrabold mb-2">
            {formatProbability(candidateB.win_probability)}
          </div>
          <div className="text-xs uppercase tracking-wide text-stone-500 mb-4">
            {translations.winProbability}
          </div>
          {validVotesB && (
            <div className="pt-4 border-t border-stone-100">
              <div className="text-sm text-stone-600">
                <span className="font-semibold">{formatPercent(validVotesB.mean)}</span>
                <span className="text-stone-500 ml-1">({formatCI(validVotesB.ci_lower, validVotesB.ci_upper)})</span>
              </div>
              <div className="text-xs text-stone-500 uppercase tracking-wide">
                {translations.validVoteShare}
              </div>
              <div className="text-[11px] text-stone-500">
                {translations.intervalLabel} · {translations.validVotesNote}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
