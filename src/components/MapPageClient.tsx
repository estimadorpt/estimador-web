'use client';

import { useState } from 'react';
import DistrictMap from '@/components/charts/DistrictMap';
import { MapErrorBoundary } from '@/components/ErrorBoundary';

interface DistrictForecast {
  district_name: string;
  winning_party: string;
  probs: Record<string, number>;
}

interface MapPageClientProps {
  districtForecast: DistrictForecast[];
}

/**
 * The district map page's one interactive piece: it keeps the chosen
 * district. The readout of that district's shares is drawn by the map itself,
 * beside it (under it on a phone), so the answer is next to the tap.
 */
export default function MapPageClient({ districtForecast }: MapPageClientProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  return (
    <MapErrorBoundary>
      <DistrictMap
        districtForecast={districtForecast}
        onDistrictClick={district => setSelectedDistrict(district.id)}
        selectedDistrict={selectedDistrict}
      />
    </MapErrorBoundary>
  );
}
