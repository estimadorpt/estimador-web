"use client";

import React from 'react';
import { PresidentialRunoffPairsData } from '@/types';

interface PresidentialRunoffPairsProps {
  data: PresidentialRunoffPairsData;
  maxPairs?: number;
  translations?: {
    title: string;
    vs: string;
    probability: string;
  };
}

export function PresidentialRunoffPairs({
  data,
  maxPairs = 6,
  translations = {
    title: 'Most Likely Runoff Matchups',
    vs: 'vs',
    probability: 'probability',
  },
}: PresidentialRunoffPairsProps) {
  const { pairs } = data;
  
  // Take top N pairs
  const topPairs = pairs.slice(0, maxPairs);
  
  // Find max probability for scaling
  const maxProb = Math.max(...topPairs.map(p => p.probability));
  const scaleMax = Math.ceil(maxProb * 10) / 10 + 0.05;

  const formatPercent = (value: number) => {
    const pct = value * 100;
    if (pct < 1) return '<1%';
    return `${pct.toFixed(0)}%`;
  };

  if (topPairs.length === 0) {
    return <div className="text-gray-500 text-center py-8">No runoff data available</div>;
  }

  return (
    <div className="space-y-3">
      {topPairs.map((pair, index) => {
        const barWidth = (pair.probability / scaleMax) * 100;
        
        return (
          <div key={`${pair.candidate_a}-${pair.candidate_b}`}>
            {/* Pair names and probability */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <span 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pair.color_a }}
                  />
                  <span className="font-medium text-gray-800">{pair.candidate_a}</span>
                </div>
                <span className="text-gray-400 text-xs">{translations.vs}</span>
                <div className="flex items-center gap-1">
                  <span 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pair.color_b }}
                  />
                  <span className="font-medium text-gray-800">{pair.candidate_b}</span>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900 tabular-nums">
                {formatPercent(pair.probability)}
              </span>
            </div>

            {/* Bar */}
            <div className="relative h-4 bg-gray-100 rounded overflow-hidden">
              {/* Gradient bar using both candidate colors */}
              <div
                className="absolute h-full rounded"
                style={{
                  width: `${barWidth}%`,
                  background: `linear-gradient(90deg, ${pair.color_a}, ${pair.color_b})`,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Scale markers */}
      <div className="relative h-3 mt-3">
        <div className="absolute inset-x-0 flex justify-between text-[10px] text-gray-400">
          <span>0%</span>
          <span>{(scaleMax * 50).toFixed(0)}%</span>
          <span>{(scaleMax * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}



