"use client";

import { partyColors, partyNames } from "@/lib/config/colors";

interface DistrictForecast {
  district_name: string;
  winning_party: string;
  probs: Record<string, number>;
}

interface ContestedData {
  districts: Record<string, {
    ENSC: number;
    delta2024?: Record<string, number>;
    parties?: Record<string, Record<string, number>>;
  }>;
}

interface DistrictSummaryProps {
  districtData: DistrictForecast[];
  contestedData: ContestedData;
}

export function DistrictSummary({ districtData, contestedData }: DistrictSummaryProps) {
  if (!districtData || districtData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>District analysis loading...</p>
      </div>
    );
  }

  // Sort districts by competitiveness (ENSC score)
  const sortedDistricts = districtData
    .map(district => {
      const contestedInfo = contestedData?.districts?.[district.district_name];
      const competitiveness = contestedInfo?.ENSC || 0;
      
      // Get top 2 parties by probability
      const parties = Object.entries(district.probs)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2);
      
      return {
        ...district,
        competitiveness,
        topParties: parties,
        isContested: competitiveness > 0.8
      };
    })
    .sort((a, b) => b.competitiveness - a.competitiveness);

  const contestedDistricts = sortedDistricts.filter(d => d.isContested);
  const safeDistricts = sortedDistricts.filter(d => !d.isContested);

  return (
    <div className="space-y-6">
      {/* Contested Districts */}
      {contestedDistricts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Seats in Play ({contestedDistricts.length} districts)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Districts where seat allocation is uncertain - small changes in vote share could flip seats between parties.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contestedDistricts.slice(0, 9).map(district => {
              const contestedInfo = contestedData?.districts?.[district.district_name];
              const seatChanges = contestedInfo?.parties || {};
              
              // Find parties with meaningful seat change probabilities
              const partiesWithChanges = Object.entries(seatChanges)
                .map(([party, probs]) => {
                  const gainProb = (probs["1"] || 0) + (probs["2"] || 0);
                  const loseProb = (probs["-1"] || 0) + (probs["-2"] || 0);
                  return {
                    party,
                    gainProb,
                    loseProb,
                    hasChange: gainProb > 0.05 || loseProb > 0.05
                  };
                })
                .filter(p => p.hasChange)
                .sort((a, b) => (b.gainProb + b.loseProb) - (a.gainProb + a.loseProb))
                .slice(0, 3);

              return (
                <div key={district.district_name} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{district.district_name}</h4>
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                      ENSC: {district.competitiveness.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {partiesWithChanges.length > 0 ? partiesWithChanges.map(({ party, gainProb, loseProb }) => (
                      <div key={party} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: partyColors[party as keyof typeof partyColors] }}
                          />
                          <span className="text-sm font-medium">
                            {partyNames[party as keyof typeof partyNames] || party}
                          </span>
                        </div>
                        <div className="ml-5 text-xs text-gray-600">
                          {gainProb > 0.05 && (
                            <span className="text-green-700">+1 seat: {(gainProb * 100).toFixed(0)}%</span>
                          )}
                          {gainProb > 0.05 && loseProb > 0.05 && <span className="mx-1">•</span>}
                          {loseProb > 0.05 && (
                            <span className="text-red-700">-1 seat: {(loseProb * 100).toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-xs text-gray-500">Close race for seat allocation</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safe Districts Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Likely Winners by District
        </h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.values(partyColors).map((color, index) => {
              const party = Object.keys(partyColors)[index];
              const wins = safeDistricts.filter(d => d.winning_party === party).length;
              
              if (wins === 0) return null;
              
              return (
                <div key={party} className="text-center">
                  <div 
                    className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center text-white font-bold shadow-md"
                    style={{ backgroundColor: color }}
                  >
                    {wins}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {partyNames[party as keyof typeof partyNames] || party}
                  </div>
                  <div className="text-xs text-gray-500">districts</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{districtData.length}</div>
            <div className="text-sm text-gray-600">Total districts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{contestedDistricts.length}</div>
            <div className="text-sm text-gray-600">Seats in play</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{safeDistricts.length}</div>
            <div className="text-sm text-gray-600">Stable allocation</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>ENSC (Effective Number of Seat Changes)</strong> measures seat allocation uncertainty. 
            Districts with ENSC &gt; 0.8 are classified as having "seats in play" where small vote share changes 
            could flip seats between parties under the D'Hondt proportional system.
          </p>
        </div>
      </div>
    </div>
  );
}