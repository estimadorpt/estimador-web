import { createPageMetadata } from '@/lib/metadata';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import MapPageClient from '@/components/MapPageClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { partyColors } from '@/lib/config/colors';
import { Vote } from 'lucide-react';
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
      <PageHero
        icon={<Vote aria-hidden="true" className="w-4 h-4" />}
        eyebrow={t('forecast.mapEyebrow')}
        title={t('map.title')}
        lede={t('forecast.mapLede', {
          forecast: formatElectionLongDate(PARLIAMENTARY_2025_FORECAST_CUTOFF, locale),
          election: formatElectionLongDate(PARLIAMENTARY_2025.date, locale),
        })}
        back={{ href: '/eleicoes/legislativas', label: t('map.backToForecast'), locale }}
      />
      <div className="container mx-auto px-4 py-8">

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('map.portugalForecasts')}</CardTitle>
                </CardHeader>
                {/* Narrow padding on a phone so the map gets the column's width. */}
                <CardContent className="px-3 sm:px-6">
                  <MapPageClient districtForecast={districtForecast} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Legend */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('map.howToInterpret')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h2 className="text-base font-medium mb-2">{t('map.colors')}</h2>
                    <p className="text-sm text-stone-600">
                      {t('map.colorsDescription')}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-base font-medium mb-2">{t('map.interaction')}</h2>
                    <p className="text-sm text-stone-600">
                      {t('map.interactionDescription')}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-base font-medium mb-2">{t('map.islands')}</h2>
                    <p className="text-sm text-stone-600">
                      {t('map.islandsDescription')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Key Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('map.generalStats')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <MapStats districtForecast={districtForecast} t={t} locale={locale} />
                </CardContent>
              </Card>

              {/* District seat uncertainty is a better answer to "where could
                  the outcome change?" than land coloured by leading party —
                  link to it instead of inventing leader-change odds here. */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-stone-600 mb-3">
                    {locale === 'pt'
                      ? 'Esta cor mostra apenas a percentagem de votos prevista. Para saber onde os mandatos podiam realmente mudar de partido, vê a análise distrital com o índice ENSC.'
                      : 'This colour only shows the predicted vote share. For where seats could actually change party, see the district analysis with the ENSC index.'}
                  </p>
                  <Link
                    href="/eleicoes/legislativas#district-analysis"
                    locale={locale}
                    className="text-sm font-medium text-ink underline underline-offset-4 hover:text-ink-muted"
                  >
                    {locale === 'pt' ? 'Ver mandatos em disputa →' : 'See seats in play →'}
                  </Link>
                </CardContent>
              </Card>
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
    <div className="space-y-3">
      {/* Leading by predicted vote share, over all districts — the main
          forecast page separately shows likely winners among only the
          "stable allocation" subset, which is a smaller, different count
          (product-audit-2026-09-17-elections-economy.md, "8/4/1 vs 14/5/1"). */}
      <h2 className="text-base font-medium">{t('map.districtsLed')}</h2>
      <div className="space-y-2">
        {sortedParties.map(([party, count]) => (
          <div key={party} className="flex justify-between items-center">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <span aria-hidden="true" className="inline-block size-3 rounded-sm" style={{ backgroundColor: partyColors[party] ?? '#dadccf' }} />
              {party}
            </span>
            <span className="text-sm font-medium">{count}</span>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t">
        <p className="text-sm text-stone-600">
          {t('map.totalDistricts')} {districtForecast.length}
        </p>
        <p className="text-xs text-stone-500 mt-1">
          {locale === 'pt'
            ? `Todos os ${districtForecast.length} distritos, pelo partido com maior percentagem de votos prevista — não é o número de mandatos prováveis.`
            : `All ${districtForecast.length} districts, by the party with the highest predicted vote share — not the count of likely seats.`}
        </p>
      </div>
    </div>
  );
}
