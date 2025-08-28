'use client';

import { useElection } from '@/contexts/ElectionContext';
import { formatProbabilityPercent } from '@/lib/utils/probability-calculator';

interface SummaryStatsProps {
  // Parliamentary election props
  probAdMostSeats?: number;
  probPsMostSeats?: number;
  probRightMajority?: number;
  probLeftMajority?: number;
  
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
  };
}

export function ElectionSummaryStats({
  probAdMostSeats = 0,
  probPsMostSeats = 0,
  probRightMajority = 0,
  probLeftMajority = 0,
  leadingCandidateProb = 0,
  secondRoundProb = 0,
  translations
}: SummaryStatsProps) {
  const { currentElection } = useElection();

  // For now, only parliamentary elections are supported - show parliamentary stats for all
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formatProbabilityPercent(probAdMostSeats)}
        </div>
        <div className="text-sm text-gray-600">AD {translations.mostSeats}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formatProbabilityPercent(probPsMostSeats)}
        </div>
        <div className="text-sm text-gray-600">PS {translations.mostSeats}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formatProbabilityPercent(probRightMajority)}
        </div>
        <div className="text-sm text-gray-600">{translations.rightMajority}</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formatProbabilityPercent(probLeftMajority)}
        </div>
        <div className="text-sm text-gray-600">{translations.leftMajority}</div>
      </div>
    </div>
  );
}