import Link from "next/link";
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

export default async function ForecastPage() {
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
  const lastUpdate = new Date(parties[0].date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to home
              </Link>
              <div className="border-l pl-4">
                <h1 className="text-xl font-bold text-gray-900">Full Election Forecast</h1>
                <p className="text-sm text-gray-600">Portugal Parliamentary Elections</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Updated {lastUpdate}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Stats */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatProbabilityPercent(probAdMostSeats)}
              </div>
              <div className="text-sm text-gray-600">AD most seats</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatProbabilityPercent(probPsMostSeats)}
              </div>
              <div className="text-sm text-gray-600">PS most seats</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatProbabilityPercent(probRightMajority)}
              </div>
              <div className="text-sm text-gray-600">Right majority</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatProbabilityPercent(probLeftMajority)}
              </div>
              <div className="text-sm text-gray-600">Left majority</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Charts Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          
          {/* Polling Trends */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Polling trends</h2>
            </div>
            <PollingChart data={nationalTrends} />
            <p className="text-sm text-gray-600 mt-4">
              Smoothed polling averages based on {nationalTrends.length} data points. 
              Lines show estimated vote share over time with uncertainty bands.
            </p>
          </div>

          {/* Coalition Outcomes */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Coalition seat distributions</h2>
            </div>
            <CoalitionDotPlot data={seatData} />
            <p className="text-sm text-gray-600 mt-4">
              Each dot represents one simulation outcome. Black lines show median seat counts for each coalition.
            </p>
          </div>

          {/* Seat Projections */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Individual party projections</h2>
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
              Based on {seatData.length.toLocaleString()} Monte Carlo simulations. 
              Dots show mean projections, bands show 50% and 80% confidence intervals.
            </p>
          </div>

          {/* District Analysis */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Map className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">District Analysis</h2>
            </div>
            <DistrictSummary districtData={districtForecast} contestedData={contestedSeats} />
          </div>

          {/* Coalition Analysis */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Left-wing coalition</h3>
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
                          {partyNames[party as keyof typeof partyNames]}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {partyData ? (partyData.value * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm text-gray-900">Majority chance</span>
                    <span className="text-lg text-gray-900">
                      {formatProbabilityPercent(probLeftMajority)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Right-wing coalition</h3>
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
                          {partyNames[party as keyof typeof partyNames]}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {partyData ? (partyData.value * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm text-gray-900">Majority chance</span>
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
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Polling house effects</h2>
            </div>
            <HouseEffects data={houseEffects} />
          </div>

          {/* Model Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About this model</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Data sources</span>
                </div>
                <p>
                  Polling data from major Portuguese polling firms, weighted by reliability 
                  and recency. Historical election results and demographic data.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-medium">Methodology</span>
                </div>
                <p>
                  Monte Carlo simulation accounting for polling uncertainty, district-level 
                  variations, and D'Hondt seat allocation system.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Updates</span>
                </div>
                <p>
                  Model is updated as new polling data becomes available. 
                  Uncertainty decreases as election day approaches.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}