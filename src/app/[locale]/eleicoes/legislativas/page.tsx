import { createPageMetadata } from '@/lib/metadata';
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";
import { partyColors } from "@/lib/config/colors";
import { OFFICIAL_RESULTS, PARLIAMENTARY_2025, PARLIAMENTARY_2025_FORECAST_CUTOFF } from "@/lib/config/elections";
import { loadParliamentaryArchive } from "@/lib/utils/data-loader";
import { formatElectionLongDate, formatElectionNumber, formatElectionPercent, formatElectionProbabilityText } from "@/lib/election-display";
import { ProbabilityFigure } from "@/components/charts/ProbabilityFigure";
import { Calendar, BarChart3, TrendingUp, Users, Map, Vote } from "lucide-react";
import { PollingChart } from "@/components/charts/PollingChart";
import { SeatChart } from "@/components/charts/SeatChart";
import { DistrictSummary } from "@/components/charts/DistrictSummary";
import { HouseEffects } from "@/components/charts/HouseEffects";
import { CoalitionDotPlot } from "@/components/charts/CoalitionDotPlot";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { SectionNotes } from "@/components/articles/SectionNotes";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import { ElectionSummaryStats } from '@/components/ElectionSummaryStats';
import { setRequestLocale } from '@/i18n/request-locale';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return createPageMetadata({
    locale,
    path: `/eleicoes/legislativas`,
    title: t('meta.parliamentaryTitle'),
    description: t('sections.parliamentary2025Description'),
  });
}

const linkClass = 'text-ink underline underline-offset-4 hover:text-ink-muted';

