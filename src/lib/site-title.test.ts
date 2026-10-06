import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PARISH_META_TARGET, parishPageDescription, parishPageTitle, shortParishName } from './site-title';
import { formatCount } from './population/format';
import { POPULATION_DATA_DIR } from './config/population';

interface Places {
  municipalities: Array<[code: string, name: string, region: string]>;
  parishes: Array<[code: string, name: string, municipality: string, tier: string, level: string, census: number]>;
}

const places: Places = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'places.json'), 'utf8'));
const municipalityName = new Map(places.municipalities.map(([code, name]) => [code, name]));

describe('parish head text (SPV-01)', () => {
  it('drops the union prefix and keeps the article the preposition needs', () => {
    expect(shortParishName('União das freguesias de Milhazes, Vilar de Figos e Faria')).toEqual({ name: 'Milhazes, Vilar de Figos e Faria', article: '' });
    expect(shortParishName('União das freguesias da Ribeira do Neiva')).toEqual({ name: 'Ribeira do Neiva', article: 'a' });
    expect(shortParishName('Aguada de Cima')).toEqual({ name: 'Aguada de Cima', article: '' });
    expect(parishPageTitle('União das freguesias de Milhazes, Vilar de Figos e Faria', 'pt')).toBe('Quem vive em Milhazes, Vilar de Figos e Faria? | estimador.pt');
    expect(parishPageTitle('União das freguesias do Vade', 'pt')).toBe('Quem vive no Vade? | estimador.pt');
    expect(parishPageTitle('União de freguesias da cidade de Santarém', 'en')).toBe('Who lives in cidade de Santarém? | estimador.pt');
  });

  it('uses one separator: the question and the site suffix', () => {
    const title = parishPageTitle('Aguada de Cima', 'pt');
    expect(title).toBe('Quem vive em Aguada de Cima? | estimador.pt');
    expect(title).not.toContain(' · ');
  });

  it('keeps the INE resident count while it fits', () => {
    const description = parishPageDescription({ name: 'Aguada de Cima', municipalityName: 'Águeda', residents: formatCount(3893, 'pt'), locale: 'pt' });
    expect(description).toBe(`Idades, trabalho, escolaridade e agregados em Aguada de Cima (Águeda): população sintética dos Censos 2021. ${formatCount(3893, 'pt')} residentes (INE).`);
  });

  /**
   * Every parish, both locales. A handful of union names are longer than any
   * title can be; those are counted, never cut, and the count may not grow.
   */
  it('keeps every parish title and description within the limits, but for names too long to fit', () => {
    const over = { title: 0, description: 0 };
    let longestDescription = 0;
    for (const [, name, municipality, , , census] of places.parishes) {
      for (const locale of ['pt', 'en']) {
        const title = parishPageTitle(name, locale);
        const description = parishPageDescription({
          name, municipalityName: municipalityName.get(municipality) ?? municipality, residents: formatCount(census, locale as 'pt' | 'en'), locale,
        });
        const { name: short } = shortParishName(name);
        // The fixed parts of the question and suffix are 32 characters at most.
        if (title.length > PARISH_META_TARGET.title) {
          over.title += 1;
          expect(short.length, name).toBeGreaterThan(PARISH_META_TARGET.title - 32);
        }
        if (description.length > PARISH_META_TARGET.description) over.description += 1;
        longestDescription = Math.max(longestDescription, description.length);
      }
    }
    // Was 702 titles over 90 and 1,119 PT descriptions over 160 (round-2 audit);
    // now 184 titles over 70 across both locales (92 union names) and 2 descriptions.
    expect(over.title).toBeLessThanOrEqual(184);
    expect(over.description).toBeLessThanOrEqual(2);
    expect(longestDescription).toBeLessThanOrEqual(172);
  });
});
