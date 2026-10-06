import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import { indexPlaces } from '@/lib/population/places';
import type { PopulationPlaces } from '@/types/population';
import { DESCRIPTION_MAX, parishDescription, parishTitle, shortParishName, TITLE_MAX } from './head-text';

const places = indexPlaces(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'places.json'), 'utf8')) as PopulationPlaces);
const SUFFIX = ' | estimador.pt';

describe('parish titles and descriptions (SPV-01)', () => {
  it('keeps every parish title and description within the limits, in both locales', () => {
    for (const parish of places.parishes) {
      for (const locale of ['pt', 'en'] as const) {
        const title = parishTitle(parish.name, locale);
        expect(title.endsWith(SUFFIX)).toBe(true);
        expect(title.length - SUFFIX.length, title).toBeLessThanOrEqual(TITLE_MAX);
        const description = parishDescription({ name: parish.name, municipalityName: parish.municipalityName, censusPopulation: parish.censusPopulation, municipalityFigures: parish.level === 'municipality', locale });
        expect(description.length, description).toBeLessThanOrEqual(DESCRIPTION_MAX);
        expect(description).toContain(parish.municipalityName);
      }
    }
  });

  it('drops the union prefix, keeps short names whole and adds the INE count while it fits', () => {
    expect(shortParishName('União das freguesias de Milhazes, Vilar de Figos e Faria')).toBe('Milhazes, Vilar de Figos e Faria');
    expect(parishTitle('União das freguesias de Milhazes, Vilar de Figos e Faria', 'pt')).toBe('Quem vive em Milhazes, Vilar de Figos e Faria?' + SUFFIX);
    expect(parishTitle('Aguada de Cima', 'pt')).toBe('Quem vive em Aguada de Cima? · População sintética' + SUFFIX);
    const aguada = parishDescription({ name: 'Aguada de Cima', municipalityName: 'Águeda', censusPopulation: 3893, municipalityFigures: false, locale: 'pt' });
    expect(aguada).toBe('Idades, trabalho, escolaridade e agregados em Aguada de Cima (Águeda): população sintética dos Censos 2021. 3 893 residentes (INE).');
  });
});
