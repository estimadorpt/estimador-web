import { describe, expect, it } from 'vitest';
import { CANDIDATES, KEPT, TARGET, TARGET_HOUSEHOLDS, TARGET_PEOPLE, countsOf, distance, isMasked, methodExample } from './method-example';

describe('the methodology’s worked example', () => {
  const ex = methodExample();

  it('rules out the households the tables publish as zero (five or more people)', () => {
    expect(CANDIDATES.filter(isMasked).every(h => h.length >= 5)).toBe(true);
    expect(CANDIDATES.length - KEPT.length).toBe(3);
  });

  it('starts away from the tables, with every candidate weighted the same', () => {
    expect(new Set(ex.before.map(w => w.toFixed(9))).size).toBe(1);
    expect(distance(ex.countsBefore)).toBeGreaterThan(3);
  });

  it('the reweighting reproduces both tables', () => {
    ex.countsAfter.sizes.forEach((v, i) => expect(v).toBeCloseTo(TARGET.sizes[i], 6));
    ex.countsAfter.ages.forEach((v, i) => expect(v).toBeCloseTo(TARGET.ages[i], 6));
    expect(ex.after.every(w => w > 0)).toBe(true);
  });

  it('chooses whole households that land on the tables', () => {
    expect(ex.chosen).toHaveLength(TARGET_HOUSEHOLDS);
    expect(new Set(ex.chosen).size).toBe(TARGET_HOUSEHOLDS);
    expect(distance(ex.countsChosen)).toBe(0);
    expect(countsOf(ex.chosen.map(i => ex.kept[i])).ages.reduce((a, b) => a + b, 0)).toBe(TARGET_PEOPLE);
  });
});
