import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR, POPULATION_RELEASE } from '@/lib/config/population';
import { isParishPath } from '@/components/population/parish/head';
import { responsePermalink } from './permalink';
import { parseCanonicalPath } from '@/components/population/consulta/resolve';
import type { ParishRecord, PopulationPlaces, PopulationReleaseInfo } from '@/types/population';
import { parishCitation, releaseCitation } from './cite';
import { indexPlaces } from './places';

const DIR = path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR);
const json = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as T;
const places = json<PopulationPlaces>('places.json');
const index = indexPlaces(places);

describe('household counts are the generated population’s, never INE’s (P-H1)', () => {
  it('names the places.json column generated_households and says where it comes from', () => {
    expect(places.columns).toContain('generated_households');
    expect(places.columns).not.toContain('households');
    expect(places.households_source).toMatch(/generated/);
  });

  it('gives every parish file the facts its hero needs, the same as places.json', () => {
    for (const parish of index.parishes) {
      const record = json<ParishRecord>(`parish/${parish.code}.json`);
      expect(record.place, parish.code).toBeDefined();
      const place = record.place!;
      expect(place.name).toBe(parish.name);
      expect(place.municipality).toBe(parish.municipality);
      expect(place.municipality_name).toBe(parish.municipalityName);
      expect(place.region).toBe(parish.region);
      expect(place.region_name).toBe(parish.regionName);
      expect(place.census_population).toBe(parish.censusPopulation);
      expect(place.generated_households).toBe(parish.generatedHouseholds);
      expect(place.publication_population).toBe(parish.publicationPopulation);
      expect(record.tier).toBe(parish.tier);
    }
  });

  it('decides each tier on the publication count (A and B need 2,000 and 500)', () => {
    for (const parish of index.parishes) {
      if (parish.tier === 'A') expect(parish.publicationPopulation).toBeGreaterThanOrEqual(2000);
      if (parish.tier === 'B') expect(parish.publicationPopulation).toBeGreaterThanOrEqual(500);
    }
  });
});

describe('parish head guard (S-H2)', () => {
  it('applies only while the address is still the parish’s', () => {
    expect(isParishPath('/pt/populacao/freguesia/010103/', '010103')).toBe(true);
    expect(isParishPath('/en/populacao/freguesia/0302fa', '0302FA')).toBe(true);
    expect(isParishPath('/pt/sobre/', '010103')).toBe(false);
    expect(isParishPath('/pt/populacao/', '010103')).toBe(false);
    expect(isParishPath('/pt/populacao/freguesia/010109/', '010103')).toBe(false);
    expect(isParishPath('/pt/populacao/freguesia/zz/', null)).toBe(true);
  });
});

describe('versioned links and citation (P-H2, pro-PP-07)', () => {
  it('copies /populacao/v/{release}/q/{id}, lower case, with /en for English, and reads it back', () => {
    const pt = responsePermalink('https://estimador.pt', 'pt', 'q1_DC0BF3434C913975A9B6');
    expect(pt).toBe(`https://estimador.pt/populacao/v/${POPULATION_RELEASE}/q/q1_dc0bf3434c913975a9b6`);
    const en = responsePermalink('https://estimador.pt', 'en', 'q1_dc0bf3434c913975a9b6');
    expect(en).toBe(`https://estimador.pt/en/populacao/v/${POPULATION_RELEASE}/q/q1_dc0bf3434c913975a9b6`);
    expect(parseCanonicalPath(new URL(en).pathname)).toEqual({ release: POPULATION_RELEASE, id: 'q1_dc0bf3434c913975a9b6', locale: 'en' });
    expect(parseCanonicalPath(new URL(pt).pathname)?.locale).toBeNull();
  });

  it('cites with the release’s own cite line', () => {
    const release = json<PopulationReleaseInfo>('release.json');
    expect(releaseCitation()).toBe(release.attribution.cite_as);
    expect(parishCitation({ name: 'Aguada de Cima', code: '010103', url: 'https://estimador.pt/pt/populacao/freguesia/010103/' }))
      .toBe(`${release.attribution.cite_as} Aguada de Cima (010103): https://estimador.pt/pt/populacao/freguesia/010103/`);
    // The parish address is not versioned, so the copied citation says when it was read (PRO2-10).
    expect(parishCitation({ name: 'Aguada de Cima', code: '010103', url: 'https://estimador.pt/pt/populacao/freguesia/010103/', accessed: '6 out. 2026', locale: 'pt' }))
      .toMatch(/010103\/ \(consultado a 6 out\. 2026\)$/);
    expect(parishCitation({ name: 'Aguada de Cima', code: '010103', url: 'https://estimador.pt/en/populacao/freguesia/010103/', accessed: '6 Oct 2026', locale: 'en' }))
      .toMatch(/010103\/ \(accessed 6 Oct 2026\)$/);
  });
});
