import { createPageMetadata } from '@/lib/metadata';
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";
import { partyColors } from "@/lib/config/colors";
import { OFFICIAL_RESULTS, PARLIAMENTARY_2025, PARLIAMENTARY_2025_FORECAST_CUTOFF } from "@/lib/config/elections";
import { loadParliamentaryArchive, loadSimulatorData } from "@/lib/utils/data-loader";
import { closeLastSeats } from "@/lib/simulator/last-seats";
import { formatElectionLongDate, formatElectionNumber, formatElectionPercent, formatElectionProbabilityText, pollsterDisplayName, sortByPartyOrder } from "@/lib/election-display";
import { closeLeads } from "@/lib/election-aggregates";
import { electionMethodHref } from "@/lib/election-methodology";
import { ProbabilityFigure } from "@/components/charts/ProbabilityFigure";
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
import { LastSeatsTable } from '@/components/simulator/LastSeatsTable';
import { MoveVotes } from '@/components/simulator/MoveVotes';
import { listName, toList, withArticle } from '@/components/simulator/copy';
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
/** A section's heading over its chart frame, as on the Liga hub. */
const sectionTitleClass = 'text-2xl text-ink mb-3';
/** The last seats under this many votes make the section's finding. */
const CLOSE_LAST_SEAT = 2500;

