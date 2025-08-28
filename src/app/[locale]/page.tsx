import { Button } from "@/components/ui/button";
import { 
  calculateBlocMajorityProbability, 
  calculatePartyMostSeatsProbability,
  formatProbabilityPercent 
} from "@/lib/utils/probability-calculator";
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";
import { partyColors, partyNames } from "@/lib/config/colors";
import { loadForecastData } from "@/lib/utils/data-loader";
import { ArrowRight, TrendingUp, BarChart3, Map, Users, Calendar } from "lucide-react";
import { PollingChart } from "@/components/charts/PollingChart";
import { CoalitionDotPlot } from "@/components/charts/CoalitionDotPlot";
import { SimpleCoalitionDots } from "@/components/charts/SimpleCoalitionDots";
import DistrictMapPreview from "@/components/charts/DistrictMapPreview";
import { Header } from "@/components/Header";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('meta.homepageTitle'),
    description: t('meta.defaultDescription'),
    openGraph: {
      title: t('meta.homepageTitle'),
      description: t('meta.defaultDescription'),
      url: `https://estimador.pt/${locale}`,
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}`,
    },
  };
}

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const { seatData, nationalTrends } = await loadForecastData();
  
  // Load district forecast data for map preview
  const districtForecast = await (async () => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'public', 'data', 'district_forecast.json');
      const fileContents = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContents);
    } catch (error) {
      console.error('Error loading district forecast:', error);
      return [];
    }
  })();
  
  // Calculate key probabilities
  const probLeftMajority = calculateBlocMajorityProbability(seatData, leftBlocParties, majorityThreshold);
  const probRightMajority = calculateBlocMajorityProbability(seatData, rightBlocParties, majorityThreshold);
  const probAdMostSeats = calculatePartyMostSeatsProbability(seatData, 'AD', ['PS', 'CH']);
  const probPsMostSeats = calculatePartyMostSeatsProbability(seatData, 'PS', ['AD', 'CH']);
  
  // Get latest trends and determine leader
  const latest = nationalTrends
    .filter(d => d.metric === 'vote_share_mean')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .reduce((acc, d) => {
      if (!acc[d.party]) acc[d.party] = d;
      return acc;
    }, {} as any);

  const parties = Object.values(latest).sort((a: any, b: any) => b.value - a.value);
  const leader = parties[0] as any;
  const secondPlace = parties[1] as any;
  const margin = ((leader.value - secondPlace.value) * 100).toFixed(1);

  const lastUpdate = new Date(leader.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  // Calculate seat projections for top parties
  const getPartySeats = (party: string) => {
    const partySeats = seatData.map(simulation => simulation[party] || 0).sort((a, b) => a - b);
    if (partySeats.length === 0) return { mean: 0, min: 0, max: 0 };
    return {
      mean: Math.round(partySeats.reduce((sum, s) => sum + s, 0) / partySeats.length),
      min: partySeats[Math.floor(partySeats.length * 0.1)],
      max: partySeats[Math.floor(partySeats.length * 0.9)]
    };
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* News-style Headline Section */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {t('homepage.leadingWith', {
                party: t(`parties.${leader.party}`),
                percentage: `${(leader.value * 100).toFixed(1)}%`
              })}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {t('homepage.forecastShows', {
                party: t(`parties.${leader.party}`),
                margin: margin,
                probability: formatProbabilityPercent(probAdMostSeats > probPsMostSeats ? probAdMostSeats : probPsMostSeats)
              })}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{t('common.basedOn')} {seatData.length.toLocaleString()} {t('common.simulations')}</span>
              <span>•</span>
              <Link href="/methodology" className="text-green-medium hover:text-green-dark">
                {t('common.methodology')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Numbers - BBC Style */}
      <section className="bg-green-pale border-b border-green-medium/30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('homepage.chanceWinningMostSeats')}</h2>
            {lastUpdate && (
              <div className="flex items-center gap-1 text-xs text-green-dark/70">
                <Calendar className="w-3 h-3" />
                <span>{t('common.updated')} {lastUpdate}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['AD', 'PS', 'CH'].map(party => {
              const prob = party === 'AD' ? probAdMostSeats : 
                          party === 'PS' ? probPsMostSeats : 
                          1 - probAdMostSeats - probPsMostSeats;
              const seats = getPartySeats(party);
              return (
                <div key={party} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: partyColors[party as keyof typeof partyColors] }}
                    />
                    <span className="font-medium text-gray-900">{t(`parties.${party}`)}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatProbabilityPercent(prob)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {seats.min}-{seats.max} {t('common.seats')}
                  </div>
                </div>
              );
            })}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 rounded bg-gray-400" />
                <span className="font-medium text-gray-900">{t('common.others')}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatProbabilityPercent(1 - probAdMostSeats - probPsMostSeats - (1 - probAdMostSeats - probPsMostSeats))}
              </div>
              <div className="text-sm text-gray-500">
                0-20 {t('common.seats')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Analysis Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          
          {/* Coalition Outcomes - Key Visual */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('forecast.coalitionSeats')}</h2>
            <p className="text-sm text-gray-600 mb-6">
              {t('forecast.coalitionDescription')}
            </p>
            <div className="w-full">
              <CoalitionDotPlot 
                data={seatData} 
                leftCoalitionLabel={t('forecast.leftCoalition')}
                rightCoalitionLabel={t('forecast.rightCoalition')}
                projectedSeatsLabel={t('forecast.projectedSeats')}
                majorityLabel={t('forecast.majority')}
                showingOutcomesLabel={t('forecast.showingOutcomes', { count: seatData.length })}
              />
            </div>
          </div>

          {/* Content Grid with Map and Polling */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Polling Trends */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('forecast.pollingTrends')}</h2>
              <PollingChart data={nationalTrends} />
            </div>

            {/* District Map */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('homepage.districtForecast')}</h2>
                <Link 
                  href="/map" 
                  className="inline-flex items-center text-xs font-medium text-green-dark hover:text-green-medium transition-colors"
                >
                  {t('common.viewFull')}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                {t('homepage.districtDescription')}
              </p>
              <div className="w-full h-80 md:h-96">
                <ErrorBoundary componentName="District Map Preview">
                  <DistrictMapPreview 
                    districtForecast={districtForecast}
                    className="rounded overflow-hidden h-full"
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>

          {/* Second row with current standings and coalition scenarios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current standings */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('homepage.currentStandings')}</h3>
              <div className="space-y-3">
                {parties.slice(0, 6).map((party: any, index) => (
                  <div key={party.party} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: partyColors[party.party as keyof typeof partyColors] }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {t(`parties.${party.party}`, { default: party.party })}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {(party.value * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coalition scenarios */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('homepage.coalitionScenarios')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{t('homepage.rightMajority')}</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatProbabilityPercent(probRightMajority)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{t('homepage.leftMajority')}</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatProbabilityPercent(probLeftMajority)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{t('homepage.hungParliament')}</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatProbabilityPercent(1 - probRightMajority - probLeftMajority)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation to detailed pages */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/forecast" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-dark bg-green-pale border border-green-medium rounded-md hover:bg-green-light/20 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('nav.forecast')}
            </Link>
            <Link 
              href="/map" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-green-pale transition-colors"
            >
              <Map className="w-4 h-4 mr-2" />
              Mapa Distrital
            </Link>
            <Link 
              href="/articles" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-green-pale transition-colors"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {t('nav.analysis')}
            </Link>
            <Link 
              href="/methodology" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-green-pale transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              {t('common.methodology')}
            </Link>
          </div>
        </div>
      </section>

      {/* About section */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('homepage.aboutForecast')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('homepage.aboutDescription')}
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{seatData.length.toLocaleString()} {t('common.simulations')}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>{t('common.basedOn')} {nationalTrends.length} polling data points</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}