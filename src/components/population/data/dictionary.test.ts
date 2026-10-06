import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR, POPULATION_RELEASE } from '@/lib/config/population';
import { jsonLd, populationDatasetJsonLd } from '@/lib/structured-data';
import type { PopulationReleaseInfo } from '@/types/population';
import { columnDescription, DESCRIPTION_OVERRIDES, INTERNAL_REFERENCE } from './dictionary';

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
