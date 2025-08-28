'use client';

import { useState } from 'react';
import DistrictMap from '@/components/charts/DistrictMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { partyColors } from '@/lib/config/colors';

interface DistrictForecast {
  district_name: string;
  winning_party: string;
  probs: Record<string, number>;
}

interface MapPageClientProps {
  districtForecast: DistrictForecast[];
}

export default function MapPageClient({ districtForecast }: MapPageClientProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<{ id: string; probs: Record<string, number> } | null>(null);

  const handleDistrictClick = (district: { id: string; probs: Record<string, number> }) => {
    setSelectedDistrict(district.id);
    setSelectedData(district);
  };

  return (
    <div className="space-y-6">
      <DistrictMap
        districtForecast={districtForecast}
        onDistrictClick={handleDistrictClick}
        selectedDistrict={selectedDistrict}
        className="border rounded-lg"
      />
      
      {/* Selected District Details */}
      {selectedData && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedData.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h4 className="font-medium">Previsão de Votos por Partido:</h4>
              <div className="space-y-3">
                {Object.entries(selectedData.probs)
                  .sort(([,a], [,b]) => b - a)
                  .map(([party, share]) => {
                    const percentage = (share * 100);
                    return (
                      <div key={party} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <Badge 
                            variant="outline" 
                            className="text-xs font-medium"
                            style={{ 
                              backgroundColor: `${partyColors[party] || '#e5e7eb'}20`,
                              borderColor: partyColors[party] || '#e5e7eb'
                            }}
                          >
                            {party}
                          </Badge>
                          <span className="text-sm font-medium">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: partyColors[party] || '#e5e7eb'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="pt-2 border-t text-xs text-gray-600">
                <p>Percentagem de votos prevista para cada partido neste distrito</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}