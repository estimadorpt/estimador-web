import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import { indexPlaces } from '@/lib/population/places';
import { HONESTY, TIER_COPY, tierMeaningFor } from '@/lib/population/labels';
import type { CompactResponse, ParishRecord, PopulationMeta, PopulationPlaces } from '@/types/population';
import { howToReadItems } from './how-to-read';

const DIR = path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR);
const json = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as T;
const meta = json<PopulationMeta>('meta.json');
const index = indexPlaces(json<PopulationPlaces>('places.json'));

function items(code: string, record = json<ParishRecord>(`parish/${code}.json`), locale: 'pt' | 'en' = 'pt') {
  const place = index.byCode.get(code)!;
  const municipalityFigures = place.level === 'municipality' || record.status === 'fallback';
  return howToReadItems({ place, record, meta, locale, fallbackName: record.fallback?.name ?? null, municipalityFigures });
}

describe('how to read a parish page', () => {
  it('describes a tier C parish’s own figures, with no município or suppression wording (030857, day 0 of the game)', () => {
    for (const locale of ['pt', 'en'] as const) {
      const list = items('030857', undefined, locale);
      const text = JSON.stringify(list);
      expect(list[0].term).toBe(TIER_COPY.C.label[locale]);
      const place = index.byCode.get('030857')!;
      expect(text).toContain(JSON.stringify(tierMeaningFor('C', place.publicationPopulation)[locale]).slice(1, -1));
      expect(text).not.toMatch(/concelho|municipality|Suprimido|Suppressed/i);
      expect(text).toContain(locale === 'pt' ? '«0,0%»' : '“0.0%”');
    }
  });

  it('prints «0,0%» once, as the term, and says the tier meaning without repeating itself', () => {
    for (const locale of ['pt', 'en'] as const) {
      const list = items('030857', undefined, locale);
      const zero = list.find(item => item.term === (locale === 'pt' ? '«0,0%»' : '“0.0%”'))!;
      expect(zero.body).not.toContain(zero.term);
      expect(zero.body).toBe(HONESTY.zeroMeaning[locale]);
    }
    expect(TIER_COPY.C.meaning.pt).not.toMatch(/própria freguesia/);
    expect(TIER_COPY.C.meaning.en).not.toMatch(/parish’s own/);
  });

  it('branches the tier wording on the count the tier was decided on (MISS-01)', () => {
    // 0302FA: tier B with fewer than 2,000 residents — told it cannot be A, not that its fit is looser.
    const b = items('0302FA');
    expect(b[0].body).toMatch(/menos de 2\u00a0000 residentes/);
    expect(b[0].body).not.toMatch(/menos apertado/);
    // A tier C parish of 500 or more residents is C for its fit, not its size.
    const bigC = index.parishes.find(p => p.tier === 'C' && p.publicationPopulation >= 500)!;
    expect(items(bigC.code)[0].body).toMatch(/500 ou mais residentes.*idade ano a ano/);
    const smallC = index.parishes.find(p => p.tier === 'C' && p.publicationPopulation < 500)!;
    expect(items(smallC.code)[0].body).toMatch(/fica sempre no nível C/);
    // The single-run line no longer forbids what the page plainly shows; it says the page does not compare.
    expect(JSON.stringify(b)).toMatch(/não compara categorias nem freguesias/);
  });

  it('says what the parish page passes: INE’s count and the worst table from the place header (P101, MR2-03)', () => {
    const page = (code: string) => {
      const record = json<ParishRecord>(`parish/${code}.json`);
      const place = record.place!;
      return howToReadItems({
        place: {
          tier: record.tier,
          municipalityName: place.municipality_name,
          publicationPopulation: place.publication_population,
          censusPopulation: place.census_population,
          worst: { key: place.worst_constraint!, srmse: place.worst_constraint_srmse!, median: place.person_srmse_median! },
        },
        record, meta, locale: 'pt', fallbackName: null, municipalityFigures: false,
      })[0].body;
    };
    // Beiral do Lima: INE 500, the tier's count 499. The page no longer says "500 residentes" and "menos de 500" at once.
    expect(page('160707')).toContain('O INE contou 500 residentes');
    expect(page('160707')).not.toMatch(/^Freguesia com menos de 500 residentes/);
    // Fátima: tier C for single-year age, named with its error.
    expect(page('142106')).toContain('no nível C pela sua pior tabela, idade ano a ano, com um erro de 0,281.');
    // Faia: single-year age and a typical error past tier B's limit; both named, no reassurance (P202).
    expect(page('030408')).toContain('no nível C pelos dois critérios');
    expect(page('030408')).not.toContain('podem estar perto');
  });

  it('holds for every tier', () => {
    for (const code of ['010103', '030857']) {
      const text = JSON.stringify(items(code));
      expect(text).not.toMatch(/Valores do concelho|Suprimido/);
    }
  });

  it('explains suppressed cells and município figures only when a record has them (synthetic)', () => {
    const record = json<ParishRecord>('parish/030857.json');
    const suppressed: CompactResponse = { ...record.responses.elders_alone, cells: [[['no'], 0.9, '90.0%'], [['yes'], null, 'Suprimido', 'cell_below_minimum']] };
    const withSuppressed = { ...record, responses: { ...record.responses, elders_alone: suppressed } };
    expect(JSON.stringify(items('030857', withSuppressed))).toContain('«Suprimido»');
    const municipality = index.byCode.get('030857')!.municipalityName;
    const fallback: ParishRecord = { ...record, status: 'fallback', fallback: { code: '030800', name: municipality } };
    expect(JSON.stringify(items('030857', fallback))).toContain(`concelho de ${municipality}`);
  });
});
