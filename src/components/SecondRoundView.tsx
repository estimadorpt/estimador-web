"use client";

import { SectionIllustration } from '@/components/brand/SectionIllustration';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Suspense } from 'react';
import { SecondRoundToggle } from './SecondRoundToggle';
import { SecondRoundWinnerCards } from './charts/SecondRoundWinnerCards';
import { SecondRoundVoteSplit } from './charts/SecondRoundVoteSplit';
import { SecondRoundForecastBars } from './charts/SecondRoundForecastBars';
import { SecondRoundBeeswarm } from './charts/SecondRoundBeeswarm';
import { SecondRoundScenarios } from './charts/SecondRoundScenarios';
import { PresidentialTrendChart } from './charts/PresidentialTrendChart';
import { ErrorBoundary } from './ErrorBoundary';
import { Link } from '@/i18n/routing';
import type {
  SecondRoundForecastData,
  SecondRoundTrendsData,
  SecondRoundTrajectoriesData,
  SecondRoundValidVotesData,
  SecondRoundWinProbabilityData,
} from '@/types';

interface SecondRoundContentProps {
  secondRoundData: {
    forecast: SecondRoundForecastData;
    trends: SecondRoundTrendsData;
    trajectories: SecondRoundTrajectoriesData;
    validVotes: SecondRoundValidVotesData;
    winProbability: SecondRoundWinProbabilityData;
  };
  translations: {
    title: string;
    headline: string;
    headlineDescription: string;
    basedOnPolls: string;
    methodology: string;
    winProbability: string;
    validVoteShare: string;
    validVotesNote: string;
    versus: string;
    simulationDistribution: string;
    simulationDescription: string;
    fiftyPercentLine: string;
    showingOutcomes: string;
    keyScenarios: string;
    scenarioCloseRace: string;
    scenarioVentura40: string;
    scenarioDescription: string;
    projectedVoteShare: string;
    projectedVoteShareNote: string;
    confidenceInterval: string;
    blankNull: string;
    trajectoryTitle: string;
    trajectoryDescription: string;
    noRunoffPollsNote: string;
  };
}

