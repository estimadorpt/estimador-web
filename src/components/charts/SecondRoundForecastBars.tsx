"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import { SecondRoundForecastData } from '@/types';
import { formatElectionPercent } from '@/lib/election-display';
import { BLANK_NULL } from '@/lib/election-aggregates';

interface SecondRoundForecastBarsProps {
  forecast: SecondRoundForecastData;
  showUncertainty?: boolean;
  translations: {
    projectedVoteShare: string;
    confidenceInterval: string;
    blankNull: string;
    leading: string;
  };
}

/**
 * Election-day shares of all ballots, blank and null included. Because the
 * denominator includes blank and null ballots, no 50% "majority" marker is
 * drawn here: a majority is a majority of the valid vote, which the cards
 * and the simulation chart above show.
 */
export function SecondRoundForecastBars({
  forecast,
  showUncertainty = true,
  translations,
}: SecondRoundForecastBarsProps) {
  const locale = useLocale();
  // The data key is tested untranslated; only the label is translated.
  const candidates = forecast.candidates.map(c => ({
    ...c,
    isBlankNull: c.name === BLANK_NULL,
    label: c.name === BLANK_NULL ? translations.blankNull : c.name,
  }));

  const maxValue = Math.max(...candidates.map(c => showUncertainty ? c.ci_upper : c.mean));
  const scaleMax = Math.min(0.8, Math.ceil(maxValue * 10) / 10 + 0.05);
  const formatPercent = (value: number) => formatElectionPercent(value, locale);

  return (
    <div className="space-y-4">
      {candidates.map((candidate, index) => {
        const meanPos = (candidate.mean / scaleMax) * 100;
        const ciLowerPos = (candidate.ci_lower / scaleMax) * 100;
        const ciUpperPos = (candidate.ci_upper / scaleMax) * 100;

        return (
          <div key={candidate.name}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: candidate.color }} />
                <span className="text-sm font-medium text-stone-800">{candidate.label}</span>
                {index === 0 && !candidate.isBlankNull && (
                  <span className="text-[11px] text-stone-500 uppercase tracking-wide">{translations.leading}</span>
                )}
              </div>
              <span className="text-sm font-semibold text-stone-900 tabular-nums">{formatPercent(candidate.mean)}</span>
            </div>

            <div className="relative h-5 flex items-center" aria-hidden="true">
              <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
              {showUncertainty && (
                <div
                  className="absolute h-1 rounded-full"
                  style={{
                    left: `${ciLowerPos}%`,
                    width: `${ciUpperPos - ciLowerPos}%`,
                    backgroundColor: candidate.color,
                    opacity: 0.4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
              <div
                className="absolute w-3.5 h-3.5 rounded-full"
                style={{
                  left: `${meanPos}%`,
                  backgroundColor: candidate.color,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: '2px solid #fcfbf5',
                }}
              />
            </div>

            {showUncertainty && (
              <div className="text-[11px] text-stone-500 mt-1 tabular-nums">
                {translations.confidenceInterval}: {formatPercent(candidate.ci_lower)}–{formatPercent(candidate.ci_upper)}
              </div>
            )}
          </div>
        );
      })}

      <div className="relative h-4 mt-3 border-t border-stone-200 pt-2" aria-hidden="true">
        <div className="absolute inset-x-0 flex justify-between text-xs text-stone-500">
          <span>{formatElectionPercent(0, locale, 0)}</span>
          <span>{formatElectionPercent(scaleMax, locale, 0)}</span>
        </div>
      </div>
    </div>
  );
}
