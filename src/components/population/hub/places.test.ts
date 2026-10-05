import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { PopulationMeta, PopulationPlaces } from '@/types/population';
import { formatCount, regionBySlug, regionEntries, regionListing } from './places';

const DIR = path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR);
const places = JSON.parse(readFileSync(path.join(DIR, 'places.json'), 'utf8')) as PopulationPlaces;
const meta = JSON.parse(readFileSync(path.join(DIR, 'meta.json'), 'utf8')) as PopulationMeta;

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

  it('gives every parish its own figures and a tier, matching the release counts the hub shows', () => {
    expect(places.parishes).toHaveLength(meta.counts.parishes);
    expect(places.parishes.every(row => row[4] === 'p')).toBe(true);
    const tiers = { A: 0, B: 0, C: 0 } as Record<string, number>;
    for (const row of places.parishes) tiers[row[3]] += 1;
    expect(tiers).toEqual(meta.counts.tiers);
    expect(meta.counts.tiers).toEqual({ A: 776, B: 705, C: 1611 });
  });

  it('groups whole numbers in each locale', () => {
    expect(formatCount(3092, 'pt')).toBe('3 092');
    expect(formatCount(10340441, 'pt')).toBe('10 340 441');
    expect(formatCount(3092, 'en')).toBe('3,092');
    expect(formatCount(987, 'pt')).toBe('987');
  });
});
