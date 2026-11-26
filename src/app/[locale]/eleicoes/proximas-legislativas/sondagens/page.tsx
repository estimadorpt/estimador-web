import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { createPageMetadata } from '@/lib/metadata';
import { setRequestLocale } from '@/i18n/request-locale';
import { loadLegislativeNowcast, NOWCAST_GAP_PARTIES } from '@/lib/utils/data-loader';
import { formatElectionDate, formatElectionLongDate, formatElectionShortDate, formatElectionNumber, pollsterDisplayName } from '@/lib/election-display';
import { onModelBase } from '@/lib/legislative-nowcast';
import { Art, art, gapTitle, partyName, trendTitle } from '@/lib/nowcast-copy';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { DataCard } from '@/components/viz/DataCard';
import { ChartTable } from '@/components/viz/ChartTable';
import { PollingChart } from '@/components/charts/PollingChart';
import { NowcastNav } from '@/components/nowcast/NowcastNav';
import { NowcastSource } from '@/components/nowcast/parts';

const PATH = '/eleicoes/proximas-legislativas/sondagens';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: PATH,
    title: pt ? 'Próximas legislativas: as sondagens desde 2025' : 'Next parliamentary election: the polls since 2025',
    description: pt
      ? 'Todas as sondagens desde as legislativas de 2025, a evolução de cada partido e quanto cada empresa se afasta da estimativa.'
      : 'Every poll since the 2025 parliamentary election, how each party has moved, and how far each pollster sits from the estimate.',
  });
}

