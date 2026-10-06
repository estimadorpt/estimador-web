"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import { PresidentialForecastData } from '@/types';
import { formatElectionPercent } from '@/lib/election-display';

interface PresidentialForecastBarsProps {
  forecast: PresidentialForecastData;
  showUncertainty?: boolean;
  maxCandidates?: number;
  translations?: {
    projectedVoteShare: string;
    confidenceInterval: string;
  };
}

export function PresidentialForecastBars({
  forecast,
  showUncertainty = true,
  maxCandidates = 8,
  translations = {
    projectedVoteShare: 'Projected vote share',
    confidenceInterval: '95% CI',
  },
}: PresidentialForecastBarsProps) {
  const locale = useLocale();
  const pt = locale !== 'en';
  // "Others" is not a candidate: it gets a line under the bars, not a bar.
  const candidates = forecast.candidates
    .filter(c => c.name !== 'Others')
    .slice(0, maxCandidates);
  const others = forecast.candidates.find(c => c.name === 'Others');

  // The axis runs to the next round ten above the widest interval, with a
  // tick every ten points (0, 10, 20, 30%), never a "17,5%" midpoint.
  const maxValue = Math.max(
    ...candidates.map(c => showUncertainty ? c.ci_upper : c.mean)
  );
  const scaleMax = Math.min(1, Math.max(0.1, Math.ceil(maxValue * 10 + 1e-9) / 10));
  const ticks = Array.from({ length: Math.round(scaleMax * 10) + 1 }, (_, i) => i / 10);

  const formatPercent = (value: number) => formatElectionPercent(value, locale);

  return (
    <div className="space-y-4">
      {candidates.map((candidate) => {
        const meanPos = (candidate.mean / scaleMax) * 100;
        const ciLowerPos = (candidate.ci_lower / scaleMax) * 100;
        const ciUpperPos = (candidate.ci_upper / scaleMax) * 100;

        return (
          <div key={candidate.name}>
            {/* Candidate name and value */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: candidate.color }}
                />
                <span className="text-sm font-medium text-stone-800">
                  {candidate.name}
                </span>

              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-stone-900 tabular-nums">
                  {formatPercent(candidate.mean)}
                </span>
              </div>
            </div>

            {/* Clean lollipop chart - error bar with dot at mean */}
            <div className="relative h-5 flex items-center">
              {/* Background track */}
              <div className="absolute inset-x-0 top-1/2 h-px bg-line" />

              {/* Error bar - horizontal line spanning CI */}
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

              {/* Mean marker - larger dot */}
              <div
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{
                  left: `${meanPos}%`,
                  backgroundColor: candidate.color,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: '1px solid #fcfbf5',
                }}
              />

              {/* 50% threshold marker */}
              {(0.5 / scaleMax) <= 1 && (
                <div
                  className="absolute h-full w-px bg-ink-muted opacity-50"
                  style={{ left: `${(0.5 / scaleMax) * 100}%` }}
                />
              )}
            </div>

            {/* CI text below bar */}
            {showUncertainty && (
              <div className="text-[11px] text-stone-500 mt-1 tabular-nums">
                {translations.confidenceInterval}: {formatPercent(candidate.ci_lower)}–{formatPercent(candidate.ci_upper)}
              </div>
            )}
          </div>
        );
      })}

      {/* Scale markers, at their true positions */}
      <div className="relative h-5 mt-3 border-t border-stone-200" aria-hidden="true">
        {ticks.map((tick, i) => (
          <span
            key={tick}
            className="absolute top-1.5 text-xs text-stone-500 tabular-nums"
            style={i === 0 ? { left: 0 } : i === ticks.length - 1 ? { right: 0 } : { left: `${(tick / scaleMax) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {formatElectionPercent(tick, locale, 0)}
          </span>
        ))}
      </div>

      {others && (
        <p className="text-xs text-stone-600 tabular-nums">
          {pt ? 'Outros candidatos, em conjunto (sem barra)' : 'Other candidates, together (not drawn)'}: {formatPercent(others.mean)}
          {showUncertainty && ` (${formatPercent(others.ci_lower)}–${formatPercent(others.ci_upper)})`}
        </p>
      )}
    </div>
  );
}
