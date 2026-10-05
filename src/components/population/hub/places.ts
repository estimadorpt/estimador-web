/**
 * Place listings for the population hub and the region pages: regions,
 * municípios and parishes in alphabetical order, and counts of places by
 * publication level. Counting places is metadata; nothing here adds up
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

/** How many parishes show their own figures, and how many show their município's. */
export function levelCounts(places: PopulationPlaces): { parish: number; municipality: number; total: number } {
  let parish = 0;
  let municipality = 0;
  for (const row of places.parishes) {
    if (row[4] === 'p') parish += 1;
    else municipality += 1;
  }
  return { parish, municipality, total: places.parishes.length };
}

/**
 * Whole numbers in the page's format, grouped from the thousands up:
 * "3 092" in Portuguese (narrow no-break space), "3,092" in English.
 * Formatting only; the value is the one given.
 */
export function formatCount(value: number, locale: Locale): string {
  const digits = String(Math.trunc(Math.abs(value)));
  const separator = locale === 'pt' ? ' ' : ',';
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return value < 0 ? `-${grouped}` : grouped;
}
