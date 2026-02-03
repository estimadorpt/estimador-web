"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SecondRoundToggle } from './SecondRoundToggle';
import { SecondRoundWinnerCards } from './charts/SecondRoundWinnerCards';
import { SecondRoundVoteSplit } from './charts/SecondRoundVoteSplit';
import { SecondRoundForecastBars } from './charts/SecondRoundForecastBars';
import { SecondRoundBeeswarm } from './charts/SecondRoundBeeswarm';
import { SecondRoundScenarios } from './charts/SecondRoundScenarios';
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
    versus: string;
    validVotesNote: string;
    simulationDistribution: string;
    simulationDescription: string;
    fiftyPercentLine: string;
    showingOutcomes: string;
    keyScenarios: string;
    scenarioVenturaBeatsAD: string;
    scenarioCloseRace: string;
    scenarioVentura40: string;
    scenarioDescription: string;
    projectedVoteShare: string;
    confidenceInterval: string;
    blankNull: string;
  };
}

function SecondRoundContent({ secondRoundData, translations }: SecondRoundContentProps) {
  return (
    <>
      {/* Second Round Hero Section */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="max-w-3xl">
            <div className="inline-block bg-pink-100 text-pink-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              {translations.title}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4 leading-tight">
              {translations.headline}
            </h1>
            <p className="text-lg text-stone-600 mb-5 leading-relaxed">
              {translations.headlineDescription}
            </p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-stone-500">{translations.basedOnPolls}</span>
              <span className="text-stone-300">·</span>
              <Link href="/methodology" className="text-navy hover:text-navy-light font-medium">
                {translations.methodology}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Winner Cards */}
      <section className="py-8 bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4">
          <ErrorBoundary componentName="Winner Cards">
            <SecondRoundWinnerCards
              winProbability={secondRoundData.winProbability}
              validVotes={secondRoundData.validVotes}
              translations={{
                winProbability: translations.winProbability,
                validVoteShare: translations.validVoteShare,
                versus: translations.versus,
              }}
            />
          </ErrorBoundary>
        </div>
      </section>

      {/* Valid Votes Split */}
      <section className="py-8 bg-white border-b border-stone-200">
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

      {/* Beeswarm Distribution */}
      <section className="py-10 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-bold text-stone-900 mb-1 tracking-tight">
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
      <section className="py-10 bg-white border-b border-stone-300">
        <div className="max-w-3xl mx-auto px-4">
          <ErrorBoundary componentName="Scenarios">
            <SecondRoundScenarios
              trajectories={secondRoundData.trajectories}
              translations={{
                keyScenarios: translations.keyScenarios,
                scenarioVenturaBeatsAD: translations.scenarioVenturaBeatsAD,
                scenarioCloseRace: translations.scenarioCloseRace,
                scenarioVentura40: translations.scenarioVentura40,
                scenarioDescription: translations.scenarioDescription,
              }}
            />
          </ErrorBoundary>
        </div>
      </section>

      {/* Forecast Bars */}
      <section className="py-10 border-b border-stone-300">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl font-bold text-stone-900 mb-6 tracking-tight">
            {translations.projectedVoteShare}
          </h2>
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

// Helper to get current round from searchParams on client
function useCurrentRoundInner(): 1 | 2 {
  const searchParams = useSearchParams();
  const roundParam = searchParams.get('round');
  return roundParam === '2' ? 2 : 1;
}

export function CurrentRoundProvider({ children }: { children: (round: 1 | 2) => React.ReactNode }) {
  return (
    <Suspense fallback={children(1)}>
      <CurrentRoundProviderInner>{children}</CurrentRoundProviderInner>
    </Suspense>
  );
}

function CurrentRoundProviderInner({ children }: { children: (round: 1 | 2) => React.ReactNode }) {
  const currentRound = useCurrentRoundInner();
  return <>{children(currentRound)}</>;
}
