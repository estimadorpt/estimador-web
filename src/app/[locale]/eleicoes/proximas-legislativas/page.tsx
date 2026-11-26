import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createPageMetadata } from '@/lib/metadata';
import { setRequestLocale } from '@/i18n/request-locale';
import { majorityThreshold } from '@/lib/config/blocs';
import { PARLIAMENTARY_2025_SEATS } from '@/lib/config/elections';
import { loadLegislativeNowcast, NOWCAST_HOUSE_ORDER } from '@/lib/utils/data-loader';
import { formatElectionLongDate, formatElectionShortDate, formatElectionNumber, pollsterDisplayName } from '@/lib/election-display';
import { governTitle, overviewLede, overviewTitle, partyName, pollsTitle } from '@/lib/nowcast-copy';
import { seatTotal } from '@/lib/nowcast-summary';
import { pollOutlet } from '@/lib/nowcast-polls';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Disclosure } from '@/components/viz/Disclosure';
import { TextLink } from '@/components/brand/TextLink';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { ParliamentBar } from '@/components/charts/ParliamentBar';
import { NowcastNav } from '@/components/nowcast/NowcastNav';
import { NowcastSource, SeatKey, SeatTable, SumRow } from '@/components/nowcast/parts';

const PATH = '/eleicoes/proximas-legislativas';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: PATH,
    title: pt ? 'Próximas legislativas: deputados, votos e sondagens' : 'Next parliamentary election: seats, votes and polls',
    description: pt
      ? 'Quantos deputados elegeria cada partido, com a margem de erro, quem pode governar e o que dizem as últimas sondagens. Atualizado a cada sondagem nova.'
      : 'How many seats each party would win, with the margin of error, who could govern and what the latest polls say. Updated with every new poll.',
  });
}

