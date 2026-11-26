import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { createPageMetadata } from '@/lib/metadata';
import { setRequestLocale } from '@/i18n/request-locale';
import { loadLegislativeNowcast, TWO_THIRDS } from '@/lib/utils/data-loader';
import { formatElectionLongDate, formatElectionShortDate, formatElectionNumber } from '@/lib/election-display';
import { emigrationTitle, firstTitle, majoritiesTitle, partyName } from '@/lib/nowcast-copy';
import { seatTotal } from '@/lib/nowcast-summary';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Disclosure } from '@/components/viz/Disclosure';
import { NowcastNav } from '@/components/nowcast/NowcastNav';
import { NowcastSource, ProbRow } from '@/components/nowcast/parts';

const PATH = '/eleicoes/proximas-legislativas/deputados';
const SMALL = ['IL', 'L', 'CDU', 'BE', 'PAN'];
/** The emigration seats each pattern gives (estimador-elections `seat_prediction.py`, the diaspora scenarios). */
const PATTERN_SEATS: Record<string, string> = { '2025': 'Chega 2, AD 2', '2024': 'PS 1, Chega 2, AD 1', '2022': 'PS 3, AD 1', '2019': 'PS 2, AD 2' };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: PATH,
    title: pt ? 'Próximas legislativas: quem elege mais deputados' : 'Next parliamentary election: who wins the most seats',
    description: pt
      ? 'As hipóteses de cada partido ficar em primeiro, de cada maioria e dos dois terços, e o que decidem os deputados da emigração.'
      : 'The chances of each party coming first, of each majority and of two-thirds, and what the emigration seats decide.',
  });
}

