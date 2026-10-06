import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR, POPULATION_RELEASE } from '@/lib/config/population';
import { jsonLd, populationDatasetJsonLd } from '@/lib/structured-data';
import type { PopulationReleaseInfo } from '@/types/population';
import { columnDescription, DESCRIPTION_OVERRIDES, INTERNAL_REFERENCE, SITE_LABEL_MAPS } from './dictionary';

const release = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'release.json'), 'utf8')) as PopulationReleaseInfo;

describe('the column dictionary on /dados (X-02)', () => {
  it('shows no internal references (doc numbers, scripts, rulings, CLAUDE.md)', () => {
    for (const table of ['persons', 'households'] as const) {
      for (const [name, column] of Object.entries(release.column_dictionary[table])) {
        const { text } = columnDescription(table, name, column);
        expect(text, `${table}.${name}`).not.toMatch(INTERNAL_REFERENCE);
      }
    }
  });

  it('only overrides columns the release has', () => {
    for (const key of Object.keys(DESCRIPTION_OVERRIDES)) {
      const [table, name] = key.split('.') as ['persons' | 'households', string];
      expect(release.column_dictionary[table][name], key).toBeDefined();
    }
  });
});

describe('the dictionary agrees with the page and the model card (PRO2-04, POP2-ACC-V02, PRO2-03)', () => {
  it('revises the parish code and município name rows, in both tables', () => {
    for (const table of ['persons', 'households'] as const) {
      expect(columnDescription(table, 'freguesia', release.column_dictionary[table].freguesia).text).toContain('6-character');
      expect(columnDescription(table, 'municipio_name', release.column_dictionary[table].municipio_name).text).toContain('INE’s 2021 Census');
    }
  });

  it('never says industry or occupation are per-parish targets', () => {
    for (const name of ['industry_section', 'occupation_major']) {
      const { text, edited } = columnDescription('persons', name, release.column_dictionary.persons[name]);
      expect(edited).toBe(true);
      expect(text).not.toMatch(/per-parish INE target/);
      expect(text).toContain('not fitted');
    }
  });

  it('labels exactly the code columns the release’s label_maps leaves out', () => {
    for (const key of Object.keys(SITE_LABEL_MAPS)) {
      const [table, name] = key.split('.') as ['persons' | 'households', string];
      const column = release.column_dictionary[table][name];
      expect(column, key).toBeDefined();
      expect(column.label_map ?? null, key).toBeNull();
    }
    expect(SITE_LABEL_MAPS['persons.activity_sector_code'].map(entry => entry.code)).toEqual(['1', '2', '3', '4']);
    expect(SITE_LABEL_MAPS['households.nuts2'].map(entry => entry.code)).toEqual(['11', '15', '16', '17', '18', '20', '30']);
  });
});

describe('Dataset JSON-LD for /populacao/dados', () => {
  it('names the release, its licence, its files and its citation', () => {
    const data = populationDatasetJsonLd('pt', release);
    expect(data['@type']).toBe('Dataset');
    expect(data.version).toBe(POPULATION_RELEASE);
    // The synthetic population is CC BY-NC 4.0 (relabelled 2026-10-06); INE's source data stay CC BY 4.0.
    expect(release.license).toBe('CC BY-NC 4.0');
    expect(data.license).toBe('https://creativecommons.org/licenses/by-nc/4.0/');
    expect(data.citation).toBe(release.attribution.cite_as);
    expect((data.distribution as unknown[]).length).toBeGreaterThanOrEqual(4);
    expect(data.creditText).toBe(release.attribution.pt);
    // The release's own counts, grouped like the rest of the site.
    expect(data.description).toContain('3\u00a0092 freguesias dos Censos 2021');
    expect(populationDatasetJsonLd('en', release).description).toContain('3,092 parishes of the 2021 Census');
    expect(jsonLd({ a: '</script>' })).not.toContain('</script>');
  });
});
