import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createPageMetadata } from '@/lib/metadata';
import { setRequestLocale } from '@/i18n/request-locale';
import { majorityThreshold } from '@/lib/config/blocs';
import { partyColors } from '@/lib/config/colors';
import { loadLegislativeNowcast } from '@/lib/utils/data-loader';
import { closeLeads, CONTESTED_ENSC } from '@/lib/election-aggregates';
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
import { Disclosure } from '@/components/viz/Disclosure';
import { TextLink } from '@/components/brand/TextLink';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { IntervalBand, ProbBar, ReadingRule, Ruler } from '@/components/instrument';
import { PollingChart } from '@/components/charts/PollingChart';
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
const headCell = 'pb-1.5 pr-2 font-medium';
const headRow = 'border-b border-ink text-left align-bottom text-[12.5px] leading-4 text-graphite';

/** A party's name cell: its colour swatch and code, with the full name for hover and screen readers. */
function PartyCell({ party, name }: { party: string; name: string }) {
  return (
    <th scope="row" className="py-1.5 pr-2 text-left font-normal">
      <span className="name-cut inline-flex items-center gap-[7px] whitespace-nowrap">
        <i aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: partyColors[party as keyof typeof partyColors] }} />
        <abbr title={name} className="no-underline">{party}</abbr>
      </span>
    </th>
  );
}

