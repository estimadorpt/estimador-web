import { createPageMetadata } from '@/lib/metadata';
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";
import { partyColors } from "@/lib/config/colors";
import { OFFICIAL_RESULTS, PARLIAMENTARY_2025, PARLIAMENTARY_2025_FORECAST_CUTOFF } from "@/lib/config/elections";
import { loadParliamentaryArchive } from "@/lib/utils/data-loader";
import { formatElectionLongDate, formatElectionNumber, formatElectionPercent, formatElectionProbabilityText, pollsterDisplayName, sortByPartyOrder } from "@/lib/election-display";
import { closeLeads } from "@/lib/election-aggregates";
import { electionMethodHref } from "@/lib/election-methodology";
import { ProbabilityFigure } from "@/components/charts/ProbabilityFigure";
import { Calendar, BarChart3, TrendingUp, Users, Vote } from "lucide-react";
import { PollingChart } from "@/components/charts/PollingChart";
import { SeatChart } from "@/components/charts/SeatChart";
import { DistrictSummary } from "@/components/charts/DistrictSummary";
import { HouseEffects } from "@/components/charts/HouseEffects";
import { CoalitionDotPlot } from "@/components/charts/CoalitionDotPlot";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { SectionNotes } from "@/components/articles/SectionNotes";
import { DataCard } from "@/components/viz/DataCard";
import { Disclosure } from "@/components/viz/Disclosure";
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
/**
 * A link on a line of its own: a 44px target at the text's own size (UXM2-09).
 * The gap stands in for the space before an arrow, which a flex box collapses.
 */
