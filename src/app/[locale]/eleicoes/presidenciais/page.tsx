import { createPageMetadata } from '@/lib/metadata';
import { loadPresidentialData, loadSecondRoundData } from "@/lib/utils/data-loader";
import { ArrowRight, Users, Vote } from "lucide-react";
import { PresidentialCandidateCards, SecondRoundIndicator } from "@/components/charts/PresidentialCandidateCards";
import { PresidentialTrendChart } from "@/components/charts/PresidentialTrendChart";
import { PresidentialForecastBars } from "@/components/charts/PresidentialForecastBars";
import { PresidentialHeadToHead } from "@/components/charts/PresidentialHeadToHead";
import { PresidentialRunoffPairs } from "@/components/charts/PresidentialRunoffPairs";
import { RoundSwitch } from "@/components/SecondRoundView";
import { SecondRoundToggle } from "@/components/SecondRoundToggle";
import { SecondRoundArchive } from "@/components/SecondRoundArchive";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { SectionNotes } from "@/components/articles/SectionNotes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ModelAssumptionsCard } from "@/components/ModelAssumptionsCard";
import { UncertaintyExplainer } from "@/components/UncertaintyExplainer";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import { OFFICIAL_RESULTS, PRESIDENTIAL_2026, PRESIDENTIAL_2026_SECOND_ROUND_DATE } from "@/lib/config/elections";
import { credibleIntervalLabel, formatElectionDayMonth, formatElectionLongDate, formatElectionNumber, formatElectionProbability } from "@/lib/election-display";

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
    description: t('meta.presidentialDescription', {
      date1: formatElectionLongDate(PRESIDENTIAL_2026.date, locale),
      date2: formatElectionLongDate(PRESIDENTIAL_2026_SECOND_ROUND_DATE, locale),
    }),
  });
}

const linkClass = 'text-ink underline underline-offset-4 hover:text-ink-muted';

