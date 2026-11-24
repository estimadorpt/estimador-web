import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createPageMetadata } from '@/lib/metadata';
import { setRequestLocale } from '@/i18n/request-locale';
import { majorityThreshold } from '@/lib/config/blocs';
import { partyColors } from '@/lib/config/colors';
import { loadLegislativeNowcast } from '@/lib/utils/data-loader';
import { closeLeads } from '@/lib/election-aggregates';
import {
  formatElectionDate,
  formatElectionLongDate,
  formatElectionNumber,
  formatElectionPercent,
  formatElectionProbabilityText,
  formatElectionShortDate,
  pollsterDisplayName,
  sortByPartyOrder,
} from '@/lib/election-display';
import { partyWithArticle } from '@/lib/election-findings';
import { rankedByMostSeats, weeklyFrom } from '@/lib/legislative-nowcast';
import { formatSignedNumber } from '@/lib/typography';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { DataCard } from '@/components/viz/DataCard';
import { ChartTable } from '@/components/viz/ChartTable';
import { TextLink } from '@/components/brand/TextLink';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { IntervalBand, ReadingRule, Ruler } from '@/components/instrument';
import { ProbabilityFigure } from '@/components/charts/ProbabilityFigure';
import { PollingChart } from '@/components/charts/PollingChart';
import { SeatChart } from '@/components/charts/SeatChart';
import { Disclosure } from '@/components/viz/Disclosure';
import { CONTESTED_ENSC } from '@/lib/election-aggregates';
import { DistrictSummary } from '@/components/charts/DistrictSummary';

const PATH = '/eleicoes/proximas-legislativas';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: PATH,
    title: pt ? 'Próximas legislativas: a estimativa diária' : 'Next parliamentary election: the daily estimate',
    description: pt
      ? 'Votos e mandatos se as legislativas fossem no dia da última sondagem, estimados a partir das sondagens publicadas desde maio de 2025.'
      : 'Votes and seats if the parliamentary election were held on the day of the latest poll, estimated from the polls published since May 2025.',
  });
}

const linkClass = 'text-ink underline underline-offset-4 hover:text-ink-muted';
const sectionTitleClass = 'text-2xl text-ink mb-3';
/** The vote-share ruler, in percent: every modelled party's 90% range fits under 45%. */
const SHARE_MAX = 45;

