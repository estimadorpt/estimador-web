/**
 * Places: parishes, municípios and regions for search, navigation and the
 * game. Names are the CAOP 2021 names the atlas geography uses. The resident
 * count is INE's (Censos 2021) and is labelled as such wherever it appears;
 * the household count is the generated population's (each collective living
 * quarter counts as one household) and is never attributed to INE.
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
  /** INE, Censos 2021: residents. */
  censusPopulation: number;
  /** The generated population's households (collective quarters count one each). Not INE's. */
  generatedHouseholds: number;
  /** The count the quality tier was decided on (quality.csv publication_population). */
  publicationPopulation: number;
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
    const [code, name, municipality, tier, level, censusPopulation, generatedHouseholds, lat, lon, publicationPopulation] = row;
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
      generatedHouseholds,
      publicationPopulation: publicationPopulation ?? censusPopulation,
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

/** "União das freguesias de/da/do…" and "União de freguesias de…" (both spellings are in CAOP 2021). */
const UNION_PREFIX = /^uni[aã]o (?:das|de) freguesias (?:de|da|do|das|dos) /i;
const SEPARATOR = /,\s*|\s+e\s+/;

/**
 * The names a parish answers to: its full name and its members. A union's
 * members are the parishes it joined ("União das freguesias da Sé e São
 * Lourenço" → "se", "sao lourenco"); a parenthesised part names members too
 * ("Funchal (Sé)" → "funchal", "se"; "Lamego (Almacave e Sé)" → "lamego",
 * "almacave", "se"), so a short member name finds its parish exactly.
 */
export function searchNames(name: string): string[] {
  const folded = fold(name);
  const union = UNION_PREFIX.test(name);
  const inner = [...name.matchAll(/\(([^)]*)\)/g)].map(match => match[1]);
  if (!union && inner.length === 0) return [folded];
  const outside = name.replace(/\([^)]*\)/g, ' ').replace(UNION_PREFIX, '').replace(/\s+/g, ' ').trim();
  const parts = [...(union ? outside.split(SEPARATOR) : [outside]), ...inner.flatMap(part => part.split(SEPARATOR))];
  const members = [...new Set(parts.map(fold).filter(member => member && member !== folded))];
  return [folded, ...members];
}

export interface SearchHit {
  parish: Parish;
  /**
   * How the query matched, for ordering (lower first): 0 the code or the exact
   * name, 1 an exact member of a union, 2 the name starts with the query,
   * 3 a member or a word starts with it, 4 the name contains it, 5 every word
   * of the query starts a word of the parish or município name, 6 the
   * município's name starts with it. A parish of a município the query names
   * exactly is listed under that município, before everything else.
   */
  rank: number;
}

export interface MunicipalityHit {
  code: string;
  name: string;
  region: string;
  regionName: string;
  /** How many parishes it has (a count of places, from places.json). */
  parishCount: number;
}

export type PlaceHit =
  | { kind: 'municipality'; municipality: MunicipalityHit }
  | ({ kind: 'parish'; underMunicipality: boolean } & SearchHit);

/** Small words a reader may leave out: "moreira conegos" finds "Moreira de Cónegos". */
const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

function tokens(folded: string): string[] {
  const all = folded.split(' ').filter(Boolean);
  const kept = all.filter(word => !STOPWORDS.has(word));
  return kept.length ? kept : all;
}

/** Rank first (Infinity-safe: Infinity − Infinity is NaN), then alphabetical. */
const byRank = (a: SearchHit, b: SearchHit) => (a.rank === b.rank ? 0 : a.rank < b.rank ? -1 : 1);

const byName = (a: SearchHit, b: SearchHit) =>
  byRank(a, b) || a.parish.name.localeCompare(b.parish.name, 'pt') || a.parish.municipalityName.localeCompare(b.parish.municipalityName, 'pt');

function rankParish(parish: Parish, q: string, queryTokens: string[], code: string | null): number {
  if (code && parish.code === code) return 0;
  const names = searchNames(parish.name);
  const [full, ...members] = names;
  if (full === q) return 0;
  if (members.includes(q)) return 1;
  if (full.startsWith(q)) return 2;
  const words = full.split(' ');
  if (members.some(member => member.startsWith(q)) || words.some(word => word.startsWith(q))) return 3;
  if (full.includes(q)) return 4;
  const municipality = fold(parish.municipalityName);
  if (queryTokens.length > 1) {
    const pool = [...words, ...municipality.split(' ')];
    if (queryTokens.every(token => pool.some(word => word.startsWith(token)))) return 5;
  }
  if (municipality.startsWith(q)) return 6;
  return Infinity;
}

/**
 * Search by parish name (and each member of a "União das freguesias"), by a
 * município's name, or by the six-character code, ignoring case, accents,
 * punctuation and the small words (de, da, do, e). When the query is exactly
 * a município's name, that município comes first, followed by all of its
 * parishes; then the other matches. Ties go alphabetical — the order says
 * nothing about the places. `total` is how many parishes matched, so a list
 * cut at `limit` can say so.
 */
