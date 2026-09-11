'use client';

import DistrictMap from './DistrictMap';
import type { DistrictForecast } from '@/types/geography';

export default function DistrictMapPreview({ districtForecast, className = '', height = 300 }: {
  districtForecast: DistrictForecast[]; className?: string; height?: number;
}) {
  return <DistrictMap districtForecast={districtForecast} className={className} height={height} />;
}