const standaloneLinkClass = `inline-flex min-h-11 items-center gap-1 ${linkClass}`;
/** A section's question over its chart frame, as on the Liga hub. */
const sectionTitleClass = 'text-2xl text-stone-900 mb-3 tracking-tight';

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

  const pt = locale === 'pt';
  const forecastDate = formatElectionLongDate(PARLIAMENTARY_2025_FORECAST_CUTOFF, locale);
  const electionDate = formatElectionLongDate(PARLIAMENTARY_2025.date, locale);
  const pct = (v: number) => formatElectionPercent(v, locale);

  // The chart frame's footer (CLAUDE.md, "Chart frame"): an archived forecast
  // names its run. The seat charts summarise the simulations; the trend is the
  // model's estimate fitted to the polls, so it cites those instead.
  const frame = {
    updated: pt ? `Previsão de ${forecastDate}` : `Forecast of ${forecastDate}`,
    methodologyHref: '/eleicoes/metodologia#legislativas',
    methodologyLabel: t('common.methodology'),
    locale,
  };
  const simulationsSource = pt
    ? `Fonte: modelo estimador.pt, ${formatElectionNumber(archive.simulations, locale)} simulações`
    : `Source: estimador.pt model, ${formatElectionNumber(archive.simulations, locale)} simulations`;
  const trendSource = pt ? 'Fonte: modelo estimador.pt, ajustado às sondagens' : 'Source: estimador.pt model, fitted to the polls';
  // The house effects come from the polls the model read: the last of them is
  // the last trend date before election day (15 May 2025, a day before the run).
  const lastPollDate = trends.dates.filter(d => d < PARLIAMENTARY_2025.date).at(-1);
  const pollsSource = lastPollDate
    ? (pt
      ? `Fonte: modelo estimador.pt, sondagens até ${formatElectionLongDate(lastPollDate, locale)}`
      : `Source: estimador.pt model, polls up to ${formatElectionLongDate(lastPollDate, locale)}`)
    : trendSource;

  // Election-day projection per party: mean and the 94% HDI band, read from
  // the last date of the trend window (the election day itself).
  const last = trends.dates.length - 1;
  // The share, then its interval kept on one line: on a narrow card the
  // interval drops below the share instead of breaking inside the range.
  const projection = (party: string) => {
    const p = trends.parties[party];
    const mean = p?.mean[last];
    if (mean == null) return <span className="font-bold">—</span>;
    const low = p.low[last];
    const high = p.high[last];
    return (
      <>
        <span className="font-bold">{pct(mean)}</span>
        {low != null && high != null && <> <span className="whitespace-nowrap font-normal text-stone-600">({pct(low)}–{pct(high)})</span></>}
      </>
    );
  };
  // Every party list on the page in the archive's one order (AEE3-06): the
  // left bloc reads PS + L + CDU + BE here as in the chips and the tables.
  const rightParties = sortByPartyOrder(rightBlocParties);
  const leftParties = sortByPartyOrder(leftBlocParties);
  const rightName = rightParties.join(' + ');
  const leftName = leftParties.join(' + ');
  const otherParties = sortByPartyOrder(['CH', 'PAN']);
  const officialResults = OFFICIAL_RESULTS['parliamentary-2025'][0];
  // Districts the map and the count give to a party that led by under a point.
  const close = closeLeads(districtForecast);
  const closeLeadNote = close.length > 0
    ? t('forecast.closeLeadNote', {
      list: close.map(c => `${c.district} (${c.first.party} ${pct(c.first.share)}, ${c.second.party} ${pct(c.second.share)})`).join('; '),
    })
    : undefined;
  const external = <span aria-hidden="true"> ↗</span>;
  const arrow = <span aria-hidden="true"> →</span>;

  // One column per group of parties, in one card: the two blocs with their
  // majority odds, and the parties in neither bloc (CH, PAN), so every
  // modelled party's projected share is on the page. The groups hold two to
  // four parties, so as three cards the shorter ones were stretched to the
  // tallest and ended in blank cream; as columns of one card, split by
  // hairlines, each reads top-down at its own length.
  const blocColumn = (title: string, parties: string[], majority: number | null) => (
    <div className="p-6">
      <h3 className="text-lg text-stone-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {parties.map(party => (
          <div key={party} className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 pt-0.5">
              <div aria-hidden="true" className="w-3 h-3 shrink-0 rounded" style={{ backgroundColor: partyColors[party as keyof typeof partyColors] }} />
              <span className="text-sm font-medium text-stone-900">{t(`parties.${party}`)}</span>
            </div>
            <span className="text-right text-sm text-stone-900 tabular-nums">{projection(party)}</span>
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
      {/* The way back to the archive guide, which says how to read this page
          (CL3-V01); the kicker then names the archive's year, not the section. */}
      <PageHero
        compact
        illustration="elections"
        back={{ href: '/eleicoes/arquivo', label: t('nav.elections'), locale }}
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
            <a href={officialResults.href} className={standaloneLinkClass} rel="noopener noreferrer">{t('forecast.officialResults')}{external}</a>
          </>
        }
      />

      <nav aria-label={t('presidential.inThisArchive')} className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 px-4 py-3 text-sm">
          <a href="#overview" className={`tap-target ${linkClass}`}>{t('presidential.navForecast')}</a>
          <a href="#polling" className={`tap-target ${linkClass}`}>{t('presidential.navUncertainty')}</a>
          <a href="#evidence" className={`tap-target ${linkClass}`}>{t('presidential.navEvidence')}</a>
        </div>
      </nav>

      {!archive.available ? (
        <section id="overview">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <p className="max-w-2xl text-stone-600">{t('forecast.unavailable')}</p>
          </div>
        </section>
      ) : (
      <>
      <section id="overview" className="border-b border-line">
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
        <div className="max-w-7xl mx-auto px-4 space-y-12">

          {/* Each chart under its question and in the one chart frame
              (DataCard: title, plot, source, forecast date, method). */}
          <div id="polling">
            <h2 className={sectionTitleClass}>{t('forecast.pollingTrends')}</h2>
            {/* The section's one chart: its explanation is the frame's
                subtitle, not a second grey line above it (UXD3-11). */}
            <DataCard
              title={pt ? 'Percentagem de votos estimada, por partido' : 'Estimated vote share, by party'}
              subtitle={t('forecast.pollingTrendsDescription', { count: formatElectionNumber(trendDates, locale) })}
              source={trendSource}
              {...frame}
              methodologyHref={electionMethodHref('trend', locale)}
            >
              <PollingChart series={trends} voteShareLabel={t('forecast.voteShareLabel')} />
            </DataCard>
          </div>

          <div>
            <h2 className={sectionTitleClass}>{t('forecast.coalitionSeats')}</h2>
            <DataCard
              title={pt ? 'Mandatos de cada bloco, simulação a simulação' : 'Each bloc’s seats, simulation by simulation'}
              subtitle={`${t('forecast.coalitionDescription')} ${t('forecast.coalitionArithmeticNote')}`}
              source={simulationsSource}
              {...frame}
              methodologyHref={electionMethodHref('pageShows', locale)}
            >
              <CoalitionDotPlot
                simulations={blocs}
                leftCoalitionLabel={leftName}
                rightCoalitionLabel={rightName}
                projectedSeatsLabel={t('forecast.projectedSeats')}
                majorityLabel={t('forecast.majorityThresholdLabel', { seats: majorityThreshold, total: 230 })}
                showingOutcomesLabel={t.raw('forecast.drawnSimulations') as string}
                tableCaption={t('forecast.projectedSeatsByBloc')}
              />
            </DataCard>
          </div>

          <div>
            <h2 className={sectionTitleClass}>{t('forecast.individualParties')}</h2>
            <DataCard
              title={pt ? 'Mandatos por partido' : 'Seats by party'}
              subtitle={t('forecast.simulationDescription', { count: formatElectionNumber(archive.simulations, locale) })}
              source={simulationsSource}
              {...frame}
              methodologyHref={electionMethodHref('seats', locale)}
            >
              <SeatChart stats={seats} tableCaption={t('forecast.projectedSeatsByParty')} />
            </DataCard>
          </div>

          <div id="district-analysis">
            <div className="flex flex-wrap items-center justify-between gap-x-3 mb-3">
              <h2 className="text-2xl text-stone-900 tracking-tight">{t('forecast.districtAnalysis')}</h2>
              <Link href="/eleicoes/legislativas/mapa" locale={locale} className={`text-sm font-medium ${standaloneLinkClass}`}>
                {t('map.title')}{arrow}
              </Link>
            </div>
            <DataCard
              title={pt ? 'Mandatos em disputa e partido à frente, por distrito' : 'Seats in play and the party ahead, by district'}
              source={simulationsSource}
              {...frame}
              methodologyHref={electionMethodHref('pageShows', locale)}
            >
              <DistrictSummary districtData={districtForecast} contestedData={contestedSeats} closeLeadNote={closeLeadNote} headingLevel={4} />
            </DataCard>
          </div>

          {/* One caption for the three cards: it was repeated in each. */}
          <div>
            <p className="mb-4 max-w-3xl text-sm text-stone-600">{t('forecast.blocProjectionCaption', { election: electionDate, date: forecastDate })}</p>
            <div className="grid divide-y divide-line rounded-2xl border border-line bg-cream lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              {blocColumn(leftName, leftParties, probabilities.leftMajority)}
              {blocColumn(rightName, rightParties, probabilities.rightMajority)}
              {blocColumn(t('forecast.otherParties'), otherParties, null)}
            </div>
          </div>

          {/* Polling analysis: a specialist method/evidence view, not a
              main-path answer, so the matrix sits behind the one show/hide
              control inside its chart frame. The heading stays outside. */}
          <div>
            <h2 className="text-2xl text-stone-900 mb-3 tracking-tight">{t('forecast.pollingHouseEffects')}</h2>
            <DataCard
              title={pt ? 'Desvio de cada empresa de sondagens, por partido' : 'Each polling firm’s deviation, by party'}
              source={pollsSource}
              {...frame}
              methodologyHref={electionMethodHref('houseEffects', locale)}
            >
              {/* The toggle names what it opens: a lone "Mostrar" made the
                  card look unfinished (UXD3-12). */}
              <Disclosure summary={t('forecast.showHouseEffects', {
                pollsters: formatElectionNumber(new Set(houseEffects.map(h => pollsterDisplayName(h.pollster))).size, locale),
                parties: formatElectionNumber(new Set(houseEffects.map(h => h.party).filter(p => p in partyColors)).size, locale),
              })}>
                <div className="mt-3">
                  <HouseEffects data={houseEffects} />
                </div>
              </Disclosure>
            </DataCard>
          </div>
        </div>
      </section>
      </>
      )}

      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div id="evidence" className="bg-paper border border-line rounded-2xl p-6">
            <h2 className="text-2xl text-stone-900 mb-4">{t('forecast.aboutModel')}</h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-stone-600">
              <div>
                <h3 className="flex items-center gap-2 mb-2 text-base font-bold text-ink">
                  <Users aria-hidden="true" className="w-4 h-4" />
                  {t('forecast.dataSources')}
                </h3>
                <p>{t('forecast.dataSourcesDescription')}</p>
              </div>
              <div>
                <h3 className="flex items-center gap-2 mb-2 text-base font-bold text-ink">
                  <BarChart3 aria-hidden="true" className="w-4 h-4" />
                  {t('forecast.methodology')}
                </h3>
                <p>{t('forecast.methodologyDescription')}</p>
                <Link href="/eleicoes/metodologia#legislativas" locale={locale} className={`mt-1 ${standaloneLinkClass}`}>{t('common.methodology')}{arrow}</Link>
              </div>
              <div>
                <h3 className="flex items-center gap-2 mb-2 text-base font-bold text-ink">
                  <TrendingUp aria-hidden="true" className="w-4 h-4" />
                  {t('forecast.updates')}
                </h3>
                <p>{t('forecast.updatesDescription', { date: forecastDate })}</p>
                <a href={officialResults.href} className={`mt-1 ${standaloneLinkClass}`} rel="noopener noreferrer">{t('forecast.officialResults')}{external}</a>
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
