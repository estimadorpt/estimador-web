'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { geoMercator, geoPath } from 'd3';
import { feature } from 'topojson-client';
import { partyColors } from '@/lib/config/colors';
import { getRegionForIsland } from '@/lib/geography/regionMapping';
import { useTopoJsonData } from '@/hooks/useTopoJsonData';
import type { DistrictForecast, SelectedDistrict } from '@/types/geography';

interface DistrictMapProps {
  districtForecast: DistrictForecast[];
  className?: string;
  onDistrictClick?: (district: SelectedDistrict) => void;
  selectedDistrict?: string | null;
  height?: number;
}

export default function DistrictMap({ districtForecast, className = '', onDistrictClick,
  selectedDistrict, height = 500 }: DistrictMapProps) {
  const pt = useLocale() === 'pt';
  const { portugalTopoJson, isLoading, error, retry } = useTopoJsonData();
  const [inspected, setInspected] = useState<string | null>(null);
  const regions = useMemo(() => new Map(districtForecast.map(d => [d.district_name, d])), [districtForecast]);
  const geometry = useMemo(() => {
    if (!portugalTopoJson) return null;
    try {
      const collection = feature(portugalTopoJson, portugalTopoJson.objects.ilhasGeo2);
      const projection = geoMercator().fitExtent([[12, 12], [628, height - 12]], collection);
      const path = geoPath(projection);
      return collection.features.map(d => ({ name: d.properties.NAME_1, d: path(d) ?? '' }));
    } catch { return null; }
  }, [portugalTopoJson, height]);
  const active = regions.get(inspected ?? selectedDistrict ?? '');
  const choose = (name: string) => {
    const data = regions.get(name);
    setInspected(name);
    if (data) onDistrictClick?.({ id: name, probs: data.probs });
  };
  const format = (n: number) => new Intl.NumberFormat(pt ? 'pt-PT' : 'en-GB', { style: 'percent', maximumFractionDigits: 1 }).format(n);

  return (
    <div className={`w-full p-3 ${className}`}>
      {onDistrictClick && (
        <label className="mb-3 block text-sm font-medium text-stone-700">
          {pt ? 'Escolher distrito ou região' : 'Choose a district or region'}
          <select className="mt-1 block w-full rounded border border-stone-300 bg-cream p-2" value={selectedDistrict ?? ''}
            onChange={e => choose(e.target.value)}>
            <option value="" disabled>{pt ? 'Selecione uma região' : 'Select a region'}</option>
            {[...regions.keys()].sort((a, b) => a.localeCompare(b, pt ? 'pt' : 'en')).map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
      )}
      {isLoading ? <p role="status" className="py-10 text-center text-stone-500">{pt ? 'A carregar mapa…' : 'Loading map…'}</p>
        : error || !geometry ? <div role="alert" className="py-6 text-center">
          <p>{pt ? 'Não foi possível carregar o mapa. Pode continuar a escolher uma região na lista.' : 'The map could not load. You can still choose a region from the list.'}</p>
          <button type="button" onClick={retry} className="mt-3 underline">{pt ? 'Tentar novamente' : 'Try again'}</button>
        </div> : (
          <svg viewBox={`0 0 640 ${height}`} className="block w-full" style={{ maxHeight: height }}
            aria-label={pt ? 'Previsão legislativa de 2025 por distrito e região' : '2025 parliamentary forecast by district and region'}>
            {geometry.map(({ name, d }, index) => {
              const region = getRegionForIsland(name);
              const data = regions.get(region);
              const description = data ? `${region}: ${Object.entries(data.probs).sort(([, a], [, b]) => b - a).map(([party, value]) => `${party} ${format(value)}`).join(', ')}` : region;
              return <path key={`${name}-${index}`} d={d} fill={partyColors[data?.winning_party] ?? '#dadccf'}
                stroke={selectedDistrict === region ? '#16362e' : 'white'} strokeWidth={selectedDistrict === region ? 2.5 : 0.8}
                role={onDistrictClick ? 'button' : 'img'} tabIndex={0} aria-label={description}
                aria-pressed={onDistrictClick ? selectedDistrict === region : undefined}
                className="outline-offset-2 focus:stroke-stone-950 focus:stroke-[3px]"
                onFocus={() => setInspected(region)} onMouseEnter={() => setInspected(region)}
                onClick={() => choose(region)} onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(region); }
                }}><title>{description}</title></path>;
            })}
          </svg>
        )}
      {active && <p className="mt-2 text-sm text-stone-700" aria-live="polite">
        <strong>{active.district_name}</strong>{' · '}
        {Object.entries(active.probs).sort(([, a], [, b]) => b - a).map(([party, value]) => `${party} ${format(value)}`).join(' · ')}
      </p>}
      <p className="mt-2 text-xs text-stone-500">{pt ? 'A cor indica o partido com maior percentagem de votos prevista. Arquivo da previsão, não resultados oficiais.' : 'Colour shows the party with the highest forecast vote share. Archived forecast, not official results.'}</p>
    </div>
  );
}
