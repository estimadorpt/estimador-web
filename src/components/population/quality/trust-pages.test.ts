import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { PopulationScorecard } from '@/types/population';
import { CONSTRAINT_LABEL, FITTED_PERSON_KEYS, FITTED_TABLES, GLOSSARY, LIMITATIONS, NOVELTY, PRIVACY_FINDINGS, RELEASE_GATES, SCORED_ONLY_TABLES, constraintLabel, formatFit, generatedGap } from './copy';
import { formatBytes } from '../data/format';
import { METHODOLOGY_ANCHORS, headingSlug, methodologyFieldAnchor } from './anchors';
import type { PopulationPlaces, PopulationReleaseInfo } from '@/types/population';

const root = process.cwd();
const scorecard = JSON.parse(
  readFileSync(path.join(root, 'public/data', POPULATION_DATA_DIR, 'scorecard.json'), 'utf8'),
) as PopulationScorecard;
const mdx = (locale: string) => readFileSync(path.join(root, 'src/content/population-methodology', `${locale}.mdx`), 'utf8');

const pct = (value: number) => value.toFixed(1).replace('.', ',');

describe('quoted privacy and novelty figures', () => {
  it('match the scorecard they quote', () => {
    // The quotation is the producer's rounding; the check only guards drift.
    expect(NOVELTY.pt).toContain(`${pct(scorecard.novelty.person_verbatim_pct)}% das pessoas`);
    expect(NOVELTY.pt).toContain(`${pct(100 - scorecard.novelty.household_novel_pct)}% dos agregados`);
    const dcr = scorecard.privacy.person_dcr as { synthetic_to_seed: { exact_match_rate: number }; seed_leave_one_out: { exact_match_rate: number } };
    const dcrText = PRIVACY_FINDINGS[1].body.pt;
    expect(dcrText).toContain(`${pct(dcr.synthetic_to_seed.exact_match_rate * 100)}%`);
    expect(dcrText).toContain(`${pct(dcr.seed_leave_one_out.exact_match_rate * 100)}%`);
    expect(PRIVACY_FINDINGS[2].body.pt).toContain(scorecard.privacy.person_membership_excess_auc.toFixed(3).replace('-', '−').replace('.', ','));
    expect(PRIVACY_FINDINGS[3].body.pt).toContain(scorecard.privacy.attribute_inference_excess.toFixed(3).replace('-', '−').replace('.', ','));
    expect(scorecard.privacy.status).toBe('pass');
  });

  it('never claim the population is entirely new', () => {
    const all = JSON.stringify([NOVELTY, PRIVACY_FINDINGS, LIMITATIONS, RELEASE_GATES]) + mdx('pt') + mdx('en');
    expect(all).not.toMatch(/100\s?%/);
    expect(all.toLowerCase()).not.toMatch(/\bnovel\b|totalmente nov/);
  });
});

describe('methodology content', () => {
  for (const locale of ['pt', 'en']) {
    it(`${locale}: renders the verbatim pieces from their sources and avoids the banned terms`, () => {
      const text = mdx(locale);
      for (const block of ['<Positioning />', '<Attribution />', '<CiteAs />', '<SingleRun />', '<ProvenanceFields />', '<Limitations />', '<Uses />', '<Novelty />', '<Synthetic />', '<PublicationRules />']) {
        expect(text).toContain(block);
      }
      expect(text.toLowerCase()).not.toContain('foundation model');
      expect(text.toLowerCase()).not.toContain('modelo de fundação');
      expect(text).not.toMatch(/!\s/);
    });
  }
});

describe('formatting', () => {
  it('prints fit statistics with three decimals in the page locale', () => {
    expect(formatFit(0.10410202, 'pt')).toBe('0,104');
    expect(formatFit(0.00812632, 'en')).toBe('0.008');
  });
  it('prints download sizes', () => {
    expect(formatBytes(181_731_672, 'pt')).toBe('181,7 MB');
    expect(formatBytes(668_145, 'pt')).toBe('668 kB');
    expect(formatBytes(573, 'en')).toBe('573 B');
  });
});

const read = <T,>(file: string) => JSON.parse(readFileSync(path.join(root, 'public/data', POPULATION_DATA_DIR, file), 'utf8')) as T;
// The page's code without its comments (which explain why the band reading is not rendered).
const qualityPage = readFileSync(path.join(root, 'src/app/[locale]/populacao/qualidade/page.tsx'), 'utf8')
  .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('no verdict against the pre-registered size-band ranges (MR2-02, round-1 M-15)', () => {
  it('the quality page renders neither the producer’s band reading nor the strata notes', () => {
    // The ranges were set for an out-of-fit check with the earlier engine; the page's errors are in-sample.
    expect(qualityPage).not.toMatch(/band_reading|band_position|note_pt|note_en|bandReading|acceptance/);
    expect(qualityPage).not.toMatch(/melhor do que o previsto|better than expected/);
  });
});

