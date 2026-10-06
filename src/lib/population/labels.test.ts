import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { ParishRecord, PopulationPlaces, PopulationReleaseInfo } from '@/types/population';
import { parishCitation, releaseCitation } from './cite';
import { RECIPE_COPY, TIER_B_MAX_PERSON_SRMSE_MEDIAN, TIER_B_MAX_WORST_SRMSE, TIER_COPY, tierMeaningFor } from './labels';

const places = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'places.json'), 'utf8')) as PopulationPlaces;
const row = (code: string) => places.parishes.find(parish => parish[0] === code)!;
const parishFile = (code: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'parish', `${code}.json`), 'utf8')) as ParishRecord;
/** The page's call: both counts and the fit (worst table, its error, the typical error) from the parish file's place header. */
const pageMeaning = (code: string) => {
  const { tier, place } = parishFile(code);
  return tierMeaningFor(tier, place!.publication_population, place!.census_population, {
    key: place!.worst_constraint!, srmse: place!.worst_constraint_srmse!, median: place!.person_srmse_median!,
  });
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
    // The map and the game show these words for a named parish they know no fit for: no claim about its answers (P202).
    expect(text.pt).toContain('lê os números com mais cuidado');
    expect(text.pt).not.toContain('podem estar perto');
    expect(text.en).not.toContain('can be close');
  });

  it('names the table that set a tier C parish of 500 or more, from its place header (MR2-03)', () => {
    // Fátima: single-year age, scored apart from the fit, 0.2805… in quality.csv.
    const fatima = pageMeaning('142106');
    expect(fatima.pt).toContain('no nível C pela sua pior tabela, idade ano a ano, com um erro de 0,281.');
    expect(fatima.pt).toContain('as respostas não a usam');
    expect(fatima.en).toContain('in tier C because of its worst table, single-year age, with an error of 0.281.');
    // Its typical error (0.0545) is within tier B's limit: only then may the answers be close to INE's tables.
    expect(fatima.pt).toContain('fica dentro do limiar do nível B, por isso as respostas podem estar perto das tabelas do INE.');
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
    // Single-year age past the limit AND a typical error past tier B's (Faia 0.185, Sarnadas de Ródão 0.186):
    // both criteria named, the care line kept, no claim that the answers may be close (P202).
    for (const code of ['030408', '051103']) {
      const both = pageMeaning(code);
      expect(both.pt, code).toContain('no nível C pelos dois critérios: o erro típico');
      expect(both.pt, code).toContain('a pior tabela, idade ano a ano, com um erro de');
      expect(both.pt, code).toContain('Lê os números com mais cuidado.');
      expect(both.pt, code).not.toContain('podem estar perto');
      expect(both.en, code).toContain('in tier C on both criteria: its typical error');
      expect(both.en, code).not.toContain('can be close');
    }
    expect(pageMeaning('030408').pt).toContain('idade ano a ano, com um erro de 0,634.');
    // A fitted worst table with the typical error past the limit too (Assumar, main source of livelihood).
    expect(pageMeaning('121101').pt).toContain('no nível C pelos dois critérios');
    expect(pageMeaning('121101').pt).toContain('principal meio de vida, com um erro de 1,022.');
    // A file without the typical error says nothing about the answers being close, and keeps the care line.
    const unknown = tierMeaningFor('C', 555, 555, { key: 'srmse_p_age_single', srmse: 0.634 });
    expect(unknown.pt).toMatch(/as respostas não a usam \(mostram a idade em grupos de 5 anos\)\. Lê os números com mais cuidado\.$/);
    expect(unknown.pt).not.toContain('podem estar perto');
    expect(tierMeaningFor('C', 555, 555, { key: 'srmse_p_age_single', srmse: 0.634, median: null }).pt).toBe(unknown.pt);
    // Under 500 on the tier's count the size decides, whatever the worst table (160707 keeps naming both counts).
    expect(pageMeaning('160707').pt).toContain('O INE contou 500 residentes');
    // A code the site does not name falls back to the generic words.
    expect(tierMeaningFor('C', 13212, 13212, { key: 'srmse_p_new', srmse: 0.4 }).pt).toBe(tierMeaningFor('C', 13212, 13212).pt);
  });

  it('reads tier B’s limits from the release (quality_tier_policy)', () => {
    const release = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'release.json'), 'utf8')) as PopulationReleaseInfo & { quality_tier_policy: { thresholds: { B: { max_worst_srmse: number; max_person_srmse_median: number } } } };
    expect(release.quality_tier_policy.thresholds.B.max_worst_srmse).toBe(TIER_B_MAX_WORST_SRMSE);
    expect(release.quality_tier_policy.thresholds.B.max_person_srmse_median).toBe(TIER_B_MAX_PERSON_SRMSE_MEDIAN);
  });

  it('gives every tier C parish of 500 or more its own reason, and the reassurance only where both fit criteria allow it (P202)', () => {
    const counts = { typical: 0, both: 0, worstAgeClose: 0, worstFitted: 0 };
    for (const [code, , , tier, , , , , , publication] of places.parishes) {
      if (tier !== 'C' || publication < 500) continue;
      const { place } = parishFile(code);
      const text = pageMeaning(code).pt;
      const medianOver = place!.person_srmse_median! > TIER_B_MAX_PERSON_SRMSE_MEDIAN;
      if (text.includes('pelo seu erro típico')) counts.typical += 1;
      else if (text.includes('pelos dois critérios')) counts.both += 1;
      else if (text.includes('podem estar perto')) counts.worstAgeClose += 1;
      else if (text.includes('É uma das 12 tabelas de pessoas do ajuste')) counts.worstFitted += 1;
      else throw new Error(`${code}: no reason named`);
      // Never told the answers may be close when the typical error misses tier B's limit.
      if (medianOver) expect(text, code).not.toContain('podem estar perto');
      if (text.includes('podem estar perto')) expect(place!.worst_constraint, code).toBe('srmse_p_age_single');
    }
    // quality.csv v1.0.3: 2 on the typical error alone, 16 on both (10 single-year age, 6 fitted tables),
    // 694 on single-year age with the typical error within tier B's limit, 16 on a fitted worst table alone.
    expect(counts).toEqual({ typical: 2, both: 16, worstAgeClose: 694, worstFitted: 16 });
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
