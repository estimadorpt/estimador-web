import { createPageMetadata } from '@/lib/metadata';
import { 
  calculateBlocMajorityProbability, 
  calculatePartyMostSeatsProbability,
  formatProbabilityPercent 
} from "@/lib/utils/probability-calculator";
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";
import { partyColors, partyNames } from "@/lib/config/colors";
import { loadForecastData } from "@/lib/utils/data-loader";
import { Calendar, BarChart3, TrendingUp, Users, Map, Vote } from "lucide-react";
import { PollingChart } from "@/components/charts/PollingChart";
import { SeatChart } from "@/components/charts/SeatChart";
import { DistrictSummary } from "@/components/charts/DistrictSummary";
import { HouseEffects } from "@/components/charts/HouseEffects";
import { CoalitionDotPlot } from "@/components/charts/CoalitionDotPlot";
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { SectionNotes } from "@/components/articles/SectionNotes";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import type { TrendData } from '@/types';
import { ElectionAwareContent } from '@/components/ElectionAwareContent';
import { ElectionSummaryStats } from '@/components/ElectionSummaryStats';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return createPageMetadata({
    locale,
    path: `/eleicoes/legislativas`,
    title: t('meta.forecastTitle'),
    description: t('sections.parliamentary2025Description'),
  });
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
    .reduce<Record<string, TrendData>>((acc, d) => {
      if (!acc[d.party]) acc[d.party] = d;
      return acc;
    }, {});

  const parties = Object.values(latest).sort((a, b) => b.value - a.value);
  const lastUpdate = parties[0]
    ? new Date(parties[0].date).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <PageHero
        icon={<Vote aria-hidden="true" className="w-4 h-4" />}
        eyebrow={t('nav.elections')}
        title={t('forecast.subtitle')}
        meta={
          <span className="inline-flex items-center gap-1">
            <Calendar aria-hidden="true" className="w-3 h-3" />
            {lastUpdate ? `${t('common.updated')} ${lastUpdate}` : t('common.noData')}
          </span>
        }
      />

      {/* Summary Stats */}
      <section className="border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-8">
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
              <div className="bg-cream border border-stone-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-5 h-5 text-stone-400" />
                  <h2 className="text-2xl text-stone-900">{t('forecast.pollingTrends')}</h2>
                </div>
                <PollingChart data={nationalTrends} voteShareLabel={t('forecast.voteShareLabel')} />
                <p className="text-sm text-stone-600 mt-4">
                  {t('forecast.pollingTrendsDescription', { count: nationalTrends.length })}
                </p>
              </div>
            }
          >
            <div className="bg-cream border border-stone-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-stone-400" />
                <h2 className="text-2xl text-stone-900">{t('forecast.pollingTrends')}</h2>
              </div>
              <PollingChart data={nationalTrends} voteShareLabel={t('forecast.voteShareLabel')} />
              <p className="text-sm text-stone-600 mt-4">
                {t('forecast.pollingTrendsDescription', { count: nationalTrends.length })}
              </p>
            </div>
          </ElectionAwareContent>

          {/* Coalition Outcomes */}
          <div className="bg-cream border border-stone-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-stone-400" />
              <h2 className="text-2xl text-stone-900">{t('forecast.coalitionSeats')}</h2>
            </div>
            <CoalitionDotPlot 
              data={seatData} 
              leftCoalitionLabel={t('forecast.leftCoalition')}
              rightCoalitionLabel={t('forecast.rightCoalition')}
              projectedSeatsLabel={t('forecast.projectedSeats')}
              majorityLabel={t('forecast.majority')}
              showingOutcomesLabel={t('forecast.showingOutcomes', { count: seatData.length })}
            />
            <p className="text-sm text-stone-600 mt-4">
              {t('forecast.coalitionDescription')}
            </p>
          </div>

          {/* Seat Projections */}
          <div className="bg-cream border border-stone-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-stone-400" />
              <h2 className="text-2xl text-stone-900">{t('forecast.individualParties')}</h2>
            </div>
            <SeatChart data={seatData.flatMap((simulation, index) => 
              Object.entries(simulation)
                .filter(([party, seats]) => partyColors.hasOwnProperty(party))
                .map(([party, seats]) => ({
                  party,
                  seats: seats || 0
                }))
            )} />
            <p className="text-sm text-stone-600 mt-4">
              {t('forecast.simulationDescription', { count: seatData.length.toLocaleString() })}
            </p>
          </div>

          {/* District Analysis */}
          <div className="bg-cream border border-stone-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-stone-400" />
                <h2 className="text-2xl text-stone-900">{t('forecast.districtAnalysis')}</h2>
              </div>
              <Link
                href="/eleicoes/mapa"
                locale={locale}
                className="text-sm text-ink hover:text-ink-muted font-medium flex items-center gap-1"
              >
                {t('map.title')} →
              </Link>
            </div>
            <DistrictSummary districtData={districtForecast} contestedData={contestedSeats} />
          </div>

          {/* Coalition Analysis */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-cream border border-stone-200 rounded-2xl p-6">
              <h3 className="text-lg text-stone-900 mb-4">{t('forecast.leftCoalition')}</h3>
              <div className="space-y-3">
                {leftBlocParties.map(party => {
                  const partyData = parties.find(p => p.party === party);
                  return (
                    <div key={party} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: partyColors[party as keyof typeof partyColors] }}
                        />
                        <span className="text-sm font-medium text-stone-900">
                          {t(`parties.${party}`)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-stone-900">
                        {partyData ? `${(partyData.value * 100).toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm text-stone-900">{t('forecast.majorityChance')}</span>
                    <span className="text-lg text-stone-900">
                      {formatProbabilityPercent(probLeftMajority)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-cream border border-stone-200 rounded-2xl p-6">
              <h3 className="text-lg text-stone-900 mb-4">{t('forecast.rightCoalition')}</h3>
              <div className="space-y-3">
                {rightBlocParties.map(party => {
                  const partyData = parties.find(p => p.party === party);
                  return (
                    <div key={party} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: partyColors[party as keyof typeof partyColors] }}
                        />
                        <span className="text-sm font-medium text-stone-900">
                          {t(`parties.${party}`)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-stone-900">
                        {partyData ? `${(partyData.value * 100).toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm text-stone-900">{t('forecast.majorityChance')}</span>
                    <span className="text-lg text-stone-900">
                      {formatProbabilityPercent(probRightMajority)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Polling Analysis */}
          <div className="bg-cream border border-stone-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-stone-400" />
              <h2 className="text-2xl text-stone-900">{t('forecast.pollingHouseEffects')}</h2>
            </div>
            <HouseEffects data={houseEffects} />
          </div>

          {/* Model Details */}
          <div className="bg-paper border border-line rounded-2xl p-6">
            <h3 className="text-lg text-stone-900 mb-4">{t('forecast.aboutModel')}</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-stone-600">
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

          {/* Written analysis, last in the stack: a hairline rule rather than
              another card, since this page's cards are the 2025 archive's own
              older styling and the notes are not part of that archive. */}
          <SectionNotes
            section="elections"
            locale={locale}
            containerClassName="border-t border-stone-200 pt-8"
          />
        </div>
      </section>
      <SiteFooter locale={locale} />
    </div>
  );
}