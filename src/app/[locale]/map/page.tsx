import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/Header';
import MapPageClient from '@/components/MapPageClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import fs from 'fs';
import path from 'path';

interface DistrictForecast {
  district_name: string;
  winning_party: string;
  probs: Record<string, number>;
}

async function getDistrictForecast(): Promise<DistrictForecast[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'district_forecast.json');
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
  const t = await getTranslations({ locale });
  
  return {
    title: `${t('map.title')} - estimador.pt`,
    description: t('map.selectDistrict'),
  };
}

export default async function MapPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const districtForecast = await getDistrictForecast();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {t('map.subtitle')}
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl">
              {t('map.selectDistrict')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('map.portugalForecasts')}</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <h4 className="font-medium mb-2">{t('map.colors')}</h4>
                    <p className="text-sm text-slate-600">
                      {t('map.colorsDescription')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">{t('map.interaction')}</h4>
                    <p className="text-sm text-slate-600">
                      {t('map.interactionDescription')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">{t('map.islands')}</h4>
                    <p className="text-sm text-slate-600">
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
                  <MapStats districtForecast={districtForecast} t={t} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Component for map statistics
function MapStats({ districtForecast, t }: { districtForecast: DistrictForecast[], t: any }) {
  const partyWins = districtForecast.reduce((acc, district) => {
    acc[district.winning_party] = (acc[district.winning_party] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedParties = Object.entries(partyWins)
    .sort(([,a], [,b]) => b - a);

  return (
    <div className="space-y-3">
      <h4 className="font-medium">{t('map.districtsLed')}</h4>
      <div className="space-y-2">
        {sortedParties.map(([party, count]) => (
          <div key={party} className="flex justify-between items-center">
            <Badge variant="outline">{party}</Badge>
            <span className="text-sm font-medium">{count}</span>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t">
        <p className="text-sm text-slate-600">
          {t('map.totalDistricts')} {districtForecast.length}
        </p>
      </div>
    </div>
  );
}