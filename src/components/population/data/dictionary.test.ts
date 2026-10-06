import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR, POPULATION_RELEASE } from '@/lib/config/population';
import { jsonLd, populationDatasetJsonLd } from '@/lib/structured-data';
import type { PopulationReleaseInfo } from '@/types/population';
import { columnDescription, DESCRIPTION_OVERRIDES, INTERNAL_REFERENCE, SITE_LABEL_MAPS, SITE_NOTES } from './dictionary';

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

describe('collective quarters and the household-type answer (round 3: PRO3-10, METH3-20, POP3-ACC-01, POP3-ACC-05)', () => {
  const persons = (name: string) => columnDescription('persons', name, release.column_dictionary.persons[name]).text;

  it('says which person columns are null for every resident of a collective quarter', () => {
    const institutional = persons('is_institutional');
    for (const column of ['nucleus_id', 'sitprof_code', 'activity_sector_code', 'occupation_major', 'occupation_code', 'industry_section', 'work_location_type', 'transport_mode']) {
      expect(institutional, column).toContain(column);
      expect(release.column_dictionary.persons[column], column).toBeDefined();
    }
    expect(institutional).toContain('education imputed');
    expect(persons('nucleus_id')).toMatch(/Null for every resident of a collective living quarter/);
  });

  it('prints no tenure share of its own (the producer’s 0.16% does not reproduce)', () => {
    const tenure = columnDescription('households', 'hh_tenure_code', release.column_dictionary.households.hh_tenure_code).text;
    expect(tenure).not.toMatch(/\d+\.\d+%/);
  });

  it('notes, in both languages, that the household-type answer predates the final packaging', () => {
    for (const key of Object.keys(SITE_NOTES)) {
      const [table, name] = key.split('.') as ['persons' | 'households', string];
      expect(release.column_dictionary[table][name], key).toBeDefined();
    }
    expect(SITE_NOTES['households.hh_type_top'].pt).toContain('empacotamento final dos microdados');
    expect(SITE_NOTES['households.hh_type_top'].en).toContain('final packaging');
    // No figure of the site's own measuring (handoff §3).
    expect(SITE_NOTES['households.hh_type_top'].pt).not.toMatch(/\d/);
  });
});

describe('Dataset JSON-LD for /populacao/dados', () => {
  it('names the release, its licence, its files and its citation', () => {
    const data = populationDatasetJsonLd('pt', release);
    expect(data['@type']).toBe('Dataset');
    expect(data.version).toBe(POPULATION_RELEASE);
    expect(data.license).toBe('https://creativecommons.org/licenses/by/4.0/');
    expect(data.citation).toBe(release.attribution.cite_as);
    expect((data.distribution as unknown[]).length).toBeGreaterThanOrEqual(4);
    expect(data.creditText).toBe(release.attribution.pt);
    // The release's own counts, grouped like the rest of the site.
    expect(data.description).toContain('3\u00a0092 freguesias dos Censos 2021');
    expect(populationDatasetJsonLd('en', release).description).toContain('3,092 parishes of the 2021 Census');
    expect(jsonLd({ a: '</script>' })).not.toContain('</script>');
  });
});
