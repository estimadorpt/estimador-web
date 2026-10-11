import { createPageMetadata } from '@/lib/metadata';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import MapPageClient from '@/components/MapPageClient';
import { partyColors } from '@/lib/config/colors';
import { Link } from '@/i18n/routing';
import { PARLIAMENTARY_2025, PARLIAMENTARY_2025_FORECAST_CUTOFF } from '@/lib/config/elections';
import { formatElectionLongDate } from '@/lib/election-display';
import fs from 'fs';
import path from 'path';
import { setRequestLocale } from '@/i18n/request-locale';

interface DistrictForecast {
  district_name: string;
  winning_party: string;
  probs: Record<string, number>;
}

async function getDistrictForecast(): Promise<DistrictForecast[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'elections', 'parliamentary-2025', 'district_forecast.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error loading district forecast:', error);
    return [];
  }
}

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
    path: `/eleicoes/legislativas/mapa`,
    title: t('meta.parliamentaryMapTitle'),
    description: t('forecast.mapLede', {
      forecast: formatElectionLongDate(PARLIAMENTARY_2025_FORECAST_CUTOFF, locale),
      election: formatElectionLongDate(PARLIAMENTARY_2025.date, locale),
    }),
  });
}

export default async function MapPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const districtForecast = await getDistrictForecast();

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      {/* The map reads one election's district forecast, so it opens as a
          page of that election, not as a general elections surface. */}
      <main id="main-content" tabIndex={-1}>
      {/* Compact, like /legislativas it hangs from: the title keeps its size and place (UXD3-09). */}
      <PageHero
        compact
        eyebrow={t('forecast.mapEyebrow')}
        title={t('map.title')}
        lede={t('forecast.mapLede', {
          forecast: formatElectionLongDate(PARLIAMENTARY_2025_FORECAST_CUTOFF, locale),
          election: formatElectionLongDate(PARLIAMENTARY_2025.date, locale),
        })}
        back={{ href: '/eleicoes/legislativas', label: t('map.backToForecast'), locale }}
      />
      {/* The shared container (CONTAINER_CLASS), so the body lines up with the
          header and the hero at every width. Instruments under ink rules, no cards. */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-10">
            {/* Map */}
            <section aria-labelledby="map-title" className="min-w-0 lg:col-span-2">
              <h2 id="map-title" className="border-b border-ink pb-2 text-[19px] leading-6 text-ink">{t('map.portugalForecasts')}</h2>
              <div className="mt-4">
                <MapPageClient districtForecast={districtForecast} />
              </div>
            </section>

            {/* Sidebar */}
            <div className="min-w-0 space-y-10">
              <section aria-labelledby="map-reading">
                <h2 id="map-reading" className="border-b border-ink pb-2 text-[19px] leading-6 text-ink">{t('map.howToInterpret')}</h2>
                <dl className="mt-1 text-sm">
                  {(['colors', 'interaction', 'islands'] as const).map(key => (
                    <div key={key} className="border-b border-grid py-3">
                      <dt className="font-semibold text-ink">{t(`map.${key}`)}</dt>
                      <dd className="mt-1 text-graphite">{t(`map.${key}Description`)}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section aria-labelledby="map-stats">
                <h2 id="map-stats" className="border-b border-ink pb-2 text-[19px] leading-6 text-ink">{t('map.generalStats')}</h2>
                <MapStats districtForecast={districtForecast} t={t} locale={locale} />
              </section>

              {/* District seat uncertainty is a better answer to "where could
                  the outcome change?" than land coloured by leading party —
                  link to it instead of inventing leader-change odds here. */}
              <div className="border-t border-rule pt-3">
                <p className="text-sm text-graphite mb-1">
                  {locale === 'pt'
                    ? 'Esta cor mostra apenas a percentagem de votos prevista. Para saber onde os mandatos podiam realmente mudar de partido, vê a análise distrital com o índice ENSC.'
                    : 'This colour only shows the predicted vote share. For where seats could actually change party, see the district analysis with the ENSC index.'}
                </p>
                <Link
                  href="/eleicoes/legislativas#district-analysis"
                  locale={locale}
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4 hover:decoration-2"
                >
                  {locale === 'pt' ? 'Ver mandatos em disputa' : 'See seats in play'}<span aria-hidden="true"> →</span>
                </Link>
              </div>
            </div>
          </div>
      </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

// Component for map statistics
function MapStats({ districtForecast, t, locale }: { districtForecast: DistrictForecast[]; t: (key: string) => string; locale: string }) {
  const partyWins = districtForecast.reduce((acc, district) => {
    acc[district.winning_party] = (acc[district.winning_party] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedParties = Object.entries(partyWins)
    .sort(([,a], [,b]) => b - a);

  return (
    <div>
      {/* Leading by predicted vote share, over all districts — the main
          forecast page separately shows likely winners among only the
          "stable allocation" subset, which is a smaller, different count
          (product-audit-2026-09-17-elections-economy.md, "8/4/1 vs 14/5/1"). */}
      <p className="mt-2 text-[13px] text-graphite">{t('map.districtsLed')}</p>
      <ul className="mt-1">
        {sortedParties.map(([party, count]) => (
          <li key={party} className="flex items-center justify-between border-b border-grid py-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
              <span aria-hidden="true" className="inline-block size-3" style={{ backgroundColor: partyColors[party] ?? '#bdbdbd' }} />
              {party}
            </span>
            <span className="text-sm font-semibold tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-graphite">
        {t('map.totalDistricts')} <span className="font-semibold text-ink tabular-nums">{districtForecast.length}</span>
      </p>
      <p className="text-xs text-graphite mt-1">
        {locale === 'pt'
          ? `Os ${districtForecast.length} distritos e regiões autónomas, pelo partido com maior percentagem de votos prevista. Não é o número de mandatos prováveis.`
          : `All ${districtForecast.length} districts and autonomous regions, by the party with the highest predicted vote share. It is not the count of likely seats.`}
      </p>
    </div>
  );
}
