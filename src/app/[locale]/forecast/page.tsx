import { 
  calculateBlocMajorityProbability, 
  calculatePartyMostSeatsProbability,
  formatProbabilityPercent 
} from "@/lib/utils/probability-calculator";
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";
import { partyColors, partyNames } from "@/lib/config/colors";
import { loadForecastData } from "@/lib/utils/data-loader";
import { ArrowLeft, Calendar, BarChart3, TrendingUp, Users, Map } from "lucide-react";
import { PollingChart } from "@/components/charts/PollingChart";
import { SeatChart } from "@/components/charts/SeatChart";
import { DistrictSummary } from "@/components/charts/DistrictSummary";
import { HouseEffects } from "@/components/charts/HouseEffects";
import { CoalitionDotPlot } from "@/components/charts/CoalitionDotPlot";
import { Header } from "@/components/Header";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import { ElectionAwareContent } from '@/components/ElectionAwareContent';
import { ElectionSummaryStats } from '@/components/ElectionSummaryStats';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('meta.forecastTitle'),
    description: t('meta.defaultDescription'),
    openGraph: {
      title: t('meta.forecastTitle'),
      description: t('meta.defaultDescription'),
      url: `https://estimador.pt/${locale}/forecast`,
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/forecast`,
    },
  };
}

export default async function ForecastPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const { seatData, nationalTrends, districtForecast, contestedSeats, houseEffects } = await loadForecastData();
  
  // Calculate probabilities
  const probLeftMajority = calculateBlocMajorityProbability(seatData, leftBlocParties, majorityThreshold);
  const probRightMajority = calculateBlocMajorityProbability(seatData, rightBlocParties, majorityThreshold);
  const probAdMostSeats = calculatePartyMostSeatsProbability(seatData, 'AD', ['PS', 'CH']);
  const probPsMostSeats = calculatePartyMostSeatsProbability(seatData, 'PS', ['AD', 'CH']);
  
  // Get latest polling data
  const latest = nationalTrends
    .filter(d => d.metric === 'vote_share_mean')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .reduce((acc, d) => {
      if (!acc[d.party]) acc[d.party] = d;
      return acc;
    }, {} as any);

  const parties = Object.values(latest).sort((a: any, b: any) => b.value - a.value);
  const lastUpdate = new Date((parties[0] as any).date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Summary Stats */}
      <section className="bg-green-pale border-b border-green-medium/30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('forecast.subtitle')}</h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-dark/70">
              <Calendar className="w-3 h-3" />
              <span>{t('common.updated')} {lastUpdate}</span>
            </div>
          </div>
          <ElectionSummaryStats
            probAdMostSeats={probAdMostSeats}
            probPsMostSeats={probPsMostSeats}
            probRightMajority={probRightMajority}
            probLeftMajority={probLeftMajority}
            translations={{
              mostSeats: t('forecast.mostSeats'),
              rightMajority: t('homepage.rightMajority'),
              leftMajority: t('homepage.leftMajority'),
              presidentialLeading: t('forecast.presidentialLeading'),
              secondRound: t('forecast.secondRound'),
              comingSoon: t('forecast.comingSoon'),
              mayoralRaces: t('forecast.mayoralRaces'),
              municipalCouncils: t('forecast.municipalCouncils'),
              mepAllocation: t('forecast.mepAllocation'),
              politicalGroups: t('forecast.politicalGroups')
            }}
          />
        </div>
      </section>

      {/* Main Charts Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          
          {/* Election-Aware Polling Trends */}
          <ElectionAwareContent
            fallback={
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-5 h-5 text-green-medium" />
                  <h2 className="text-xl font-semibold text-gray-900">{t('forecast.pollingTrends')}</h2>
                </div>
                <PollingChart data={nationalTrends} voteShareLabel={t('forecast.voteShareLabel')} />
                <p className="text-sm text-gray-600 mt-4">
                  {t('forecast.pollingTrendsDescription', { count: nationalTrends.length })}
                </p>
              </div>
            }
          >
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-green-medium" />
                <h2 className="text-xl font-semibold text-gray-900">{t('forecast.pollingTrends')}</h2>
              </div>
              <PollingChart data={nationalTrends} voteShareLabel={t('forecast.voteShareLabel')} />
              <p className="text-sm text-gray-600 mt-4">
                {t('forecast.pollingTrendsDescription', { count: nationalTrends.length })}
              </p>
            </div>
          </ElectionAwareContent>

          {/* Coalition Outcomes */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-green-medium" />
              <h2 className="text-xl font-semibold text-gray-900">{t('forecast.coalitionSeats')}</h2>
            </div>
            <CoalitionDotPlot 
              data={seatData} 
              leftCoalitionLabel={t('forecast.leftCoalition')}
              rightCoalitionLabel={t('forecast.rightCoalition')}
              projectedSeatsLabel={t('forecast.projectedSeats')}
              majorityLabel={t('forecast.majority')}
              showingOutcomesLabel={t('forecast.showingOutcomes', { count: seatData.length })}
            />
            <p className="text-sm text-gray-600 mt-4">
              {t('forecast.coalitionDescription')}
            </p>
          </div>

          {/* Seat Projections */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-green-medium" />
              <h2 className="text-xl font-semibold text-gray-900">{t('forecast.individualParties')}</h2>
            </div>
            <SeatChart data={seatData.flatMap((simulation, index) => 
              Object.entries(simulation)
                .filter(([party, seats]) => partyColors.hasOwnProperty(party))
                .map(([party, seats]) => ({
                  party,
                  seats: seats || 0
                }))
            )} />
            <p className="text-sm text-gray-600 mt-4">
              {t('forecast.simulationDescription', { count: seatData.length.toLocaleString() })}
            </p>
          </div>

          {/* District Analysis */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-green-medium" />
                <h2 className="text-xl font-semibold text-gray-900">{t('forecast.districtAnalysis')}</h2>
              </div>
              <Link
                href="/map"
                className="text-sm text-navy hover:text-navy-light font-medium flex items-center gap-1"
              >
                {t('map.title')} →
              </Link>
            </div>
            <DistrictSummary districtData={districtForecast} contestedData={contestedSeats} />
          </div>

          {/* Coalition Analysis */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('forecast.leftCoalition')}</h3>
              <div className="space-y-3">
                {leftBlocParties.map(party => {
                  const partyData = parties.find((p: any) => p.party === party);
                  return (
                    <div key={party} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: partyColors[party as keyof typeof partyColors] }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {t(`parties.${party}`)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {partyData ? ((partyData as any).value * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm text-gray-900">{t('forecast.majorityChance')}</span>
                    <span className="text-lg text-gray-900">
                      {formatProbabilityPercent(probLeftMajority)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('forecast.rightCoalition')}</h3>
              <div className="space-y-3">
                {rightBlocParties.map(party => {
                  const partyData = parties.find((p: any) => p.party === party);
                  return (
                    <div key={party} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: partyColors[party as keyof typeof partyColors] }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {t(`parties.${party}`)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {partyData ? ((partyData as any).value * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm text-gray-900">{t('forecast.majorityChance')}</span>
                    <span className="text-lg text-gray-900">
                      {formatProbabilityPercent(probRightMajority)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Polling Analysis */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-green-medium" />
              <h2 className="text-xl font-semibold text-gray-900">{t('forecast.pollingHouseEffects')}</h2>
            </div>
            <HouseEffects data={houseEffects} />
          </div>

          {/* Model Details */}
          <div className="bg-green-pale border border-green-medium/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('forecast.aboutModel')}</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{t('forecast.dataSources')}</span>
                </div>
                <p>
                  {t('forecast.dataSourcesDescription')}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-medium">{t('forecast.methodology')}</span>
                </div>
                <p>
                  {t('forecast.methodologyDescription')}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">{t('forecast.updates')}</span>
                </div>
                <p>
                  {t('forecast.updatesDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}