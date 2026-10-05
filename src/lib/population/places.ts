/**
 * Places: parishes, municípios and regions for search, navigation and the
 * game. Names are the CAOP 2021 names the atlas geography uses; INE resident
 * counts and household counts come from the release's quality table and are
 * labelled as INE figures wherever they appear.
 */
import type { PlaceRow, PopulationPlaces } from '@/types/population';

export interface Parish {
  code: string;
  name: string;
  municipality: string;
  municipalityName: string;
  region: string;
  regionName: string;
  tier: 'A' | 'B' | 'C';
  /** "parish": the parish's own figures; "municipality": the município's, labelled as such. */
  level: 'parish' | 'municipality';
  censusPopulation: number;
  households: number;
  lat: number;
  lon: number;
}

export interface PlaceIndex {
  parishes: Parish[];
  byCode: Map<string, Parish>;
  municipalities: Array<{ code: string; name: string; region: string }>;
  municipalityByCode: Map<string, { code: string; name: string; region: string }>;
  regions: Array<{ id: string; name: string }>;
  regionById: Map<string, { id: string; name: string }>;
}

export function indexPlaces(data: PopulationPlaces): PlaceIndex {
  const regions = data.regions.map(([id, name]) => ({ id, name }));
  const regionById = new Map(regions.map(region => [region.id, region]));
  const municipalities = data.municipalities.map(([code, name, region]) => ({ code, name, region }));
  const municipalityByCode = new Map(municipalities.map(m => [m.code, m]));
  const parishes = data.parishes.map((row: PlaceRow) => {
    const [code, name, municipality, tier, level, censusPopulation, households, lat, lon] = row;
    const muni = municipalityByCode.get(municipality);
    const region = muni ? regionById.get(muni.region) : undefined;
    return {
      code,
      name,
      municipality,
      municipalityName: muni?.name ?? municipality,
      region: muni?.region ?? '',
      regionName: region?.name ?? '',
      tier,
      level: level === 'p' ? ('parish' as const) : ('municipality' as const),
      censusPopulation,
      households,
      lat,
      lon,
    };
  });
  return {
    parishes,
    byCode: new Map(parishes.map(parish => [parish.code, parish])),
    municipalities,
    municipalityByCode,
    regions,
    regionById,
  };
}

/** Lower case, no accents, no punctuation: "União das Freguesias de São João" → "uniao das freguesias de sao joao". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const UNION = /^uniao das freguesias de /;

/** The names a parish answers to: its full name and, for a union, each member parish. */
export function searchNames(name: string): string[] {
  const folded = fold(name);
  if (!UNION.test(folded)) return [folded];
  const members = name.replace(/^União das freguesias de /i, '').split(/,\s*|\s+e\s+/).map(fold).filter(Boolean);
  return [folded, ...members];
}

export interface SearchHit {
  parish: Parish;
  /** How the query matched, for ordering: 0 exact name, 1 name starts, 2 member/word starts, 3 contains, 4 município. */
  rank: number;
}

/**
 * Parish search. Matches parish names (and each member of a "União das
 * freguesias"), then município names, ignoring case, accents and punctuation.
 * Ties go alphabetical — the order says nothing about the places.
 */
export function searchParishes(index: PlaceIndex, query: string, limit = 12): SearchHit[] {
  const q = fold(query);
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const parish of index.parishes) {
    const names = searchNames(parish.name);
    let rank = Infinity;
    if (names[0] === q) rank = 0;
    else if (names[0].startsWith(q)) rank = 1;
    else if (names.slice(1).some(n => n === q || n.startsWith(q)) || names[0].split(' ').some(word => word.startsWith(q))) rank = 2;
    else if (names[0].includes(q)) rank = 3;
    else if (fold(parish.municipalityName).startsWith(q)) rank = 4;
    if (rank < Infinity) hits.push({ parish, rank });
  }
  hits.sort((a, b) => a.rank - b.rank || a.parish.name.localeCompare(b.parish.name, 'pt') || a.parish.municipalityName.localeCompare(b.parish.municipalityName, 'pt'));
  return hits.slice(0, limit);
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The parish whose representative point is closest (a nearest point, not a boundary test). */
export function nearestParish(index: PlaceIndex, point: { lat: number; lon: number }): Parish | null {
  let best: Parish | null = null;
  let bestDistance = Infinity;
  for (const parish of index.parishes) {
    const distance = haversineKm(point, parish);
    if (distance < bestDistance) {
      best = parish;
      bestDistance = distance;
    }
  }
  return best;
}

/** Region (district or autonomous region) id from a DICOFRE code. */
export function regionOfCode(code: string): string {
  const district = code.slice(0, 2);
  if (district >= '41' && district <= '49') return 'azores';
  if (district === '31' || district === '32') return 'madeira';
  return district;
}

/** The six-character DICOFRE code, accepted case-insensitively from a URL. */
export function normaliseParishCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return /^[0-9A-Z]{6}$/.test(code) ? code : null;
}

/** URL slug for a region page: "Viana do Castelo" → "viana-do-castelo", "Açores" → "acores". */
export function regionSlug(name: string): string {
  return fold(name).replace(/\s+/g, '-');
}

/** How a region is named in a heading. */
export function regionTitle(id: string, name: string, locale: 'pt' | 'en'): string {
  if (id === 'azores') return locale === 'pt' ? 'Região Autónoma dos Açores' : 'Autonomous Region of the Azores';
  if (id === 'madeira') return locale === 'pt' ? 'Região Autónoma da Madeira' : 'Autonomous Region of Madeira';
  return locale === 'pt' ? `Distrito de ${name}` : `${name} district`;
}
