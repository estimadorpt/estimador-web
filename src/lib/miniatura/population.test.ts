import { describe, expect, it } from 'vitest';
import { AGE_BANDS, FIT, HOUSEHOLDS, PEOPLE, SIZES, byAge, bySize, details, distanceFromTarget, fittedCounts } from './population';

describe('the invented neighbourhood', () => {
  it('holds exactly 100 distinct people in 30 households, each with an adult', () => {
    expect(PEOPLE).toHaveLength(100);
    expect(new Set(PEOPLE.map(p => p.id)).size).toBe(100);
    expect(PEOPLE.map(p => p.id)).toEqual(PEOPLE.map((_, i) => i));
    expect(HOUSEHOLDS).toHaveLength(30);
    expect(HOUSEHOLDS.flatMap(h => h.people)).toHaveLength(100);
    for (const home of HOUSEHOLDS) {
      expect(home.people.every(p => p.size === home.people.length)).toBe(true);
      expect(home.people.some(p => p.age >= 18)).toBe(true);
      expect(SIZES).toContain(home.people.length);
    }
  });

  it('recounts the same 100 people by age and by household size', () => {
    for (const groups of [byAge(), bySize()]) {
      expect(groups.flat()).toHaveLength(100);
      expect(new Set(groups.flat().map(p => p.id)).size).toBe(100);
    }
    expect(byAge()).toHaveLength(AGE_BANDS.pt.length);
    expect(bySize().map(g => g.length)).toEqual([5, 10, 15, 20, 50]);
  });

  it('gives no one under 21 a job and no one without a job a commute', () => {
    for (const person of PEOPLE) {
      const info = details(person);
      if (person.age < 21) expect(info.activity).not.toBe(0);
      if (info.activity !== 0) expect(info.commute).toBe(3);
      if (person.age < 15) expect(info.education).toBe(0);
    }
  });
});

describe('the fit, in miniature', () => {
  it('compares tables of the same groups, the target with as many people as the neighbourhood', () => {
    expect(FIT.target).toHaveLength(AGE_BANDS.pt.length);
    expect(FIT.unfitted).toHaveLength(AGE_BANDS.pt.length);
    expect(FIT.target.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('brings the neighbourhood close to its table, and the unfitted draw is clearly further away', () => {
    expect(distanceFromTarget(fittedCounts())).toBeGreaterThan(0);
    expect(distanceFromTarget(fittedCounts())).toBeLessThanOrEqual(3);
    expect(distanceFromTarget(FIT.unfitted)).toBeGreaterThanOrEqual(5 * distanceFromTarget(fittedCounts()));
  });
});
