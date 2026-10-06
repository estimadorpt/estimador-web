import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { PopulationPlaces } from '@/types/population';
import { parishCitation, releaseCitation } from './cite';
import { RECIPE_COPY, TIER_COPY, tierMeaningFor } from './labels';

const places = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'places.json'), 'utf8')) as PopulationPlaces;
const row = (code: string) => places.parishes.find(parish => parish[0] === code)!;

describe('tier wording', () => {
  it('names both counts where INE’s and the tier’s sit on either side of 500 (Beiral do Lima, 160707)', () => {
    const [, , , tier, , census, , , , publication] = row('160707');
    expect([tier, census, publication]).toEqual(['C', 500, 499]);
    const text = tierMeaningFor(tier, publication, census);
    expect(text.pt).toContain('O INE contou 500 residentes');
    expect(text.pt).toContain('que aqui é de 499');
    expect(text.pt).not.toMatch(/^Freguesia com menos de 500 residentes/);
    expect(text.en).toContain('INE counted 500 residents');
    // Without INE's count, the generic sentence (callers that have not passed it yet).
    expect(tierMeaningFor(tier, publication).pt).toMatch(/^Freguesia com menos de 500 residentes/);
  });

  it('is the only parish whose two counts straddle a tier threshold', () => {
    const straddles = places.parishes.filter(([, , , , , census, , , , publication]) =>
      [500, 2000].some(threshold => publication < threshold && census >= threshold));
    expect(straddles.map(parish => parish[0])).toEqual(['160707']);
  });

  it('says a tier C parish of 500 or more is C for its worst table, usually single-year age (MR2-03, Fátima 142106)', () => {
    const [, , , tier, , census, , , , publication] = row('142106');
    expect(tier).toBe('C');
    const text = tierMeaningFor(tier, publication, census);
    expect(text.pt).toContain('idade ano a ano');
    expect(text.pt).not.toContain('abaixo dos limiares');
    expect(text.en).toContain('single-year age');
    expect(TIER_COPY.C.meaning.pt).not.toContain('abaixo dos limiares');
  });

  it('says each age band adds up to 100% in “who lives alone” (POP2-ACC-08)', () => {
    expect(RECIPE_COPY.who_lives_alone.population.pt).toContain('cada faixa etária soma 100% por si');
    expect(RECIPE_COPY.who_lives_alone.population.en).toContain('each age band adds up to 100% on its own');
  });
});

describe('parish citation (PRO2-10)', () => {
  const base = { name: 'Moreira de Cónegos', code: '030831', url: 'https://estimador.pt/pt/populacao/freguesia/030831/' };
  it('adds the day it was read', () => {
    expect(parishCitation({ ...base, accessed: '2026-10-06' })).toBe(`${releaseCitation()} Moreira de Cónegos (030831): ${base.url} (consultado a 2026-10-06)`);
    expect(parishCitation({ ...base, accessed: '2026-10-06', locale: 'en' })).toMatch(/\(accessed 2026-10-06\)$/);
  });
  it('keeps the old form without a valid date', () => {
    expect(parishCitation(base)).toBe(`${releaseCitation()} Moreira de Cónegos (030831): ${base.url}`);
    expect(parishCitation({ ...base, accessed: 'ontem' })).toBe(`${releaseCitation()} Moreira de Cónegos (030831): ${base.url}`);
  });
});