function SecondRoundContent({ secondRoundData, translations }: SecondRoundContentProps) {
  const locale = useLocale();
  const pt = locale !== 'en';
  const hasTrend = Object.keys(secondRoundData.trends.candidates || {}).length > 0
    && secondRoundData.trends.dates.length > 0;
  return (
    <>
      {/* Second Round Hero Section — id="forecast" so the in-page nav's
          "O que a previsão dizia" link resolves in this round too. */}
      <section id="forecast" className="scroll-mt-24 bg-paper border-b border-line">
        <div className="illustrated-hero max-w-7xl mx-auto px-4 py-7">
          <div className="max-w-3xl">
            <div className="inline-block bg-moss text-ink text-xs font-semibold px-3 py-1 rounded-full mb-3">
              {translations.title}
            </div>
            <h1 className="text-3xl md:text-4xl text-stone-900 mb-4 leading-tight">
              {translations.headline}
            </h1>
            <p className="text-lg text-stone-600 mb-5 leading-relaxed">
              {translations.headlineDescription}
            </p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-stone-500">{translations.basedOnPolls}</span>
              <span className="text-stone-300">·</span>
              <Link href="/metodologia" className="text-ink hover:text-ink-muted font-medium">
                {translations.methodology}
              </Link>
            </div>
          </div>
          <SectionIllustration scene="elections" />
        </div>
      </section>

      {/* Winner Cards — central answer and winning probability first */}
      <section className="py-8 bg-paper border-b border-line">
        <div className="max-w-7xl mx-auto px-4">
          <ErrorBoundary componentName="Winner Cards">
            <SecondRoundWinnerCards
              winProbability={secondRoundData.winProbability}
              validVotes={secondRoundData.validVotes}
              translations={{
                winProbability: translations.winProbability,
                validVoteShare: translations.validVoteShare,
                validVotesNote: translations.validVotesNote,
                versus: translations.versus,
              }}
            />
          </ErrorBoundary>
        </div>
      </section>

      {/* Valid Votes Split — expected vote share, denominator stated */}
      <section className="py-8 bg-cream border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4">
          <ErrorBoundary componentName="Vote Split">
            <SecondRoundVoteSplit
              validVotes={secondRoundData.validVotes}
              translations={{
                validVotesNote: translations.validVotesNote,
              }}
            />
          </ErrorBoundary>
        </div>
      </section>

      {/* Support trends — the change-over-time/evidence step that was
          missing in this round (id="trajectory" matches the in-page nav's
          "Onde havia incerteza" link, which previously had no target here). */}
      <section id="trajectory" className="scroll-mt-24 py-10 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">
            {translations.trajectoryTitle}
          </h2>
          <p className="text-sm text-stone-500 mb-3 max-w-xl">
            {translations.trajectoryDescription}
          </p>
          <p className="text-xs text-stone-500 mb-8 max-w-xl border-l-2 border-amber-400 pl-3">
            {translations.noRunoffPollsNote}
          </p>
          {hasTrend ? (
            <ErrorBoundary componentName="Second Round Trend">
              <PresidentialTrendChart
                trends={secondRoundData.trends}
                showPolls={false}
                maxCandidates={3}
                height={380}
                candidateParam="candidate2"
              />
            </ErrorBoundary>
          ) : (
            <p className="text-sm text-stone-500">
              {pt
                ? 'Não existe uma série temporal para a segunda volta nesta previsão arquivada.'
                : 'No time series exists for the runoff in this archived forecast.'}
            </p>
          )}
        </div>
      </section>

      {/* Beeswarm Distribution */}
      <section className="py-10 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">
            {translations.simulationDistribution}
          </h2>
          <p className="text-sm text-stone-500 mb-8 max-w-xl">
            {translations.simulationDescription}
          </p>
          <ErrorBoundary componentName="Beeswarm">
            <SecondRoundBeeswarm
              trajectories={secondRoundData.trajectories}
              translations={{
                fiftyPercentLine: translations.fiftyPercentLine,
                showingOutcomes: translations.showingOutcomes,
              }}
            />
          </ErrorBoundary>
        </div>
      </section>

      {/* Key Scenarios */}
      <section className="py-10 bg-paper border-b border-line">
        <div className="max-w-3xl mx-auto px-4">
          <ErrorBoundary componentName="Scenarios">
            <SecondRoundScenarios
              trajectories={secondRoundData.trajectories}
              translations={{
                keyScenarios: translations.keyScenarios,
                scenarioCloseRace: translations.scenarioCloseRace,
                scenarioVentura40: translations.scenarioVentura40,
                scenarioDescription: translations.scenarioDescription,
              }}
            />
          </ErrorBoundary>
        </div>
      </section>

      {/* Forecast Bars — includes blank/null, denominator stated */}
      <section className="py-10 border-b border-stone-300">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">
            {translations.projectedVoteShare}
          </h2>
          <p className="text-xs text-stone-500 mb-6 max-w-xl">
            {translations.projectedVoteShareNote}
          </p>
          <ErrorBoundary componentName="Forecast Bars">
            <SecondRoundForecastBars
              forecast={secondRoundData.forecast}
              showUncertainty={true}
              translations={{
                projectedVoteShare: translations.projectedVoteShare,
                confidenceInterval: translations.confidenceInterval,
                blankNull: translations.blankNull,
              }}
            />
          </ErrorBoundary>
        </div>
      </section>
    </>
  );
}

interface SecondRoundViewProps {
  secondRoundData: {
    forecast: SecondRoundForecastData;
    trends: SecondRoundTrendsData;
    trajectories: SecondRoundTrajectoriesData;
    validVotes: SecondRoundValidVotesData;
    winProbability: SecondRoundWinProbabilityData;
  };
  firstRoundContent: React.ReactNode;
  translations: SecondRoundContentProps['translations'];
  toggleTranslations: {
    firstRound: string;
    secondRound: string;
  };
}

