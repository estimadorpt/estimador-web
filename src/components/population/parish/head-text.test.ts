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
        const title = parishTitle(parish.name, parish.municipalityName, locale);
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
        const title = parishTitle(parish.name, parish.municipalityName, locale).slice(0, -SUFFIX.length);
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

  it('closes a parenthesis it cuts into and steps past a trailing "de" or "e"', () => {
    // Not "Sintra…", which a search result would read as the município.
    expect(parishTitle('União das freguesias de Sintra (Santa Maria e São Miguel, São Martinho e São Pedro de Penaferrim)', 'Sintra', 'pt'))
      .toBe('Sintra (Santa Maria e São Miguel, São Martinho…): população sintética' + SUFFIX);
    expect(parishTitle('União das freguesias de Alandroal (Nossa Senhora da Conceição), São Brás dos Matos (Mina do Bugalho) e Juromenha (Nossa Senhora do Loreto)', 'Alandroal', 'en'))
      .toBe('Alandroal (Nossa Senhora da Conceição), São…: synthetic population' + SUFFIX);
    expect(parishTitle('União das freguesias de Ponte da Barca, Vila Nova de Muía e Paço Vedro de Magalhães', 'Ponte da Barca', 'pt'))
      .toBe('Ponte da Barca, Vila Nova de Muía e Paço Vedro…: população sintética' + SUFFIX);
  });

  it('names the parish (the h1, no question), drops the union prefix, keeps short names whole and adds the INE count while it fits', () => {
    expect(shortParishName('União das freguesias de Milhazes, Vilar de Figos e Faria')).toBe('Milhazes, Vilar de Figos e Faria');
    expect(parishTitle('União das freguesias de Milhazes, Vilar de Figos e Faria', 'Barcelos', 'pt')).toBe('Milhazes, Vilar de Figos e Faria, Barcelos: população sintética' + SUFFIX);
    expect(parishTitle('Aguada de Cima', 'Águeda', 'pt')).toBe('Aguada de Cima, Águeda: população sintética' + SUFFIX);
    expect(parishTitle('Misericórdia', 'Lisboa', 'en')).toBe('Misericórdia, Lisboa: synthetic population' + SUFFIX);
    const aguada = parishDescription({ name: 'Aguada de Cima', municipalityName: 'Águeda', censusPopulation: 3893, municipalityFigures: false, locale: 'pt' });
    expect(aguada).toBe('Idades, trabalho, escolaridade e agregados em Aguada de Cima (Águeda): população sintética dos Censos 2021. 3 893 residentes (INE).');
  });

  it('keeps the article a union name carries in the description, and the bare name in the title (SEO3-04)', () => {
    expect(parishTitle('União das freguesias do Vade', 'Vila Verde', 'pt')).toBe('Vade, Vila Verde: população sintética' + SUFFIX);
    expect(parishTitle('União de freguesias da cidade de Santarém', 'Santarém', 'en')).toBe('cidade de Santarém, Santarém: synthetic population' + SUFFIX);
    expect(parishDescription({ name: 'União das freguesias do Vade', municipalityName: 'Vila Verde', censusPopulation: 1000, municipalityFigures: false, locale: 'pt' }))
      .toMatch(/^Idades, trabalho, escolaridade e agregados na União das freguesias do Vade \(Vila Verde\)/);
  });

  it('writes one separator, no question, and an agreeing preposition in the description for every parish (SEO3-04)', () => {
    // Written out here rather than imported, so the test does not share a mistake with the code.
    const articleOf: Record<string, string> = { do: 'no', da: 'na', dos: 'nos', das: 'nas' };
    let unionsWithArticle = 0;
    for (const parish of places.parishes) {
      for (const locale of ['pt', 'en'] as const) {
        const title = parishTitle(parish.name, parish.municipalityName, locale);
        expect(title.slice(0, -SUFFIX.length), title).not.toContain(' · ');
        expect(title, title).not.toContain('?');
        expect(title, title).not.toMatch(/^União /);
        const description = parishDescription({ name: parish.name, municipalityName: parish.municipalityName, censusPopulation: parish.censusPopulation, municipalityFigures: parish.level === 'municipality', locale });
        if (locale !== 'pt') continue;
        expect(description, description).not.toMatch(/ em União /);
        const union = /^União (?:das|de) freguesias (do|da|dos|das) /i.exec(parish.name);
        if (union) {
          unionsWithArticle++;
          // The full union name is feminine ("na União…"); its short name keeps the article it ends on ("no Vade").
          const agrees = new RegExp(` agregados (?:na União|${articleOf[union[1].toLowerCase()]} )`);
          expect(description, description).toMatch(agrees);
        }
      }
    }
    // The audit counted 18 such unions whose article had been dropped.
    expect(unionsWithArticle).toBeGreaterThanOrEqual(18);
  });
});
