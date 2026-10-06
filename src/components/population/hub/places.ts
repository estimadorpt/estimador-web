/**
 * Place listings for the population hub and the region pages: regions,
 * municípios and parishes in alphabetical order. Nothing here adds up
 * residents or any generated figure.
 */
import { indexPlaces, regionSlug, regionTitle, type Parish } from '@/lib/population/places';
import type { Locale } from '@/lib/population/labels';
import type { PopulationPlaces } from '@/types/population';

const byName = (a: string, b: string) => a.localeCompare(b, 'pt');

export interface RegionEntry {
  id: string;
  name: string;
  slug: string;
  title: string;
}

const isAutonomous = (id: string) => id === 'azores' || id === 'madeira';

/**
 * The 20 regions: the 18 districts, then the two autonomous regions, each
 * group alphabetical by name ("Distrito da Guarda" files under G, not D-a).
 */
export function regionEntries(places: PopulationPlaces, locale: Locale): RegionEntry[] {
  return places.regions
    .map(([id, name]) => ({ id, name, slug: regionSlug(name), title: regionTitle(id, name, locale) }))
    .sort((a, b) => Number(isAutonomous(a.id)) - Number(isAutonomous(b.id)) || byName(a.name, b.name));
}

export function regionBySlug(places: PopulationPlaces, slug: string): { id: string; name: string } | null {
  const hit = places.regions.find(([, name]) => regionSlug(name) === slug);
  return hit ? { id: hit[0], name: hit[1] } : null;
}

export interface MunicipalityListing {
  code: string;
  name: string;
  parishes: Parish[];
}

/** A region's municípios and their parishes, both alphabetical. */
export function regionListing(places: PopulationPlaces, regionId: string): MunicipalityListing[] {
  const index = indexPlaces(places);
  return index.municipalities
    .filter(m => m.region === regionId)
    .map(m => ({
      code: m.code,
      name: m.name,
      parishes: index.parishes
        .filter(parish => parish.municipality === m.code)
        .sort((a, b) => byName(a.name, b.name)),
    }))
    .sort((a, b) => byName(a.name, b.name));
}

/** Counts use the section's one format helper. */
export { formatCount } from '@/lib/population/format';

/** One parish row of a region table: code, name, INE residents, tier, and 1 when its figures are the município's. */
export type RegionRow = [code: string, name: string, residents: number, tier: 'A' | 'B' | 'C', municipalityFigures: 0 | 1];

export interface RegionTable {
  code: string;
  name: string;
  rows: RegionRow[];
}

/**
 * The region listing cut to the fields its tables print, so a region page
 * hands its table a compact array rather than every parish object
 * (coordinates, households, region names), and rendered rows, twice over in
 * the page's payload. Order is the listing's: alphabetical.
 */
export function regionTables(listing: MunicipalityListing[]): RegionTable[] {
  return listing.map(m => ({
    code: m.code,
    name: m.name,
    rows: m.parishes.map((parish): RegionRow => [parish.code, parish.name, parish.censusPopulation, parish.tier, parish.level === 'municipality' ? 1 : 0]),
  }));
}
