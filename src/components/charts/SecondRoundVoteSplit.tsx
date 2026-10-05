"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import { SecondRoundValidVotesData } from '@/types';
import { formatElectionPercent } from '@/lib/election-display';

interface SecondRoundVoteSplitProps {
  validVotes: SecondRoundValidVotesData;
  translations: {
    validVotesNote: string;
  };
}

/**
 * The expected split of the valid vote. Numbers are set in ink: several
 * candidate colours (pink, cyan, orange) fall below 3:1 on cream, so the
 * colour stays on the bar and the swatch, never on the text.
 */
export function SecondRoundVoteSplit({ validVotes, translations }: SecondRoundVoteSplitProps) {
  const locale = useLocale();
  const candidates = validVotes.candidates;
  if (candidates.length < 2) return null;

  const [candidateA, candidateB] = candidates;
  const totalMean = candidateA.mean + candidateB.mean;
  const shareA = candidateA.mean / totalMean;
  const shareB = candidateB.mean / totalMean;

  return (
    <div className="w-full" data-testid="vote-split">
      <div className="flex flex-wrap justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: candidateA.color }} />
          <span className="text-sm font-medium text-stone-700">{candidateA.name}</span>
          <span className="text-lg font-bold text-ink tabular-nums">{formatElectionPercent(shareA, locale)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-ink tabular-nums">{formatElectionPercent(shareB, locale)}</span>
          <span className="text-sm font-medium text-stone-700">{candidateB.name}</span>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: candidateB.color }} />
        </div>
      </div>

      <div className="relative" aria-hidden="true">
        <div className="flex h-10 rounded-lg overflow-hidden">
          <div className="h-full" style={{ width: `${shareA * 100}%`, backgroundColor: candidateA.color }} />
          <div className="h-full" style={{ width: `${shareB * 100}%`, backgroundColor: candidateB.color }} />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-0.5 bg-cream opacity-80" />
      </div>

      <div className="flex justify-center mt-1" aria-hidden="true">
        <span className="text-xs text-stone-500">{formatElectionPercent(0.5, locale, 0)}</span>
      </div>

      <div className="text-xs text-stone-500 text-center mt-2">
        {translations.validVotesNote}
      </div>
    </div>
  );
}
