/**
 * Which level the map shows and how a parish code, a município code or a
 * region id resolves into it. Pure functions; the component holds the state.
 *
 * Levels: the country (20 regions: 18 districts and the two autonomous
 * regions), a region (its municípios), a município (its parishes).
 */
import { normaliseParishCode, regionOfCode } from '@/lib/population/places';

export type MapView =
  | { level: 'country' }
  | { level: 'region'; region: string }
  | { level: 'municipality'; region: string; municipality: string };

export const COUNTRY: MapView = { level: 'country' };

export const REGION_IDS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', 'azores', 'madeira',
] as const;

/** Region names as places.json and the geometry give them, so a breadcrumb reads right before any file arrives. */
export const REGION_NAMES: Record<(typeof REGION_IDS)[number], string> = {
  '01': 'Aveiro', '02': 'Beja', '03': 'Braga', '04': 'Bragança', '05': 'Castelo Branco', '06': 'Coimbra',
  '07': 'Évora', '08': 'Faro', '09': 'Guarda', '10': 'Leiria', '11': 'Lisboa', '12': 'Portalegre',
  '13': 'Porto', '14': 'Santarém', '15': 'Setúbal', '16': 'Viana do Castelo', '17': 'Vila Real', '18': 'Viseu',
  azores: 'Açores', madeira: 'Madeira',
};

export function isRegionId(id: string | null | undefined): id is string {
  return !!id && (REGION_IDS as readonly string[]).includes(id);
}

/** A parish's município (DDCC) — the first four characters of its DICOFRE code, also for the lettered unions ("0302FA"). */
export function municipalityOfParish(code: string): string {
  return code.slice(0, 4);
}

/** A município's region: districts 01–18, the Azores (41–49) and Madeira (31–32). */
export function regionOfMunicipality(code: string): string {
  return regionOfCode(code);
}

/** The view a parish lives in. */
export function viewOfParish(code: string): MapView {
  const municipality = municipalityOfParish(code);
  return { level: 'municipality', region: regionOfMunicipality(municipality), municipality };
}

/**
 * The opening view: a focused parish wins (its município), then a region,
 * then the whole country. Unknown or malformed values fall back silently.
 */
export function resolveInitialView({ initialRegion, focusParish }: { initialRegion?: string; focusParish?: string }): MapView {
  const parish = normaliseParishCode(focusParish);
  if (parish) {
    const view = viewOfParish(parish);
    if (view.level === 'municipality' && isRegionId(view.region)) return view;
  }
  if (isRegionId(initialRegion)) return { level: 'region', region: initialRegion };
  return COUNTRY;
}

export function parentView(view: MapView): MapView | null {
  if (view.level === 'municipality') return { level: 'region', region: view.region };
  if (view.level === 'region') return COUNTRY;
  return null;
}

export function sameView(a: MapView, b: MapView): boolean {
  if (a.level !== b.level) return false;
  if (a.level === 'country') return true;
  if (a.level === 'region') return a.region === (b as typeof a).region;
  return a.municipality === (b as typeof a).municipality;
}

export interface Crumb {
  label: string;
  view: MapView;
}

/** "Portugal › Aveiro › Águeda". */
export function breadcrumb(view: MapView, names: { region: (id: string) => string | undefined; municipality: (code: string) => string | undefined }): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Portugal', view: COUNTRY }];
  if (view.level === 'country') return crumbs;
  const regionLabel = names.region(view.region) ?? (isRegionId(view.region) ? REGION_NAMES[view.region as keyof typeof REGION_NAMES] : view.region);
  crumbs.push({ label: regionLabel, view: { level: 'region', region: view.region } });
  if (view.level === 'municipality') crumbs.push({ label: names.municipality(view.municipality) ?? '…', view });
  return crumbs;
}

export const GEOGRAPHY_PATH = '/data/population-geography';

/** The geometry files a view needs, coarsest first. */
export function geometryFiles(view: MapView): string[] {
  const files = [`${GEOGRAPHY_PATH}/country.json`];
  if (view.level !== 'country') files.push(`${GEOGRAPHY_PATH}/municipalities/${view.region}.json`);
  if (view.level === 'municipality') files.push(`${GEOGRAPHY_PATH}/parishes/${view.municipality}.json`);
  return files;
}

const collator = new Intl.Collator('pt', { sensitivity: 'base' });

/** Alphabetical, Portuguese collation — the only order the map's lists use. */
export function byName<T>(items: T[], name: (item: T) => string): T[] {
  return [...items].sort((a, b) => collator.compare(name(a), name(b)));
}

/** "União das freguesias de A, B e C" → "A, B e C", for a label on the map. */
export function shortParishName(name: string): string {
  return name.replace(/^União das freguesias de /i, '');
}
