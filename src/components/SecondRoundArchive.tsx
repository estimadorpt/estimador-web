import { getTranslations } from 'next-intl/server';
import { SecondRoundWinnerCards } from './charts/SecondRoundWinnerCards';
import { SecondRoundVoteSplit } from './charts/SecondRoundVoteSplit';
import { SecondRoundForecastBars } from './charts/SecondRoundForecastBars';
import { SecondRoundBeeswarm } from './charts/SecondRoundBeeswarm';
import { SecondRoundScenarios } from './charts/SecondRoundScenarios';
import { PresidentialTrendChart } from './charts/PresidentialTrendChart';
import { ErrorBoundary } from './ErrorBoundary';
import { TextLink } from './brand/TextLink';
import { DataCard } from './viz/DataCard';
import { PRESIDENTIAL_2026_SECOND_ROUND_DATE } from '@/lib/config/elections';
import { BLANK_NULL } from '@/lib/election-aggregates';
import { credibleIntervalLabel, formatElectionLongDate, formatElectionNumber, formatElectionProbability } from '@/lib/election-display';
import { likeliestWinner } from '@/lib/election-findings';
import type { SecondRoundArchive as SecondRoundArchiveData } from '@/lib/utils/data-loader';

/**
 * The runoff half of the presidential archive (the default view). Rendered on
 * the server: the 8000 simulations arrive here already summarised, so the
 * client receives the 800 drawn values and the summaries, never the raw file.
 */
export async function SecondRoundArchive({ data, locale }: { data: SecondRoundArchiveData; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'secondRound' });
  const tf = await getTranslations({ locale, namespace: 'forecast' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  if (!data.available || !data.simulations) {
    return (
      <section id="forecast" className="border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <p className="max-w-2xl text-graphite">{t('unavailable')}</p>
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
  // The headline is the finding the homepage states too: who won the runoff
  // in what share of the simulations.
  const winner = likeliestWinner(data.winProbability.candidates);
  const hasTrend = Object.keys(data.trends.candidates || {}).length > 0 && data.trends.dates.length > 0;
  const total = formatElectionNumber(simulations.total, locale);
  const pt = locale === 'pt';
  // The chart frame's footer (CLAUDE.md, "Chart frame"): an archived forecast
  // names its run, its date and where the method is explained.
  const frame = {
    updated: pt ? `Previsão de ${cutoffLabel}` : `Forecast of ${cutoffLabel}`,
    methodologyHref: '/eleicoes/metodologia#segunda-volta-2026',
    methodologyLabel: tc('methodology'),
    locale,
  };
  const simulationsSource = pt ? `Fonte: modelo estimador.pt, ${total} simulações` : `Source: estimador.pt model, ${total} simulations`;

  return (
    <>
      <section id="forecast" className="bg-paper border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-7">
          <div className="max-w-3xl">
            <p className="text-[12px] font-semibold text-graphite mb-2">{t('title')}</p>
            <h2 className="text-2xl md:text-3xl text-ink mb-3 leading-tight">{t('archiveTitle', { name: winner?.name ?? '', p: winner ? formatElectionProbability(winner.win_probability, locale) : '' })}</h2>
            <p className="text-lg text-graphite mb-4 leading-relaxed">
              {t('headlineDescription', { date: cutoffLabel, election: electionLabel, candidateA: candidateA?.name ?? '', candidateB: candidateB?.name ?? '' })}
            </p>
            <TextLink href="/eleicoes/metodologia#segunda-volta-2026" locale={locale} className="text-sm">
              {t('methodologyLink')}
            </TextLink>
          </div>
        </div>
      </section>

      <section className="py-8 border-b border-line">
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

      <section className="py-8 border-b border-rule">
        <div className="mx-auto w-full max-w-7xl px-4"><div className="max-w-3xl">
          <ErrorBoundary componentName="Vote Split">
            <SecondRoundVoteSplit validVotes={data.validVotes} translations={{ validVotesNote: t('validVotesNote') }} />
          </ErrorBoundary>
        </div></div>
      </section>

      <section id="trajectory" className="py-10 border-b border-rule">
        <div className="max-w-7xl mx-auto px-4">
          {/* The heading, its caveat, then the frame: the explanation is the
              frame's subtitle, not a second grey line above it (UXD3-11). */}
          <h2 className="text-2xl text-ink mb-3">{t('supportTrends')}</h2>
          <p className="text-[13px] leading-5 text-graphite mb-6 max-w-xl">
            {t('noRunoffPollsNote', { date: cutoffLabel })}
          </p>
          {hasTrend ? (
            <DataCard
              title={pt ? 'Apoio estimado na segunda volta, dia a dia' : 'Estimated runoff support, day by day'}
              subtitle={t('trendDescription')}
              source={pt ? 'Fonte: modelo estimador.pt' : 'Source: estimador.pt model'}
              {...frame}
            >
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
            </DataCard>
          ) : (
            <p className="text-sm text-graphite">{t('noTrend')}</p>
          )}
        </div>
      </section>

      <section className="py-10 border-b border-rule">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl text-ink mb-3">{t('simulationDistribution')}</h2>
          <DataCard
            title={pt ? 'Votos válidos de cada candidato no dia da eleição, por simulação' : 'Each candidate’s valid-vote share on election day, by simulation'}
            subtitle={t('simulationDescription')}
            source={simulationsSource}
            {...frame}
          >
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
          </DataCard>
        </div>
      </section>

      <section className="py-10 border-b border-line">
        <div className="mx-auto w-full max-w-7xl px-4"><div className="max-w-3xl">
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
        </div></div>
      </section>

      <section className="py-10 border-b border-rule">
        <div className="mx-auto w-full max-w-7xl px-4"><div className="max-w-3xl">
          <h2 className="text-2xl text-ink mb-3">{t('projectedVoteShare')}</h2>
          <DataCard
            title={pt ? 'Percentagem de todos os boletins, com o intervalo de 95%' : 'Share of all ballots, with the 95% interval'}
            subtitle={t('projectedVoteShareNote')}
            source={simulationsSource}
            {...frame}
          >
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
          </DataCard>
        </div></div>
      </section>
    </>
  );
}