export default async function PresidentialArchivePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const first = await loadPresidentialData();
  const secondRound = await loadSecondRoundData();
  const { forecast, winProbabilities, trends, snapshotProbabilities, polls, headToHead, runoffPairs, changes, runoffChanges, lastPollDate } = first;

  // Dates, each named once. The first-round forecast is dated by its run
  // (updated_at) and by the last poll it saw; the runoff by its own run.
  const firstElection = formatElectionLongDate(PRESIDENTIAL_2026.date, locale);
  const secondElection = formatElectionLongDate(PRESIDENTIAL_2026_SECOND_ROUND_DATE, locale);
  const firstForecast = forecast.updated_at ? formatElectionLongDate(forecast.updated_at, locale) : null;
  const secondForecast = secondRound.forecast.updated_at ? formatElectionLongDate(secondRound.forecast.updated_at, locale) : null;
  const firstRoundDateLine = firstForecast && lastPollDate
    ? t('presidential.roundOneDateLine', { election: firstElection, forecast: firstForecast, lastPoll: formatElectionDayMonth(lastPollDate, locale) })
    : t('presidential.roundOneDateLineNoForecast', { election: firstElection });
  const secondRoundDateLine = secondForecast
    ? t('secondRound.roundDateLine', { election: secondElection, forecast: secondForecast })
    : t('secondRound.roundDateLineNoForecast', { election: secondElection });

  // Intervals as published: the forecast bars carry ci_lower/ci_upper, the
  // 2.5th and 97.5th percentiles (checked against the runoff simulations,
  // which the same exporter wrote); the trend bands are P25–P75 and P5–P95.
  const interval95 = credibleIntervalLabel(.025, .975, locale);
  const interval50 = credibleIntervalLabel(.25, .75, locale);
  const interval90 = credibleIntervalLabel(.05, .95, locale);
  const modelledCandidates = forecast.candidates.filter(c => c.name !== 'Others').length;
  const results = OFFICIAL_RESULTS['presidential-2026'];

  const officialResults = (
    <span className="inline-flex flex-wrap items-center gap-x-2">
      <span>{t('presidential.officialResults')}:</span>
      {results.map(r => (
        <a key={r.href} href={r.href} className={linkClass} rel="noopener noreferrer">
          {r.round === 1 ? t('secondRound.firstRoundTab') : t('secondRound.secondRoundTab')} ↗
        </a>
      ))}
    </span>
  );

  const firstRound = !first.available ? (
    <section id="forecast" className="scroll-mt-24 border-b border-line">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <p className="max-w-2xl text-stone-600">{t('presidential.unavailable')}</p>
      </div>
    </section>
  ) : (
    <>
      <section id="forecast" className="scroll-mt-24 bg-paper border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-7">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-2">{t('presidential.firstRoundKicker')}</p>
            <h2 className="text-2xl md:text-3xl text-stone-900 mb-3 leading-tight">{t('presidential.firstRoundTitle')}</h2>
            <p className="text-lg text-stone-600 leading-relaxed">
              {t('presidential.firstRoundLede', { date: firstForecast ?? firstElection, probability: formatElectionProbability(winProbabilities.second_round_probability, locale) })}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-parchment border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <SecondRoundIndicator
            probability={winProbabilities.second_round_probability}
            locale={locale}
            translations={{
              secondRoundNeeded: t('presidential.secondRoundNeeded'),
              probabilityLabel: t('presidential.probability'),
            }}
          />
        </div>
      </section>

      <section className="py-8 bg-cream border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl text-stone-900 mb-1">{t('presidential.winProbabilitiesToday')}</h2>
          <p className="text-sm text-stone-500 mb-6">{firstRoundDateLine}</p>
          <ErrorBoundary componentName="Candidate Cards">
            <PresidentialCandidateCards
              winProbabilities={winProbabilities}
              forecast={forecast}
              trends={trends}
              snapshotProbabilities={snapshotProbabilities}
              runoffPairs={runoffPairs}
              runoffChanges={runoffChanges}
              changes={changes}
              cutoffDate={lastPollDate ?? undefined}
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

      <section id="trajectory" className="scroll-mt-24 py-10 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">{t('presidential.supportTrajectory')}</h2>
          <p className="text-sm text-stone-500 mb-8 max-w-xl">{t('presidential.trendDescription')}</p>
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

      {headToHead.dates.length > 0 && (
        <section className="py-10 bg-cream border-b border-stone-300">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">{t('presidential.headToHeadTitle')}</h2>
            <p className="text-sm text-stone-500 mb-8 max-w-xl">
              {t('presidential.headToHeadDescription', { candidateA: headToHead.candidate_a, candidateB: headToHead.candidate_b })}
            </p>
            <ErrorBoundary componentName="Head-to-Head">
              <PresidentialHeadToHead
                data={headToHead}
                cutoffDate={lastPollDate}
                translations={{
                  title: t('presidential.headToHeadTitle'),
                  probability: t('presidential.leads'),
                  lastValue: t('presidential.headToHeadLastValue'),
                  empty: t('presidential.headToHeadEmpty'),
                }}
              />
            </ErrorBoundary>
          </div>
        </section>
      )}

      <section className="py-10 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl text-stone-900 mb-1 tracking-tight">{t('presidential.runoffScenariosTitle')}</h2>
          <p className="text-sm text-stone-500 mb-8 max-w-xl">{t('presidential.runoffScenariosDescription')}</p>
          <ErrorBoundary componentName="Runoff Pairs">
            <PresidentialRunoffPairs
              data={runoffPairs}
              maxPairs={6}
              translations={{
                title: t('presidential.mostLikelyMatchups'),
                vs: t('presidential.vs'),
                probability: t('presidential.probability'),
                empty: t('presidential.runoffEmpty'),
              }}
            />
          </ErrorBoundary>
        </div>
      </section>

      <section className="py-10 border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              <h3 className="text-xl text-stone-900 mb-1 tracking-tight">{t('presidential.projectedVoteShare')}</h3>
              <p className="text-xs text-stone-500 mb-6">
                {t('presidential.forecastForElectionDay', { forecast: firstForecast ?? '', election: firstElection })}
              </p>
              <ErrorBoundary componentName="Forecast Bars">
                <PresidentialForecastBars
                  forecast={forecast}
                  showUncertainty={true}
                  maxCandidates={8}
                  translations={{
                    projectedVoteShare: t('presidential.projectedVoteShare'),
                    confidenceInterval: interval95,
                  }}
                />
              </ErrorBoundary>
            </div>

            <div className="lg:col-span-2 lg:border-l lg:border-stone-200 lg:pl-12">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">{t('presidential.aboutModel')}</h3>
              <div className="space-y-4 text-sm text-stone-600">
                <p className="leading-relaxed">{t('presidential.modelDescription')}</p>
                <div className="border-l-2 border-amber-500 pl-4 py-2 bg-amber-50/50">
                  <p className="text-amber-800 text-sm">{t('presidential.undecidedWarning')}</p>
                </div>
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t('presidential.keyFactors')}</h4>
                  <ul className="space-y-1 text-stone-600 text-sm">
                    <li>→ {t('presidential.factor1')}</li>
                    <li>→ {t('presidential.factor2')}</li>
                    <li>→ {t('presidential.factor3')}</li>
                  </ul>
                </div>
                <div className="pt-4">
                  <ModelAssumptionsCard />
                </div>
                <UncertaintyExplainer
                  numPolls={polls.polls.length}
                  intervals={[
                    { label: interval50, where: t('presidential.intervalWhereInner') },
                    { label: interval90, where: t('presidential.intervalWhereOuter') },
                    { label: interval95, where: t('presidential.intervalWhereBars') },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <div className="election-page min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
        <PageHero
          compact
          illustration="elections"
          icon={<Vote aria-hidden="true" className="w-4 h-4" />}
          eyebrow={t('presidential.archiveEyebrow')}
          title={t('presidential.archiveTitle')}
          lede={t('presidential.archiveLede')}
          meta={
            <>
              <span><RoundSwitch firstRound={firstRoundDateLine} secondRound={secondRoundDateLine} /></span>
              {officialResults}
            </>
          }
        />

        <nav aria-label={t('presidential.inThisArchive')} className="border-b border-line bg-cream">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
            <SecondRoundToggle
              translations={{
                firstRound: t('secondRound.firstRoundTab'),
                secondRound: t('secondRound.secondRoundTab'),
                label: t('presidential.roundToggleLabel'),
              }}
            />
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a href="#forecast" className={linkClass}>{t('presidential.navForecast')}</a>
              <a href="#trajectory" className={linkClass}>{t('presidential.navUncertainty')}</a>
              <a href="#evidence" className={linkClass}>{t('presidential.navEvidence')}</a>
            </div>
          </div>
        </nav>

        <RoundSwitch
          firstRound={firstRound}
          secondRound={<SecondRoundArchive data={secondRound} locale={locale} />}
        />

        {/* Written analysis — content, so it goes above the cross-links. */}
        <SectionNotes
          section="elections"
          locale={locale}
          className="py-8 border-b border-stone-300"
          containerClassName="max-w-7xl mx-auto px-4"
        />

        <section className="py-8 border-b border-stone-300">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">{t('nav.moreFrom')}</h2>
            <div className="flex flex-wrap gap-6">
              {[
                { href: '/eleicoes/legislativas', label: t('nav.parliamentaryForecast') },
                { href: '/eleicoes/arquivo', label: t('elections.navArchiveGuide') },
                { href: '/metodologia', label: t('common.methodology') },
              ].map(link => (
                <Link key={link.href} href={link.href} locale={locale} className="group inline-flex items-center gap-2 text-ink underline underline-offset-4">
                  <span className="font-semibold">{link.label}</span>
                  <ArrowRight aria-hidden="true" className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="evidence" className="scroll-mt-24 border-t border-line">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="max-w-2xl">
              <h2 className="text-2xl mb-3">{t('presidential.aboutForecast')}</h2>
              <p className="text-sm leading-relaxed text-stone-600 mb-5">{t('presidential.aboutDescription')}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-600">
                <span className="inline-flex items-center gap-2">
                  <Users aria-hidden="true" className="w-4 h-4" />
                  {t('presidential.candidatesModeled', { count: formatElectionNumber(modelledCandidates, locale) })}
                </span>
                <span aria-hidden="true">·</span>
                <span>{firstRoundDateLine}</span>
                <span aria-hidden="true">·</span>
                <span>{secondRoundDateLine}</span>
              </div>
              <p className="mt-4 text-sm text-stone-600">{officialResults}</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