export default async function NowcastPollsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const pt = locale === 'pt';
  const loc = pt ? 'pt' : 'en';
  const nowcast = await loadLegislativeNowcast();
  if (!nowcast.available) notFound();
  const { file, votes, gaps } = nowcast;
  const { run, previous, trend } = file;
  const longDate = (iso: string) => formatElectionLongDate(iso, locale);
  const shortDate = (iso: string) => formatElectionShortDate(iso, locale);
  const count = (n: number) => formatElectionNumber(n, locale);
  const dec = (v: number) => formatElectionNumber(v, locale, 1);
  const prevYear = previous.date.slice(0, 4);
  const firstPoll = [...file.polls].sort((a, b) => a.fieldwork_end.localeCompare(b.fieldwork_end))[0];

  // Since the last election: each party's estimate against its 2025 share, both among the eight parties.
  const changes = file.national.map(r => ({ party: r.party, change: (votes[r.party] ?? 0) - 100 * (previous.shares[r.party] ?? 0) }));
  const big3 = file.national.slice(0, 3).map(r => r.party);
  const listOf = (items: string[], and: string) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}`);
  const lede = pt
    ? `${listOf(big3.map((p, i) => `${i === 0 ? `${Art(p)} passou` : art(p)} de ${dec(100 * (previous.shares[p] ?? 0))}% para ${dec(votes[p] ?? 0)}%`), 'e')}, contando só os oito maiores partidos e, em ${prevYear}, sem o voto da emigração. Cada ponto é uma sondagem.`
    : `${listOf(big3.map(p => `${partyName(p)} ${p === big3[0] ? 'went ' : ''}from ${dec(100 * (previous.shares[p] ?? 0))}% to ${dec(votes[p] ?? 0)}%`), 'and')}, counting only the eight largest parties and, in ${prevYear}, without the emigration vote. Each dot is a poll.`;

  const dots = file.polls.flatMap(poll =>
    Object.entries(onModelBase(poll.shares, file.parties)).filter(([, share]) => share > 0).map(([party, share]) => ({ date: poll.fieldwork_end, party, share })),
  );
  const gapRows = gaps.map(g => ({ name: pollsterDisplayName(g.pollster), polls: g.polls, gap: g.gap, above: g.above, tracking: g.tracking }));
  const signed = (v: number) => (!Number.isFinite(v) ? '—' : `${v > 0.05 ? '+' : v < -0.05 ? '−' : ''}${dec(Math.abs(v))}`);
  const source = { polls: file.polls.length, from: longDate(firstPoll?.fieldwork_end ?? previous.date), to: longDate(run.last_poll), locale };
  const listParties = ['AD', 'PS', 'CH', 'IL', 'L', 'CDU', 'BE', 'PAN'];

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <NowcastNav current="sondagens" locale={locale} />
        <PageHero
          compact
          back={{ href: '/eleicoes/arquivo', label: t('nav.elections'), locale }}
          eyebrow={pt ? 'Próximas legislativas' : 'Next parliamentary election'}
          title={trendTitle(changes, prevYear, loc)}
          lede={lede}
          meta={<span>{pt ? `Estimativa de ${shortDate(run.as_of)}, com sondagens até ${shortDate(run.last_poll)}` : `Estimate of ${shortDate(run.as_of)}, with polls up to ${shortDate(run.last_poll)}`}</span>}
        />
        <div className="mx-auto max-w-7xl space-y-10 px-4 py-6">
          <section aria-label={pt ? 'A evolução' : 'The trend'} className="max-w-3xl">
            <DataCard title={pt ? `Cada partido desde as eleições de ${prevYear}` : `Each party since the ${prevYear} election`} subtitle={pt ? 'A linha é a estimativa e a faixa a sua margem, sem o erro que todas as sondagens partilham.' : 'The line is the estimate and the band its margin, without the error all polls share.'}>
              <PollingChart series={{ dates: trend.dates, parties: trend.parties }} voteShareLabel={pt ? '% dos votos' : '% of the vote'} band={{ percent: Math.round(trend.interval * 100), hdi: false }} showNote={false} polls={dots} endLabels="party" />
            </DataCard>
          </section>

          <section aria-labelledby="empresas-titulo" className="max-w-3xl border-t border-ink pt-3">
            <p className="text-[12.5px] text-graphite">{pt ? 'As empresas de sondagens' : 'The pollsters'}</p>
            <h2 id="empresas-titulo" className="mt-0.5 text-[21px] leading-[27px] text-ink">{gapTitle(gapRows, loc)}</h2>
            <table className="mt-3 w-full border-collapse border-t border-ink text-[14.5px]">
              <caption className="sr-only">{pt ? 'Diferença média, em pontos, entre as sondagens de cada empresa e a estimativa da mesma semana.' : 'Mean difference, in points, between each pollster’s polls and the estimate of the same week.'}</caption>
              <thead>
                <tr className="border-b border-grid text-[12.5px] text-graphite">
                  <th scope="col" className="py-1.5 text-left font-normal">{pt ? 'Empresa (sondagens)' : 'Pollster (polls)'}</th>
                  {NOWCAST_GAP_PARTIES.map(p => <th key={p} scope="col" className="pl-3 text-right font-normal">{partyName(p)}</th>)}
                </tr>
              </thead>
              <tbody>
                {gapRows.map(g => (
                  <tr key={`${g.name}-${g.tracking}`} className="border-b border-grid">
                    <th scope="row" className="py-1.5 text-left font-normal text-ink">{g.name}{!g.tracking && gapRows.some(o => o.name === g.name && o.tracking) ? (pt ? ', avulsas' : ', one-off') : ''} <span className="text-graphite">({g.tracking ? (pt ? `tracking, ${count(g.polls)} vagas` : `tracker, ${count(g.polls)} waves`) : count(g.polls)})</span></th>
                    {NOWCAST_GAP_PARTIES.map(p => <td key={p} className="py-1.5 pl-3 text-right tabular-nums text-ink">{signed(g.gap[p])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[13.5px] leading-5 text-graphite">{pt ? 'Diferença média, em pontos, entre cada sondagem e a estimativa da mesma semana, nos oito maiores partidos.' : 'Mean difference, in points, between each poll and the estimate of the same week, among the eight largest parties.'}</p>
            <div className="mt-3">
              <ChartTable
                caption={pt ? 'Sondagens desde as últimas legislativas' : 'Polls since the last parliamentary election'}
                summaryLabel={pt ? `Ver as ${count(file.polls.length)} sondagens, como publicadas` : `Show the ${count(file.polls.length)} polls, as published`}
                columns={[pt ? 'Empresa' : 'Pollster', pt ? 'Fim do trabalho de campo' : 'Fieldwork end', pt ? 'Amostra' : 'Sample', ...listParties.map(partyName)]}
                align={['left', 'left', 'right', ...listParties.map(() => 'right' as const)]}
                rows={[...file.polls].sort((a, b) => b.fieldwork_end.localeCompare(a.fieldwork_end)).map(poll => [
                  pollsterDisplayName(poll.pollster),
                  formatElectionDate(poll.fieldwork_end, locale),
                  poll.sample_size != null ? count(poll.sample_size) : '—',
                  ...listParties.map(p => (poll.shares[p] ? dec(poll.shares[p] * 100) : '—')),
                ])}
              />
            </div>
            <NowcastSource {...source} />
          </section>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
