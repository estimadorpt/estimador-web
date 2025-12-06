"use client";

import React from 'react';
import { PresidentialForecastData } from '@/types';

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
  const candidates = forecast.candidates.slice(0, maxCandidates);
  
  // Find the max value for scaling
  const maxValue = Math.max(
    ...candidates.map(c => showUncertainty ? c.ci_upper : c.mean)
  );
  const scaleMax = Math.min(0.6, Math.ceil(maxValue * 10) / 10 + 0.05);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-3">
      {candidates.map((candidate, index) => {
        const meanWidth = (candidate.mean / scaleMax) * 100;
        const ciLowerWidth = (candidate.ci_lower / scaleMax) * 100;
        const ciUpperWidth = (candidate.ci_upper / scaleMax) * 100;
        const ci90LowerWidth = (candidate.ci_10 / scaleMax) * 100;
        const ci90UpperWidth = (candidate.ci_90 / scaleMax) * 100;

        return (
          <div key={candidate.name}>
            {/* Candidate name and value */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: candidate.color }}
                />
                <span className="text-sm text-gray-700">
                  {candidate.name}
                </span>
                {index === 0 && (
                  <span className="text-[10px] text-gray-400 uppercase">
                    Leader
                  </span>
                )}
              </div>
              <div className="text-right flex items-baseline gap-2">
                <span className="text-sm font-medium text-gray-900 tabular-nums">
                  {formatPercent(candidate.mean)}
                </span>
                {showUncertainty && (
                  <span className="text-xs text-gray-400 tabular-nums">
                    [{formatPercent(candidate.ci_lower)} – {formatPercent(candidate.ci_upper)}]
                  </span>
                )}
              </div>
            </div>

            {/* Bar visualization - clean style */}
            <div className="relative h-5 bg-gray-100 rounded overflow-hidden">
              {/* 95% CI range */}
              {showUncertainty && (
                <div
                  className="absolute h-full"
                  style={{
                    left: `${ciLowerWidth}%`,
                    width: `${ciUpperWidth - ciLowerWidth}%`,
                    backgroundColor: candidate.color,
                    opacity: 0.15,
                  }}
                />
              )}
              
              {/* 80% CI range */}
              {showUncertainty && (
                <div
                  className="absolute h-full"
                  style={{
                    left: `${ci90LowerWidth}%`,
                    width: `${ci90UpperWidth - ci90LowerWidth}%`,
                    backgroundColor: candidate.color,
                    opacity: 0.3,
                  }}
                />
              )}

              {/* Mean bar */}
              <div
                className="absolute h-full"
                style={{
                  width: `${meanWidth}%`,
                  backgroundColor: candidate.color,
                }}
              />

              {/* 50% threshold marker */}
              <div
                className="absolute h-full w-px bg-gray-400"
                style={{ left: `${(0.5 / scaleMax) * 100}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Scale markers */}
      <div className="relative h-4 mt-2">
        <div className="absolute inset-x-0 flex justify-between text-xs text-gray-400">
          <span>0%</span>
          <span>25%</span>
          <span>{(scaleMax * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Legend */}
      {showUncertainty && (
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-gray-400 rounded-sm" />
            <span>Mean</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-gray-400/40 rounded-sm" />
            <span>80% CI</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 bg-gray-400/20 rounded-sm" />
            <span>95% CI</span>
          </div>
        </div>
      )}
    </div>
  );
}

