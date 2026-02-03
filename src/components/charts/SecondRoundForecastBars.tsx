"use client";

import React from 'react';
import { SecondRoundForecastData } from '@/types';

interface SecondRoundForecastBarsProps {
  forecast: SecondRoundForecastData;
  showUncertainty?: boolean;
  translations: {
    projectedVoteShare: string;
    confidenceInterval: string;
    blankNull?: string;
  };
}

export function SecondRoundForecastBars({
  forecast,
  showUncertainty = true,
  translations = {
    projectedVoteShare: 'Projected vote share',
    confidenceInterval: '95% CI',
  },
}: SecondRoundForecastBarsProps) {
  // Translate candidate names if needed
  const candidates = forecast.candidates.map(c => ({
    ...c,
    name: c.name === 'Blank/Null' && translations.blankNull ? translations.blankNull : c.name
  }));

  // Find the max value for scaling (cap at 80%)
  const maxValue = Math.max(
    ...candidates.map(c => showUncertainty ? c.ci_upper : c.mean)
  );
  const scaleMax = Math.min(0.8, Math.ceil(maxValue * 10) / 10 + 0.05);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  // 50% threshold position
  const fiftyPercentPos = (0.5 / scaleMax) * 100;

  return (
    <div className="space-y-4">
      {candidates.map((candidate, index) => {
        const meanPos = (candidate.mean / scaleMax) * 100;
        const ciLowerPos = (candidate.ci_lower / scaleMax) * 100;
        const ciUpperPos = (candidate.ci_upper / scaleMax) * 100;
        const isBlankNull = candidate.name === 'Blank/Null';

        return (
          <div key={candidate.name}>
            {/* Candidate name and value */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: candidate.color }}
                />
                <span className="text-sm font-medium text-gray-800">
                  {candidate.name}
                </span>
                {index === 0 && (
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                    Leader
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {formatPercent(candidate.mean)}
                </span>
              </div>
            </div>

            {/* Clean lollipop chart - error bar with dot at mean */}
            <div className="relative h-5 flex items-center">
              {/* Background track */}
              <div className="absolute inset-0 bg-gray-100 rounded-full" />

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
                className="absolute w-4 h-4 rounded-full shadow-sm"
                style={{
                  left: `${meanPos}%`,
                  backgroundColor: candidate.color,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: '2px solid white',
                }}
              />

              {/* 50% threshold marker (only show for non-blank/null) */}
              {!isBlankNull && fiftyPercentPos <= 100 && (
                <div
                  className="absolute h-full w-px bg-red-400 opacity-70"
                  style={{ left: `${fiftyPercentPos}%` }}
                />
              )}
            </div>

            {/* CI text below bar */}
            {showUncertainty && (
              <div className="text-[11px] text-gray-400 mt-1 tabular-nums">
                95% CI: {formatPercent(candidate.ci_lower)} - {formatPercent(candidate.ci_upper)}
              </div>
            )}
          </div>
        );
      })}

      {/* Scale markers */}
      <div className="relative h-4 mt-3 border-t border-gray-200 pt-2">
        <div className="absolute inset-x-0 flex justify-between text-xs text-gray-400">
          <span>0%</span>
          {fiftyPercentPos <= 100 && (
            <span className="text-red-500 font-medium" style={{ marginLeft: `${fiftyPercentPos}%`, transform: 'translateX(-50%)', position: 'absolute' }}>
              50%
            </span>
          )}
          <span>{(scaleMax * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
