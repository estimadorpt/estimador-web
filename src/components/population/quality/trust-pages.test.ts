import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { PopulationScorecard } from '@/types/population';
import { LIMITATIONS, NOVELTY, PRIVACY_FINDINGS, RELEASE_GATES, formatFit } from './copy';
import { formatBytes } from '../data/format';
import { bandReading } from './band-reading';

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

describe('size bands against their pre-registered ranges', () => {
  it('quotes the producer’s reading and one shared note, in each locale', () => {
    const pt = bandReading(scorecard, 'pt');
    expect(pt.reading).toBe(scorecard.headline.band_reading?.pt);
    expect(pt.reading).toMatch(/^100% das freguesias/);
    expect(pt.notes).toEqual([{ key: 'all', label: null, note: scorecard.strata[0].note_pt }]);
    expect(pt.notes[0].note).toContain('melhor do que o previsto');
    const en = bandReading(scorecard, 'en');
    expect(en.reading).toBe(scorecard.headline.band_reading?.en);
    expect(en.notes[0].note).toContain('better than expected');
  });

  it('lists the notes per band when they differ', () => {
    const mixed: PopulationScorecard = {
      ...scorecard,
      strata: scorecard.strata.map((stratum, i) => (i === 0 ? { ...stratum, band_position: 'inside', note_pt: 'Dentro do intervalo.', note_en: 'Inside the range.' } : stratum)),
    };
    const notes = bandReading(mixed, 'pt').notes;
    expect(notes).toHaveLength(scorecard.strata.length);
    expect(notes[0]).toEqual({ key: 'lt_500', label: 'Menos de 500 residentes', note: 'Dentro do intervalo.' });
  });

  it('reads nothing from a pre-v1.0.2 scorecard, whose note_pt was a status code', () => {
    const old: PopulationScorecard = {
      ...scorecard,
      headline: { ...scorecard.headline, band_reading: undefined },
      strata: scorecard.strata.map(stratum => ({ ...stratum, band_position: undefined, note_en: undefined, note_pt: 'stop_and_investigate' })),
    };
    expect(bandReading(old, 'pt')).toEqual({ reading: null, notes: [] });
  });
});
