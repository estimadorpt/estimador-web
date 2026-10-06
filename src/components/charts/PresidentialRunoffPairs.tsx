"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import { PresidentialRunoffPairsData } from '@/types';
import { formatElectionPercent, formatElectionProbability } from '@/lib/election-display';

interface PresidentialRunoffPairsProps {
  data: PresidentialRunoffPairsData;
  maxPairs?: number;
  translations: {
    title: string;
    vs: string;
    probability: string;
    empty: string;
  };
}

export function PresidentialRunoffPairs({
  data,
  maxPairs = 6,
  translations,
}: PresidentialRunoffPairsProps) {
  const locale = useLocale();
  const { pairs } = data;
  
  // Take top N pairs; the rest are summed on one line, so the list adds up
  // and a pair that is not drawn is still accounted for.
  const topPairs = pairs.slice(0, maxPairs);
  const rest = pairs.slice(maxPairs);
  const restProbability = rest.reduce((sum, pair) => sum + pair.probability, 0);
  const pt = locale !== 'en';
  
  // A probability bar on a full-width track reads as a share of 100%, so the
  // scale is always 0–100%: a 43% pair fills 43% of the track.
  const scaleMax = 1;

  const formatPercent = (value: number) => formatElectionProbability(value, locale);

  if (topPairs.length === 0) {
    return <p className="text-stone-500 text-center py-8">{translations.empty}</p>;
  }

  return (
    <div className="space-y-3">
      {topPairs.map((pair) => {
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
                  <span className="font-medium text-stone-800">{pair.candidate_a}</span>
                </div>
                <span className="text-stone-500 text-xs">{translations.vs}</span>
                <div className="flex items-center gap-1">
                  <span 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pair.color_b }}
                  />
                  <span className="font-medium text-stone-800">{pair.candidate_b}</span>
                </div>
              </div>
              <span className="text-sm font-bold text-stone-900 tabular-nums">
                {formatPercent(pair.probability)}
              </span>
            </div>

            {/* Bar */}
            <div className="relative h-4 bg-parchment rounded overflow-hidden" aria-hidden="true">
              {/* Neutral color bar */}
              <div
                className="absolute h-full rounded bg-stone-500"
                style={{
                  width: `${barWidth}%`,
                }}
              />
            </div>
          </div>
        );
      })}

      {rest.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-stone-700">
              {pt
                ? `Outros ${rest.length} pares, em conjunto`
                : `The other ${rest.length} pairs, together`}
            </span>
            <span className="text-sm font-bold text-stone-900 tabular-nums">{formatPercent(restProbability)}</span>
          </div>
          <div className="relative h-4 bg-parchment rounded overflow-hidden" aria-hidden="true">
            <div className="absolute h-full rounded bg-stone-400" style={{ width: `${(restProbability / scaleMax) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-stone-500">{rest.map(pair => `${pair.candidate_a} ${translations.vs} ${pair.candidate_b} ${formatPercent(pair.probability)}`).join(' · ')}</p>
        </div>
      )}

      {/* Scale markers */}
      <div className="relative h-3 mt-3" aria-hidden="true">
        <div className="absolute inset-x-0 flex justify-between text-[11px] text-stone-500">
          <span>{formatElectionPercent(0, locale, 0)}</span>
          <span>{formatElectionPercent(0.5, locale, 0)}</span>
          <span>{formatElectionPercent(1, locale, 0)}</span>
        </div>
      </div>
    </div>
  );
}


