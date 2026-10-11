'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatElectionNumber, formatElectionPercent } from '@/lib/election-display';
import DistrictMap from '@/components/charts/DistrictMap';
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
        />
      </MapErrorBoundary>
      
      {/* The chosen district: its name over an ink rule, then each party's
          predicted share as a figure and a bar in the party's colour on a thin
          scale rule. No card, no badge, no grey track. */}
      {selectedData && (() => {
        const sorted = Object.entries(selectedData.probs).sort(([, a], [, b]) => b - a);
        const gap = sorted.length >= 2 ? (sorted[0][1] - sorted[1][1]) * 100 : null;
        return (
          <section aria-labelledby="district-detail" className="border-t border-ink pt-3">
            <h3 id="district-detail" className="text-[19px] leading-6 text-ink">{selectedData.id}</h3>
            <p className="mt-1 text-[13px] text-graphite">{t('voteShareByParty')}</p>
            <ul className="mt-2">
              {sorted.map(([party, share]) => (
                <li key={party} className="border-b border-grid py-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                      <span aria-hidden="true" className="inline-block size-3" style={{ backgroundColor: partyColors[party] || '#bdbdbd' }} />
                      {party}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{formatElectionPercent(share, locale)}</span>
                  </div>
                  <div className="relative mt-1 h-2.5 border-b border-scale" aria-hidden="true">
                    <div className="absolute left-0 top-0 h-1.5" style={{ width: `${Math.min(100, share * 100)}%`, backgroundColor: partyColors[party] || '#bdbdbd' }} />
                  </div>
                </li>
              ))}
            </ul>
            {gap != null && (
              <p className="mt-3 text-xs text-graphite">
                {t('topTwoGap', { gap: formatElectionNumber(gap, locale, 1) })}
              </p>
            )}
            <p className="mt-1 text-xs text-graphite">{t('voteShareCaption')}</p>
          </section>
        );
      })()}
    </div>
  );
}