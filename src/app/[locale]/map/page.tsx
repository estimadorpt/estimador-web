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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mapa Distrital - estimador.pt',
    description: 'Mapa interativo com previsões eleitorais por distrito português',
  };
}

export default async function MapPage() {
  const t = await getTranslations();
  const districtForecast = await getDistrictForecast();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Mapa Distrital Interativo
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl">
              Explore as previsões eleitorais por distrito. Clique em qualquer distrito 
              para ver a percentagem de votos prevista para cada partido.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Portugal - Previsões por Distrito</CardTitle>
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
                  <CardTitle>Como Interpretar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Cores</h4>
                    <p className="text-sm text-slate-600">
                      Cada distrito está colorido com a cor do partido com maior 
                      percentagem de votos prevista nessa região.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Interação</h4>
                    <p className="text-sm text-slate-600">
                      Passe o rato sobre um distrito para ver o partido líder e percentagem, 
                      ou clique para ver todos os detalhes.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Ilhas</h4>
                    <p className="text-sm text-slate-600">
                      Os Açores e Madeira aparecem como múltiplas ilhas, mas as 
                      previsões são agregadas por região.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Key Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                  <MapStats districtForecast={districtForecast} />
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
function MapStats({ districtForecast }: { districtForecast: DistrictForecast[] }) {
  const partyWins = districtForecast.reduce((acc, district) => {
    acc[district.winning_party] = (acc[district.winning_party] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedParties = Object.entries(partyWins)
    .sort(([,a], [,b]) => b - a);

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Distritos Liderados:</h4>
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
          Total de distritos: {districtForecast.length}
        </p>
      </div>
    </div>
  );
}