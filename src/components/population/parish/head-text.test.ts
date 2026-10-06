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

  it('never ends a cut name on a function word or leaves a "(" open, in either locale (S-08)', () => {
    // The words a cut must not end on, written out here rather than imported,
    // so the test does not share a mistake with the code.
    const dangling = /(?:^|\s)(?:e|de|da|do|das|dos|and|of)…/i;
    const balanced = (text: string) => {
      let depth = 0;
      for (const ch of text) {
        if (ch === '(') depth++;
        else if (ch === ')' && --depth < 0) return false;
      }
      return depth === 0;
    };
    let cut = 0;
    for (const parish of places.parishes) {
      for (const locale of ['pt', 'en'] as const) {
        const title = parishTitle(parish.name, locale).slice(0, -SUFFIX.length);
        const description = parishDescription({ name: parish.name, municipalityName: parish.municipalityName, censusPopulation: parish.censusPopulation, municipalityFigures: parish.level === 'municipality', locale });
        for (const text of [title, description]) {
          if (text.includes('…')) cut++;
          expect(text, text).not.toMatch(dangling);
          expect(balanced(text), text).toBe(true);
        }
      }
    }
    // The check runs over real cuts: about 45 parishes have a long union name.
    expect(cut).toBeGreaterThan(40);
  });

  it('steps a cut back out of an open parenthesis and past a trailing "de" or "e"', () => {
    expect(parishTitle('União das freguesias de Sintra (Santa Maria e São Miguel, São Martinho e São Pedro de Penaferrim)', 'pt'))
      .toBe('Quem vive em Sintra…?' + SUFFIX);
    expect(parishTitle('União das freguesias de Alandroal (Nossa Senhora da Conceição), São Brás dos Matos (Mina do Bugalho) e Juromenha (Nossa Senhora do Loreto)', 'en'))
      .toBe('Who lives in Alandroal (Nossa Senhora da Conceição), São Brás…?' + SUFFIX);
    expect(parishTitle('União das freguesias de Ponte da Barca, Vila Nova de Muía e Paço Vedro de Magalhães', 'pt'))
      .toBe('Quem vive em Ponte da Barca, Vila Nova de Muía e Paço Vedro…?' + SUFFIX);
  });

  it('drops the union prefix, keeps short names whole and adds the INE count while it fits', () => {
    expect(shortParishName('União das freguesias de Milhazes, Vilar de Figos e Faria')).toBe('Milhazes, Vilar de Figos e Faria');
    expect(parishTitle('União das freguesias de Milhazes, Vilar de Figos e Faria', 'pt')).toBe('Quem vive em Milhazes, Vilar de Figos e Faria?' + SUFFIX);
    expect(parishTitle('Aguada de Cima', 'pt')).toBe('Quem vive em Aguada de Cima? · População sintética' + SUFFIX);
    const aguada = parishDescription({ name: 'Aguada de Cima', municipalityName: 'Águeda', censusPopulation: 3893, municipalityFigures: false, locale: 'pt' });
    expect(aguada).toBe('Idades, trabalho, escolaridade e agregados em Aguada de Cima (Águeda): população sintética dos Censos 2021. 3 893 residentes (INE).');
  });
});
