"use client";

import React, { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { PresidentialWinProbabilitiesData, PresidentialForecastData, PresidentialRunoffPairsData } from '@/types';
import { presidentialCandidateParties } from '@/lib/config/colors';
import { credibleIntervalLabel, formatElectionPercent, formatElectionRange } from '@/lib/election-display';
import { ProbabilityFigure } from './ProbabilityFigure';

interface PresidentialCandidateCardsProps {
  winProbabilities: PresidentialWinProbabilitiesData;
  forecast: PresidentialForecastData;
  /** Election-day runoff pairs (presidential_runoff_pairs.json). */
  runoffPairs?: PresidentialRunoffPairsData;
  maxCandidates?: number;
  translations?: {
    chanceOfRunoff: string;
    voteShare: string;
    partyLabel: string;
  };
}

// Compute runoff probability for each candidate by summing all pairs where they appear
function computeRunoffProbabilities(pairs: PresidentialRunoffPairsData['pairs']): Record<string, number> {
  const probs: Record<string, number> = {};
  for (const pair of pairs) {
    probs[pair.candidate_a] = (probs[pair.candidate_a] ?? 0) + pair.probability;
    probs[pair.candidate_b] = (probs[pair.candidate_b] ?? 0) + pair.probability;
  }
  return probs;
}

/**
 * One card per candidate, every figure on the same horizon: the forecast of
 * 16 January for election day. The big number is the chance of reaching the
 * runoff (summed from the election-day pairs); below it the projected vote
 * share with its 95% interval as a range, as in the bars further down. The
 * card no longer mixes in the snapshot at the last poll, nor the change since
 * the poll before it.
 */
export function PresidentialCandidateCards({
  winProbabilities,
  forecast,
  runoffPairs,
  maxCandidates = 5,
  translations = {
    chanceOfRunoff: 'Chance of reaching the runoff',
    voteShare: 'Projected vote share',
    partyLabel: 'Party',
  },
}: PresidentialCandidateCardsProps) {
  const locale = useLocale();
  const pt = locale !== 'en';

  const runoffProbabilities = useMemo(
    () => (runoffPairs?.pairs?.length ? computeRunoffProbabilities(runoffPairs.pairs) : null),
    [runoffPairs],
  );
  const intervalLabel = credibleIntervalLabel(.025, .975, locale);

  const candidateData = winProbabilities.candidates
    .slice(0, maxCandidates)
    .map(wp => {
      const runoffProb = runoffProbabilities?.[wp.name] ?? 0;
      return {
        ...wp,
        forecastData: forecast.candidates.find(f => f.name === wp.name),
        displayRunoffProb: runoffProb > 0 ? runoffProb : wp.leading_probability,
        party: presidentialCandidateParties[wp.name],
      };
    })
    .sort((a, b) => b.displayRunoffProb - a.displayRunoffProb);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-stone-200 border-y border-stone-200">
      {candidateData.map((candidate, index) => (
        <div
          key={candidate.name}
          className={`p-4 ${index === 0 ? 'bg-stone-50' : 'bg-cream'}`}
        >
          {/* Color indicator + name */}
          <div className="flex items-start gap-2 mb-3">
            <div
              className="w-1 h-12 flex-shrink-0"
              style={{ backgroundColor: candidate.color }}
            />
            <div className="min-w-0">
              <h3 className="text-stone-900 text-sm leading-tight">
                {candidate.name}
              </h3>
              <p className="text-xs text-stone-500">
                {candidate.party ?? (pt ? 'Indep.' : 'Ind.')}
              </p>
              {index === 0 && (
                <p className="text-[11px] font-bold text-stone-500 uppercase">{pt ? 'À frente' : 'Leading'}</p>
              )}
            </div>
          </div>

          {/* Runoff probability, the big number. Ink, not the candidate
              colour: several candidate colours fail contrast on cream. */}
          <div className="mb-2">
            <ProbabilityFigure
              probability={candidate.displayRunoffProb}
              locale={locale}
              className="block text-4xl font-display font-extrabold tabular-nums tracking-tighter text-ink"
            />
            <div className="text-[11px] text-stone-500 uppercase tracking-wide">
              {translations.chanceOfRunoff}
            </div>
          </div>

          {/* Vote share on election day, its interval as a range */}
          {candidate.forecastData && (
            <div className="pt-2 mt-2 border-t border-stone-100">
              <div className="text-sm tabular-nums">
                <span className="font-semibold text-stone-800">
                  {formatElectionPercent(candidate.forecastData.mean, locale)}
                </span>
                <span className="block text-xs text-stone-500">
                  {formatElectionRange(candidate.forecastData.ci_lower, candidate.forecastData.ci_upper, locale)}
                </span>
              </div>
              <div className="text-[11px] text-stone-500 uppercase tracking-wide">
                {translations.voteShare}
              </div>
              <div className="text-[11px] text-stone-500">
                {intervalLabel}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Second round indicator component
interface SecondRoundIndicatorProps {
  probability: number;
  locale: string;
  translations: {
    secondRoundNeeded: string;
    probabilityLabel: string;
  };
}

/**
 * The first-round archive's headline: how likely a runoff was. Neutral ink
 * throughout; amber is reserved for caveats, not for a high value.
 */
export function SecondRoundIndicator({ probability, locale, translations }: SecondRoundIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-1 h-12 bg-ink" aria-hidden="true" />
        <div>
          <div className="text-lg font-bold text-stone-900">{translations.secondRoundNeeded}</div>
          <div className="text-sm text-stone-500">{translations.probabilityLabel}</div>
        </div>
      </div>
      <ProbabilityFigure probability={probability} locale={locale} className="text-5xl font-display font-extrabold tabular-nums tracking-tighter text-ink" />
    </div>
  );
}
