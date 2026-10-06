import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SecondRoundWinnerCards } from './charts/SecondRoundWinnerCards';
import { SecondRoundVoteSplit } from './charts/SecondRoundVoteSplit';
import { SecondRoundForecastBars } from './charts/SecondRoundForecastBars';
import { SecondRoundBeeswarm } from './charts/SecondRoundBeeswarm';
import { SecondRoundScenarios } from './charts/SecondRoundScenarios';
import { PresidentialTrendChart } from './charts/PresidentialTrendChart';
import { ErrorBoundary } from './ErrorBoundary';
import { PRESIDENTIAL_2026_SECOND_ROUND_DATE } from '@/lib/config/elections';
import { BLANK_NULL } from '@/lib/election-aggregates';
import { credibleIntervalLabel, formatElectionLongDate, formatElectionNumber } from '@/lib/election-display';
import type { SecondRoundArchive as SecondRoundArchiveData } from '@/lib/utils/data-loader';

/**
 * The runoff half of the presidential archive (the default view). Rendered on
 * the server: the 8000 simulations arrive here already summarised, so the
 * client receives the 800 drawn values and the summaries, never the raw file.
 */
export async function SecondRoundArchive({ data, locale }: { data: SecondRoundArchiveData; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'secondRound' });
  const tf = await getTranslations({ locale, namespace: 'forecast' });
  if (!data.available || !data.simulations) {
    return (
      <section id="forecast" className="border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <p className="max-w-2xl text-stone-600">{t('unavailable')}</p>
        </div>
      </section>
    );
  }
  const { simulations } = data;
  const cutoff = data.forecast.updated_at;
  const cutoffLabel = formatElectionLongDate(cutoff, locale);
  const electionLabel = formatElectionLongDate(PRESIDENTIAL_2026_SECOND_ROUND_DATE, locale);
  const interval95 = credibleIntervalLabel(.025, .975, locale);
  const [candidateA, candidateB] = data.winProbability.candidates;
  const hasTrend = Object.keys(data.trends.candidates || {}).length > 0 && data.trends.dates.length > 0;
  const total = formatElectionNumber(simulations.total, locale);

  return (
    <>
      <section id="forecast" className="bg-paper border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-7">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-2">{t('title')}</p>
            <h2 className="text-2xl md:text-3xl text-stone-900 mb-3 leading-tight">{t('archiveTitle')}</h2>
            <p className="text-lg text-stone-600 mb-4 leading-relaxed">
              {t('headlineDescription', { date: cutoffLabel, election: electionLabel, candidateA: candidateA?.name ?? '', candidateB: candidateB?.name ?? '' })}
            </p>
            <Link href="/eleicoes/metodologia#segunda-volta-2026" locale={locale} className="text-sm font-medium text-ink underline underline-offset-4">
              {t('methodologyLink')}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 bg-paper border-b border-line">
        <div className="max-w-7xl mx-auto px-4">
          <ErrorBoundary componentName="Winner Cards">
            <SecondRoundWinnerCards
              winProbability={data.winProbability}
              validVotes={data.validVotes}
              translations={{
                winProbability: t('winProbability'),
                validVoteShare: t('validVoteShare'),
                validVotesNote: t('validVotesNote'),
                versus: t('versus'),
                intervalLabel: interval95,
              }}
            />
          </ErrorBoundary>
        </div>
      </section>

      <section className="py-8 bg-cream border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4">
          <ErrorBoundary componentName="Vote Split">
            <SecondRoundVoteSplit validVotes={data.validVotes} translations={{ validVotesNote: t('validVotesNote') }} />
          </ErrorBoundary>
        </div>
      </section>

      <section id="trajectory" className="py-10 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">{t('supportTrends')}</h2>
          <p className="text-sm text-stone-500 mb-3 max-w-xl">{t('trendDescription')}</p>
          <p className="text-xs text-stone-600 mb-8 max-w-xl border-l-2 border-line pl-3">
            {t('noRunoffPollsNote', { date: cutoffLabel })}
          </p>
          {hasTrend ? (
            <ErrorBoundary componentName="Second Round Trend">
              <PresidentialTrendChart
                trends={data.trends}
                cutoffDate={cutoff}
                showPolls={false}
                maxCandidates={2}
                exclude={['Others', BLANK_NULL]}
                height={380}
                candidateParam="candidate2"
              />
            </ErrorBoundary>
          ) : (
            <p className="text-sm text-stone-500">{t('noTrend')}</p>
          )}
        </div>
      </section>

      <section className="py-10 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">{t('simulationDistribution')}</h2>
          <p className="text-sm text-stone-500 mb-8 max-w-xl">{t('simulationDescription')}</p>
          <ErrorBoundary componentName="Beeswarm">
            <SecondRoundBeeswarm
              simulations={simulations}
              translations={{
                axisLabel: t('axisLabel'),
                fiftyPercentLine: t('fiftyPercentLine'),
                drawnCaption: tf.raw('drawnSimulations') as string,
                tableCaption: t('tableCaption'),
                candidate: t('candidateColumn'),
                median: t('medianColumn'),
                winShare: t('winShareColumn'),
                tipSuffix: t('tipSuffix'),
              }}
            />
          </ErrorBoundary>
        </div>
      </section>

      <section className="py-10 bg-paper border-b border-line">
        <div className="max-w-3xl mx-auto px-4">
          <SecondRoundScenarios
            simulations={simulations}
            locale={locale}
            translations={{
              keyScenarios: t('keyScenarios'),
              scenarioCloseRace: t('scenarioCloseRace'),
              scenarioVentura40: t('scenarioVentura40'),
              scenarioDescription: t('scenarioDescription', { total }),
            }}
          />
        </div>
      </section>

      <section className="py-10 border-b border-stone-300">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">{t('projectedVoteShare')}</h2>
          <p className="text-xs text-stone-500 mb-6 max-w-xl">{t('projectedVoteShareNote')}</p>
          <ErrorBoundary componentName="Forecast Bars">
            <SecondRoundForecastBars
              forecast={data.forecast}
              showUncertainty={true}
              translations={{
                projectedVoteShare: t('projectedVoteShare'),
                confidenceInterval: interval95,
                blankNull: t('blankNull'),
                leading: t('leading'),
              }}
            />
          </ErrorBoundary>
        </div>
      </section>
    </>
  );
}