export function searchPlaces(index: PlaceIndex, query: string, limit = 12): { hits: PlaceHit[]; total: number } {
  const q = fold(query);
  if (q.length < 2) return { hits: [], total: 0 };
  const code = /^[0-9a-z]{6}$/.test(q) && /\d/.test(q) ? q.toUpperCase() : null;
  const queryTokens = tokens(q);
  const named = index.municipalities.filter(m => fold(m.name) === q);
  const namedCodes = new Set(named.map(m => m.code));

  const under: SearchHit[] = [];
  const others: SearchHit[] = [];
  for (const parish of index.parishes) {
    if (namedCodes.has(parish.municipality)) {
      under.push({ parish, rank: rankParish(parish, q, queryTokens, code) });
      continue;
    }
    const rank = rankParish(parish, q, queryTokens, code);
    if (rank < Infinity) others.push({ parish, rank });
  }
  others.sort(byName);
  // Within a named município, a parish named like the query leads ("viseu":
  // the parish Viseu, then the others alphabetically), never last.
  under.sort(byName);

  const hits: PlaceHit[] = [];
  for (const municipality of named) {
    const region = index.regionById.get(municipality.region);
    const parishes = under.filter(hit => hit.parish.municipality === municipality.code);
    hits.push({
      kind: 'municipality',
      municipality: { ...municipality, regionName: region?.name ?? '', parishCount: parishes.length },
    });
    for (const hit of parishes) hits.push({ kind: 'parish', underMunicipality: true, ...hit });
  }
  // A named município's own parishes are all shown; the rest fill up to the limit.
  const room = Math.max(named.length ? 5 : limit, limit - hits.length);
  for (const hit of others.slice(0, room)) hits.push({ kind: 'parish', underMunicipality: false, ...hit });
  return { hits, total: under.length + others.length };
}

/**
 * The option Enter may choose without the reader pointing at one, when
 * choosing cannot be undone (a guess in the game): only a parish whose code or
 * full name is exactly the query, and only when exactly one is. Otherwise -1:
 * typing a município's name ("Viseu", "Mealhada") and pressing Enter must not
 * spend a guess on a parish the player never picked.
 */
export function exactParishOption(hits: PlaceHit[]): number {
  const exact = hits.flatMap((hit, i) => (hit.kind === 'parish' && hit.rank === 0 ? [i] : []));
  return exact.length === 1 ? exact[0] : -1;
}

/** Parish matches only, in the order `searchPlaces` lists them. */
export function searchParishes(index: PlaceIndex, query: string, limit = 12): SearchHit[] {
  return searchPlaces(index, query, limit).hits
    .filter((hit): hit is Extract<PlaceHit, { kind: 'parish' }> => hit.kind === 'parish')
    .map(({ parish, rank }) => ({ parish, rank }));
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * How far a location may be from the nearest parish point and still be taken
 * as "in" that parish. Beyond it (abroad, at sea) the search says so instead
 * of jumping to a parish hundreds of kilometres away.
 */
export const NEAREST_MAX_KM = 25;

/** sessionStorage key: set by "use my location" just before it opens the parish it found, read once by that page. */
export const NEARBY_KEY = 'estimador:freguesia-perto';

/**
 * The parish whose representative point is closest (a nearest point, not a
 * boundary test), or null when none is within `maxKm`.
 */
export function nearestParish(index: PlaceIndex, point: { lat: number; lon: number }, maxKm = NEAREST_MAX_KM): Parish | null {
  let best: Parish | null = null;
  let bestDistance = Infinity;
  for (const parish of index.parishes) {
    const distance = haversineKm(point, parish);
    if (distance < bestDistance) {
      best = parish;
      bestDistance = distance;
    }
  }
  return bestDistance <= maxKm ? best : null;
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

/**
 * A region inside a sentence, after "of": PT "do distrito de Aveiro", "do
 * distrito do Porto", "da Região Autónoma dos Açores"; EN "the Aveiro
 * district", "the Autonomous Region of the Azores".
 */
export function ofRegion(id: string, name: string, locale: 'pt' | 'en'): string {
  const title = regionTitle(id, name, locale);
  if (locale === 'en') return `the ${title}`;
  if (id === 'azores' || id === 'madeira') return `da ${title}`;
  return `do ${title.charAt(0).toLowerCase()}${title.slice(1)}`;
}

/** How a region is named in a heading. */
export function regionTitle(id: string, name: string, locale: 'pt' | 'en'): string {
  if (id === 'azores') return locale === 'pt' ? 'Região Autónoma dos Açores' : 'Autonomous Region of the Azores';
  if (id === 'madeira') return locale === 'pt' ? 'Região Autónoma da Madeira' : 'Autonomous Region of Madeira';
  // Two district names take an article in Portuguese: "da Guarda", "do Porto".
  const of = name === 'Guarda' ? 'da' : name === 'Porto' ? 'do' : 'de';
  return locale === 'pt' ? `Distrito ${of} ${name}` : `${name} district`;
}
