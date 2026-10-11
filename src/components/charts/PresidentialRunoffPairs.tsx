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
  
  // A probability bar across the full width reads as a share of 100%, so the
  // scale is always 0–100%: a 43% pair reaches 43% of the way. An ink bar on a
  // thin scale rule, no grey track (the instrument's ProbBar, at full width).
  const scaleMax = 1;

  const formatPercent = (value: number) => formatElectionProbability(value, locale);

  if (topPairs.length === 0) {
    return <p className="py-8 text-graphite">{translations.empty}</p>;
  }

  return (
    <div className="space-y-4">
      {topPairs.map((pair) => {
        const barWidth = (pair.probability / scaleMax) * 100;
        
        return (
          <div key={`${pair.candidate_a}-${pair.candidate_b}`}>
            {/* Pair names and probability */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pair.color_a }}
                  />
                  <span className="font-medium text-ink">{pair.candidate_a}</span>
                </div>
                <span className="text-graphite text-xs">{translations.vs}</span>
                <div className="flex items-center gap-1">
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pair.color_b }}
                  />
                  <span className="font-medium text-ink">{pair.candidate_b}</span>
                </div>
              </div>
              <span className="text-sm font-bold text-ink tabular-nums">
                {formatPercent(pair.probability)}
              </span>
            </div>

            <ShareBar width={barWidth} tone="bg-ink" />
          </div>
        );
      })}

      {rest.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-ink">
              {pt
                ? `Outros ${rest.length} pares, em conjunto`
                : `The other ${rest.length} pairs, together`}
            </span>
            <span className="text-sm font-bold text-ink tabular-nums">{formatPercent(restProbability)}</span>
          </div>
          <ShareBar width={(restProbability / scaleMax) * 100} tone="bg-stone-400" />
          <p className="mt-1 text-xs text-graphite">{rest.map(pair => `${pair.candidate_a} ${translations.vs} ${pair.candidate_b} ${formatPercent(pair.probability)}`).join(' · ')}</p>
        </div>
      )}

      {/* Scale markers */}
      <div className="relative h-3 mt-3" aria-hidden="true">
        <div className="absolute inset-x-0 flex justify-between text-[11px] text-graphite">
          <span>{formatElectionPercent(0, locale, 0)}</span>
          <span>{formatElectionPercent(0.5, locale, 0)}</span>
          <span>{formatElectionPercent(1, locale, 0)}</span>
        </div>
      </div>
    </div>
  );
}

/** An ink bar on a thin scale rule: the share of 100% reached, with no track behind it. */
function ShareBar({ width, tone }: { width: number; tone: string }) {
  return (
    <div className="relative h-3 border-b border-scale" aria-hidden="true">
      <div className={`absolute left-0 top-0 h-2 ${tone}`} style={{ width: `${Math.min(100, Math.max(0, width))}%` }} />
    </div>
  );
}
