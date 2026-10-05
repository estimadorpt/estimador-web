import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PopulationPlaces } from '@/types/population';
import { formatCount, levelCounts, regionBySlug, regionEntries, regionListing } from './places';

const places = JSON.parse(
  readFileSync(path.join(process.cwd(), 'public/data/population/v1.0.0/places.json'), 'utf8'),
) as PopulationPlaces;

describe('population hub places', () => {
  it('lists 20 regions with unique slugs: districts, then autonomous regions, alphabetical', () => {
    for (const locale of ['pt', 'en'] as const) {
      const regions = regionEntries(places, locale);
      expect(regions).toHaveLength(20);
      expect(new Set(regions.map(r => r.slug)).size).toBe(20);
      const districts = regions.slice(0, 18).map(r => r.name);
      expect([...districts].sort((a, b) => a.localeCompare(b, 'pt'))).toEqual(districts);
      expect(regions.slice(18).map(r => r.id)).toEqual(['azores', 'madeira']);
    }
    const pt = regionEntries(places, 'pt');
    expect(pt.map(r => r.slug)).toEqual(expect.arrayContaining(['acores', 'evora', 'braganca', 'viana-do-castelo']));
    expect(pt.map(r => r.title)).toEqual(expect.arrayContaining(['Distrito da Guarda', 'Distrito do Porto', 'Distrito de Évora']));
  });

  it('resolves every slug back to its region', () => {
    for (const region of regionEntries(places, 'pt')) {
      expect(regionBySlug(places, region.slug)?.id).toBe(region.id);
    }
    expect(regionBySlug(places, 'atlantida')).toBeNull();
  });

  it('places every parish in exactly one region listing', () => {
    const codes = places.regions.flatMap(([id]) => regionListing(places, id).flatMap(m => m.parishes.map(p => p.code)));
    expect(codes).toHaveLength(places.parishes.length);
    expect(new Set(codes).size).toBe(places.parishes.length);
    const braganca = regionListing(places, '04');
    expect(braganca.flatMap(m => m.parishes)).toHaveLength(226);
    const names = braganca.map(m => m.name);
    expect([...names].sort((a, b) => a.localeCompare(b, 'pt'))).toEqual(names);
  });

  it('counts places by publication level', () => {
    const counts = levelCounts(places);
    expect(counts.total).toBe(3092);
    expect(counts.parish + counts.municipality).toBe(3092);
  });

  it('groups whole numbers in each locale', () => {
    expect(formatCount(3092, 'pt')).toBe('3 092');
    expect(formatCount(10340441, 'pt')).toBe('10 340 441');
    expect(formatCount(3092, 'en')).toBe('3,092');
    expect(formatCount(987, 'pt')).toBe('987');
  });
});
