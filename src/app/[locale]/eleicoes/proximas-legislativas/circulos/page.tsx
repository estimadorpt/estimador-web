import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { createPageMetadata } from '@/lib/metadata';
import { setRequestLocale } from '@/i18n/request-locale';
import { loadLegislativeNowcast } from '@/lib/utils/data-loader';
import { closeLeads, CONTESTED_ENSC } from '@/lib/election-aggregates';
import { formatElectionLongDate, formatElectionShortDate, formatElectionNumber, formatElectionPercent } from '@/lib/election-display';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { DistrictSummary } from '@/components/charts/DistrictSummary';
import { NowcastNav } from '@/components/nowcast/NowcastNav';
import { NowcastSource } from '@/components/nowcast/parts';

const PATH = '/eleicoes/proximas-legislativas/circulos';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  return createPageMetadata({
    locale,
    path: PATH,
    title: pt ? 'Próximas legislativas: círculo a círculo' : 'Next parliamentary election: district by district',
    description: pt
      ? 'Quem lidera em cada um dos 20 círculos do território e onde há deputados em disputa.'
      : 'Who leads in each of the 20 home districts, and where seats are in play.',
  });
}

export default async function NowcastDistrictsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const pt = locale === 'pt';
  const nowcast = await loadLegislativeNowcast();
  if (!nowcast.available) notFound();
  const { file, districtForecast, contestedSeats } = nowcast;
  const { run, previous } = file;
  const longDate = (iso: string) => formatElectionLongDate(iso, locale);
  const shortDate = (iso: string) => formatElectionShortDate(iso, locale);
  const count = (n: number) => formatElectionNumber(n, locale);
  const pct = (v: number) => formatElectionPercent(v, locale, 1);
  const prevYear = previous.date.slice(0, 4);
  const firstPoll = [...file.polls].sort((a, b) => a.fieldwork_end.localeCompare(b.fieldwork_end))[0];
  const contested = Object.values(contestedSeats.districts).filter(d => d.ENSC > CONTESTED_ENSC).length;
  const close = closeLeads(districtForecast);
  const closeList = close.map(c => `${c.district} (${c.first.party} ${pct(c.first.share)}, ${c.second.party} ${pct(c.second.share)})`).join('; ');
  const closeLeadNote = close.length > 0
    ? (pt
      ? `A menos de 1 ponto entre os dois primeiros: ${closeList}. A contagem dá estes círculos ao partido à frente, mas é praticamente um empate.`
      : `Under 1 point between the top two: ${closeList}. The count gives these districts to the party ahead, but it is close to a tie.`)
    : undefined;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <NowcastNav current="circulos" locale={locale} />
        <PageHero
          compact
          back={{ href: '/eleicoes/arquivo', label: t('nav.elections'), locale }}
          eyebrow={pt ? 'Próximas legislativas' : 'Next parliamentary election'}
          title={pt ? `Há deputados em disputa em ${count(contested)} dos ${count(districtForecast.length)} círculos do território` : `Seats are in play in ${count(contested)} of the ${count(districtForecast.length)} home districts`}
          meta={<span>{pt ? `Estimativa de ${shortDate(run.as_of)}, com sondagens até ${shortDate(run.last_poll)}` : `Estimate of ${shortDate(run.as_of)}, with polls up to ${shortDate(run.last_poll)}`}</span>}
        />
        <div className="mx-auto max-w-7xl px-4 py-6">
          <DistrictSummary
            districtData={districtForecast}
            contestedData={contestedSeats}
            closeLeadNote={closeLeadNote}
            headingLevel={3}
            seatChangeBaseline={pt
              ? `Os +1 e −1 comparam cada partido com o seu número de deputados mais frequente nesse círculo, e não com ${prevYear}.`
              : `The +1 and −1 compare each party with its own most frequent seat count in that district, not with ${prevYear}.`}
          />
          <NowcastSource polls={file.polls.length} from={longDate(firstPoll?.fieldwork_end ?? previous.date)} to={longDate(run.last_poll)} locale={locale} note={pt ? 'Sem os 4 deputados da emigração.' : 'Without the 4 emigration seats.'} />
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