export default async function LegislativeNowcastPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const pt = locale === 'pt';
  const nowcast = await loadLegislativeNowcast();
  const back = { href: '/eleicoes/arquivo', label: t('nav.elections'), locale };
  const eyebrow = pt ? 'Próximas legislativas · sem eleições marcadas' : 'Next parliamentary election · none called yet';

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
  const { run, previous, national, trend } = file;
  const pct = (v: number) => formatElectionPercent(v, locale);
  const prob = (p: number) => formatElectionProbabilityText(p, locale);
  const count = (n: number) => formatElectionNumber(n, locale);
  const points = (v: number) => formatElectionNumber(v * 100, locale, 1);
  const longDate = (iso: string) => formatElectionLongDate(iso, locale);
  const shortDate = (iso: string) => formatElectionShortDate(iso, locale);
  const lastPoll = longDate(run.last_poll);
  // The last election, named from the file: "2025", "maio de 2025".
  const prevYear = previous.date.slice(0, 4);
  const prevMonth = new Date(`${previous.date}T12:00:00Z`).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const partyName = (party: string) => t(`parties.${party}`);
  const and = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${pt ? 'e' : 'and'} ${items.at(-1)}`);
  const join = (parties: readonly string[]) => sortByPartyOrder([...parties]).join(' + ');

  // Every heading below is a finding read from the files (the job pushes new ones without a review).
  // The h1: the party with most seats in the most draws (a tie counts for no one).
  const ranked = rankedByMostSeats(mostSeats.outright, file.parties);
  const leader = ranked[0];
  const finding = pt
    ? `${partyWithArticle(leader, locale)} elegia mais deputados do que qualquer outro partido em ${prob(mostSeats.outright[leader])} das simulações`
    : `${leader} would win more seats than any other party in ${prob(mostSeats.outright[leader])} of simulations`;

  // The majority: the seat sum that reaches 116 most often, when it does in most draws.
  const topSum = [...seatSums].sort((a, b) => b.reach - a.reach)[0];
  const sumFinds = topSum && topSum.reach >= 0.5;
  const noPartyAlone = seats.every(s => s.hi90 < majorityThreshold);
  const sumsHeading = sumFinds
    ? (pt
      ? `${join(topSum.parties)} somam ${majorityThreshold} ou mais mandatos em ${prob(topSum.reach)} das simulações`
      : `${join(topSum.parties)} reach ${majorityThreshold} seats or more in ${prob(topSum.reach)} of simulations`)
    : (pt
      ? `Nenhuma destas somas chega aos ${majorityThreshold} mandatos em metade das simulações`
      : `None of these sums reaches ${majorityThreshold} seats in half of the simulations`);
  const lede = pt
    ? `Se a votação fosse a ${lastPoll}, data da última sondagem.${sumFinds ? ` ${join(topSum.parties)} somariam ${majorityThreshold} ou mais mandatos em ${prob(topSum.reach)} das simulações${noPartyAlone ? '; nenhum partido chega lá sozinho' : ''}.` : ''}`
    : `If the vote were held on ${lastPoll}, the day of the latest poll.${sumFinds ? ` ${join(topSum.parties)} would have ${majorityThreshold} seats or more in ${prob(topSum.reach)} of simulations${noPartyAlone ? '; no party gets there alone' : ''}.` : ''}`;

  // Votes: how far apart the leaders are, and whether their 90% intervals overlap.
  const [first] = national;
  const overlapping = national.slice(0, 3).filter(r => r.hi90 >= first.lo90);
  const votesHeading = overlapping.length >= 2
    ? (pt
      ? `${and(overlapping.map(r => r.party))} separados por ${points(first.median - overlapping.at(-1)!.median)} pontos, com intervalos que se sobrepõem`
      : `${and(overlapping.map(r => r.party))} ${points(first.median - overlapping.at(-1)!.median)} points apart, with overlapping intervals`)
    : (pt
      ? `${first.party} à frente nos votos: ${pct(first.median)}, entre ${points(first.lo90)} e ${points(first.hi90)}`
      : `${first.party} ahead on votes: ${pct(first.median)}, between ${points(first.lo90)} and ${points(first.hi90)}`);
  const change = (party: string) => {
    const row = national.find(r => r.party === party);
    const before = previous.shares[party];
    return row && before != null ? formatSignedNumber((row.median - before) * 100, locale, 1) : '—';
  };

  // Seats: the top two's 90% ranges, on a ruler that fits the largest one.
  const [seatA, seatB] = seats;
  const seatsHeading = pt
    ? `${seatA.party} entre ${seatA.lo90} e ${seatA.hi90} mandatos; ${seatB.party}, entre ${seatB.lo90} e ${seatB.hi90}`
    : `${seatA.party} between ${seatA.lo90} and ${seatA.hi90} seats; ${seatB.party}, between ${seatB.lo90} and ${seatB.hi90}`;
  const seatMax = Math.max(125, Math.ceil((Math.max(...seats.map(s => s.hi90)) + 5) / 25) * 25);
  const seatLabels = Array.from({ length: seatMax / 25 + 1 }, (_, i) => i * 25);

  // The trend: who rose and who fell most since the election.
  const moves = Object.entries(trend.parties)
    .map(([party, series]) => ({ party, move: (series.mean.at(-1) ?? 0) - (series.mean[0] ?? 0) }))
    .sort((a, b) => b.move - a.move);
  const riser = moves[0];
  const faller = moves.at(-1)!;
  const trendHeading = riser.move >= 0.005 && faller.move <= -0.005
    ? (pt
      ? `${riser.party} subiu ${points(riser.move)} pontos desde ${prevMonth}; ${faller.party} desceu ${points(-faller.move)}`
      : `${riser.party} up ${points(riser.move)} points since ${prevMonth}; ${faller.party} down ${points(-faller.move)}`)
    : (pt ? `As sondagens desde ${prevMonth}` : `The polls since ${prevMonth}`);
  const weekly = weeklyFrom(trend.dates);
  const spacing = weekly
    ? (pt ? `de quatro em quatro semanas até ${shortDate(weekly)} e semanal depois` : `every fourth week until ${shortDate(weekly)}, weekly after`)
    : (pt ? 'semana a semana' : 'week by week');

  // Districts: how many have seats in play, the most uncertain named.
  const contested = Object.entries(contestedSeats.districts)
    .filter(([, d]) => d.ENSC > CONTESTED_ENSC)
    .sort(([, a], [, b]) => b.ENSC - a.ENSC)
    .map(([name]) => name);
  const districtsHeading = pt
    ? `Mandatos em disputa em ${count(contested.length)} dos ${count(districtForecast.length)} distritos e regiões`
    : `Seats in play in ${count(contested.length)} of ${count(districtForecast.length)} districts and regions`;
  const close = closeLeads(districtForecast);
  const closeList = close.map(c => `${c.district} (${c.first.party} ${pct(c.first.share)}, ${c.second.party} ${pct(c.second.share)})`).join('; ');
  const closeLeadNote = close.length > 0
    ? (pt
      ? `A menos de 1 ponto percentual entre os dois primeiros: ${closeList}. A contagem dá estes distritos ao partido à frente, mas a estimativa é praticamente um empate.`
      : `Under 1 percentage point between the top two: ${closeList}. The count gives these districts to the party ahead, but the estimate is close to a tie.`)
    : undefined;

  const pollParties = ['AD', 'PS', 'CH', 'IL', 'L', 'CDU', 'BE', 'PAN'];
  const diag = run.diagnostics;
  const methodLink = { methodologyHref: '#metodo', methodologyLabel: pt ? 'Como lemos as sondagens' : 'How we read the polls', locale };
  const frame = { ...methodLink, updated: pt ? `Estimativa de ${shortDate(run.as_of)}` : `Estimate of ${shortDate(run.as_of)}` };
  const modelSource = pt
    ? `Fonte: modelo estimador.pt, ${count(file.polls.length)} sondagens até ${shortDate(run.last_poll)}`
    : `Source: estimador.pt model, ${count(file.polls.length)} polls up to ${shortDate(run.last_poll)}`;
  const simulationsSource = pt
    ? `Fonte: modelo estimador.pt, ${count(nowcast.simulations)} simulações`
    : `Source: estimador.pt model, ${count(nowcast.simulations)} simulations`;
  const ifVote = pt ? `se a votação fosse a ${lastPoll}` : `if the vote were held on ${lastPoll}`;

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
        <PageHero
          compact
          back={back}
          eyebrow={eyebrow}
          title={finding}
          lede={lede}
          meta={<span>{pt ? `Última sondagem: ${shortDate(run.last_poll)} · estimativa calculada a ${shortDate(run.as_of)}` : `Latest poll: ${shortDate(run.last_poll)} · estimate made on ${shortDate(run.as_of)}`}</span>}
        />

        <nav aria-label={pt ? 'Nesta página' : 'On this page'} className="hidden border-b border-line sm:block">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 px-4 py-3 text-sm">
            <a href="#votos" className={`tap-target ${linkClass}`}>{pt ? 'Votos' : 'Votes'}</a>
            <a href="#mandatos" className={`tap-target ${linkClass}`}>{pt ? 'Mandatos' : 'Seats'}</a>
            <a href="#tendencia" className={`tap-target ${linkClass}`}>{pt ? `Desde ${prevYear}` : `Since ${prevYear}`}</a>
            <a href="#distritos" className={`tap-target ${linkClass}`}>{pt ? 'Distritos' : 'Districts'}</a>
            <a href="#sondagens" className={`tap-target ${linkClass}`}>{pt ? 'Sondagens' : 'Polls'}</a>
            <a href="#metodo" className={`tap-target ${linkClass}`}>{pt ? 'Método' : 'Method'}</a>
          </div>
        </nav>

        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl gap-x-12 gap-y-10 px-4 py-8 lg:grid-cols-2">
            {/* Who has most seats: one ruler per party, the tie as its own row. */}
            <div id="estimativa">
              <h2 className="mb-3 text-xl text-ink">{pt ? 'Quem elege mais deputados' : 'Who wins most seats'}</h2>
              <table className="w-full border-collapse text-[14px]">
                <caption className="sr-only">{pt ? 'Percentagem das simulações em que cada partido elege mais deputados do que qualquer outro.' : 'Share of simulations in which each party wins more seats than any other.'}</caption>
                <tbody>
                  {ranked.slice(0, 3).map(party => (
                    <tr key={party} className="border-b border-grid">
                      <PartyCell party={party} name={partyName(party)} />
                      <td className="w-[120px] py-2 pr-3"><ProbBar p={mostSeats.outright[party]} width={110} /></td>
                      <td className="py-2 text-right"><span className="fig text-[22px] leading-6">{prob(mostSeats.outright[party])}</span></td>
                    </tr>
                  ))}
                  <tr className="border-b border-grid">
                    <th scope="row" className="py-2 pr-2 text-left font-normal text-graphite">{pt ? 'Empate' : 'Tie'}</th>
                    <td className="w-[120px] py-2 pr-3"><ProbBar p={mostSeats.tie} width={110} /></td>
                    <td className="py-2 text-right text-graphite">{prob(mostSeats.tie)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* The majority, as seat arithmetic. */}
            <div>
              <h2 className="mb-3 text-xl text-ink">{sumsHeading}</h2>
              <table className="w-full border-collapse text-[14px]">
                <caption className="sr-only">{pt ? `Somas de mandatos: mediana e percentagem das simulações em que chegam aos ${majorityThreshold} (maioria de 230).` : `Seat sums: median and share of simulations reaching ${majorityThreshold} (a majority of 230).`}</caption>
                <thead>
                  <tr className={headRow}>
                    <th scope="col" className={headCell}>{pt ? 'Partidos' : 'Parties'}</th>
                    <th scope="col" className={`${headCell} text-right`}>{pt ? 'Mediana' : 'Median'}</th>
                    <th scope="col" className="pb-1.5 text-right font-medium">{pt ? `${majorityThreshold} ou mais` : `${majorityThreshold} or more`}</th>
                  </tr>
                </thead>
                <tbody>
                  {seatSums.map(sum => (
                    <tr key={sum.parties.join('+')} className="border-b border-grid">
                      <th scope="row" className="py-1.5 pr-2 text-left font-normal">{join(sum.parties)}</th>
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
              <h2 className={sectionTitleClass}>{votesHeading}</h2>
              <DataCard
                title={pt ? `Votos ${ifVote}` : `Votes ${ifVote}`}
                subtitle={pt ? `Mediana e intervalo de 90%; o quadrado é o resultado de ${prevYear}.` : `Median and 90% interval; the square is the ${prevYear} result.`}
                source={modelSource}
                {...frame}
              >
                <table className="w-full border-collapse text-[14px]">
                  <caption className="sr-only">
                    {pt
                      ? `Percentagem de votos estimada por partido (mediana e intervalo de 90%), o resultado de ${prevYear} e a variação da mediana em pontos.`
                      : `Estimated vote share by party (median and 90% interval), the ${prevYear} result and the change in the median, in points.`}
                  </caption>
                  <thead>
                    <tr className={headRow}>
                      <th scope="col" className={headCell}>{pt ? 'Partido' : 'Party'}</th>
                      <th scope="col" className={`${headCell} text-right`}>{pt ? 'Mediana' : 'Median'}</th>
                      <th scope="col" className={`hidden ${headCell} text-right sm:table-cell`}>{pt ? 'Intervalo de 90%' : '90% interval'}</th>
                      <th scope="col" className="w-[42%] min-w-[130px] pb-1.5 pr-3 font-medium">
                        <span className="sr-only">{pt ? 'Intervalo e resultado anterior' : 'Interval and previous result'}</span>
                        <Ruler min={0} max={SHARE_MAX} minor={1} major={5} labels={[0, 10, 20, 30, 40]} unit="%" />
                      </th>
                      <th scope="col" className={`hidden ${headCell} text-right md:table-cell`}>{prevYear}</th>
                      <th scope="col" className="hidden pb-1.5 text-right font-medium sm:table-cell">{pt ? 'Variação (p.p.)' : 'Change (pp)'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {national.map(r => (
                      <tr key={r.party} className="border-b border-grid">
                        <PartyCell party={r.party} name={partyName(r.party)} />
                        <td className="py-1.5 pr-2 text-right"><span className="fig text-[19px] leading-6">{pct(r.median)}</span></td>
                        <td className="hidden whitespace-nowrap py-1.5 pr-2 text-right text-graphite sm:table-cell">{points(r.lo90)}–{points(r.hi90)}</td>
                        <td className="py-1.5 pr-3">
                          <IntervalBand lo={r.lo90 * 100} md={r.median * 100} hi={r.hi90 * 100} min={0} max={SHARE_MAX} now={previous.shares[r.party] != null ? previous.shares[r.party] * 100 : null} />
                          <span className="mt-0.5 block whitespace-nowrap text-[12.5px] text-graphite sm:hidden">{points(r.lo90)}–{points(r.hi90)}</span>
                        </td>
                        <td className="hidden py-1.5 pr-2 text-right text-graphite md:table-cell">{previous.shares[r.party] != null ? pct(previous.shares[r.party]) : '—'}</td>
                        <td className="hidden py-1.5 text-right sm:table-cell">{change(r.party)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[12.5px] leading-[17px] text-graphite">
                  <ReadingRule locale={locale} variant="short" marks={['now', 'band']} />
                </p>
                <p className="mt-2 text-[12.5px] leading-[17px] text-graphite">
                  {pt
                    ? 'Percentagens dos votos nos oito partidos modelados, sem os outros partidos nem os brancos e nulos; as sondagens publicam percentagens sobre o seu próprio total.'
                    : 'Shares of the vote for the eight modelled parties, without other parties or blank and spoilt ballots; the polls publish shares of their own total.'}
                </p>
              </DataCard>
            </div>

            <div id="mandatos">
              <h2 className={sectionTitleClass}>{seatsHeading}</h2>
              <DataCard
                title={pt ? `Mandatos ${ifVote}` : `Seats ${ifVote}`}
                subtitle={pt ? `Mediana e intervalo de 90%, em ${count(nowcast.simulations)} simulações. São precisos ${majorityThreshold} para a maioria.` : `Median and 90% interval, over ${count(nowcast.simulations)} simulations. A majority takes ${majorityThreshold}.`}
                source={simulationsSource}
                {...frame}
              >
                <table className="w-full border-collapse text-[14px]">
                  <caption className="sr-only">{pt ? 'Mandatos por partido: mediana e intervalo de 90%.' : 'Seats by party: median and 90% interval.'}</caption>
                  <thead>
                    <tr className={headRow}>
                      <th scope="col" className={headCell}>{pt ? 'Partido' : 'Party'}</th>
                      <th scope="col" className={`${headCell} text-right`}>{pt ? 'Mediana' : 'Median'}</th>
                      <th scope="col" className={`hidden ${headCell} text-right sm:table-cell`}>{pt ? 'Intervalo de 90%' : '90% interval'}</th>
                      <th scope="col" className="w-[52%] min-w-[150px] pb-1.5 font-medium">
                        <span className="sr-only">{pt ? 'Intervalo' : 'Interval'}</span>
                        <Ruler min={0} max={seatMax} minor={5} major={25} labels={seatLabels} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {seats.map(s => (
                      <tr key={s.party} className="border-b border-grid">
                        <PartyCell party={s.party} name={partyName(s.party)} />
                        <td className="py-1.5 pr-2 text-right"><span className="fig text-[19px] leading-6">{count(s.median)}</span></td>
                        <td className="hidden whitespace-nowrap py-1.5 pr-2 text-right text-graphite sm:table-cell">{s.lo90}–{s.hi90}</td>
                        <td className="py-1.5">
                          <IntervalBand lo={s.lo90} md={s.median} hi={s.hi90} min={0} max={seatMax} reference={majorityThreshold <= seatMax ? majorityThreshold : null} />
                          <span className="mt-0.5 block whitespace-nowrap text-[12.5px] text-graphite sm:hidden">{s.lo90}–{s.hi90}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[12.5px] leading-[17px] text-graphite">
                  <ReadingRule locale={locale} variant="short" marks={['band']} />
                </p>
                {majorityThreshold <= seatMax && (
                  <p className="mt-1 text-[12.5px] leading-[17px] text-graphite">{pt ? `Tracejado: ${majorityThreshold} mandatos, a maioria.` : `Dashed: ${majorityThreshold} seats, a majority.`}</p>
                )}
              </DataCard>
            </div>

            <div id="tendencia">
              <h2 className={sectionTitleClass}>{trendHeading}</h2>
              <DataCard
                title={pt ? 'Média das sondagens estimada pelo modelo, por partido' : 'The model’s poll average, by party'}
                subtitle={pt
                  ? `Média e intervalo de 90%, ${spacing}; sem o erro comum a todas as sondagens no dia da votação.`
                  : `Mean and 90% interval, ${spacing}; without the error all polls can share on election day.`}
                source={modelSource}
                {...frame}
              >
                <PollingChart series={{ dates: trend.dates, parties: trend.parties }} voteShareLabel={t('forecast.voteShareLabel')} band={{ percent: Math.round(trend.interval * 100), hdi: false }} />
              </DataCard>
            </div>

            <div id="distritos">
              <h2 className={sectionTitleClass}>{districtsHeading}</h2>
              <DataCard
                title={pt ? 'Mandatos em disputa e partido à frente, por distrito' : 'Seats in play and the party ahead, by district'}
                subtitle={contested.length > 0
                  ? (pt ? `Os mais incertos: ${and(contested.slice(0, 3))}.` : `The most uncertain: ${and(contested.slice(0, 3))}.`)
                  : (pt ? 'Nenhum distrito tem mandatos em disputa.' : 'No district has seats in play.')}
                source={simulationsSource}
                {...methodLink}
              >
                <Disclosure summary={pt ? `Ver os ${count(districtForecast.length)} distritos e regiões` : `Show the ${count(districtForecast.length)} districts and regions`}>
                  <DistrictSummary
                    districtData={districtForecast}
                    contestedData={contestedSeats}
                    closeLeadNote={closeLeadNote}
                    headingLevel={4}
                    seatChangeBaseline={pt
                      ? `Os +1 e −1 comparam cada partido com o seu próprio número de mandatos mais frequente nesse distrito, nas simulações, e não com ${prevYear}, e incluem os casos de dois mandatos ou mais. Como cada partido é comparado com o seu valor, os ganhos e as perdas de um distrito não têm de se compensar: quando um mandato se divide quase a meias entre dois partidos, cada um pode aparecer com +1 ou −1, conforme o seu valor mais frequente.`
                      : `The +1 and −1 compare each party with its own most frequent seat count in that district across the simulations, not with ${prevYear}, and include two seats or more. Because each party is compared with its own count, a district’s gains and losses need not balance: when a seat is split almost evenly between two parties, each can show +1 or −1, depending on its own most frequent count.`}
                  />
                </Disclosure>
              </DataCard>
            </div>

            <div id="sondagens">
              <h2 className={sectionTitleClass}>{pt ? `${count(file.polls.length)} sondagens desde ${prevMonth}` : `${count(file.polls.length)} polls since ${prevMonth}`}</h2>
              <DataCard
                title={pt ? 'As sondagens que o modelo leu, da mais recente para a mais antiga' : 'The polls the model read, newest first'}
                subtitle={pt
                  ? 'Como publicadas por cada empresa, sobre o total da própria sondagem (outros partidos incluídos); as percentagens de cima são só dos oito partidos modelados.'
                  : 'As each firm published them, out of the poll’s own total (other parties included); the shares above are of the eight modelled parties only.'}
                source={pt ? 'Fonte: sondagens publicadas na comunicação social, compiladas pela Wikipedia' : 'Source: polls published in the press, as compiled by Wikipedia'}
                {...methodLink}
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
                    ...pollParties.map(p => (poll.shares[p] != null ? points(poll.shares[p]) : '—')),
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
                    ? 'Cada partido segue um passeio aleatório semana a semana: a estimativa de cada semana parte da anterior e move-se com as sondagens novas. Cada empresa tem o seu desvio próprio, estimado em todas as sondagens desde 2009, e as sondagens são lidas descontado esse desvio. Não corrigimos a média em nenhuma direção. O rastreio semanal da Pitagórica junta quatro semanas de entrevistas: contamos só as novas de cada edição. A estimativa volta a correr sempre que sai uma sondagem nova.'
                    : 'Each party follows a weekly random walk: each week’s estimate starts from the one before and moves with the new polls. Each firm has its own lean, estimated from every poll since 2009, and the polls are read net of it. We do not shift the average in any direction. Pitagórica’s weekly tracker pools four weeks of interviews: we count only each release’s new ones. The estimate runs again whenever a new poll comes out.'}
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-ink">{pt ? 'Um erro que todas as sondagens partilham' : 'An error all polls share'}</h3>
                <p>
                  {pt
                    ? 'No dia da votação, as sondagens podem errar todas para o mesmo lado: em 2025 deram ao Chega 18,4% em média, e teve 22,8%. Juntamos um erro desse tamanho, medido nas seis legislativas de 2011 a 2025, e é por isso que os intervalos dos votos e dos mandatos são largos. Nesse teste, a direção do erro não se repetiu de forma fiável de uma eleição para a seguinte, por isso não a corrigimos. A média das sondagens no gráfico desde 2025 não inclui esse erro, e a sua faixa é mais estreita.'
                    : 'On election day, the polls can all miss the same way: in 2025 they gave Chega 18.4% on average, and it won 22.8%. We add an error of that size, measured over the six parliamentary elections from 2011 to 2025, which is why the vote and seat intervals are wide. In that test the direction of the miss did not repeat reliably from one election to the next, so we do not correct for it. The poll average in the chart since 2025 leaves that error out, so its band is narrower.'}
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-ink">{pt ? 'Dos votos aos mandatos' : 'From votes to seats'}</h3>
                <p>
                  {pt
                    ? `Cada simulação parte do resultado de ${prevYear} em cada distrito e acompanha a variação nacional (metade proporcional, metade uniforme), com o ruído medido nas eleições anteriores, e aplica o método de Hondt. Os quatro mandatos da emigração seguem os resultados de 2019, 2022, 2024 e 2025 nessas circunscrições, um quarto das simulações cada. Publicamos uma atualização só se a amostragem convergir em todos os ${count(diag.n_values)} valores do modelo (r-hat até 1,01, amostra efetiva de 400 ou mais). Esta: r-hat máximo ${formatElectionNumber(diag.max_rhat, locale, 3)}, amostra efetiva mínima ${count(Math.floor(Math.min(diag.min_ess_bulk, diag.min_ess_tail)))}.`
                    : `Each simulation starts from each district’s ${prevYear} result and follows the national change (half proportional, half uniform), with the noise measured in earlier elections, and applies the D’Hondt method. The four emigration seats follow the 2019, 2022, 2024 and 2025 results in those constituencies, a quarter of the simulations each. We publish an update only if the sampler converged on all ${count(diag.n_values)} values in the model (r-hat up to 1.01, effective sample of 400 or more). This one: highest r-hat ${formatElectionNumber(diag.max_rhat, locale, 3)}, lowest effective sample ${count(Math.floor(Math.min(diag.min_ess_bulk, diag.min_ess_tail)))}.`}
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