function SecondRoundViewInner({
  secondRoundData,
  firstRoundContent,
  translations,
  toggleTranslations,
}: SecondRoundViewProps) {
  const searchParams = useSearchParams();
  const roundParam = searchParams.get('round');
  // Default to second round (round=2) unless explicitly set to round=1
  const currentRound = roundParam === '1' ? 1 : 2;

  return (
    <>
      {/* Toggle in the banner is rendered by the page */}
      {currentRound === 1 ? (
        firstRoundContent
      ) : (
        <SecondRoundContent
          secondRoundData={secondRoundData}
          translations={translations}
        />
      )}
    </>
  );
}

export function SecondRoundView(props: SecondRoundViewProps) {
  return (
    <Suspense fallback={<SecondRoundContent secondRoundData={props.secondRoundData} translations={props.translations} />}>
      <SecondRoundViewInner {...props} />
    </Suspense>
  );
}

// Client component for banner toggle
interface BannerToggleProps {
  toggleTranslations: {
    firstRound: string;
    secondRound: string;
  };
}

function BannerToggleInner({ toggleTranslations }: BannerToggleProps) {
  const searchParams = useSearchParams();
  const roundParam = searchParams.get('round');
  // Default to second round (round=2) unless explicitly set to round=1
  const currentRound = roundParam === '1' ? 1 : 2;

  return (
    <SecondRoundToggle
      currentRound={currentRound as 1 | 2}
      translations={toggleTranslations}
    />
  );
}

export function BannerToggle({ toggleTranslations }: BannerToggleProps) {
  return (
    <Suspense fallback={<div className="w-32 h-8 bg-stone-700/50 rounded-full animate-pulse" />}>
      <BannerToggleInner toggleTranslations={toggleTranslations} />
    </Suspense>
  );
}

// Helper to get current round from searchParams on client.
// Default is round 2 (no `round` param) — this must match SecondRoundViewInner
// and BannerToggleInner above, or a round-aware label could show the wrong
// round on first paint.
function useCurrentRoundInner(): 1 | 2 {
  const searchParams = useSearchParams();
  const roundParam = searchParams.get('round');
  return roundParam === '1' ? 1 : 2;
}

export function CurrentRoundProvider({ children }: { children: (round: 1 | 2) => React.ReactNode }) {
  return (
    <Suspense fallback={children(2)}>
      <CurrentRoundProviderInner>{children}</CurrentRoundProviderInner>
    </Suspense>
  );
}

function CurrentRoundProviderInner({ children }: { children: (round: 1 | 2) => React.ReactNode }) {
  const currentRound = useCurrentRoundInner();
  return <>{children(currentRound)}</>;
}

/**
 * Round-aware event date + forecast cutoff, so the banner never shows the
 * first-round date while second-round content is active (and vice versa).
 * Event date and cutoff are rendered as two distinct pieces of text — never
 * merged into a single ambiguous label.
 */
export interface RoundDateLabels {
  firstRoundEventDate: string;
  secondRoundEventDate: string;
  firstRoundCutoffLabel: string;
  secondRoundCutoffLabel: string;
}

export function RoundDate(props: RoundDateLabels) {
  return (
    <Suspense fallback={<>{props.firstRoundEventDate}</>}>
      <RoundDateInner {...props} />
    </Suspense>
  );
}

function RoundDateInner({ firstRoundEventDate, secondRoundEventDate, firstRoundCutoffLabel, secondRoundCutoffLabel }: RoundDateLabels) {
  const currentRound = useCurrentRoundInner();
  const eventDate = currentRound === 1 ? firstRoundEventDate : secondRoundEventDate;
  const cutoffLabel = currentRound === 1 ? firstRoundCutoffLabel : secondRoundCutoffLabel;
  return (
    <>
      <span>{eventDate}</span>
      <span className="text-stone-300 mx-2">·</span>
      <span>{cutoffLabel}</span>
    </>
  );
}
