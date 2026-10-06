'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatElectionNumber, formatElectionPercent } from '@/lib/election-display';
import DistrictMap from '@/components/charts/DistrictMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { partyColors } from '@/lib/config/colors';
import { MapErrorBoundary } from '@/components/ErrorBoundary';

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
  const t = useTranslations('map');
  const locale = useLocale();

  const handleDistrictClick = (district: { id: string; probs: Record<string, number> }) => {
    setSelectedDistrict(district.id);
    setSelectedData(district);
  };

  return (
    <div className="space-y-6">
      <MapErrorBoundary>
        <DistrictMap
          districtForecast={districtForecast}
          onDistrictClick={handleDistrictClick}
          selectedDistrict={selectedDistrict}
          className="sm:border sm:border-line sm:rounded-lg"
        />
      </MapErrorBoundary>
      
      {/* Selected District Details */}
      {selectedData && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedData.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h2 className="text-base font-medium">{t('voteShareByParty')}</h2>
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
                              backgroundColor: `${partyColors[party] || '#dadccf'}20`,
                              borderColor: partyColors[party] || '#dadccf'
                            }}
                          >
                            {party}
                          </Badge>
                          <span className="text-sm font-medium">
                            {formatElectionPercent(share, locale)}
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: partyColors[party] || '#dadccf'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              {(() => {
                const sorted = Object.entries(selectedData.probs).sort(([, a], [, b]) => b - a);
                const gap = sorted.length >= 2 ? (sorted[0][1] - sorted[1][1]) * 100 : null;
                return gap != null ? (
                  <p className="text-xs text-stone-600">
                    {t('topTwoGap', { gap: formatElectionNumber(gap, locale, 1) })}
                  </p>
                ) : null;
              })()}
              <div className="pt-2 border-t text-xs text-stone-600">
                <p>{t('voteShareCaption')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}