export default async function ParliamentaryArchivePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const [archive, simulator] = await Promise.all([loadParliamentaryArchive(), loadSimulatorData()]);
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
        {low != null && high != null && <> <span className="whitespace-nowrap font-normal text-graphite">({pct(low)}–{pct(high)})</span></>}
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
  // The 2025 result's last seats (the official count, not the forecast): the
  // finding counts the circles decided by under CLOSE_LAST_SEAT votes.
  const closeSeats = simulator ? closeLastSeats(simulator.circles, CLOSE_LAST_SEAT) : null;
  const closest = closeSeats?.closest;
  const closestRunner = closest?.lastSeat.runnerUp;
  const num = (v: number) => formatElectionNumber(v, locale);
  const lastSeatStandfirst = closest && closestRunner && closeSeats
    ? (pt
      ? `Em ${closest.name}, ${withArticle(closestRunner.list)} precisava de mais ${num(closestRunner.votes)} votos para tirar ${toList(closest.lastSeat.list)} o último dos ${num(closest.seats)} mandatos. As margens destes ${num(closeSeats.count)} círculos somam ${num(closeSeats.votes)} votos.`
      : `In ${closest.name}, ${listName(closestRunner.list, 'en')} needed ${num(closestRunner.votes)} more votes to take the last of ${num(closest.seats)} seats from ${listName(closest.lastSeat.list, 'en')}. The margins of these ${num(closeSeats.count)} circles add up to ${num(closeSeats.votes)} votes.`)
    : '';
  const resultsSource = pt
    ? 'Fonte: resultados oficiais (SGMAI, por freguesia; Mapa Oficial n.º 2-A/2025 para a emigração), contas estimador.pt'
    : 'Source: official results (SGMAI, by parish; Mapa Oficial n.º 2-A/2025 for the emigration circles), estimador.pt calculations';
  const resultsFrame = {
    updated: pt ? `Eleição de ${electionDate}, mapa de mandatos de 2025` : `Election of ${electionDate}, 2025 seat map`,
    methodologyLabel: t('common.methodology'),
    locale,
  };
  const external = <span aria-hidden="true"> ↗</span>;
  const arrow = <span aria-hidden="true"> →</span>;

  // One column per group of parties: the two blocs with their majority odds,
  // and the parties in neither bloc (CH, PAN), so every modelled party's
  // projected share is on the page. Columns under one ink rule, no card:
  // each reads top-down at its own length.
  const blocColumn = (title: string, parties: string[], majority: number | null) => (
    <div className="border-b border-rule py-4 lg:border-b-0">
      <h3 className="text-lg text-ink mb-3">{title}</h3>
      <div className="space-y-3">
        {parties.map(party => (
          <div key={party} className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 pt-0.5">
              <div aria-hidden="true" className="w-3 h-3 shrink-0" style={{ backgroundColor: partyColors[party as keyof typeof partyColors] }} />
              <span className="text-sm font-medium text-ink">{t(`parties.${party}`)}</span>
            </div>
            <span className="text-right text-sm text-ink tabular-nums">{projection(party)}</span>
          </div>
        ))}
        {majority != null && (
          <div className="border-t border-line pt-3 mt-3">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-sm text-ink">{t('forecast.majorityChance')}</span>
              <ProbabilityFigure probability={majority} locale={locale} className="text-lg text-ink tabular-nums" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
      {/* The way back to the archive guide, which says how to read this page
          (CL3-V01); the kicker then names the archive's year, not the section. */}
      <PageHero
        compact
        back={{ href: '/eleicoes/arquivo', label: t('nav.elections'), locale }}
        eyebrow={t('forecast.archiveEyebrow')}
        lede={t('forecast.archiveLede')}
        title={t('forecast.subtitle')}
        meta={
          <>
            <span>{t('forecast.forecastDateLine', { forecast: forecastDate, election: electionDate })}</span>
            <a href={officialResults.href} className={standaloneLinkClass} rel="noopener noreferrer">{t('forecast.officialResults')}{external}</a>
          </>
        }
      />

      <nav aria-label={t('presidential.inThisArchive')} className="border-b border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 px-4 py-3 text-sm">
          <a href="#overview" className={`tap-target ${linkClass}`}>{t('presidential.navForecast')}</a>
          <a href="#polling" className={`tap-target ${linkClass}`}>{t('presidential.navUncertainty')}</a>
          {simulator && (
            <>
              <a href="#ultimos-mandatos" className={`tap-target ${linkClass}`}>{pt ? 'Últimos mandatos' : 'Last seats'}</a>
              <a href="#mover-votos" className={`tap-target ${linkClass}`}>{pt ? 'Mover votos' : 'Move votes'}</a>
            </>
          )}
          <a href="#evidence" className={`tap-target ${linkClass}`}>{t('presidential.navEvidence')}</a>
        </div>
      </nav>

      {!archive.available ? (
        <section id="overview">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <p className="max-w-2xl text-graphite">{t('forecast.unavailable')}</p>
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

          {/* Each chart under its heading and in the one chart frame
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
              <h2 className="text-2xl text-ink">{t('forecast.districtAnalysis')}</h2>
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
            <p className="mb-4 max-w-3xl text-sm text-graphite">{t('forecast.blocProjectionCaption', { election: electionDate, date: forecastDate })}</p>
            <div className="grid border-t border-ink lg:grid-cols-3 lg:gap-x-10">
              {blocColumn(leftName, leftParties, probabilities.leftMajority)}
              {blocColumn(rightName, rightParties, probabilities.rightMajority)}
              {blocColumn(t('forecast.otherParties'), otherParties, null)}
            </div>
          </div>

          {/* Polling analysis: a specialist method/evidence view, not a
              main-path answer, so the matrix sits behind the one show/hide
              control inside its chart frame. The heading stays outside. */}
          <div>
            <h2 className="text-2xl text-ink mb-3">{t('forecast.pollingHouseEffects')}</h2>
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

      {/* After the forecast, the result: two sections from the official 2025
          count (not the forecast's run), each in the one chart frame. */}
      {simulator && closeSeats && (
        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4 space-y-12">
            <p className="max-w-3xl border-t border-rule pt-8 text-sm text-graphite">
              {pt
                ? `As duas secções seguintes partem do resultado oficial de ${electionDate}, não da previsão.`
                : `The next two sections start from the official result of ${electionDate}, not from the forecast.`}
            </p>

            <div id="ultimos-mandatos">
              <h2 className={sectionTitleClass}>
                {pt
                  ? `Em ${num(closeSeats.count)} dos ${num(closeSeats.total)} círculos, o último mandato decidiu-se por menos de ${num(CLOSE_LAST_SEAT)} votos`
                  : `In ${num(closeSeats.count)} of the ${num(closeSeats.total)} circles, the last seat came down to fewer than ${num(CLOSE_LAST_SEAT)} votes`}
              </h2>
              <DataCard
                title={pt ? 'O último mandato de cada círculo, em 2025' : 'Each circle’s last seat, in 2025'}
                subtitle={`${pt
                  ? 'A lista que ficou com o último mandato, a lista seguinte e quantos votos a mais esta precisava para o levar, com tudo o resto igual. Os mais renhidos primeiro.'
                  : 'The list that took the last seat, the next list in line and how many more votes it needed to take it, everything else equal. The closest first.'} ${lastSeatStandfirst}`}
                source={resultsSource}
                {...resultsFrame}
                methodologyHref={electionMethodHref('lastSeats', locale)}
              >
                <LastSeatsTable
                  rows={simulator.circles.map(c => ({ circle: c.name, seats: c.seats, list: c.lastSeat.list, runnerUp: c.lastSeat.runnerUp }))}
                  locale={pt ? 'pt' : 'en'}
                  shown={Math.max(closeSeats.count, 1)}
                  caption={pt ? 'O último mandato de cada círculo em 2025, e os votos que faltavam à lista seguinte' : 'Each circle’s last seat in 2025, and the votes the next list needed'}
                  votesHeading={pt ? 'Votos que faltavam' : 'Votes it needed'}
                  restLabel={pt
                    ? `Ver os outros ${num(closeSeats.total - closeSeats.count)} círculos`
                    : `Show the other ${num(closeSeats.total - closeSeats.count)} circles`}
                />
              </DataCard>
            </div>

            <div id="mover-votos">
              <h2 className={sectionTitleClass}>
                {pt ? 'Muda o voto de 2025 e vê o parlamento que daria' : 'Change the 2025 vote and see the parliament it would give'}
              </h2>
              <DataCard
                title={pt ? 'Mandatos com os votos que escolheres, sobre o mapa de 2025' : 'Seats with the votes you choose, on the 2025 map'}
                badge={pt ? 'Cenário, não previsão' : 'A scenario, not a forecast'}
                subtitle={pt
                  ? 'Muda a percentagem de cada partido, ou o voto de um grupo de eleitores (abstenção incluída), e o parlamento ao lado segue, círculo a círculo, pelo método de Hondt. É um cenário sem margem.'
                  : 'Change each party’s share, or the vote of a group of voters (abstention included), and the parliament beside it follows, circle by circle, by the D’Hondt method. It is a scenario with no margin.'}
                source={pt
                  ? 'Fonte: resultados oficiais (SGMAI, por freguesia; Mapa Oficial n.º 2-A/2025 para a emigração); por grupos, também INE, Censos 2021, e Estudo Eleitoral Português 2024 (ICS); contas estimador.pt'
                  : 'Source: official results (SGMAI, by parish; Mapa Oficial n.º 2-A/2025 for the emigration circles); by group, also INE, Censos 2021, and the Portuguese Election Study 2024 (ICS); estimador.pt calculations'}
                {...resultsFrame}
                methodologyHref={electionMethodHref('simulator', locale)}
              >
                <MoveVotes
                  data={simulator}
                  locale={pt ? 'pt' : 'en'}
                  anchorId="mover-votos"
                  groupsMethodHref={electionMethodHref('simulatorGroups', locale)}
                />
              </DataCard>
            </div>
          </div>
        </section>
      )}

      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div id="evidence">
            <h2 className="border-b border-ink pb-2 text-2xl text-ink mb-4">{t('forecast.aboutModel')}</h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-graphite">
              <div>
                <h3 className="mb-2 text-base font-semibold text-ink">{t('forecast.dataSources')}</h3>
                <p>{t('forecast.dataSourcesDescription')}</p>
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-ink">{t('forecast.methodology')}</h3>
                <p>{t('forecast.methodologyDescription')}</p>
                <Link href="/eleicoes/metodologia#legislativas" locale={locale} className={`mt-1 ${standaloneLinkClass}`}>{t('common.methodology')}{arrow}</Link>
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-ink">{t('forecast.updates')}</h3>
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
            containerClassName="border-t border-rule pt-8"
          />
        </div>
      </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
