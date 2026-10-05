import { SectionIllustration } from '@/components/brand/SectionIllustration';
import { createPageMetadata } from '@/lib/metadata';
import { loadPresidentialData, loadSecondRoundData } from "@/lib/utils/data-loader";
import { ArrowRight, Calendar, Users } from "lucide-react";
import { PresidentialCandidateCards, SecondRoundIndicator } from "@/components/charts/PresidentialCandidateCards";
import { PresidentialTrendChart } from "@/components/charts/PresidentialTrendChart";
import { PresidentialForecastBars } from "@/components/charts/PresidentialForecastBars";
import { PresidentialHeadToHead } from "@/components/charts/PresidentialHeadToHead";
import { PresidentialRunoffPairs } from "@/components/charts/PresidentialRunoffPairs";
import { SecondRoundView, BannerToggle, RoundDate } from "@/components/SecondRoundView";
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { SectionNotes } from "@/components/articles/SectionNotes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ModelAssumptionsCard } from "@/components/ModelAssumptionsCard";
import { UncertaintyExplainer } from "@/components/UncertaintyExplainer";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import { PRESIDENTIAL_2026, PRESIDENTIAL_2026_SECOND_ROUND_DATE } from "@/lib/config/elections";
import { credibleIntervalLabel } from "@/lib/election-display";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return createPageMetadata({
    locale,
    path: `/eleicoes/presidenciais`,
    title: t('meta.presidentialTitle'),
    description: t('meta.presidentialDescription'),
  });
}

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Load presidential forecast data
  // runoffPairs is either snapshot (at last poll date) or election day, handled by data loader
  const { forecast, winProbabilities, trends, snapshotProbabilities: snapshotProbabilitiesData, trajectories, polls, headToHead, runoffPairs, changes, runoffChanges, lastPollDate } = await loadPresidentialData();

  // Load second round data (always load for client-side switching)
  const secondRoundData = await loadSecondRoundData();

  // Use snapshot probabilities (as of last poll date) instead of election day forecast
  // This shows "if the election were held today" which is more appropriate when
  // we're far from election day and don't have strong assumptions about future movement

  // Calculate cutoff index for snapshot probabilities data (last poll date)
  const cutoffDate = lastPollDate ? new Date(lastPollDate) : null;
  const snapshotDates = snapshotProbabilitiesData?.dates?.length
    ? snapshotProbabilitiesData.dates
    : trends.dates;
  const cutoffIndex = cutoffDate
    ? snapshotDates.findIndex((d: string) => new Date(d) > cutoffDate) - 1
    : snapshotDates.length - 1;
  const safeIndex = Math.max(0, cutoffIndex === -1 ? snapshotDates.length - 1 : cutoffIndex);

  // Compute runoff probability for each candidate (sum of all pairs where they appear)
  const secondRoundProbability = winProbabilities.second_round_probability;
  
  // Get the last update date
  const lastUpdate = forecast.updated_at 
    ? new Date(forecast.updated_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })
    : null;

  // Format probability as percentage
  const formatProbability = (value: number) => {
    const pct = value * 100;
    if (pct > 99) return '>99%';
    if (pct < 1) return '<1%';
    return `${Math.round(pct)}%`;
  };

  // Round-specific event date and forecast cutoff, kept as two distinct
  // pieces of text so neither round shares an ambiguous date with the other.
  const formatFullDate = (value: string) => new Date(value).toLocaleDateString(
    locale === 'pt' ? 'pt-PT' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  const firstRoundEventDate = formatFullDate(PRESIDENTIAL_2026.date);
  const secondRoundEventDate = formatFullDate(PRESIDENTIAL_2026_SECOND_ROUND_DATE);
  const firstRoundCutoffLabel = lastPollDate
    ? (locale === 'pt' ? `previsão de ${formatFullDate(lastPollDate)}` : `forecast of ${formatFullDate(lastPollDate)}`)
    : '';
  const secondRoundCutoffDate = secondRoundData.forecast.updated_at;
  const secondRoundCutoffLabel = secondRoundCutoffDate
    ? (locale === 'pt' ? `previsão de ${formatFullDate(secondRoundCutoffDate)}` : `forecast of ${formatFullDate(secondRoundCutoffDate)}`)
    : '';
  // Both forecast bars publish a 95% interval (ci_lower/ci_upper), distinct
  // from the trend chart's own 50%/90% quantiles — name the exact bounds so
  // the two visualizations are never read as directly comparable ranges.
  const forecastConfidenceInterval = credibleIntervalLabel(.025, .975, locale);

  return (
    <div className="election-page min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
      {/* Presidential Election Banner */}
      <div className="border-b border-line bg-cream text-ink">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide">{t('presidential.electionName')}</span>
            <span className="text-stone-500">·</span>
            <span className="text-ink-muted">
              <RoundDate
                firstRoundEventDate={firstRoundEventDate}
                secondRoundEventDate={secondRoundEventDate}
                firstRoundCutoffLabel={firstRoundCutoffLabel}
                secondRoundCutoffLabel={secondRoundCutoffLabel}
              />
            </span>
          </div>
          <div className="flex items-center gap-4">
            <BannerToggle
              toggleTranslations={{
                firstRound: t('secondRound.firstRoundTab'),
                secondRound: t('secondRound.secondRoundTab'),
              }}
            />
            <div className="flex items-center gap-2 text-ink-muted bg-parchment px-3 py-1 rounded-full text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{locale === 'pt' ? 'Arquivo da previsão' : 'Forecast archive'}</span>
            </div>
          </div>
        </div>
      </div>

      <nav aria-label={locale === 'pt' ? 'Neste arquivo' : 'In this archive'} className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 px-4 py-3 text-sm text-ink-muted">
          <a href="#forecast" className="hover:text-ink">{locale === 'pt' ? 'O que a previsão dizia' : 'What the forecast said'}</a>
          <a href="#trajectory" className="hover:text-ink">{locale === 'pt' ? 'Onde havia incerteza' : 'Where uncertainty was'}</a>
          <a href="#evidence" className="hover:text-ink">{locale === 'pt' ? 'Dados e método' : 'Data and method'}</a>
        </div>
      </nav>

      <SecondRoundView
        secondRoundData={secondRoundData}
        toggleTranslations={{
          firstRound: t('secondRound.firstRoundTab'),
          secondRound: t('secondRound.secondRoundTab'),
        }}
        translations={{
          title: t('secondRound.title'),
          headline: locale === 'pt' ? 'Presidenciais 2026: a previsão à data.' : 'Presidential election 2026: the forecast at the time.',
          headlineDescription: t('secondRound.headlineDescription', {
            candidateA: secondRoundData.winProbability.candidates[0]?.name || '',
            candidateB: secondRoundData.winProbability.candidates[1]?.name || ''
          }),
          basedOnPolls: locale === 'pt' ? 'Informação disponível à data' : 'Information available at the time',
          methodology: t('common.methodology'),
          winProbability: t('secondRound.winProbability'),
          validVoteShare: t('secondRound.validVoteShare'),
          versus: t('secondRound.versus'),
          validVotesNote: t('secondRound.validVotesNote'),
          simulationDistribution: t('secondRound.simulationDistribution'),
          simulationDescription: t('secondRound.simulationDescription'),
          fiftyPercentLine: t('secondRound.fiftyPercentLine'),
          showingOutcomes: t('secondRound.showingOutcomes', { count: secondRoundData.trajectories.n_samples }),
          keyScenarios: t('secondRound.keyScenarios'),
          scenarioCloseRace: t('secondRound.scenarioCloseRace'),
          scenarioVentura40: t('secondRound.scenarioVentura40'),
          scenarioDescription: t('secondRound.scenarioDescription'),
          projectedVoteShare: t('secondRound.projectedVoteShare'),
          projectedVoteShareNote: t('secondRound.projectedVoteShareNote'),
          confidenceInterval: forecastConfidenceInterval,
          blankNull: t('secondRound.blankNull'),
          trajectoryTitle: t('secondRound.supportTrends'),
          trajectoryDescription: t('secondRound.trendDescription'),
          noRunoffPollsNote: secondRoundCutoffDate
            ? t('secondRound.noRunoffPollsNote', { date: formatFullDate(secondRoundCutoffDate) })
            : '',
        }}
        firstRoundContent={
          <>
            {/* Hero Section - First Round */}
            <section id="forecast" className="scroll-mt-24 bg-paper border-b border-line">
              <div className="illustrated-hero max-w-7xl mx-auto px-4 py-7">
                <div className="max-w-3xl">
                  <div className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    {locale === 'pt' ? '1.ª volta · previsão arquivada' : 'First round · archived forecast'}
                  </div>
                  <h1 className="text-3xl md:text-4xl text-stone-900 mb-4 leading-tight">
                    {locale === 'pt' ? 'Primeira volta: o que prevíamos.' : 'First round: what we forecast.'}
                  </h1>
                  <p className="text-lg text-stone-600 mb-5 leading-relaxed">
                    {locale === 'pt'
                      ? `Na previsão arquivada, a probabilidade de ser necessária uma segunda volta era de ${formatProbability(secondRoundProbability)}.`
                      : `In the archived forecast, the probability of a second round being required was ${formatProbability(secondRoundProbability)}.`}
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-stone-500">{locale === 'pt' ? 'Informação disponível à data' : 'Information available at the time'}</span>
                    <span className="text-ink-muted">·</span>
                    <Link href="/metodologia" locale={locale} className="text-ink hover:text-ink-muted font-medium">
                      {t('common.methodology')}
                    </Link>
                  </div>
                </div>
                <SectionIllustration scene="elections" />
              </div>
            </section>

            {/* Second Round Indicator */}
            <section className="bg-stone-100 border-b border-stone-200">
              <div className="max-w-7xl mx-auto px-4 py-5">
                <SecondRoundIndicator
                  probability={secondRoundProbability}
                  translations={{
                    secondRoundNeeded: t('presidential.secondRoundNeeded'),
                    probabilityLabel: t('presidential.probability'),
                  }}
                />
              </div>
            </section>

            {/* Win Probability Cards */}
            <section className="py-8 bg-cream border-b border-stone-200">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl text-stone-900">
                    {t('presidential.winProbabilitiesToday')}
                  </h2>
                  {lastUpdate && (
                    <div className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                      {t('common.updated')} {lastUpdate}
                    </div>
                  )}
                </div>
                <ErrorBoundary componentName="Candidate Cards">
                  <PresidentialCandidateCards
                    winProbabilities={winProbabilities}
                    forecast={forecast}
                    trends={trends}
                    snapshotProbabilities={snapshotProbabilitiesData}
                    runoffPairs={runoffPairs}
                    runoffChanges={runoffChanges}
                    changes={changes}
                    cutoffDate={lastPollDate}
                    maxCandidates={5}
                    translations={{
                      chanceOfRunoff: t('presidential.chanceOfRunoff'),
                      voteShare: t('presidential.voteShare'),
                      partyLabel: t('presidential.partyAffiliation'),
                      sinceLastPoll: t('presidential.sinceLastPoll'),
                    }}
                  />
                </ErrorBoundary>
              </div>
            </section>

            {/* Support Trends Chart */}
            <section id="trajectory" className="scroll-mt-24 py-10 border-b border-stone-300">
              <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">
                  {t('presidential.supportTrajectory')}
                </h2>
                <p className="text-sm text-stone-500 mb-8 max-w-xl">
                  {t('presidential.trendDescription')}
                </p>
                <ErrorBoundary componentName="Support Trends">
                  <PresidentialTrendChart
                    trends={trends}
                    polls={polls}
                    electionDate={PRESIDENTIAL_2026.date}
                    cutoffDate={lastPollDate}
                    height={420}
                    showPolls={true}
                    maxCandidates={5}
                  />
                </ErrorBoundary>
              </div>
            </section>

            {/* Head-to-Head Probability */}
            {headToHead.dates.length > 0 && (
              <section className="py-10 bg-cream border-b border-stone-300">
                <div className="max-w-7xl mx-auto px-4">
                  <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">
                    {t('presidential.headToHeadTitle')}
                  </h2>
                  <p className="text-sm text-stone-500 mb-8 max-w-xl">
                    {t('presidential.headToHeadDescription', {
                      candidateA: headToHead.candidate_a,
                      candidateB: headToHead.candidate_b
                    })}
                  </p>
                  <ErrorBoundary componentName="Head-to-Head">
                    <PresidentialHeadToHead
                      data={headToHead}
                      cutoffDate={lastPollDate}
                      height={280}
                      translations={{
                        title: t('presidential.headToHeadTitle'),
                        description: t('presidential.headToHeadDescription', {
                          candidateA: headToHead.candidate_a,
                          candidateB: headToHead.candidate_b
                        }),
                        probability: t('presidential.leads'),
                      }}
                    />
                  </ErrorBoundary>
                </div>
              </section>
            )}

            {/* Runoff Scenarios */}
            {runoffPairs.pairs.length > 0 && (
              <section className="py-10 border-b border-stone-300">
                <div className="max-w-7xl mx-auto px-4">
                  <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">
                    {t('presidential.runoffScenariosTitle')}
                  </h2>
                  <p className="text-sm text-stone-500 mb-8 max-w-xl">
                    {t('presidential.runoffScenariosDescription')}
                  </p>

                  <div>
                    <ErrorBoundary componentName="Runoff Pairs">
                      <PresidentialRunoffPairs
                        data={runoffPairs}
                        maxPairs={6}
                        translations={{
                          title: t('presidential.mostLikelyMatchups'),
                          vs: t('presidential.vs'),
                          probability: t('presidential.probability'),
                        }}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              </section>
            )}

            {/* Vote Share Forecast */}
            <section className="py-10 border-b border-stone-300">
              <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                  {/* Forecast Bars - takes 3 columns */}
                  <div className="lg:col-span-3">
                    <h3 className="text-xl text-stone-900 mb-1 tracking-tight">
                      {t('presidential.projectedVoteShare')}
                    </h3>
                    <p className="text-xs text-stone-500 mb-6">
                      {locale === 'pt' ? 'Previsão para o dia da eleição' : 'Forecast for election day'}
                    </p>
                    <ErrorBoundary componentName="Forecast Bars">
                      <PresidentialForecastBars
                        forecast={forecast}
                        showUncertainty={true}
                        maxCandidates={8}
                        translations={{
                          projectedVoteShare: t('presidential.projectedVoteShare'),
                          confidenceInterval: forecastConfidenceInterval,
                        }}
                      />
                    </ErrorBoundary>
                  </div>

                  {/* About the Model - takes 2 columns */}
                  <div className="lg:col-span-2 lg:border-l lg:border-stone-200 lg:pl-12">
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">
                      {t('presidential.aboutModel')}
                    </h3>
                    <div className="space-y-4 text-sm text-stone-600">
                      <p className="leading-relaxed">
                        {t('presidential.modelDescription')}
                      </p>
                      <div className="border-l-2 border-amber-500 pl-4 py-2 bg-amber-50/50">
                        <p className="text-amber-800 text-sm">
                          <strong>{locale === 'pt' ? 'Nota:' : 'Note:'}</strong> {t('presidential.undecidedWarning')}
                        </p>
                      </div>
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                          {t('presidential.keyFactors')}
                        </h4>
                        <ul className="space-y-1 text-stone-600 text-sm">
                          <li>→ {t('presidential.factor1')}</li>
                          <li>→ {t('presidential.factor2')}</li>
                          <li>→ {t('presidential.factor3')}</li>
                        </ul>
                      </div>

                      {/* Model Assumptions Card */}
                      <div className="pt-4">
                        <ModelAssumptionsCard />
                      </div>

                      {/* Uncertainty Explainer */}
                      <UncertaintyExplainer numPolls={polls?.polls.length ?? 0} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        }
      />

      {/* Written analysis — content, so it goes above the cross-links and the
          dark about-footer rather than between them. */}
      <SectionNotes
        section="elections"
        locale={locale}
        className="py-8 border-b border-stone-300"
        containerClassName="max-w-7xl mx-auto px-4"
      />

      {/* Navigation to Other Pages */}
      <section className="py-8 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
            {t('nav.moreFrom')}
          </div>
          <div className="flex flex-wrap gap-6">
            <Link
              href="/eleicoes/legislativas"
              locale={locale}
              className="group inline-flex items-center gap-2 text-stone-700 hover:text-ink transition-colors"
            >
              <span className="font-semibold">{t('nav.parliamentaryForecast')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/metodologia"
              locale={locale}
              className="group inline-flex items-center gap-2 text-stone-700 hover:text-ink transition-colors"
            >
              <span className="font-semibold">{t('common.methodology')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* About the forecast */}
      <section id="evidence" className="scroll-mt-24 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl mb-3">
              {t('presidential.aboutForecast')}
            </h2>
            <p className="text-sm leading-relaxed text-stone-600 mb-5">
              {t('presidential.aboutDescription')}
            </p>
            <div className="flex items-center gap-4 text-sm text-stone-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{forecast.candidates.length} {t('presidential.candidatesModeled')}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  <RoundDate
                    firstRoundEventDate={firstRoundEventDate}
                    secondRoundEventDate={secondRoundEventDate}
                    firstRoundCutoffLabel={firstRoundCutoffLabel}
                    secondRoundCutoffLabel={secondRoundCutoffLabel}
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