export default async function ParliamentaryArchivePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const archive = await loadParliamentaryArchive();
  const { probabilities, adChArithmetic, blocs, seats, trends, trendDates, districtForecast, contestedSeats, houseEffects } = archive;

  const forecastDate = formatElectionLongDate(PARLIAMENTARY_2025_FORECAST_CUTOFF, locale);
  const electionDate = formatElectionLongDate(PARLIAMENTARY_2025.date, locale);
  const pct = (v: number) => formatElectionPercent(v, locale);

  // Election-day projection per party: mean and the 94% HDI band, read from
  // the last date of the trend window (the election day itself).
  const last = trends.dates.length - 1;
  const projectionText = (party: string) => {
    const p = trends.parties[party];
    const mean = p?.mean[last];
    if (mean == null) return '—';
    const low = p.low[last];
    const high = p.high[last];
    return low != null && high != null ? `${pct(mean)} (${pct(low)}–${pct(high)})` : pct(mean);
  };
  const rightName = rightBlocParties.join(' + ');
  const leftName = leftBlocParties.join(' + ');
  const otherParties = ['CH', 'PAN'];
  const officialResults = OFFICIAL_RESULTS['parliamentary-2025'][0];

  // One card per group of parties: the two blocs with their majority odds,
  // and the parties in neither bloc (CH, PAN), so every modelled party's
  // projected share is on the page.
  const blocCard = (title: string, parties: string[], majority: number | null) => (
    <div className="bg-cream border border-stone-200 rounded-2xl p-6">
      <h3 className="text-lg text-stone-900 mb-1">{title}</h3>
      <p className="text-xs text-stone-500 mb-4">{t('forecast.blocProjectionCaption', { election: electionDate, date: forecastDate })}</p>
      <div className="space-y-3">
        {parties.map(party => (
          <div key={party} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: partyColors[party as keyof typeof partyColors] }} />
              <span className="text-sm font-medium text-stone-900">{t(`parties.${party}`)}</span>
            </div>
            <span className="text-sm font-bold text-stone-900 tabular-nums">{projectionText(party)}</span>
          </div>
        ))}
        {majority != null && (
          <div className="border-t border-line pt-3 mt-3">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-sm text-stone-900">{t('forecast.majorityChance')}</span>
              <ProbabilityFigure probability={majority} locale={locale} className="text-lg text-stone-900 tabular-nums" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="election-page min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
      <PageHero
        compact
        illustration="elections"
        icon={<Vote aria-hidden="true" className="w-4 h-4" />}
        eyebrow={t('forecast.archiveEyebrow')}
        lede={t('forecast.archiveLede')}
        title={t('forecast.subtitle')}
        meta={
          <>
            <span className="inline-flex items-center gap-1">
              <Calendar aria-hidden="true" className="w-3 h-3" />
              {t('forecast.forecastDateLine', { forecast: forecastDate, election: electionDate })}
            </span>
            <a href={officialResults.href} className={linkClass} rel="noopener noreferrer">{t('forecast.officialResults')} ↗</a>
          </>
        }
      />

      <nav aria-label={t('presidential.inThisArchive')} className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 px-4 py-3 text-sm">
          <a href="#overview" className={linkClass}>{t('presidential.navForecast')}</a>
          <a href="#polling" className={linkClass}>{t('presidential.navUncertainty')}</a>
          <a href="#evidence" className={linkClass}>{t('presidential.navEvidence')}</a>
        </div>
      </nav>

      {!archive.available ? (
        <section id="overview" className="scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <p className="max-w-2xl text-stone-600">{t('forecast.unavailable')}</p>
          </div>
        </section>
      ) : (
      <>
      <section id="overview" className="scroll-mt-24 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ElectionSummaryStats
            probAdMostSeats={probabilities.adMostSeats}
            probPsMostSeats={probabilities.psMostSeats}
            probRightMajority={probabilities.rightMajority}
            probLeftMajority={probabilities.leftMajority}
            translations={{
              mostSeats: t('forecast.mostSeats'),
              rightMajority: t('forecast.blocMajority', { parties: rightName }),
              leftMajority: t('forecast.blocMajority', { parties: leftName }),
              notes: [
                t('forecast.noBlocMajorityNote', {
                  probability: formatElectionProbabilityText(probabilities.noBlocMajority, locale),
                  median: formatElectionNumber(adChArithmetic.median, locale),
                  reach: formatElectionProbabilityText(adChArithmetic.reach, locale),
                }),
                t('forecast.coalitionArithmeticNote'),
              ],
            }}
          />
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8">

          <div id="polling" className="scroll-mt-24 bg-cream border border-stone-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp aria-hidden="true" className="w-5 h-5 text-stone-500" />
              <h2 className="text-2xl text-stone-900">{t('forecast.pollingTrends')}</h2>
            </div>
            <PollingChart series={trends} voteShareLabel={t('forecast.voteShareLabel')} />
            <p className="text-sm text-stone-600 mt-4">
              {t('forecast.pollingTrendsDescription', { count: formatElectionNumber(trendDates, locale) })}
            </p>
          </div>

          <div className="bg-cream border border-stone-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 aria-hidden="true" className="w-5 h-5 text-stone-500" />
              <h2 className="text-2xl text-stone-900">{t('forecast.coalitionSeats')}</h2>
            </div>
            <CoalitionDotPlot
              simulations={blocs}
              leftCoalitionLabel={leftName}
              rightCoalitionLabel={rightName}
              projectedSeatsLabel={t('forecast.projectedSeats')}
              majorityLabel={t('forecast.majorityThresholdLabel', { seats: majorityThreshold, total: 230 })}
              showingOutcomesLabel={t.raw('forecast.drawnSimulations') as string}
            />
            <p className="text-sm text-stone-600 mt-4">{t('forecast.coalitionDescription')}</p>
            <p className="text-xs text-stone-500 mt-2">{t('forecast.coalitionArithmeticNote')}</p>
          </div>

          <div className="bg-cream border border-stone-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users aria-hidden="true" className="w-5 h-5 text-stone-500" />
              <h2 className="text-2xl text-stone-900">{t('forecast.individualParties')}</h2>
            </div>
            <SeatChart stats={seats} />
            <p className="text-sm text-stone-600 mt-4">
              {t('forecast.simulationDescription', { count: formatElectionNumber(archive.simulations, locale) })}
            </p>
          </div>

          <div id="district-analysis" className="scroll-mt-24 bg-cream border border-stone-200 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <Map aria-hidden="true" className="w-5 h-5 text-stone-500" />
                <h2 className="text-2xl text-stone-900">{t('forecast.districtAnalysis')}</h2>
              </div>
              <Link href="/eleicoes/legislativas/mapa" locale={locale} className={`text-sm font-medium ${linkClass}`}>
                {t('map.title')} →
              </Link>
            </div>
            <DistrictSummary districtData={districtForecast} contestedData={contestedSeats} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blocCard(leftName, leftBlocParties, probabilities.leftMajority)}
            {blocCard(rightName, rightBlocParties, probabilities.rightMajority)}
            {blocCard(t('forecast.otherParties'), otherParties, null)}
          </div>

          {/* Polling analysis — a specialist method/evidence view, not a
              main-path answer, so it sits behind a disclosure. */}
          <details className="group bg-cream border border-stone-200 rounded-2xl p-6">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3">
              <Users aria-hidden="true" className="w-5 h-5 text-stone-500" />
              <h2 className="text-2xl text-stone-900">{t('forecast.pollingHouseEffects')}</h2>
              <span className="ml-auto text-xs font-bold uppercase tracking-wider text-stone-500 group-open:hidden">
                {t('forecast.show')}
              </span>
            </summary>
            <div className="mt-6">
              <HouseEffects data={houseEffects} />
            </div>
          </details>
        </div>
      </section>
      </>
      )}

      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div id="evidence" className="scroll-mt-24 bg-paper border border-line rounded-2xl p-6">
            <h2 className="text-lg text-stone-900 mb-4">{t('forecast.aboutModel')}</h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-stone-600">
              <div>
                <h3 className="flex items-center gap-2 mb-2 font-medium">
                  <Users aria-hidden="true" className="w-4 h-4" />
                  {t('forecast.dataSources')}
                </h3>
                <p>{t('forecast.dataSourcesDescription')}</p>
              </div>
              <div>
                <h3 className="flex items-center gap-2 mb-2 font-medium">
                  <BarChart3 aria-hidden="true" className="w-4 h-4" />
                  {t('forecast.methodology')}
                </h3>
                <p>{t('forecast.methodologyDescription')}</p>
                <Link href="/eleicoes/metodologia#legislativas" locale={locale} className={`mt-2 inline-block ${linkClass}`}>{t('common.methodology')} →</Link>
              </div>
              <div>
                <h3 className="flex items-center gap-2 mb-2 font-medium">
                  <TrendingUp aria-hidden="true" className="w-4 h-4" />
                  {t('forecast.updates')}
                </h3>
                <p>{t('forecast.updatesDescription', { date: forecastDate })}</p>
                <a href={officialResults.href} className={`mt-2 inline-block ${linkClass}`} rel="noopener noreferrer">{t('forecast.officialResults')} ↗</a>
              </div>
            </div>
          </div>

          {/* Written analysis, last in the stack: a hairline rule rather than
              another card, since the notes are not part of the archive. */}
          <SectionNotes
            section="elections"
            locale={locale}
            containerClassName="border-t border-stone-200 pt-8"
          />
        </div>
      </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
