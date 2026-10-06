import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { ParishRecord, PopulationPlaces, PopulationReleaseInfo } from '@/types/population';
import { parishCitation, releaseCitation } from './cite';
import { RECIPE_COPY, TIER_B_MAX_WORST_SRMSE, TIER_COPY, tierMeaningFor } from './labels';

const places = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'places.json'), 'utf8')) as PopulationPlaces;
const row = (code: string) => places.parishes.find(parish => parish[0] === code)!;
const parishFile = (code: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'parish', `${code}.json`), 'utf8')) as ParishRecord;
/** The page's call: both counts and the worst table from the parish file's place header. */
const pageMeaning = (code: string) => {
  const { tier, place } = parishFile(code);
  return tierMeaningFor(tier, place!.publication_population, place!.census_population, { key: place!.worst_constraint!, srmse: place!.worst_constraint_srmse! });
};

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

  it('names the table that set a tier C parish of 500 or more, from its place header (MR2-03)', () => {
    // Fátima: single-year age, scored apart from the fit, 0.2805… in quality.csv.
    const fatima = pageMeaning('142106');
    expect(fatima.pt).toContain('no nível C pela sua pior tabela, idade ano a ano, com um erro de 0,281.');
    expect(fatima.pt).toContain('as respostas não a usam');
    expect(fatima.en).toContain('in tier C because of its worst table, single-year age, with an error of 0.281.');
    // A fitted table (activity sector): no claim that the answers do not use it.
    const sector = pageMeaning('021117');
    expect(sector.pt).toContain('setor de atividade (quatro grandes grupos), com um erro de 1,360.');
    expect(sector.pt).toContain('É uma das 12 tabelas de pessoas do ajuste');
    expect(sector.pt).not.toContain('não a usam');
    // Worst table within tier B's limit: C on the typical error, said without a comparison.
    for (const code of ['030406', '030915']) {
      const typical = pageMeaning(code);
      expect(typical.pt, code).toContain('no nível C pelo seu erro típico');
      expect(typical.pt, code).not.toContain('pela sua pior tabela');
      expect(typical.en, code).toContain('because of its typical error');
    }
    // Under 500 on the tier's count the size decides, whatever the worst table (160707 keeps naming both counts).
    expect(pageMeaning('160707').pt).toContain('O INE contou 500 residentes');
    // A code the site does not name falls back to the generic words.
    expect(tierMeaningFor('C', 13212, 13212, { key: 'srmse_p_new', srmse: 0.4 }).pt).toBe(tierMeaningFor('C', 13212, 13212).pt);
  });

  it('reads tier B’s worst-table limit from the release (quality_tier_policy)', () => {
    const release = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'release.json'), 'utf8')) as PopulationReleaseInfo & { quality_tier_policy: { thresholds: { B: { max_worst_srmse: number } } } };
    expect(release.quality_tier_policy.thresholds.B.max_worst_srmse).toBe(TIER_B_MAX_WORST_SRMSE);
  });

  it('gives every tier C parish of 500 or more its own reason, one of the three wordings', () => {
    let named = 0;
    for (const [code, , , tier, , , , , , publication] of places.parishes) {
      if (tier !== 'C' || publication < 500) continue;
      const text = pageMeaning(code).pt;
      expect(text, code).toMatch(/pela sua pior tabela|pelo seu erro típico/);
      named += 1;
    }
    expect(named).toBe(728);
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