export default async function LegislativeNowcastPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const pt = locale === 'pt';
  const nowcast = await loadLegislativeNowcast();
  const back = { href: '/eleicoes/arquivo', label: t('nav.elections'), locale };
  const eyebrow = pt ? 'Próximas legislativas · estimativa diária' : 'Next parliamentary election · daily estimate';

  if (!nowcast.available) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <main id="main-content" tabIndex={-1}>
          <PageHero compact back={back} eyebrow={eyebrow} title={pt ? 'Próximas legislativas' : 'Next parliamentary election'} />
          <div className="mx-auto flex max-w-7xl flex-wrap items-start gap-6 px-4 py-10">
            <EmptyStateMark />
            <p className="max-w-2xl text-graphite">
              {pt
                ? 'A estimativa não está disponível nesta versão do site. Os arquivos das presidenciais de 2026 e das legislativas de 2025 continuam online.'
                : 'The estimate is not available in this version of the site. The 2026 presidential and 2025 parliamentary archives are still online.'}
            </p>
            <TextLink href="/eleicoes/arquivo" locale={locale}>{t('nav.elections')}</TextLink>
          </div>
        </main>
        <SiteFooter locale={locale} />
      </div>
    );
  }

  const { file, mostSeats, seatSums, seats, districtForecast, contestedSeats } = nowcast;
  const { run, previous } = file;
  const pct = (v: number) => formatElectionPercent(v, locale);
  const prob = (p: number) => formatElectionProbabilityText(p, locale);
  const count = (n: number) => formatElectionNumber(n, locale);
  const longDate = (iso: string) => formatElectionLongDate(iso, locale);
  const lastPoll = longDate(run.last_poll);
  // The last election, named from the file: "2025", "maio de 2025".
  const prevYear = previous.date.slice(0, 4);
  const prevMonth = new Date(`${previous.date}T12:00:00Z`).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const previousDate = longDate(previous.date);
  const partyName = (party: string) => t(`parties.${party}`);

  // The headline: the party with most seats in the most draws (ties count for no one).
  const ranked = rankedByMostSeats(mostSeats.outright, file.parties);
  const leader = ranked[0];
  const finding = pt
    ? `${partyWithArticle(leader, locale)} elegia mais deputados do que qualquer outro partido em ${prob(mostSeats.outright[leader])} das simulações`
    : `${leader} would win more seats than any other party in ${prob(mostSeats.outright[leader])} of simulations`;
  const tiles = ranked.slice(0, 3);

  const frame = {
    updated: pt ? `Estimativa de ${formatElectionShortDate(run.as_of, locale)}` : `Estimate of ${formatElectionShortDate(run.as_of, locale)}`,
    methodologyHref: '#metodo',
    methodologyLabel: pt ? 'Como lemos as sondagens' : 'How we read the polls',
    locale,
  };
  const simulationsSource = pt
    ? `Fonte: modelo estimador.pt, ${count(nowcast.simulations)} simulações`
    : `Source: estimador.pt model, ${count(nowcast.simulations)} simulations`;
  const pollsSource = pt
    ? `Fonte: modelo estimador.pt, ${count(file.polls.length)} sondagens até ${formatElectionShortDate(run.last_poll, locale)}`
    : `Source: estimador.pt model, ${count(file.polls.length)} polls up to ${formatElectionShortDate(run.last_poll, locale)}`;

  const close = closeLeads(districtForecast);
  const closeList = close.map(c => `${c.district} (${c.first.party} ${pct(c.first.share)}, ${c.second.party} ${pct(c.second.share)})`).join('; ');
  const closeLeadNote = close.length > 0
    ? (pt
      ? `A menos de 1 ponto percentual entre os dois primeiros: ${closeList}. A contagem dá estes distritos ao partido à frente, mas a estimativa é praticamente um empate.`
      : `Under 1 percentage point between the top two: ${closeList}. The count gives these districts to the party ahead, but the estimate is close to a tie.`)
    : undefined;
  const sharePoints = (v: number) => formatElectionNumber(v * 100, locale, 1);
  const change = (party: string) => {
    const row = file.national.find(r => r.party === party);
    const before = previous.shares[party];
    return row && before != null ? formatSignedNumber((row.median - before) * 100, locale, 1) : '—';
  };
  const pollParties = ['AD', 'PS', 'CH', 'IL', 'L', 'CDU', 'BE', 'PAN'];
  const diag = run.diagnostics;
  const weekly = weeklyFrom(file.trend.dates);
  const shortDate = (iso: string) => formatElectionShortDate(iso, locale);
  const spacing = weekly
    ? (pt ? `de quatro em quatro semanas até ${shortDate(weekly)} e semanal depois` : `every fourth week until ${shortDate(weekly)}, weekly after`)
    : (pt ? 'semana a semana' : 'week by week');
  // Section headings read from the data, short enough for two lines on a phone.
  const listParties = (items: string[]) => (pt
    ? `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`
    : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);
  const votesHeading = listParties(file.national.slice(0, 3).map(r => `${r.party}\u00a0${pct(r.median)}`));
  const seatsHeading = pt
    ? `${listParties(seats.slice(0, 3).map(r => `${r.party}\u00a0${count(r.mean)}`))} mandatos, em média`
    : `${listParties(seats.slice(0, 3).map(r => `${r.party}\u00a0${count(r.mean)}`))} seats on average`;
  const contested = Object.entries(contestedSeats.districts)
    .filter(([, d]) => d.ENSC > CONTESTED_ENSC)
    .sort(([, a], [, b]) => b.ENSC - a.ENSC)
    .map(([name]) => name);
  const districtsHeading = pt
    ? `Mandatos em disputa em ${count(contested.length)} dos ${count(districtForecast.length)} distritos e regiões`
    : `Seats in play in ${count(contested.length)} of ${count(districtForecast.length)} districts and regions`;

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
        <PageHero
          compact
          back={back}
          eyebrow={eyebrow}
          title={finding}
          lede={pt
            ? `Não há eleições marcadas. É o que dariam as ${count(file.polls.length)} sondagens publicadas desde as legislativas de ${prevYear} se a votação fosse no dia da última, ${lastPoll}.`
            : `No election has been called. This is what the ${count(file.polls.length)} polls published since the ${prevYear} election would give if the vote were held on the day of the latest, ${lastPoll}.`}
          meta={<span>{pt ? `Estimativa de ${shortDate(run.as_of)} · volta a correr com cada sondagem nova` : `Estimate of ${shortDate(run.as_of)} · runs again with every new poll`}</span>}
        />

        <nav aria-label={pt ? 'Nesta página' : 'On this page'} className="border-b border-line">
          <div className="mx-auto flex max-w-7xl gap-x-5 overflow-x-auto whitespace-nowrap px-4 py-1 text-sm [scrollbar-width:none] sm:flex-wrap sm:py-3">
            <a href="#votos" className={`tap-target ${linkClass}`}>{pt ? 'Votos' : 'Votes'}</a>
            <a href="#tendencia" className={`tap-target ${linkClass}`}>{pt ? `Desde ${prevYear}` : `Since ${prevYear}`}</a>
            <a href="#mandatos" className={`tap-target ${linkClass}`}>{pt ? 'Mandatos' : 'Seats'}</a>
            <a href="#distritos" className={`tap-target ${linkClass}`}>{pt ? 'Distritos' : 'Districts'}</a>
            <a href="#sondagens" className={`tap-target ${linkClass}`}>{pt ? 'Sondagens' : 'Polls'}</a>
            <a href="#metodo" className={`tap-target ${linkClass}`}>{pt ? 'Método' : 'Method'}</a>
          </div>
        </nav>

        {/* Who has most seats: the three likeliest, then the seat sums as arithmetic. */}
        <section id="estimativa" className="border-b border-line">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <h2 className="sr-only">{pt ? 'Quem elege mais deputados' : 'Who wins most seats'}</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4">
              {tiles.map((party, i) => (
                <div key={party} className={i === 0 ? '' : i === 2 ? 'md:border-l md:border-line md:pl-4' : 'border-l border-line pl-4'}>
                  <ProbabilityFigure probability={mostSeats.outright[party]} locale={locale} className="mb-1 block font-display text-4xl font-extrabold tabular-nums text-ink" />
                  <div className="text-sm text-graphite">{pt ? `${party} com mais mandatos` : `${party} with most seats`}</div>
                </div>
              ))}
              <div className="border-l border-line pl-4">
                <ProbabilityFigure probability={mostSeats.tie} locale={locale} className="mb-1 block font-display text-4xl font-extrabold tabular-nums text-ink" />
                <div className="text-sm text-graphite">{pt ? 'Empate no primeiro lugar' : 'Tie for first place'}</div>
              </div>
            </div>
            <div className="mt-8 max-w-xl">
              <table className="w-full border-collapse text-[14px]">
                <caption className="mb-2 text-left text-[13px] font-semibold text-ink">
                  {pt ? `Somas de mandatos (maioria: ${majorityThreshold} de 230)` : `Seat sums (majority: ${majorityThreshold} of 230)`}
                </caption>
                <thead>
                  <tr className="border-b border-ink text-left align-bottom text-[12.5px] leading-4 text-graphite">
                    <th scope="col" className="pb-1.5 pr-2 font-medium">{pt ? 'Partidos' : 'Parties'}</th>
                    <th scope="col" className="pb-1.5 pr-2 text-right font-medium">{pt ? 'Mediana' : 'Median'}</th>
                    <th scope="col" className="pb-1.5 text-right font-medium">{pt ? `${majorityThreshold} ou mais` : `${majorityThreshold} or more`}</th>
                  </tr>
                </thead>
                <tbody>
                  {seatSums.map(sum => (
                    <tr key={sum.parties.join('+')} className="border-b border-grid">
                      <th scope="row" className="py-1.5 pr-2 text-left font-normal">{sortByPartyOrder([...sum.parties]).join(' + ')}</th>
                      <td className="py-1.5 pr-2 text-right tabular-nums">{count(sum.median)}</td>
                      <td className="py-1.5 text-right tabular-nums">{prob(sum.reach)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-graphite">{t('forecast.coalitionArithmeticNote')}</p>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto max-w-7xl space-y-12 px-4">
            <div id="votos">
              <h2 className={sectionTitleClass}>{pt ? `Votos: ${votesHeading}` : `Votes: ${votesHeading}`}</h2>
              <DataCard
                title={pt ? 'Percentagem de votos estimada, por partido' : 'Estimated vote share, by party'}
                subtitle={pt
                  ? `A ${lastPoll}: mediana e intervalo de 90%, com o erro que todas as sondagens podem partilhar. O quadrado é o resultado de ${prevYear}. Votos nos oito partidos modelados, sem os restantes.`
                  : `On ${lastPoll}: median and 90% interval, with the error all polls can share. The square is the ${prevYear} result. Votes for the eight modelled parties, without the others.`}
                source={pollsSource}
                {...frame}
              >
                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={pt ? 'Votos por partido' : 'Votes by party'}>
                  <table className="w-full border-collapse text-[14px]">
                    <caption className="sr-only">
                      {pt
                        ? `Percentagem de votos estimada por partido (mediana e intervalo de 90%), resultado de ${previousDate} e variação da mediana em pontos.`
                        : `Estimated vote share by party (median and 90% interval), the ${previousDate} result and the change in the median, in points.`}
                    </caption>
                    <thead>
                      <tr className="border-b border-ink text-left align-bottom text-[12.5px] leading-4 text-graphite">
                        <th scope="col" className="pb-1.5 pr-2 font-medium">{pt ? 'Partido' : 'Party'}</th>
                        <th scope="col" className="pb-1.5 pr-2 text-right font-medium">{pt ? 'Mediana' : 'Median'}</th>
                        <th scope="col" className="hidden pb-1.5 pr-2 text-right font-medium sm:table-cell">{pt ? 'Intervalo de 90%' : '90% interval'}</th>
                        <th scope="col" className="w-[38%] min-w-[130px] pb-1.5 pr-3 font-medium">
                          <span className="sr-only">{pt ? 'Intervalo e resultado anterior' : 'Interval and previous result'}</span>
                          <Ruler min={0} max={SHARE_MAX} minor={1} major={5} labels={[0, 10, 20, 30, 40]} unit="%" />
                        </th>
                        <th scope="col" className="hidden pb-1.5 pr-2 text-right font-medium md:table-cell">{previous.date.slice(0, 4)}</th>
                        <th scope="col" className="pb-1.5 text-right font-medium">{pt ? 'Variação (p.p.)' : 'Change (pp)'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {file.national.map(r => (
                        <tr key={r.party} className="border-b border-grid">
                          <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                            <span className="name-cut inline-flex items-center gap-[7px] whitespace-nowrap">
                              <i aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: partyColors[r.party as keyof typeof partyColors] }} />
                              <abbr title={partyName(r.party)} className="no-underline">{r.party}</abbr>
                            </span>
                          </th>
                          <td className="py-1.5 pr-2 text-right"><span className="fig text-[19px] leading-6">{pct(r.median)}</span></td>
                          <td className="hidden whitespace-nowrap py-1.5 pr-2 text-right text-graphite sm:table-cell">{sharePoints(r.lo90)}–{sharePoints(r.hi90)}</td>
                          <td className="py-1.5 pr-3">
                            <IntervalBand lo={r.lo90 * 100} md={r.median * 100} hi={r.hi90 * 100} min={0} max={SHARE_MAX} now={previous.shares[r.party] != null ? previous.shares[r.party] * 100 : null} />
                            <span className="mt-0.5 block whitespace-nowrap text-[12.5px] text-graphite sm:hidden">{sharePoints(r.lo90)}–{sharePoints(r.hi90)}</span>
                          </td>
                          <td className="hidden py-1.5 pr-2 text-right text-graphite md:table-cell">{previous.shares[r.party] != null ? pct(previous.shares[r.party]) : '—'}</td>
                          <td className="py-1.5 text-right">{change(r.party)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[12.5px] leading-[17px] text-graphite">
                  <ReadingRule locale={locale} variant="short" marks={['now', 'band']} />
                </p>
              </DataCard>
            </div>

            <div id="tendencia">
              <h2 className={sectionTitleClass}>{pt ? `As sondagens desde ${prevMonth}` : `The polls since ${prevMonth}`}</h2>
              <DataCard
                title={pt ? 'Média das sondagens estimada pelo modelo, por partido' : 'The model’s poll average, by party'}
                subtitle={pt
                  ? `Média e intervalo de 90%, ${spacing}, sem o desvio próprio de cada empresa. A faixa não inclui o erro que todas as sondagens podem partilhar no dia da votação, por isso é mais estreita do que os intervalos de cima.`
                  : `Mean and 90% interval, ${spacing}, net of each firm’s own lean. The band leaves out the error all polls can share on election day, so it is narrower than the intervals above.`}
                source={pollsSource}
                {...frame}
              >
                <PollingChart series={{ dates: file.trend.dates, parties: file.trend.parties }} voteShareLabel={t('forecast.voteShareLabel')} band={{ percent: Math.round(file.trend.interval * 100), hdi: false }} />
              </DataCard>
            </div>

            <div id="mandatos">
              <h2 className={sectionTitleClass}>{seatsHeading}</h2>
              <DataCard
                title={pt ? 'Mandatos por partido, em todas as simulações' : 'Seats by party, across every simulation'}
                subtitle={t('forecast.simulationDescription', { count: count(nowcast.simulations) })}
                source={simulationsSource}
                {...frame}
              >
                <SeatChart stats={seats} tableCaption={t('forecast.projectedSeatsByParty')} />
              </DataCard>
            </div>

            <div id="distritos">
              <h2 className={sectionTitleClass}>{districtsHeading}</h2>
              <DataCard
                title={pt ? 'Mandatos em disputa e partido à frente, por distrito' : 'Seats in play and the party ahead, by district'}
                subtitle={pt
                  ? `${contested.length > 0 ? `Os mais incertos: ${listParties(contested.slice(0, 3))}. ` : ''}Cada distrito parte do seu resultado de ${prevYear} e acompanha a variação nacional; os quatro mandatos da emigração seguem os resultados de 2019 a 2025.`
                  : `${contested.length > 0 ? `The most uncertain: ${listParties(contested.slice(0, 3))}. ` : ''}Each district starts from its ${prevYear} result and follows the national change; the four emigration seats follow the 2019 to 2025 results.`}
                source={simulationsSource}
                {...frame}
              >
                <Disclosure summary={pt ? `Ver os ${count(districtForecast.length)} distritos e regiões` : `Show the ${count(districtForecast.length)} districts and regions`}>
                <DistrictSummary
                  districtData={districtForecast}
                  contestedData={contestedSeats}
                  closeLeadNote={closeLeadNote}
                  headingLevel={4}
                  seatChangeBaseline={pt
                    ? `Os +1 e −1 comparam cada partido com o seu próprio número de mandatos mais frequente nesse distrito, nas simulações, e não com ${previous.date.slice(0, 4)}, e incluem os casos de dois mandatos ou mais. Como cada partido é comparado com o seu valor, os ganhos e as perdas de um distrito não têm de se compensar: quando um mandato se divide quase a meias entre dois partidos, cada um pode aparecer com +1 ou −1, conforme o seu valor mais frequente.`
                    : `The +1 and −1 compare each party with its own most frequent seat count in that district across the simulations, not with ${previous.date.slice(0, 4)}, and include two seats or more. Because each party is compared with its own count, a district’s gains and losses need not balance: when a seat is split almost evenly between two parties, each can show +1 or −1, depending on its own most frequent count.`}
                />
                </Disclosure>
              </DataCard>
            </div>

            <div id="sondagens">
              <h2 className={sectionTitleClass}>{pt ? `${count(file.polls.length)} sondagens desde ${prevMonth}` : `${count(file.polls.length)} polls since ${prevMonth}`}</h2>
              <DataCard
                title={pt ? 'As sondagens que o modelo leu, da mais recente para a mais antiga' : 'The polls the model read, newest first'}
                subtitle={pt
                  ? 'Percentagens como publicadas por cada empresa, sobre o total da própria sondagem (outros partidos incluídos). O rastreio semanal da Pitagórica junta quatro semanas de entrevistas: o modelo conta só as entrevistas novas de cada edição.'
                  : 'Shares as each firm published them, out of the poll’s own total (other parties included). Pitagórica’s weekly tracker pools four weeks of interviews: the model counts only each release’s new interviews.'}
                source={pt ? 'Fonte: sondagens publicadas na comunicação social, compiladas pela Wikipedia' : 'Source: polls published in the press, as compiled by Wikipedia'}
                {...frame}
              >
                <ChartTable
                  caption={pt ? 'Sondagens desde as últimas legislativas' : 'Polls since the last parliamentary election'}
                  summaryLabel={pt ? `Ver as ${count(file.polls.length)} sondagens` : `Show the ${count(file.polls.length)} polls`}
                  columns={[pt ? 'Empresa' : 'Pollster', pt ? 'Fim do trabalho de campo' : 'Fieldwork end', pt ? 'Amostra' : 'Sample', ...pollParties]}
                  align={['left', 'left', 'right', ...pollParties.map(() => 'right' as const)]}
                  rows={file.polls.map(poll => [
                    pollsterDisplayName(poll.pollster),
                    formatElectionDate(poll.fieldwork_end, locale),
                    poll.sample_size != null ? count(poll.sample_size) : '—',
                    ...pollParties.map(p => (poll.shares[p] != null ? sharePoints(poll.shares[p]) : '—')),
                  ])}
                />
              </DataCard>
            </div>
          </div>
        </section>

        <section id="metodo" className="pb-8">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-4 border-b border-ink pb-2 text-2xl text-ink">{pt ? 'Como lemos as sondagens' : 'How we read the polls'}</h2>
            <div className="grid gap-6 text-sm text-graphite md:grid-cols-3">
              <div>
                <h3 className="mb-2 text-base font-semibold text-ink">{pt ? 'Uma média com memória' : 'An average with memory'}</h3>
                <p>
                  {pt
                    ? 'Cada partido segue um passeio aleatório semana a semana: a estimativa de cada semana parte da anterior e move-se com as sondagens novas. Cada empresa tem o seu desvio próprio, estimado em todas as sondagens desde 2009, e as sondagens são lidas descontado esse desvio. Não corrigimos a média em nenhuma direção.'
                    : 'Each party follows a weekly random walk: each week’s estimate starts from the one before and moves with the new polls. Each firm has its own lean, estimated from every poll since 2009, and the polls are read net of it. We do not shift the average in any direction.'}
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-ink">{pt ? 'Um erro que todas as sondagens partilham' : 'An error all polls share'}</h3>
                <p>
                  {pt
                    ? 'No dia da votação, as sondagens podem errar todas para o mesmo lado: em 2025 deram ao Chega 18,4% em média, e teve 22,8%. Juntamos um erro desse tamanho, medido nas seis legislativas de 2011 a 2025, e é por isso que os intervalos são largos. Nesse teste, a direção do erro não se repetiu de forma fiável de uma eleição para a seguinte, por isso não a corrigimos.'
                    : 'On election day, the polls can all miss the same way: in 2025 they gave Chega 18.4% on average, and it won 22.8%. We add an error of that size, measured over the six parliamentary elections from 2011 to 2025, which is why the intervals are wide. In that test the direction of the miss did not repeat reliably from one election to the next, so we do not correct for it.'}
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-ink">{pt ? 'Dos votos aos mandatos' : 'From votes to seats'}</h3>
                <p>
                  {pt
                    ? `Cada simulação reparte os votos pelos distritos a partir de ${previousDate}, com o ruído medido nas eleições anteriores, e aplica o método de Hondt em cada um. Publicamos uma atualização só se a amostragem convergir em todos os ${count(diag.n_values)} valores do modelo (r-hat até 1,01, amostra efetiva de 400 ou mais). Esta: r-hat máximo ${formatElectionNumber(diag.max_rhat, locale, 3)}, amostra efetiva mínima ${count(Math.floor(Math.min(diag.min_ess_bulk, diag.min_ess_tail)))}.`
                    : `Each simulation shares the vote out across the districts from ${previousDate}, with the noise measured in earlier elections, and applies the D’Hondt method in each. We publish an update only if the sampler converged on all ${count(diag.n_values)} values in the model (r-hat up to 1.01, effective sample of 400 or more). This one: highest r-hat ${formatElectionNumber(diag.max_rhat, locale, 3)}, lowest effective sample ${count(Math.floor(Math.min(diag.min_ess_bulk, diag.min_ess_tail)))}.`}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6">
              <TextLink href="/eleicoes/metodologia" locale={locale}>{pt ? 'Como fizemos as previsões arquivadas' : 'How the archived forecasts were made'}</TextLink>
              <TextLink href="/eleicoes/legislativas" locale={locale}>{pt ? 'A previsão de 2025 (arquivo)' : 'The 2025 forecast (archive)'}</TextLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
