'use client';

import { useLocale } from 'next-intl';
import { ProbabilityFigure } from '@/components/charts/ProbabilityFigure';

interface SummaryStatsProps {
  probAdMostSeats: number;
  probPsMostSeats: number;
  probRightMajority: number;
  probLeftMajority: number;
  translations: {
    mostSeats: string;
    /** Each bloc named by its members ("Maioria AD + IL"), never by a side alone. */
    rightMajority: string;
    leftMajority: string;
    /**
     * Lines under the figures: that a bloc is an arithmetic grouping of seats,
     * not a prediction that those parties will govern together, and the
     * no-majority share with the AD + CH arithmetic.
     */
    notes: string[];
  };
}

const figureClass = 'block text-4xl font-display font-extrabold tabular-nums text-stone-900 mb-1';

/** The parliamentary archive's headline probabilities. */
export function ElectionSummaryStats({
  probAdMostSeats,
  probPsMostSeats,
  probRightMajority,
  probLeftMajority,
  translations
}: SummaryStatsProps) {
  const locale = useLocale();
  const tiles: Array<[number, string]> = [
    [probAdMostSeats, `AD ${translations.mostSeats}`],
    [probPsMostSeats, `PS ${translations.mostSeats}`],
    [probRightMajority, translations.rightMajority],
    [probLeftMajority, translations.leftMajority],
  ];
  return (
    <div>
      <div className="election-summary grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-7">
        {tiles.map(([probability, label]) => (
          <div key={label} className="border-l border-line pl-4 first:border-0 first:pl-0">
            <ProbabilityFigure probability={probability} locale={locale} className={figureClass} />
            <div className="text-sm text-stone-600">{label}</div>
          </div>
        ))}
      </div>
      {translations.notes.map(note => (
        <p key={note} className="text-xs text-stone-500 mt-3 max-w-3xl">{note}</p>
      ))}
    </div>
  );
}