function Block({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-2xl border-t border-ink pt-3">
      <p className="text-[12.5px] text-graphite">{kicker}</p>
      <h2 className="mt-0.5 text-[21px] leading-[27px] text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default async function NowcastSeatsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const pt = locale === 'pt';
  const loc = pt ? 'pt' : 'en';
  const nowcast = await loadLegislativeNowcast();
  if (!nowcast.available) notFound();
  const { file, seats, majorities, otherSums, twoThirds, patterns, leaderChange, patternYears, votes } = nowcast;
  const { run, previous } = file;
  const longDate = (iso: string) => formatElectionLongDate(iso, locale);
  const shortDate = (iso: string) => formatElectionShortDate(iso, locale);
  const dec = (v: number) => formatElectionNumber(v, locale, 1);
  const firstPoll = [...file.polls].sort((a, b) => a.fieldwork_end.localeCompare(b.fieldwork_end))[0];
  const source = { polls: file.polls.length, from: longDate(firstPoll?.fieldwork_end ?? previous.date), to: longDate(run.last_poll), locale };
  const emigrationNote = pt ? `Os 4 deputados da emigração repartidos como em ${patternYears.join(' e ')}.` : `The 4 emigration seats shared out as in ${patternYears.join(' and ')}.`;
  const ranked = Object.entries(seats.first).filter(([, p]) => p > 0).sort((a, b) => b[1] - a[1]);
  const label = (parties: readonly string[]) => (parties.length > 3 ? (pt ? 'Esquerda' : 'The left') : parties.map(partyName).join(pt ? ' e ' : ' and '));
  const smallSeats = seatTotal(seats.seats, SMALL);
  const smallVotes = SMALL.reduce((sum, p) => sum + (votes[p] ?? 0), 0);
  const proportional = Math.round((smallVotes / 100) * 230);


  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <NowcastNav current="deputados" locale={locale} />
        <PageHero
          compact
          back={{ href: '/eleicoes/arquivo', label: t('nav.elections'), locale }}
          eyebrow={pt ? 'Próximas legislativas' : 'Next parliamentary election'}
          title={firstTitle(seats.first, loc)}
          meta={<span>{pt ? `Estimativa de ${shortDate(run.as_of)}, com sondagens até ${shortDate(run.last_poll)}` : `Estimate of ${shortDate(run.as_of)}, with polls up to ${shortDate(run.last_poll)}`}</span>}
        />
        <div className="mx-auto max-w-7xl space-y-10 px-4 py-6">
          <section aria-label={pt ? 'Quem elege mais deputados' : 'Who wins the most seats'} className="max-w-2xl">
            <table className="w-full border-collapse border-t border-ink">
              <caption className="sr-only">{pt ? 'Hipóteses de cada partido eleger mais deputados do que qualquer outro.' : 'Each party’s chance of winning more seats than any other.'}</caption>
              <tbody>
                {ranked.map(([p, v]) => <ProbRow key={p} label={partyName(p)} parties={[p]} p={v} locale={locale} />)}
                {seats.tie > 0 && <ProbRow label={pt ? 'Empate' : 'Tie'} p={seats.tie} locale={locale} />}
              </tbody>
            </table>
          </section>

          <Block kicker={pt ? 'Maioria absoluta, 116 deputados' : 'Absolute majority, 116 seats'} title={majoritiesTitle(majorities, loc)}>
            <table className="mt-3 w-full border-collapse border-t border-ink">
              <caption className="sr-only">{pt ? 'Hipóteses de cada soma de partidos chegar aos 116 e aos dois terços.' : 'The chance of each group of parties reaching 116 seats and two-thirds.'}</caption>
              <tbody>
                {[...majorities].reverse().map(m => <ProbRow key={m.parties.join('+')} label={label(m.parties)} parties={m.parties} p={m.reach} locale={locale} />)}
              </tbody>
            </table>
            <p className="mt-4 border-b border-ink pb-1 text-[12.5px] font-semibold text-ink">{pt ? `Dois terços, ${TWO_THIRDS} deputados` : `Two-thirds, ${TWO_THIRDS} seats`}</p>
            <table className="w-full border-collapse">
              <caption className="sr-only">{pt ? 'Hipóteses dos dois terços e de o Chega, sozinho, os travar.' : 'The chance of two-thirds, and of Chega blocking them on its own.'}</caption>
              <tbody>
                <ProbRow label={pt ? 'PS e AD' : 'PS and AD'} parties={['PS', 'AD']} p={twoThirds.centre.reach} locale={locale} />
                <ProbRow label={pt ? `Chega com ${230 - TWO_THIRDS + 1} ou mais: trava sozinho uma revisão da Constituição` : `Chega with ${230 - TWO_THIRDS + 1} or more: blocks a constitutional revision on its own`} parties={['CH']} p={twoThirds.blocking.reach} locale={locale} />
              </tbody>
            </table>
            <Disclosure summary={pt ? 'E com o Chega?' : 'And with Chega?'} className="mt-1">
              <table className="w-full border-collapse">
                <caption className="sr-only">{pt ? 'Hipóteses das somas com o Chega.' : 'The chances of the sums with Chega.'}</caption>
                <tbody>
                  {otherSums.map(m => <ProbRow key={m.parties.join('+')} label={pt ? `${label(m.parties)}, maioria` : `${label(m.parties)}, majority`} parties={m.parties} p={m.reach} locale={locale} />)}
                  <ProbRow label={pt ? 'AD, Chega e IL, dois terços' : 'AD, Chega and IL, two-thirds'} parties={['AD', 'CH', 'IL']} p={twoThirds.right.reach} locale={locale} />
                </tbody>
              </table>
            </Disclosure>
          </Block>

          <Block kicker={pt ? 'Emigração, 4 deputados' : 'Emigration, 4 seats'} title={emigrationTitle(leaderChange, patternYears, loc)}>
            <table className="mt-3 w-full border-collapse border-t border-ink text-[14.5px]">
              <caption className="sr-only">{pt ? 'Hipóteses de o PS e o Chega ficarem em primeiro, conforme a forma como se repartem os deputados da emigração.' : 'The chances of PS and Chega coming first, depending on how the emigration seats are shared out.'}</caption>
              <thead>
                <tr className="border-b border-grid text-[12.5px] text-graphite">
                  <th scope="col" className="py-1.5 text-left font-normal">{pt ? 'Se os 4 deputados se repartirem como em' : 'If the 4 seats are shared out as in'}</th>
                  <th scope="col" className="text-right font-normal">{pt ? 'PS em 1.º' : 'PS first'}</th>
                  <th scope="col" className="pl-3 text-right font-normal">{pt ? 'Chega em 1.º' : 'Chega first'}</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map(p => (
                  <tr key={p.pattern} className="border-b border-grid">
                    <th scope="row" className="py-1.5 text-left font-normal text-ink">{p.year} <span className="text-graphite">({PATTERN_SEATS[p.year] ?? ''})</span></th>
                    <td className="text-right tabular-nums text-ink">{Math.round(100 * (p.outright.PS ?? 0))}%</td>
                    <td className="pl-3 text-right tabular-nums text-ink">{Math.round(100 * (p.outright.CH ?? 0))}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[14px] leading-5 text-graphite">{pt ? `As contas da página usam ${patternYears.join(' e ')}, as eleições mais recentes.` : `The page’s figures use ${patternYears.join(' and ')}, the most recent elections.`}</p>
          </Block>

          <Block kicker={pt ? 'Votos e deputados' : 'Votes and seats'} title={pt ? `IL, Livre, CDU, BE e PAN elegeriam ${smallSeats} deputados; se os lugares fossem proporcionais aos votos, seriam ${proportional}` : `IL, Livre, CDU, BE and PAN would win ${smallSeats} seats; in proportion to their votes, they would have ${proportional}`}>
            <p className="mt-2 text-[15.5px] leading-6 text-ink">{pt ? `Os cinco somam ${dec(smallVotes)}% dos votos dos oito maiores partidos.` : `Together they have ${dec(smallVotes)}% of the votes of the eight largest parties.`}</p>
            <NowcastSource {...source} note={emigrationNote} />
          </Block>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
