'use client';

import { formatProbabilityPercent } from '@/lib/utils/probability-calculator';

interface SummaryStatsProps {
  // Parliamentary election props
  probAdMostSeats?: number;
  probPsMostSeats?: number;
  probRightMajority?: number;
  probLeftMajority?: number;
  // Which parties make up each bloc, e.g. "AD + IL" — named beside the
  // figure so "Direita"/"Right" is never read without its membership.
  rightCoalitionMembers?: string;
  leftCoalitionMembers?: string;

  // Presidential election props (placeholder for now)
  leadingCandidateProb?: number;
  secondRoundProb?: number;

  // Translated strings
  translations: {
    mostSeats: string;
    rightMajority: string;
    leftMajority: string;
    presidentialLeading: string;
    secondRound: string;
    comingSoon: string;
    mayoralRaces: string;
    municipalCouncils: string;
    mepAllocation: string;
    politicalGroups: string;
    // States that a bloc is an arithmetic grouping of seats, not a
    // prediction that those parties will govern together.
    coalitionArithmeticNote: string;
  };
}

export function ElectionSummaryStats({
  probAdMostSeats = 0,
  probPsMostSeats = 0,
  probRightMajority = 0,
  probLeftMajority = 0,
  rightCoalitionMembers,
  leftCoalitionMembers,
  translations
}: SummaryStatsProps) {

  // For now, only parliamentary elections are supported - show parliamentary stats for all
  return (
    <div>
      <div className="election-summary grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-7">
        <div className="border-l border-line pl-4 first:border-0 first:pl-0">
          <div className="text-4xl font-display font-extrabold tabular-nums text-stone-900 mb-1">
            {formatProbabilityPercent(probAdMostSeats)}
          </div>
          <div className="text-sm text-stone-600">AD {translations.mostSeats}</div>
        </div>
        <div className="border-l border-line pl-4 first:border-0 first:pl-0">
          <div className="text-4xl font-display font-extrabold tabular-nums text-stone-900 mb-1">
            {formatProbabilityPercent(probPsMostSeats)}
          </div>
          <div className="text-sm text-stone-600">PS {translations.mostSeats}</div>
        </div>
        <div className="border-l border-line pl-4 first:border-0 first:pl-0">
          <div className="text-4xl font-display font-extrabold tabular-nums text-stone-900 mb-1">
            {formatProbabilityPercent(probRightMajority)}
          </div>
          <div className="text-sm text-stone-600">
            {translations.rightMajority}
            {rightCoalitionMembers && <span className="text-stone-400"> ({rightCoalitionMembers})</span>}
          </div>
        </div>
        <div className="border-l border-line pl-4 first:border-0 first:pl-0">
          <div className="text-4xl font-display font-extrabold tabular-nums text-stone-900 mb-1">
            {formatProbabilityPercent(probLeftMajority)}
          </div>
          <div className="text-sm text-stone-600">
            {translations.leftMajority}
            {leftCoalitionMembers && <span className="text-stone-400"> ({leftCoalitionMembers})</span>}
          </div>
        </div>
      </div>
      {(rightCoalitionMembers || leftCoalitionMembers) && (
        <p className="text-xs text-stone-500 mt-4">{translations.coalitionArithmeticNote}</p>
      )}
    </div>
  );
}