export default async function LegislativeNowcastPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const pt = locale === 'pt';
  const loc = pt ? 'pt' : 'en';
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

  const { file, seats, majorities, otherSums, votes, singleMajority, patternYears } = nowcast;
  const { run, previous } = file;
  const longDate = (iso: string) => formatElectionLongDate(iso, locale);
  const shortDate = (iso: string) => formatElectionShortDate(iso, locale);
  const count = (n: number) => formatElectionNumber(n, locale);
  const prevYear = previous.date.slice(0, 4);
  const prevMonth = new Date(`${previous.date}T12:00:00Z`).toLocaleDateString(pt ? 'pt-PT' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const firstPoll = [...file.polls].sort((a, b) => a.fieldwork_end.localeCompare(b.fieldwork_end))[0];

  // Every party, most seats first: the seats, the 90% range, 2025 and the vote share.
  const rows = [...seats.seats]
    .sort((a, b) => b.seats - a.seats)
    .map(s => ({ party: s.party, seats: s.seats, lo: seats.range[s.party].lo, hi: seats.range[s.party].hi, before: PARLIAMENTARY_2025_SEATS[s.party] ?? null, vote: votes[s.party] ?? 0 }));
  const title = overviewTitle(rows.filter(r => r.before != null).map(r => ({ ...r, before: r.before! })), seats.first, loc);
  const lede = overviewLede(rows.slice(0, 3), seats.first, singleMajority, prevMonth, loc);

  // The latest polls, as published.
  const latest = [...file.polls].sort((a, b) => b.fieldwork_end.localeCompare(a.fieldwork_end)).slice(0, 3);
  const pollParties = file.parties;
  const pollHeading = pollsTitle(latest.map(p => ({ name: pollsterDisplayName(p.pollster), shares: p.shares })), pollParties, loc);
  const dayMonth = (iso: string) => shortDate(iso).replace(/\s\d{4}$/, '');
  // "13 a 19 nov." in one month, "26 out. a 23 nov." across two ("13–19 Nov", "26 Oct–23 Nov").
  const fieldwork = (start: string | null, end: string) => {
    if (!start || start === end) return dayMonth(end);
    const sameMonth = start.slice(0, 7) === end.slice(0, 7);
    const from = sameMonth ? String(Number(start.slice(8, 10))) : dayMonth(start);
    return pt ? `${from} a ${dayMonth(end)}` : `${from}–${dayMonth(end)}`;
  };
  const pct = (v: number) => `${formatElectionNumber(v * 100, locale, Math.abs(v * 100 - Math.round(v * 100)) < 1e-6 ? 0 : 1)}%`;

  // Who can govern without Chega, and the sums with it (folded: a coalition with Chega is not on the table).
  const house = NOWCAST_HOUSE_ORDER.map(p => seats.seats.find(s => s.party === p)).filter((s): s is { party: string; seats: number } => s != null);
  const groupLabel = (parties: readonly string[]) => (parties.length > 3 ? parties.map(partyName).join(', ').replace(/, ([^,]+)$/, pt ? ' e $1' : ' and $1') : parties.map(partyName).join(pt ? ' e ' : ' and '));
  const emigrationNote = pt
    ? `Votos em percentagem dos oito maiores partidos. Os 4 deputados da emigração repartidos como em ${patternYears.join(' e ')}.`
    : `Votes as a share of the eight largest parties. The 4 emigration seats shared out as in ${patternYears.join(' and ')}.`;
  const source = { polls: file.polls.length, from: longDate(firstPoll?.fieldwork_end ?? previous.date), to: longDate(run.last_poll), locale };
  const diag = run.diagnostics;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <NowcastNav current="resumo" locale={locale} />
        <PageHero
          compact
          back={back}
          eyebrow={eyebrow}
          title={title}
          lede={lede}
          meta={<span>{pt ? `Estimativa de ${shortDate(run.as_of)} · sondagens até ${shortDate(run.last_poll)}` : `Estimate of ${shortDate(run.as_of)} · polls up to ${shortDate(run.last_poll)}`}</span>}
        />

        <div className="mx-auto max-w-7xl space-y-10 px-4 py-6">
          <section aria-label={pt ? 'Deputados e votos' : 'Seats and votes'} className="max-w-2xl">
            <SeatTable rows={rows} locale={locale} sinceYear={prevYear} />
            <SeatKey locale={locale} />
            <NowcastSource {...source} note={emigrationNote} />
          </section>

          <section aria-labelledby="sondagens-titulo" className="max-w-2xl border-t border-ink pt-3">
            <h2 id="sondagens-titulo" className="text-[21px] leading-[27px] text-ink">{pollHeading}</h2>
            <p className="mt-1 text-[13.5px] text-graphite">{pt ? 'Como publicadas, com outros partidos e indecisos' : 'As published, with other parties and undecided voters'}</p>
            <ul className="mt-2 border-t border-ink">
              {latest.map(poll => {
                const outlet = pollOutlet(poll.source_url);
                const top = pollParties.filter(p => poll.shares[p] != null).sort((a, b) => (poll.shares[b] ?? 0) - (poll.shares[a] ?? 0)).slice(0, 3);
                return (
                  <li key={`${poll.pollster}-${poll.fieldwork_end}`} className="border-b border-grid py-2.5">
                    <p className="text-[14.5px] text-ink">
                      <span className="font-semibold">{pollsterDisplayName(poll.pollster)}{outlet ? (pt ? ` para ${outlet.pt}` : ` for ${outlet.en}`) : ''}</span>
                      <span className="text-graphite"> · {fieldwork(poll.fieldwork_start, poll.fieldwork_end)}{poll.sample_size ? (pt ? `, ${count(poll.sample_size)} entrevistas` : `, ${count(poll.sample_size)} interviews`) : ''}</span>
                    </p>
                    <p className="mt-0.5 text-[14.5px] tabular-nums text-ink">{top.map(p => `${partyName(p)} ${pct(poll.shares[p])}`).join(' · ')}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3"><TextLink href={`${PATH}/sondagens`} locale={locale}>{pt ? `As ${count(file.polls.length)} sondagens e a evolução desde ${prevYear}` : `All ${count(file.polls.length)} polls and the trend since ${prevYear}`}</TextLink></p>
          </section>

          <section aria-labelledby="governar-titulo" className="max-w-2xl border-t border-ink pt-3">
            <h2 id="governar-titulo" className="text-[21px] leading-[27px] text-ink">{governTitle(majorities, loc)}</h2>
            <div className="mt-3">
              <p className="mb-2 text-[12.5px] text-graphite">{pt ? 'Os 230 deputados, da esquerda para a direita' : 'The 230 seats, left to right'}</p>
              <ParliamentBar
                seats={house}
                majority={majorityThreshold}
                label={house.map(s => `${partyName(s.party)} ${s.seats}`).join(', ')}
                majorityLabel={pt ? `${majorityThreshold} para a maioria` : `${majorityThreshold} for a majority`}
                locale={locale}
              />
              <table className="mt-4 w-full border-collapse border-t border-ink">
                <caption className="sr-only">{pt ? 'Deputados de cada soma de partidos sem o Chega, face aos 116 da maioria.' : 'Seats for each group of parties without Chega, against the 116 of a majority.'}</caption>
                <tbody>
                  {[...majorities].reverse().map(m => <SumRow key={m.parties.join('+')} parties={m.parties} label={groupLabel(m.parties)} total={seatTotal(seats.seats, m.parties)} locale={locale} />)}
                </tbody>
              </table>
              <Disclosure summary={pt ? 'E com o Chega?' : 'And with Chega?'} className="mt-1">
                <table className="w-full border-collapse">
                  <caption className="sr-only">{pt ? 'Somas de deputados com o Chega.' : 'Seat sums with Chega.'}</caption>
                  <tbody>
                    {otherSums.map(m => <SumRow key={m.parties.join('+')} parties={m.parties} label={groupLabel(m.parties)} total={seatTotal(seats.seats, m.parties)} locale={locale} />)}
                  </tbody>
                </table>
              </Disclosure>
            </div>
          </section>

          <section id="metodo" aria-label={pt ? 'Como fazemos' : 'How we do it'} className="border-t border-ink pt-2">
            <Disclosure summary={pt ? 'Como fazemos esta estimativa' : 'How this estimate is made'}>
              <div className="mt-2 grid max-w-5xl gap-6 text-sm text-graphite md:grid-cols-3">
                <div>
                  <h3 className="mb-2 text-base font-semibold text-ink">{pt ? 'Todas as sondagens, semana a semana' : 'Every poll, week by week'}</h3>
                  <p>
                    {pt
                      ? 'Cada partido segue um passeio aleatório semana a semana: a estimativa de cada semana parte da anterior e move-se com as sondagens novas. Cada empresa tem o seu desvio habitual, estimado em todas as sondagens desde 2009, e lemos cada sondagem descontado esse desvio. O rastreio da Pitagórica junta quatro semanas de entrevistas: contamos só as novas de cada edição.'
                      : 'Each party follows a weekly random walk: each week’s estimate starts from the one before and moves with the new polls. Each firm has its own usual lean, estimated from every poll since 2009, and each poll is read net of it. Pitagórica’s tracker pools four weeks of interviews: we count only each release’s new ones.'}
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-ink">{pt ? 'O erro que todas as sondagens partilham' : 'The error all polls share'}</h3>
                  <p>
                    {pt
                      ? 'No dia da votação, as sondagens podem errar todas para o mesmo lado: em 2025 deram ao Chega 18,4% em média, e teve 22,8%. Juntamos um erro desse tamanho, medido nas legislativas de 2011 a 2025; é por isso que as margens são largas. A direção do erro não se repetiu de uma eleição para a seguinte, por isso não a corrigimos.'
                      : 'On election day the polls can all miss the same way: in 2025 they gave Chega 18.4% on average, and it won 22.8%. We add an error of that size, measured over the parliamentary elections from 2011 to 2025, which is why the margins are wide. Its direction did not repeat from one election to the next, so we do not correct for it.'}
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-ink">{pt ? 'Dos votos aos deputados' : 'From votes to seats'}</h3>
                  <p>
                    {pt
                      ? `Cada cenário parte do resultado de ${prevYear} em cada círculo, segue a variação nacional e aplica o método de Hondt. Os 4 deputados da emigração repartem-se como em ${patternYears.join(' ou como em ')}, metade dos cenários cada. O JPP, que elegeu 1 deputado em ${prevYear}, não é estimado. Só publicamos quando a amostragem converge em todos os ${count(diag.n_values)} valores do modelo (r-hat até 1,01, amostra efetiva de 400 ou mais); nesta, o r-hat máximo foi ${formatElectionNumber(diag.max_rhat, locale, 3)}.`
                      : `Each scenario starts from each district’s ${prevYear} result, follows the national change and applies the D’Hondt method. The 4 emigration seats are shared out as in ${patternYears.join(' or as in ')}, half the scenarios each. JPP, which won 1 seat in ${prevYear}, is not modelled. We publish only when the sampler converges on all ${count(diag.n_values)} values in the model (r-hat up to 1.01, effective sample of 400 or more); this run’s highest r-hat was ${formatElectionNumber(diag.max_rhat, locale, 3)}.`}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6">
                <TextLink href="/eleicoes/metodologia" locale={locale}>{pt ? 'Como fizemos as previsões arquivadas' : 'How the archived forecasts were made'}</TextLink>
                <TextLink href="/eleicoes/legislativas" locale={locale}>{pt ? 'A previsão de 2025 (arquivo)' : 'The 2025 forecast (archive)'}</TextLink>
              </div>
            </Disclosure>
          </section>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