describe('the child-share release gate (POP2-ACC-01)', () => {
  it('states the worst case on the side of the scorecard’s sign', () => {
    const gate = RELEASE_GATES.find(item => item.pt.includes('crianças'))!;
    const above = scorecard.headline.child_deficit.value > 0;
    expect(gate.pt).toContain(above ? '0,01% acima' : '0,01% abaixo');
    expect(gate.en).toContain(above ? '0.01% above' : '0.01% below');
    expect(gate.pt).toContain('−10%');
    expect((scorecard.headline.child_deficit.value * 100).toFixed(2)).toBe('0.01');
  });
});

describe('one name per table (POP2-ACC-V03, MR2-09, PRO2-09)', () => {
  it('labels every scorecard table site-side, with the INE words', () => {
    for (const table of scorecard.constraints) {
      expect(CONSTRAINT_LABEL[table.key], table.key).toBeDefined();
    }
    expect(constraintLabel('p_labour', { pt: 'x', en: 'x' }, 'pt')).toBe('Condição perante o trabalho');
    expect(constraintLabel('p_labour3_income', { pt: 'x', en: 'x' }, 'pt')).toBe('Trabalho × principal meio de vida');
    expect(constraintLabel('p_unknown', { pt: 'Nova', en: 'New' }, 'en')).toBe('New');
    expect(JSON.stringify(Object.values(CONSTRAINT_LABEL))).not.toMatch(/rendimento|income\b/i);
  });

  it('lists the 12 fitted person tables of the chart, and the 21 coverage tables without single-year age', () => {
    expect([...FITTED_PERSON_KEYS].sort()).toEqual(scorecard.constraints.filter(table => table.was_constrained).map(table => table.key).sort());
    const fittedPersons = FITTED_TABLES[FITTED_TABLES.length - 1].pt;
    for (const key of FITTED_PERSON_KEYS) expect(fittedPersons.toLowerCase()).toContain(CONSTRAINT_LABEL[key].pt.toLowerCase());
    // 3 household tables (size, nuclei, accessibility) + 12 person + 6 scored only = the 21 of the coverage gate.
    expect(FITTED_TABLES.some(item => item.pt.includes('cadeira de rodas'))).toBe(true);
    expect(SCORED_ONLY_TABLES.some(item => item.pt.includes('ano a ano'))).toBe(false);
    expect(SCORED_ONLY_TABLES).toHaveLength(5); // the two household-activity tables share an item
  });
});

describe('the glossary names the chart’s statistic and the tier’s apart (MR2-04)', () => {
  it('does not claim the charts summarise person_srmse_median', () => {
    const text = JSON.stringify(GLOSSARY);
    expect(text).not.toContain('o que os gráficos desta página resumem');
    expect(text).toContain('raiz do desvio quadrático médio');
    expect(text).toContain('Erro do ajuste (todas as células)');
    expect(qualityPage).not.toContain('Mediana por freguesia');
  });
});

describe('methodology headings (MR2-10, PRO2-11, PRO2-13, POP2-ACC-04)', () => {
  for (const locale of ['pt', 'en'] as const) {
    const text = mdx(locale);
    const headings = [...text.matchAll(/^## (.+)$/gm)].map(match => match[1]);

    it(`${locale}: every section heading is a question and has an anchor; the shared anchors exist`, () => {
      expect(headings.length).toBeGreaterThan(6);
      for (const heading of headings) expect(heading, heading).toMatch(/\?$/);
      const slugs = headings.map(heading => headingSlug(heading));
      for (const anchor of Object.values(METHODOLOGY_ANCHORS)) expect(slugs).toContain(anchor[locale]);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it(`${locale}: says which releases are citable and what the next one brings`, () => {
      expect(text).toContain('1.0.3');
      expect(text).not.toMatch(/Cada versão estável|Every stable release/);
      expect(text).toMatch(locale === 'pt' ? /próxima versão \(1\.1\) corrige/ : /next release \(1\.1\) corrects/);
      expect(text).not.toMatch(/«exato»|o número exato de agregados|the exact number of households/);
      expect(text).toContain('<AllocationGap />');
      expect(text).toContain('<ShortAttribution />');
    });
  }

  it('gives field rows ids that are the same in both locales', () => {
    expect(methodologyFieldAnchor('living_alone')).toBe('campo-living-alone');
  });
});

describe('the generated total against INE’s (MR2-V02)', () => {
  it('reads the national gap from the release and places.json', () => {
    const release = read<PopulationReleaseInfo>('release.json');
    const places = read<PopulationPlaces>('places.json');
    const ine = places.parishes.reduce((sum, row) => sum + row[5], 0);
    expect(ine - release.counts.persons).toBe(2625);
    const pt = generatedGap(release.counts.persons, ine, 'pt');
    expect(pt).toContain('2 625 pessoas a menos');
    expect(pt).toContain('762 freguesias');
    expect(generatedGap(release.counts.persons, ine, 'en')).toContain('2,625 people fewer');
    // Parishes whose publication count is below INE's: a subset of the 762 that differ.
    const below = places.parishes.filter(row => row[9] < row[5]).length;
    expect(below).toBeGreaterThan(0);
    expect(below).toBeLessThanOrEqual(762);
  });
});

