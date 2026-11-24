import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createPageMetadata } from '@/lib/metadata';
import { setRequestLocale } from '@/i18n/request-locale';
import { leftBlocParties, majorityThreshold, rightBlocParties } from '@/lib/config/blocs';
import { partyColors } from '@/lib/config/colors';
import { loadLegislativeNowcast } from '@/lib/utils/data-loader';
import { closeLeads } from '@/lib/election-aggregates';
import {
  formatElectionDate,
  formatElectionLongDate,
  formatElectionNumber,
  formatElectionPercent,
  formatElectionProbabilityText,
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
import { IntervalBand, ReadingRule, Register, Ruler } from '@/components/instrument';
import { ProbabilityFigure } from '@/components/charts/ProbabilityFigure';
import { PollingChart } from '@/components/charts/PollingChart';
import { SeatChart } from '@/components/charts/SeatChart';
import { CoalitionDotPlot } from '@/components/charts/CoalitionDotPlot';
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

  const { file, mostSeats, seatSums, blocs, seats, districtForecast, contestedSeats } = nowcast;
  const { run, previous } = file;
  const pct = (v: number) => formatElectionPercent(v, locale);
  const prob = (p: number) => formatElectionProbabilityText(p, locale);
  const count = (n: number) => formatElectionNumber(n, locale);
  const longDate = (iso: string) => formatElectionLongDate(iso, locale);
  const lastPoll = longDate(run.last_poll);
  const runDate = longDate(run.as_of);
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
    updated: pt ? `Estimativa de ${runDate}, sondagens até ${lastPoll}` : `Estimate of ${runDate}, polls up to ${lastPoll}`,
    methodologyHref: '#metodo',
    methodologyLabel: pt ? 'Como lemos as sondagens' : 'How we read the polls',
    locale,
  };
  const simulationsSource = pt
    ? `Fonte: modelo estimador.pt, ${count(nowcast.simulations)} simulações`
    : `Source: estimador.pt model, ${count(nowcast.simulations)} simulations`;
  const pollsSource = pt
    ? `Fonte: modelo estimador.pt, ${count(run.polls_since_previous)} sondagens desde ${previousDate}`
    : `Source: estimador.pt model, ${count(run.polls_since_previous)} polls since ${previousDate}`;

  const rightName = sortByPartyOrder(rightBlocParties).join(' + ');
  const leftName = sortByPartyOrder(leftBlocParties).join(' + ');
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
  const spacing = weekly
    ? (pt ? `semana a semana desde ${longDate(weekly)}, de quatro em quatro semanas antes` : `week by week since ${longDate(weekly)}, every fourth week before`)
    : (pt ? 'semana a semana' : 'week by week');

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
            ? `Não há eleições marcadas. Lemos as ${count(run.polls_since_previous)} sondagens publicadas desde as legislativas de ${previousDate} e estimamos o resultado se a votação fosse no dia da última, ${lastPoll}. A estimativa volta a correr sempre que sai uma sondagem nova.`
            : `No election has been called. We read the ${count(run.polls_since_previous)} polls published since the ${previousDate} election and estimate the result if the vote were held on the day of the latest, ${lastPoll}. The estimate runs again whenever a new poll comes out.`}
          meta={<span>{pt ? `Estimativa de ${runDate} · sondagens até ${lastPoll}` : `Estimate of ${runDate} · polls up to ${lastPoll}`}</span>}
        />

        <nav aria-label={pt ? 'Nesta página' : 'On this page'} className="border-b border-line">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 px-4 py-3 text-sm">
            <a href="#votos" className={`tap-target ${linkClass}`}>{pt ? 'Votos' : 'Votes'}</a>
            <a href="#tendencia" className={`tap-target ${linkClass}`}>{pt ? 'Desde 2025' : 'Since 2025'}</a>
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
              {tiles.map(party => (
                <div key={party} className="border-l border-line pl-4 first:border-0 first:pl-0">
                  <ProbabilityFigure probability={mostSeats.outright[party]} locale={locale} className="mb-1 block font-display text-4xl font-extrabold tabular-nums text-ink" />
                  <div className="text-sm text-graphite">{pt ? `${party} com mais mandatos` : `${party} with most seats`}</div>
                </div>
              ))}
              <div className="border-l border-line pl-4">
                <ProbabilityFigure probability={mostSeats.tie} locale={locale} className="mb-1 block font-display text-4xl font-extrabold tabular-nums text-ink" />
                <div className="text-sm text-graphite">{pt ? 'Empate no primeiro lugar' : 'Tie for first place'}</div>
              </div>
            </div>
            <div className="mt-8 max-w-3xl">
              <Register
                title={pt ? `Somas de mandatos (maioria: ${majorityThreshold} de 230)` : `Seat sums (majority: ${majorityThreshold} of 230)`}
                items={seatSums.map(sum => ({
                  label: sortByPartyOrder([...sum.parties]).join(' + '),
                  value: pt
                    ? `${count(sum.median)} mandatos (mediana); ${majorityThreshold} ou mais em ${prob(sum.reach)} das simulações`
                    : `${count(sum.median)} seats (median); ${majorityThreshold} or more in ${prob(sum.reach)} of simulations`,
                }))}
              />
              <p className="mt-3 text-xs text-graphite">{t('forecast.coalitionArithmeticNote')}</p>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto max-w-7xl space-y-12 px-4">
            <div id="votos">
              <h2 className={sectionTitleClass}>{pt ? `Votos no dia da última sondagem, ${lastPoll}` : `Votes on the day of the latest poll, ${lastPoll}`}</h2>
              <DataCard
                title={pt ? 'Percentagem de votos estimada, por partido' : 'Estimated vote share, by party'}
                subtitle={pt
                  ? `Mediana e intervalo de 90%, com o erro que todas as sondagens podem partilhar no dia da votação. O quadrado é o resultado das legislativas de ${previousDate}. Percentagens dos votos nos oito partidos modelados, sem os restantes.`
                  : `Median and 90% interval, including the error all polls can share on election day. The square is the ${previousDate} result. Shares of the vote for the eight modelled parties, without the others.`}
                source={pollsSource}
                {...frame}
              >
                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={pt ? 'Votos por partido' : 'Votes by party'}>
                  <table className="w-full min-w-[520px] border-collapse text-[14px]">
                    <caption className="sr-only">
                      {pt
                        ? `Percentagem de votos estimada por partido (mediana e intervalo de 90%), resultado de ${previousDate} e variação da mediana em pontos.`
                        : `Estimated vote share by party (median and 90% interval), the ${previousDate} result and the change in the median, in points.`}
                    </caption>
                    <thead>
                      <tr className="border-b border-ink text-left align-bottom text-[12.5px] leading-4 text-graphite">
                        <th scope="col" className="pb-1.5 pr-2 font-medium">{pt ? 'Partido' : 'Party'}</th>
                        <th scope="col" className="pb-1.5 pr-2 text-right font-medium">{pt ? 'Mediana' : 'Median'}</th>
                        <th scope="col" className="pb-1.5 pr-2 text-right font-medium">{pt ? 'Intervalo de 90%' : '90% interval'}</th>
                        <th scope="col" className="w-[38%] min-w-[150px] pb-1.5 pr-3 font-medium">
                          <span className="sr-only">{pt ? 'Intervalo e resultado anterior' : 'Interval and previous result'}</span>
                          <Ruler min={0} max={SHARE_MAX} minor={1} major={5} labels={[0, 10, 20, 30, 40]} unit="%" />
                        </th>
                        <th scope="col" className="pb-1.5 pr-2 text-right font-medium">{previous.date.slice(0, 4)}</th>
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
                          <td className="whitespace-nowrap py-1.5 pr-2 text-right text-graphite">{sharePoints(r.lo90)}–{sharePoints(r.hi90)}</td>
                          <td className="py-1.5 pr-3">
                            <IntervalBand lo={r.lo90 * 100} md={r.median * 100} hi={r.hi90 * 100} min={0} max={SHARE_MAX} now={previous.shares[r.party] != null ? previous.shares[r.party] * 100 : null} />
                          </td>
                          <td className="py-1.5 pr-2 text-right text-graphite">{previous.shares[r.party] != null ? pct(previous.shares[r.party]) : '—'}</td>
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
              <h2 className={sectionTitleClass}>{pt ? `As sondagens desde as legislativas de ${previousDate}` : `The polls since the ${previousDate} election`}</h2>
              <DataCard
                title={pt ? 'Média das sondagens estimada pelo modelo, por partido' : 'The model’s poll average, by party'}
                subtitle={pt
                  ? `Onde estão as sondagens, ${spacing}, descontado o desvio próprio de cada empresa: média e intervalo de 90%. A faixa não inclui o erro que todas as sondagens podem partilhar no dia da votação, por isso é mais estreita do que os intervalos acima. O primeiro ponto é a semana das legislativas de ${previousDate}, ajustada ao resultado.`
                  : `Where the polls stand, ${spacing}, net of each firm’s own lean: mean and 90% interval. The band leaves out the error all polls can share on election day, so it is narrower than the intervals above. The first point is the week of the ${previousDate} election, fitted to the result.`}
                source={pollsSource}
                {...frame}
              >
                <PollingChart series={{ dates: file.trend.dates, parties: file.trend.parties }} voteShareLabel={t('forecast.voteShareLabel')} band={{ percent: Math.round(file.trend.interval * 100), hdi: false }} />
              </DataCard>
            </div>

            <div id="mandatos">
              <h2 className={sectionTitleClass}>{pt ? 'Mandatos por partido' : 'Seats by party'}</h2>
              <DataCard
                title={pt ? 'Mandatos por partido, em todas as simulações' : 'Seats by party, across every simulation'}
                subtitle={t('forecast.simulationDescription', { count: count(nowcast.simulations) })}
                source={simulationsSource}
                {...frame}
              >
                <SeatChart stats={seats} tableCaption={t('forecast.projectedSeatsByParty')} />
              </DataCard>
            </div>

            <div>
              <h2 className={sectionTitleClass}>{pt
                ? `${rightName} chega aos ${majorityThreshold} mandatos em ${prob(nowcast.probabilities.rightMajority)} das simulações; ${leftName}, em ${prob(nowcast.probabilities.leftMajority)}`
                : `${rightName} reaches ${majorityThreshold} seats in ${prob(nowcast.probabilities.rightMajority)} of simulations; ${leftName}, in ${prob(nowcast.probabilities.leftMajority)}`}</h2>
              <DataCard
                title={pt ? 'Mandatos de cada bloco, simulação a simulação' : 'Each bloc’s seats, simulation by simulation'}
                subtitle={pt
                  ? `${t('forecast.coalitionDescription')} ${t('forecast.coalitionArithmeticNote')}`
                  : `${t('forecast.coalitionDescription')} ${t('forecast.coalitionArithmeticNote')}`}
                source={simulationsSource}
                {...frame}
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

            <div id="distritos">
              <h2 className={sectionTitleClass}>{t('forecast.districtAnalysis')}</h2>
              <DataCard
                title={pt ? 'Mandatos em disputa e partido à frente, por distrito' : 'Seats in play and the party ahead, by district'}
                subtitle={pt
                  ? `Cada distrito parte do seu resultado de ${previousDate} e acompanha a variação nacional (metade proporcional, metade uniforme). Os quatro mandatos da emigração seguem os resultados de 2019, 2022, 2024 e 2025 nessas duas circunscrições, um quarto das simulações cada.`
                  : `Each district starts from its ${previousDate} result and follows the national change (half proportional, half uniform). The four emigration seats follow the 2019, 2022, 2024 and 2025 results in those two constituencies, a quarter of the simulations each.`}
                source={simulationsSource}
                {...frame}
              >
                <DistrictSummary
                  districtData={districtForecast}
                  contestedData={contestedSeats}
                  closeLeadNote={closeLeadNote}
                  headingLevel={4}
                  seatChangeBaseline={pt
                    ? `Os +1 e −1 comparam cada partido com o seu próprio número de mandatos mais frequente nesse distrito, nas simulações, e não com ${previous.date.slice(0, 4)}, e incluem os casos de dois mandatos ou mais. Como cada partido é comparado com o seu valor, os ganhos e as perdas de um distrito não têm de se compensar: quando um mandato se divide quase a meias entre dois partidos, cada um pode aparecer com +1 ou −1, conforme o seu valor mais frequente.`
                    : `The +1 and −1 compare each party with its own most frequent seat count in that district across the simulations, not with ${previous.date.slice(0, 4)}, and include two seats or more. Because each party is compared with its own count, a district’s gains and losses need not balance: when a seat is split almost evenly between two parties, each can show +1 or −1, depending on its own most frequent count.`}
                />
              </DataCard>
            </div>

            <div id="sondagens">
              <h2 className={sectionTitleClass}>{pt ? `${count(file.polls.length)} sondagens desde as legislativas de ${previousDate}` : `${count(file.polls.length)} polls since the ${previousDate} election`}</h2>
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
                    ? 'No dia da votação, as sondagens podem errar todas para o mesmo lado: em 2024 e 2025 subestimaram o Chega em 4 a 5 pontos. Juntamos um erro desse tamanho, medido nas seis legislativas de 2011 a 2025, e é por isso que os intervalos são largos. Nesse teste, a direção do erro não se repetiu de forma fiável de uma eleição para a seguinte, por isso não a corrigimos.'
                    : 'On election day, the polls can all miss the same way: in 2024 and 2025 they underestimated Chega by 4 to 5 points. We add an error of that size, measured over the six parliamentary elections from 2011 to 2025, which is why the intervals are wide. In that test the direction of the miss did not repeat reliably from one election to the next, so we do not correct for it.'}
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
