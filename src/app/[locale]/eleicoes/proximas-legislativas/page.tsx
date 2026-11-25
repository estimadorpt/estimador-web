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
} from '@/lib/election-display';
import { onModelBase, rankedByMostSeats, recentMove } from '@/lib/legislative-nowcast';
import { PARLIAMENTARY_2025_SEATS } from '@/lib/config/elections';
import { formatSignedNumber } from '@/lib/typography';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { DataCard } from '@/components/viz/DataCard';
import { ChartTable } from '@/components/viz/ChartTable';
import { Disclosure } from '@/components/viz/Disclosure';
import { TextLink } from '@/components/brand/TextLink';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { IntervalBand, Ruler } from '@/components/instrument';
import { PollingChart } from '@/components/charts/PollingChart';
import { DistrictSummary } from '@/components/charts/DistrictSummary';
import { ParliamentBar } from '@/components/charts/ParliamentBar';

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

const sectionTitleClass = 'text-2xl text-ink mb-3';
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
  const eyebrow = pt ? 'Próximas legislativas · sem data marcada' : 'Next parliamentary election · no date set';

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

  const { file, mostSeats, majorities, otherSums, seats, parliament, districtForecast, contestedSeats } = nowcast;
  const { run, previous, national, trend } = file;
  const pct = (v: number, digits = 1) => formatElectionPercent(v, locale, digits);
  const prob = (p: number) => formatElectionProbabilityText(p, locale);
  const count = (n: number) => formatElectionNumber(n, locale);
  const points = (v: number) => formatElectionNumber(v * 100, locale, 1);
  const whole = (v: number) => formatElectionNumber(v * 100, locale, 0);
  const longDate = (iso: string) => formatElectionLongDate(iso, locale);
  const shortDate = (iso: string) => formatElectionShortDate(iso, locale);
  const lastPoll = longDate(run.last_poll);
  const dayMonth = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  // The last election, named from the file: "2025", "maio de 2025".
  const prevYear = previous.date.slice(0, 4);
  const prevMonth = new Date(`${previous.date}T12:00:00Z`).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const partyName = (party: string) => t(`parties.${party}`);
  // Headlines name Chega in full (its code reads as a country), the others by their code.
  const short = (party: string) => (party === 'CH' ? 'Chega' : party);
  // "o PS", "a AD", "o Chega", inside a sentence; English has no article.
  const art = (party: string) => (pt ? `${['AD', 'IL', 'CDU'].includes(party) ? 'a' : 'o'} ${short(party)}` : short(party));
  const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  // A gap in whole points: "5 pontos", "um ponto", "menos de um ponto".
  const gap = (v: number) => {
    const n = Math.round(v * 100);
    if (n < 1) return pt ? 'menos de um ponto' : 'less than a point';
    if (n === 1) return pt ? 'um ponto' : 'one point';
    return pt ? `${count(n)} pontos` : `${count(n)} points`;
  };

  // Every heading below is a finding read from the files (the job pushes new ones without a review).
  // The h1: the vote shares readers know from the news, and how close the leaders are.
  const [first, second, third] = national;
  const spread = third ? first.median - third.median : Infinity;
  const finding = spread <= 0.08
    ? (pt
      ? `${short(first.party)} ${pct(first.median, 0)}, ${short(second.party)} ${pct(second.median, 0)}, ${short(third.party)} ${pct(third.median, 0)}: três partidos em ${gap(spread)}`
      : `${short(first.party)} ${pct(first.median, 0)}, ${short(second.party)} ${pct(second.median, 0)}, ${short(third.party)} ${pct(third.median, 0)}: three parties within ${gap(spread)}`)
    : first.median - second.median <= 0.05
      ? (pt
        ? `${short(first.party)} ${pct(first.median, 0)}, ${short(second.party)} ${pct(second.median, 0)}: separados por ${gap(first.median - second.median)}`
        : `${short(first.party)} ${pct(first.median, 0)}, ${short(second.party)} ${pct(second.median, 0)}: ${gap(first.median - second.median)} apart`)
      : (pt
        ? `${short(first.party)} à frente com ${pct(first.median, 0)}; ${short(second.party)} tem ${pct(second.median, 0)}`
        : `${short(first.party)} ahead on ${pct(first.median, 0)}; ${short(second.party)} on ${pct(second.median, 0)}`);

  // The lede: where the numbers come from, and what moved in the last four weeks.
  const move = recentMove(trend);
  const monthLine = move == null
    ? ''
    : Math.abs(move.move) < 0.01
      ? (pt ? ' Em quatro semanas, nenhum partido mexeu mais de um ponto.' : ' In four weeks, no party moved by more than a point.')
      : (pt
        ? ` Em quatro semanas, ${art(move.party)} ${move.move > 0 ? 'subiu' : 'desceu'} ${points(Math.abs(move.move))} pontos.`
        : ` In four weeks, ${short(move.party)} ${move.move > 0 ? 'rose' : 'fell'} ${points(Math.abs(move.move))} points.`);
  const lede = pt
    ? `A média das ${count(file.polls.length)} sondagens publicadas desde ${prevMonth}, como se a votação fosse a ${lastPoll}.${monthLine}`
    : `The average of the ${count(file.polls.length)} polls published since ${prevMonth}, as if the vote were held on ${lastPoll}.${monthLine}`;

  // The scoreboard: votes and seats, each against 2025. A change is set in ink only when the
  // 90% range leaves out the 2025 value; inside it, the change is within the margin.
  const seatRow = new Map(seats.map(s => [s.party, s]));
  const voteChange = (r: (typeof national)[number]) => {
    const before = previous.shares[r.party];
    if (before == null) return null;
    return { text: formatSignedNumber((r.median - before) * 100, locale, 1), clear: before < r.lo90 || before > r.hi90 };
  };
  const seatChange = (party: string) => {
    const s = seatRow.get(party);
    const before = PARLIAMENTARY_2025_SEATS[party];
    if (!s || before == null) return null;
    return { text: formatSignedNumber(s.median - before, locale, 0), clear: before < s.lo90 || before > s.hi90 };
  };

  // The trend: who rose and who fell most since the election, on the scoreboard's baseline.
  const sinceElection = national
    .filter(r => previous.shares[r.party] != null)
    .map(r => ({ party: r.party, move: r.median - previous.shares[r.party] }))
    .sort((a, b) => b.move - a.move);
  const riser = sinceElection[0];
  const faller = sinceElection.at(-1)!;
  const trendHeading = riser && riser.move >= 0.005 && faller.move <= -0.005
    ? (pt
      ? `Desde ${prevMonth}, ${art(riser.party)} subiu ${gap(riser.move)} e ${art(faller.party)} desceu ${gap(-faller.move)}`
      : `Since ${prevMonth}, ${short(riser.party)} is up ${gap(riser.move)} and ${short(faller.party)} down ${gap(-faller.move)}`)
    : (pt ? `As sondagens desde ${prevMonth}` : `The polls since ${prevMonth}`);
  const pollDots = file.polls.flatMap(poll =>
    Object.entries(onModelBase(poll.shares, file.parties))
      .filter(([, share]) => share > 0)
      .map(([party, share]) => ({ date: poll.fieldwork_end, party, share })),
  );

  // Who can reach a majority without Chega.
  const sumOf = (parties: readonly string[]) => majorities.find(m => m.parties.join() === parties.join());
  const right = sumOf(['AD', 'IL']);
  const left = sumOf(['PS', 'L', 'CDU', 'BE', 'PAN']);
  const central = sumOf(['PS', 'AD']);
  const reaches = (s: typeof right) => s != null && s.reach >= 0.5;
  const majorityHeading = !reaches(right) && !reaches(left) && reaches(central)
    ? (pt ? `Sem o Chega, só PS e AD juntos chegam aos ${majorityThreshold} deputados` : `Without Chega, only PS and AD together reach ${majorityThreshold} seats`)
    : reaches(right)
      ? (pt ? `AD e IL chegavam aos ${majorityThreshold} deputados em ${prob(right!.reach)} dos cenários` : `AD and IL would reach ${majorityThreshold} seats in ${prob(right!.reach)} of scenarios`)
      : reaches(left)
        ? (pt ? `PS e esquerda chegavam aos ${majorityThreshold} deputados em ${prob(left!.reach)} dos cenários` : `PS and the left would reach ${majorityThreshold} seats in ${prob(left!.reach)} of scenarios`)
        : (pt ? `Quem chega aos ${majorityThreshold} deputados` : `Who reaches ${majorityThreshold} seats`);
  const sumMax = Math.max(175, Math.ceil((Math.max(...majorities.map(m => m.hi90), ...otherSums.map(m => m.hi90)) + 5) / 25) * 25);
  const sumLabels = Array.from({ length: sumMax / 50 + 1 }, (_, i) => i * 50).filter(v => v <= sumMax);
  // Most seats, as "6 de cada 10 cenários".
  const ranked = rankedByMostSeats(mostSeats.outright, file.parties).slice(0, 3);
  const tenths = (p: number) => {
    const n = Math.round(p * 10);
    return n < 1 ? (pt ? 'menos de 1' : 'fewer than 1') : count(n);
  };
  const mostSeatsLine = pt
    ? `${cap(art(ranked[0]))} teria mais deputados do que qualquer outro partido em ${tenths(mostSeats.outright[ranked[0]])} de cada 10 cenários; ${ranked.slice(1).map(p => `${art(p)} em ${tenths(mostSeats.outright[p])}`).join(' e ')}.`
    : `${short(ranked[0])} would have the most seats in ${tenths(mostSeats.outright[ranked[0]])} of every 10 scenarios; ${ranked.slice(1).map(p => `${short(p)} in ${tenths(mostSeats.outright[p])}`).join(' and ')}.`;
  const parliamentLabel = parliament.map(p => `${partyName(p.party)} ${p.seats}`).join(', ');

  // The latest polls, and the newest one whose leader is not the average's.
  const latestPolls = [...file.polls].sort((a, b) => b.fieldwork_end.localeCompare(a.fieldwork_end)).slice(0, 5);
  const top3 = national.slice(0, 3).map(r => r.party);
  const leaderOf = (shares: Record<string, number>) => top3.reduce((best, p) => ((shares[p] ?? -1) > (shares[best] ?? -1) ? p : best), top3[0]);
  const dissent = latestPolls.find(p => leaderOf(p.shares) !== first.party && (p.shares[leaderOf(p.shares)] ?? 0) > (p.shares[first.party] ?? 0));
  const pollsHeading = dissent
    ? (pt
      ? `A ${pollsterDisplayName(dissent.pollster)} pôs ${art(leaderOf(dissent.shares))} à frente; a média ainda dá ${art(first.party)}`
      : `${pollsterDisplayName(dissent.pollster)} put ${short(leaderOf(dissent.shares))} ahead; the average still has ${short(first.party)}`)
    : (pt ? `As últimas sondagens dão ${art(first.party)} à frente, como a média` : `The latest polls have ${short(first.party)} ahead, as the average does`);

  // Districts, folded: how many have seats in play.
  const contested = Object.values(contestedSeats.districts).filter(d => d.ENSC > CONTESTED_ENSC).length;
  const close = closeLeads(districtForecast);
  const closeList = close.map(c => `${c.district} (${c.first.party} ${pct(c.first.share)}, ${c.second.party} ${pct(c.second.share)})`).join('; ');
  const closeLeadNote = close.length > 0
    ? (pt
      ? `A menos de 1 ponto percentual entre os dois primeiros: ${closeList}. A contagem dá estes distritos ao partido à frente, mas a estimativa é praticamente um empate.`
      : `Under 1 percentage point between the top two: ${closeList}. The count gives these districts to the party ahead, but the estimate is close to a tie.`)
    : undefined;

  const pollParties = ['AD', 'PS', 'CH', 'IL', 'L', 'CDU', 'BE', 'PAN'];
  const diag = run.diagnostics;
  const frame = { methodologyHref: '#metodo', methodologyLabel: pt ? 'Como fazemos esta estimativa' : 'How this estimate is made', locale };
  const modelSource = pt
    ? `Fonte: modelo estimador.pt, ${count(file.polls.length)} sondagens até ${shortDate(run.last_poll)}`
    : `Source: estimador.pt model, ${count(file.polls.length)} polls up to ${shortDate(run.last_poll)}`;
  const small = 'block whitespace-nowrap text-[12px] leading-4 text-graphite';
  const note = 'mt-2 text-[12.5px] leading-[17px] text-graphite';

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
          meta={<span>{pt ? `Última sondagem: ${shortDate(run.last_poll)} · estimativa de ${shortDate(run.as_of)}` : `Latest poll: ${shortDate(run.last_poll)} · estimate of ${shortDate(run.as_of)}`}</span>}
        />

        <div className="mx-auto max-w-7xl space-y-12 px-4 py-8">
          {/* 1. The scoreboard: votes and seats, each against 2025. */}
          <section id="votos" aria-labelledby="votos-titulo" className="max-w-2xl">
            <DataCard titleId="votos-titulo" title={pt ? `Votos e deputados, com a margem e a variação desde ${prevYear}` : `Votes and seats, with the margin and the change since ${prevYear}`} source={modelSource} {...frame}>
              <table className="w-full border-collapse text-[14px]">
                <caption className="sr-only">
                  {pt
                    ? `Percentagem de votos e deputados estimados por partido, com a margem de 90%, e a variação face a ${prevYear}.`
                    : `Estimated vote share and seats by party, with the 90% margin, and the change since ${prevYear}.`}
                </caption>
                <thead>
                  <tr className={headRow}>
                    <th scope="col" className={headCell}>{pt ? 'Partido' : 'Party'}</th>
                    <th scope="col" className={`${headCell} text-right`}>{pt ? 'Votos' : 'Votes'}</th>
                    <th scope="col" className={`${headCell} text-right`}>{pt ? `vs ${prevYear}` : `vs ${prevYear}`}</th>
                    <th scope="col" className={`${headCell} pl-3 text-right`}>{pt ? 'Deputados' : 'Seats'}</th>
                    <th scope="col" className="pb-1.5 text-right font-medium">{pt ? `vs ${prevYear}` : `vs ${prevYear}`}</th>
                  </tr>
                </thead>
                <tbody>
                  {national.map(r => {
                    const s = seatRow.get(r.party);
                    const dv = voteChange(r);
                    const ds = seatChange(r.party);
                    return (
                      <tr key={r.party} className="border-b border-grid align-top">
                        <PartyCell party={r.party} name={partyName(r.party)} />
                        <td className="py-1.5 pr-2 text-right">
                          <span className="fig text-[19px] leading-6">{pct(r.median)}</span>
                          <span className={small}>{whole(r.lo90)}–{whole(r.hi90)}</span>
                        </td>
                        <td className={`py-1.5 pr-2 pt-2 text-right tabular-nums ${dv?.clear ? 'font-semibold text-ink' : 'text-graphite'}`}>{dv?.text ?? '—'}</td>
                        <td className="py-1.5 pl-3 pr-2 text-right">
                          <span className="fig text-[19px] leading-6">{s ? count(s.median) : '—'}</span>
                          {s && <span className={small}>{s.lo90}–{s.hi90}</span>}
                        </td>
                        <td className={`py-1.5 pt-2 text-right tabular-nums ${ds?.clear ? 'font-semibold text-ink' : 'text-graphite'}`}>{ds?.text ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className={note}>
                {pt
                  ? `Por baixo, a margem: o resultado fica dentro dela em 9 de cada 10 cenários. É larga porque as sondagens podem falhar todas para o mesmo lado (em ${prevYear}, o Chega teve 22,8% e as sondagens davam-lhe 18,4%). A cinzento, as variações dentro da margem.`
                  : `Underneath, the margin: the result falls inside it in 9 of every 10 scenarios. It is wide because the polls can all miss the same way (in ${prevYear}, Chega won 22.8% where the polls had 18.4%). In grey, the changes inside the margin.`}
              </p>
              <p className={note.replace('mt-2', 'mt-1')}>
                {pt
                  ? `Votos: percentagem dos votos nos oito maiores partidos, um pouco acima dos números das sondagens; ${prevYear} sem a emigração.`
                  : `Votes: share of the votes for the eight largest parties, a little above the polls' own figures; ${prevYear} without the emigration vote.`}
              </p>
            </DataCard>
          </section>

          {/* 2. The trend, with the polls behind it. */}
          <section id="tendencia" aria-labelledby="tendencia-titulo">
            <h2 id="tendencia-titulo" className={sectionTitleClass}>{trendHeading}</h2>
            <DataCard
              title={pt ? `A média das sondagens desde ${prevMonth}` : `The poll average since ${prevMonth}`}
              subtitle={pt
                ? 'Cada ponto é uma sondagem; a linha é a média e a faixa, a sua margem de 90%, sem o erro comum a todas as sondagens.'
                : 'Each dot is a poll; the line is the average and the band its 90% margin, without the error all polls can share.'}
              source={modelSource}
              {...frame}
            >
              <PollingChart series={{ dates: trend.dates, parties: trend.parties }} voteShareLabel={t('forecast.voteShareLabel')} band={{ percent: Math.round(trend.interval * 100), hdi: false }} showNote={false} polls={pollDots} />
            </DataCard>
          </section>

          {/* 3. The parliament, and who can reach a majority without Chega. */}
          <section id="mandatos" aria-labelledby="mandatos-titulo" className="max-w-2xl">
            <h2 id="mandatos-titulo" className={sectionTitleClass}>{majorityHeading}</h2>
            <DataCard
              title={pt ? 'Os 230 deputados, da esquerda para a direita' : 'The 230 seats, left to right'}
              subtitle={pt ? 'Média de deputados de cada partido nos cenários.' : 'Each party’s average seats across the scenarios.'}
              source={pt ? `Fonte: modelo estimador.pt, ${count(nowcast.simulations)} cenários` : `Source: estimador.pt model, ${count(nowcast.simulations)} scenarios`}
              {...frame}
            >
              <ParliamentBar seats={parliament} majority={majorityThreshold} label={parliamentLabel} majorityLabel={pt ? `${majorityThreshold} para a maioria` : `${majorityThreshold} for a majority`} locale={locale} />
              <table className="mt-5 w-full border-collapse text-[14px]">
                <caption className="sr-only">{pt ? `Deputados de cada soma de partidos sem o Chega, com a margem de 90%, e a percentagem dos cenários em que chega aos ${majorityThreshold}.` : `Seats for each group of parties without Chega, with the 90% margin, and the share of scenarios reaching ${majorityThreshold}.`}</caption>
                <thead>
                  <tr className={headRow}>
                    <th scope="col" className={headCell}>{pt ? 'Sem o Chega' : 'Without Chega'}</th>
                    <th scope="col" className={`${headCell} text-right`}>{pt ? 'Deputados' : 'Seats'}</th>
                    <th scope="col" className="w-[34%] min-w-[84px] pb-1.5 pr-3 font-medium">
                      <span className="sr-only">{pt ? 'Margem e maioria' : 'Margin and majority'}</span>
                      <Ruler min={0} max={sumMax} minor={10} major={50} labels={sumLabels} />
                    </th>
                    <th scope="col" className="whitespace-nowrap pb-1.5 text-right font-medium">{pt ? `${majorityThreshold} ou +` : `${majorityThreshold}+`}</th>
                  </tr>
                </thead>
                <tbody>
                  {majorities.map(m => (
                    <tr key={m.parties.join('+')} className="border-b border-grid align-top">
                      <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                        {m.parties.length > 3
                          ? <>{pt ? 'Esquerda' : 'The left'}<span className={small}>{m.parties.join(', ')}</span></>
                          : m.parties.join(' + ')}
                      </th>
                      <td className="py-1.5 pr-2 text-right">
                        <span className="fig text-[19px] leading-6">{count(m.median)}</span>
                        <span className={small}>{m.lo90}–{m.hi90}</span>
                      </td>
                      <td className="py-1.5 pr-3 pt-3">
                        <IntervalBand lo={m.lo90} md={m.median} hi={m.hi90} min={0} max={sumMax} reference={majorityThreshold} />
                      </td>
                      <td className="whitespace-nowrap py-1.5 pt-2 text-right tabular-nums">{prob(m.reach)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={note}>{mostSeatsLine}</p>
              <Disclosure summary={pt ? 'Ver as somas com o Chega' : 'Show the sums with Chega'} className="mt-1">
                <table className="mt-1 w-full max-w-md border-collapse text-[14px]">
                  <caption className="sr-only">{pt ? `Somas de deputados com o Chega e a percentagem dos cenários em que chegam aos ${majorityThreshold}.` : `Seat sums with Chega and the share of scenarios reaching ${majorityThreshold}.`}</caption>
                  <tbody>
                    {otherSums.map(m => (
                      <tr key={m.parties.join('+')} className="border-b border-grid">
                        <th scope="row" className="py-1.5 pr-2 text-left font-normal">{m.parties.join(' + ')}</th>
                        <td className="py-1.5 pr-2 text-right tabular-nums">{count(m.median)} <span className="text-graphite">({m.lo90}–{m.hi90})</span></td>
                        <td className="py-1.5 text-right tabular-nums">{prob(m.reach)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-graphite">{t('forecast.coalitionArithmeticNote')}</p>
              </Disclosure>
            </DataCard>
          </section>

          {/* 4. The latest polls, as published. */}
          <section id="sondagens" aria-labelledby="sondagens-titulo" className="max-w-2xl">
            <h2 id="sondagens-titulo" className={sectionTitleClass}>{pollsHeading}</h2>
            <DataCard
              title={pt ? 'As últimas cinco sondagens' : 'The latest five polls'}
              subtitle={pt ? 'Como publicadas, sobre o total de cada sondagem. A média lê todas e desconta o desvio próprio de cada empresa.' : 'As published, out of each poll’s own total. The average reads them all, net of each firm’s own lean.'}
              source={pt ? 'Fonte: sondagens publicadas na comunicação social, compiladas pela Wikipedia' : 'Source: polls published in the press, as compiled by Wikipedia'}
              {...frame}
            >
              <table className="w-full border-collapse text-[14px]">
                <caption className="sr-only">{pt ? 'As cinco sondagens mais recentes: fim do trabalho de campo, empresa e percentagens dos três maiores partidos.' : 'The five most recent polls: fieldwork end, pollster and the three largest parties’ shares.'}</caption>
                <thead>
                  <tr className={headRow}>
                    <th scope="col" className={headCell}>{pt ? 'Até' : 'To'}</th>
                    <th scope="col" className={headCell}>{pt ? 'Empresa' : 'Pollster'}</th>
                    {top3.map(p => <th key={p} scope="col" className={`${headCell} text-right last:pr-0`}>{p}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {latestPolls.map(poll => {
                    const lead = leaderOf(poll.shares);
                    return (
                      <tr key={`${poll.pollster}-${poll.fieldwork_end}`} className="border-b border-grid">
                        <td className="whitespace-nowrap py-1.5 pr-2 text-graphite">{dayMonth(poll.fieldwork_end)}</td>
                        <th scope="row" className="py-1.5 pr-2 text-left font-normal">{pollsterDisplayName(poll.pollster)}</th>
                        {top3.map(p => (
                          <td key={p} className={`py-1.5 pr-2 text-right tabular-nums last:pr-0 ${p === lead ? 'font-semibold text-ink' : 'text-graphite'}`}>
                            {poll.shares[p] != null ? points(poll.shares[p]) : '—'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-2">
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
              </div>
            </DataCard>
          </section>

          {/* 5. Folded: the districts and the method. */}
          <section aria-label={pt ? 'Mais detalhe' : 'More detail'} className="border-t border-ink pt-2">
            <Disclosure
              summary={pt
                ? `Distrito a distrito: mandatos em disputa em ${count(contested)} dos ${count(districtForecast.length)}`
                : `District by district: seats in play in ${count(contested)} of ${count(districtForecast.length)}`}
            >
              <div className="mt-2">
                <DistrictSummary
                  districtData={districtForecast}
                  contestedData={contestedSeats}
                  closeLeadNote={closeLeadNote}
                  headingLevel={3}
                  seatChangeBaseline={pt
                    ? `Os +1 e −1 comparam cada partido com o seu próprio número de mandatos mais frequente nesse distrito, nas simulações, e não com ${prevYear}, e incluem os casos de dois mandatos ou mais. Como cada partido é comparado com o seu valor, os ganhos e as perdas de um distrito não têm de se compensar: quando um mandato se divide quase a meias entre dois partidos, cada um pode aparecer com +1 ou −1, conforme o seu valor mais frequente.`
                    : `The +1 and −1 compare each party with its own most frequent seat count in that district across the simulations, not with ${prevYear}, and include two seats or more. Because each party is compared with its own count, a district’s gains and losses need not balance: when a seat is split almost evenly between two parties, each can show +1 or −1, depending on its own most frequent count.`}
                />
              </div>
            </Disclosure>
            <div id="metodo">
              <Disclosure summary={pt ? 'Como fazemos esta estimativa' : 'How this estimate is made'}>
                <div className="mt-2 grid max-w-5xl gap-6 text-sm text-graphite md:grid-cols-3">
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
                        ? 'No dia da votação, as sondagens podem errar todas para o mesmo lado: em 2025 deram ao Chega 18,4% em média, e teve 22,8%. Juntamos um erro desse tamanho, medido nas seis legislativas de 2011 a 2025, e é por isso que as margens dos votos e dos deputados são largas. Nesse teste, a direção do erro não se repetiu de forma fiável de uma eleição para a seguinte, por isso não a corrigimos. A faixa da média no gráfico não inclui esse erro, e é mais estreita.'
                        : 'On election day, the polls can all miss the same way: in 2025 they gave Chega 18.4% on average, and it won 22.8%. We add an error of that size, measured over the six parliamentary elections from 2011 to 2025, which is why the vote and seat margins are wide. In that test the direction of the miss did not repeat reliably from one election to the next, so we do not correct for it. The average’s band in the chart leaves that error out, so it is narrower.'}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-base font-semibold text-ink">{pt ? 'Dos votos aos deputados' : 'From votes to seats'}</h3>
                    <p>
                      {pt
                        ? `Cada cenário parte do resultado de ${prevYear} em cada distrito e acompanha a variação nacional (metade proporcional, metade uniforme), com o ruído medido nas eleições anteriores, e aplica o método de Hondt. Os quatro deputados da emigração seguem os resultados de 2019, 2022, 2024 e 2025 nessas circunscrições, um quarto dos cenários cada. O JPP, que elegeu 1 deputado em ${prevYear}, não é estimado. Publicamos uma atualização só se a amostragem convergir em todos os ${count(diag.n_values)} valores do modelo (r-hat até 1,01, amostra efetiva de 400 ou mais). Esta: r-hat máximo ${formatElectionNumber(diag.max_rhat, locale, 3)}, amostra efetiva mínima ${count(Math.floor(Math.min(diag.min_ess_bulk, diag.min_ess_tail)))}.`
                        : `Each scenario starts from each district’s ${prevYear} result and follows the national change (half proportional, half uniform), with the noise measured in earlier elections, and applies the D’Hondt method. The four emigration seats follow the 2019, 2022, 2024 and 2025 results in those constituencies, a quarter of the scenarios each. JPP, which won 1 seat in ${prevYear}, is not modelled. We publish an update only if the sampler converged on all ${count(diag.n_values)} values in the model (r-hat up to 1.01, effective sample of 400 or more). This one: highest r-hat ${formatElectionNumber(diag.max_rhat, locale, 3)}, lowest effective sample ${count(Math.floor(Math.min(diag.min_ess_bulk, diag.min_ess_tail)))}.`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6">
                  <TextLink href="/eleicoes/metodologia" locale={locale}>{pt ? 'Como fizemos as previsões arquivadas' : 'How the archived forecasts were made'}</TextLink>
                  <TextLink href="/eleicoes/legislativas" locale={locale}>{pt ? 'A previsão de 2025 (arquivo)' : 'The 2025 forecast (archive)'}</TextLink>
                </div>
              </Disclosure>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
