'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { geoMercator, geoPath } from 'd3';
import { feature } from 'topojson-client';
import { partyColors, partyNames } from '@/lib/config/colors';
import { getRegionForIsland } from '@/lib/geography/regionMapping';
import { useTopoJsonData } from '@/hooks/useTopoJsonData';
import { ChartTable } from '@/components/viz/ChartTable';
import { closeLeads } from '@/lib/election-aggregates';
import type { DistrictForecast, SelectedDistrict } from '@/types/geography';

interface DistrictMapProps {
  districtForecast: DistrictForecast[];
  className?: string;
  onDistrictClick?: (district: SelectedDistrict) => void;
  selectedDistrict?: string | null;
}

// Layout in viewBox units. The mainland is tall and narrow, so it takes the
// full height on the right and the two archipelagos sit as framed insets on
// the left; one projection for everything left the mainland a third of the
// width at 360px (UXM2-15).
const WIDTH = 420;
const HEIGHT = 540;
const MAINLAND_BOX: [[number, number], [number, number]] = [[150, 8], [WIDTH - 8, HEIGHT - 8]];
const INSETS = {
  'Açores': { frame: [8, 8, 136, 112] as const, box: [[16, 34], [136, 112]] as [[number, number], [number, number]] },
  Madeira: { frame: [8, 132, 136, 112] as const, box: [[30, 160], [130, 236]] as [[number, number], [number, number]] },
};

const slug = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

/**
 * District and region map of the 2025 forecast, coloured by the party with
 * the largest estimated vote share. Each district or region is one keyboard
 * stop (the nine Açores islands and the two of Madeira are one group each),
 * named briefly ("Lisboa: AD à frente") with the full shares as its
 * description. A colour key sits under the map; the table twin holds every
 * figure.
 */
