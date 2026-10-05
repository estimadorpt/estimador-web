import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import { indexPlaces } from '@/lib/population/places';
import { HONESTY, TIER_COPY } from '@/lib/population/labels';
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
      expect(text).toContain(TIER_COPY.C.meaning[locale]);
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
