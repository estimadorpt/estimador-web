import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { PopulationScorecard } from '@/types/population';
import { LIMITATIONS, NOVELTY, PRIVACY_FINDINGS, RELEASE_GATES, formatFit } from './copy';
import { formatBytes } from '../data/format';

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
    expect(formatBytes(181_795_845, 'pt')).toBe('181,8 MB');
    expect(formatBytes(667_983, 'pt')).toBe('668 kB');
    expect(formatBytes(573, 'en')).toBe('573 B');
  });
});