export default function DistrictMap({ districtForecast, className = '', onDistrictClick,
  selectedDistrict }: DistrictMapProps) {
  const pt = useLocale() === 'pt';
  const { portugalTopoJson, isLoading, error, retry } = useTopoJsonData();
  const [inspected, setInspected] = useState<string | null>(null);
  const regions = useMemo(() => new Map(districtForecast.map(d => [d.district_name, d])), [districtForecast]);
  // Polygons grouped by the district or region they belong to, each part of
  // the country fitted to its own box (mainland, Açores inset, Madeira inset).
  const groups = useMemo(() => {
    if (!portugalTopoJson) return null;
    try {
      const collection = feature(portugalTopoJson, portugalTopoJson.objects.ilhasGeo2);
      type Feature = (typeof collection.features)[number];
      const parts = new Map<string, Feature[]>([['mainland', []], ['Açores', []], ['Madeira', []]]);
      for (const f of collection.features) {
        const region = getRegionForIsland(f.properties.NAME_1);
        parts.get(region === 'Açores' || region === 'Madeira' ? region : 'mainland')!.push(f);
      }
      const byRegion = new Map<string, string[]>();
      for (const [part, features] of parts) {
        if (features.length === 0) continue;
        const box = part === 'mainland' ? MAINLAND_BOX : INSETS[part as keyof typeof INSETS].box;
        const path = geoPath(geoMercator().fitExtent(box, { type: 'FeatureCollection', features }));
        for (const f of features) {
          const region = getRegionForIsland(f.properties.NAME_1);
          byRegion.set(region, [...(byRegion.get(region) ?? []), path(f) ?? '']);
        }
      }
      return [...byRegion.entries()].map(([region, paths]) => ({ region, paths }));
    } catch { return null; }
  }, [portugalTopoJson]);
  // Districts whose two leaders are under a point apart: hatched, and named under the key.
  const close = useMemo(() => closeLeads(districtForecast), [districtForecast]);
  const closeNames = useMemo(() => new Set(close.map(c => c.district)), [close]);
  const active = regions.get(inspected ?? selectedDistrict ?? '');
  const activeSorted = active ? Object.entries(active.probs).sort(([, a], [, b]) => b - a) : null;
  const choose = (name: string) => {
    const data = regions.get(name);
    setInspected(name);
    if (data) onDistrictClick?.({ id: name, probs: data.probs });
  };
  // Table twin columns: every party in the file, largest national presence first.
  const tableParties = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of districtForecast) for (const [party, v] of Object.entries(d.probs)) totals.set(party, (totals.get(party) ?? 0) + v);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([party]) => party);
  }, [districtForecast]);
  // One decimal everywhere ("17,0%", not "17%" beside "39,9%").
  const format = (n: number) => new Intl.NumberFormat(pt ? 'pt-PT' : 'en-GB', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
  const shares = (probs: Record<string, number>) => Object.entries(probs).sort(([, a], [, b]) => b - a).map(([party, value]) => `${party} ${format(value)}`).join(', ');
  // The key: every party that leads somewhere, by the number of districts it leads.
  const leaders = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of districtForecast) counts.set(d.winning_party, (counts.get(d.winning_party) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([party]) => party);
  }, [districtForecast]);

  return (
    <div className={`w-full sm:p-3 ${className}`}>
      {onDistrictClick && (
        <label className="mb-3 block text-sm font-medium text-stone-700">
          {pt ? 'Escolher distrito ou região' : 'Choose a district or region'}
          <select className="mt-1 block min-h-11 w-full rounded border border-stone-300 bg-cream p-2" value={selectedDistrict ?? ''}
            onChange={e => choose(e.target.value)}>
            <option value="" disabled>{pt ? 'Escolhe uma região' : 'Select a region'}</option>
            {[...regions.keys()].sort((a, b) => a.localeCompare(b, pt ? 'pt' : 'en')).map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
      )}
      {isLoading ? <p role="status" className="py-10 text-center text-stone-500">{pt ? 'A carregar mapa…' : 'Loading map…'}</p>
        : error || !groups ? <div role="alert" className="py-6 text-center">
          <p>{pt ? 'Não foi possível carregar o mapa. Podes continuar a escolher uma região na lista.' : 'The map could not load. You can still choose a region from the list.'}</p>
          <button type="button" onClick={retry} className="mt-3 underline">{pt ? 'Tentar novamente' : 'Try again'}</button>
        </div> : (
          <>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mx-auto block w-full" style={{ maxWidth: WIDTH * 1.25 }}
              role="group" aria-label={pt ? 'Previsão legislativa de 2025 por distrito e região' : '2025 parliamentary forecast by district and region'}>
              <defs>
                <pattern id="district-close-lead" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#122f2c" strokeWidth="1.6" strokeOpacity="0.55" />
                </pattern>
              </defs>
              {/* Inset frames and names: decoration, the list and the table name every region. */}
              <g aria-hidden="true">
                {Object.entries(INSETS).map(([name, { frame: [x, y, w, h] }]) => (
                  <g key={name}>
                    <rect x={x} y={y} width={w} height={h} rx={8} fill="none" stroke="#dadccf" strokeWidth={1} />
                    <text x={x + 8} y={y + 20} fontSize={17} fontWeight={700} fill="#234c40">{name}</text>
                  </g>
                ))}
              </g>
              {groups.map(({ region, paths }) => {
                const data = regions.get(region);
                const on = selectedDistrict === region || inspected === region;
                const name = data ? `${region}: ${data.winning_party} ${pt ? 'à frente' : 'ahead'}` : region;
                return (
                  <g key={region} role={onDistrictClick ? 'button' : 'img'} tabIndex={0} aria-label={name}
                    aria-describedby={data ? `district-${slug(region)}` : undefined}
                    aria-pressed={onDistrictClick ? selectedDistrict === region : undefined}
                    // A tap focuses the group; only keyboard focus draws the ring
                    // (the selection is the ink outline), so no grey box on touch.
                    className="cursor-pointer [&:focus:not(:focus-visible)]:outline-none"
                    onFocus={() => setInspected(region)} onMouseEnter={() => setInspected(region)}
                    onClick={() => choose(region)} onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(region); }
                    }}>
                    <title>{name}</title>
                    {paths.map((d, i) => <path key={i} d={d} fill={partyColors[data?.winning_party ?? ''] ?? '#dadccf'}
                      stroke={on ? '#16362e' : '#fcfbf5'} strokeWidth={on ? 2.5 : 0.8} />)}
                    {closeNames.has(region) && paths.map((d, i) => <path key={`close-${i}`} d={d} fill="url(#district-close-lead)" pointerEvents="none" />)}
                  </g>
                );
              })}
            </svg>
            {/* Descriptions for the groups above, read after each short name. */}
            <div className="sr-only">
              {districtForecast.map(d => <p key={d.district_name} id={`district-${slug(d.district_name)}`}>{`${pt ? 'Percentagem de votos prevista' : 'Predicted vote share'}: ${shares(d.probs)}`}</p>)}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink" aria-label={pt ? 'Cores do mapa' : 'Map colours'}>
              {leaders.map(party => (
                <li key={party} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block size-3 rounded-sm" style={{ backgroundColor: partyColors[party] ?? '#dadccf' }} />
                  {partyNames[party as keyof typeof partyNames] ?? party} {pt ? 'à frente' : 'ahead'}
                </li>
              ))}
              {close.length > 0 && (
                <li className="flex items-center gap-1.5">
                  <svg aria-hidden="true" width="12" height="12" className="rounded-sm"><rect width="12" height="12" fill="#e8e6dc" /><path d="M-2 4 L4 -2 M-2 10 L10 -2 M4 14 L14 4" stroke="#122f2c" strokeWidth="1.6" strokeOpacity="0.55" /></svg>
                  {pt ? 'Menos de 1 ponto entre os dois primeiros' : 'Under 1 point between the top two'}
                </li>
              )}
            </ul>
            {close.length > 0 && (
              <p className="mt-2 text-xs text-stone-600">
                {close.map(c => pt
                  ? `${c.district}: ${c.first.party} ${format(c.first.share)} e ${c.second.party} ${format(c.second.share)}. A cor dá o distrito ao ${c.first.party}, mas a previsão era praticamente um empate.`
                  : `${c.district}: ${c.first.party} ${format(c.first.share)} and ${c.second.party} ${format(c.second.share)}. The colour gives the district to ${c.first.party}, but the forecast was close to a tie.`).join(' ')}
              </p>
            )}
          </>
        )}
      {active && activeSorted && (
        <div className="mt-3 text-sm text-stone-700" aria-live="polite">
          <p><strong>{active.district_name}</strong> · {pt ? 'percentagem de votos prevista (estimativa)' : 'predicted vote share (estimate)'}</p>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
            {activeSorted.map(([party, value]) => <li key={party}>{party} {format(value)}</li>)}
          </ul>
        </div>
      )}
      <ChartTable
        caption={pt ? 'Percentagem de votos prevista por distrito e região' : 'Predicted vote share by district and region'}
        summaryLabel={pt ? 'Ver os distritos e regiões como tabela' : 'View districts and regions as a table'}
        columns={[pt ? 'Distrito ou região' : 'District or region', pt ? 'À frente' : 'Leading', ...tableParties]}
        rows={[...districtForecast].sort((a, b) => a.district_name.localeCompare(b.district_name, pt ? 'pt' : 'en')).map(d => [d.district_name, d.winning_party, ...tableParties.map(p => d.probs[p] != null ? format(d.probs[p]) : '—')])}
      />
      <p className="mt-2 text-xs text-stone-500">{pt ? 'A cor indica o partido com maior percentagem de votos prevista (estimativa), não uma probabilidade de vitória. Arquivo da previsão, não resultados oficiais.' : 'Colour shows the party with the highest estimated vote share, not a probability of winning. Archived forecast, not official results.'}</p>
    </div>
  );
}
