import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import { STEP_IDS, tierFor, tierGrid, type TierThresholds } from './rules';

const root = process.cwd();
const release = JSON.parse(readFileSync(path.join(root, 'public/data', POPULATION_DATA_DIR, 'release.json'), 'utf8')) as { quality_tier_policy: { thresholds: TierThresholds } };
const t = release.quality_tier_policy.thresholds;

describe('the methodology’s step anchors', () => {
  for (const locale of ['pt', 'en']) {
    it(`${locale}: has one "### N." heading per step id, in order`, () => {
      const mdx = readFileSync(path.join(root, 'src/content/population-methodology', `${locale}.mdx`), 'utf8');
      const steps = [...mdx.matchAll(/^### ([1-9])\. /gm)].map(m => Number(m[1]));
      expect(steps).toEqual(STEP_IDS.map((_, i) => i + 1));
      // The headings are plain text: the h3 component reads the step number from a string child.
      expect(mdx.match(/^### [1-9]\. .*$/gm)?.filter(h => /[*_`[]/.test(h)) ?? []).toEqual([]);
    });
  }
});

describe('the tier grid', () => {
  it('follows the release’s thresholds', () => {
    expect(tierGrid(t)).toEqual([['C', 'B', 'A'], ['C', 'B', 'B'], ['C', 'C', 'C']]);
  });
  // The third row is any error just above B's limit; a release that moves the thresholds changes the grid, and this test.
  it('puts every parish under B’s floor in C, however good the fit', () => {
    expect(tierFor(t.B.min_population - 1, 0, t)).toBe('C');
    expect(tierFor(t.A.min_population, t.A.max_person_srmse_median, t)).toBe('A');
  });
});
