import { describe, expect, it } from 'vitest';
import { ATLAS_PEOPLE, EMPTY_COHORT, regionPeople } from './population';
import { aloneComparison, cohortAnswer, effectiveLens, filterOutcomeLabel, lensRestatesFilter, questionDefaults, shareOf } from './cohort';
import { FIELD_LABELS } from '@/lib/miniatura/population';

const olderAlone = { ...EMPTY_COHORT, age: 3, alone: true };

describe('cohort denominators', () => {
  it('names both the whole-scope share and the age-group share, not just one', () => {
    const population = regionPeople('Portugal');
    const answer = cohortAnswer(population, olderAlone);
    expect(answer.total).toBe(population.length);
    expect(answer.ageGroupTotal).toBe(population.filter(p => p.band === 3).length);
    expect(answer.matched).toBeLessThanOrEqual(answer.ageGroupTotal!);
    expect(answer.matched).toBeGreaterThan(0);
    expect(answer.matchedHouseholds).toBeGreaterThan(0);
    expect(answer.matchedHouseholds).toBeLessThanOrEqual(answer.matched);
  });

  it('has no age-group denominator when age is unfiltered', () => {
    expect(cohortAnswer(ATLAS_PEOPLE, EMPTY_COHORT).ageGroupTotal).toBeNull();
  });

  it('counts households, not just people, and never exceeds the matched people', () => {
    const answer = cohortAnswer(ATLAS_PEOPLE, olderAlone);
    expect(answer.matchedHouseholds).toBeLessThanOrEqual(answer.matched);
  });

  it('does not collapse households that share a raw id across different regions', () => {
    // household ids (0-29) repeat per region in ATLAS_PEOPLE; every "alone" match
    // is its own single-person household, so the national count must equal the
    // number of matched people, not the much smaller count of raw household ids.
    const answer = cohortAnswer(ATLAS_PEOPLE, olderAlone);
    expect(answer.matchedHouseholds).toBe(answer.matched);
  });
});

describe('alone-versus-with-others comparison', () => {
  it('is never 100% one bar the way a filtered age lens would be', () => {
    const comparison = aloneComparison(ATLAS_PEOPLE, olderAlone);
    expect(comparison.alone + comparison.withOthers).toBe(comparison.total);
    expect(comparison.withOthers).toBeGreaterThan(0);
    expect(comparison.alone).toBeGreaterThan(0);
  });

  it('compares the whole scope when no age filter is active', () => {
    const comparison = aloneComparison(ATLAS_PEOPLE, EMPTY_COHORT);
    expect(comparison.total).toBe(ATLAS_PEOPLE.length);
  });

  it('shareOf is defensive against an empty denominator', () => {
    expect(shareOf(5, 0)).toBe(0);
    expect(shareOf(1, 4)).toBe(0.25);
  });
});

describe('lens versus an active filter', () => {
  it('flags the age lens as tautological once age is filtered', () => {
    expect(lensRestatesFilter('age', olderAlone)).toBe(true);
    expect(lensRestatesFilter('age', EMPTY_COHORT)).toBe(false);
    expect(lensRestatesFilter('employment', olderAlone)).toBe(false);
  });

  it('swaps to a lens that still varies within the filtered cohort', () => {
    expect(effectiveLens('age', olderAlone)).toBe('employment');
    expect(effectiveLens('age', EMPTY_COHORT)).toBe('age');
    expect(effectiveLens('transport', olderAlone)).toBe('transport');
  });
});

describe('filter outcome label', () => {
  it('reads as an outcome sentence, not a raw filter dump', () => {
    const label = filterOutcomeLabel(olderAlone, FIELD_LABELS.pt.age, FIELD_LABELS.pt.employment, 'pt');
    expect(label).toContain('65+ anos');
    expect(label).toContain('sozinhas');
    expect(label?.startsWith('Pessoas')).toBe(true);
  });

  it('is null with no active filters', () => {
    expect(filterOutcomeLabel(EMPTY_COHORT, FIELD_LABELS.pt.age, FIELD_LABELS.pt.employment, 'pt')).toBeNull();
  });

  it('mirrors the same shape in English', () => {
    const label = filterOutcomeLabel(olderAlone, FIELD_LABELS.en.age, FIELD_LABELS.en.employment, 'en');
    expect(label?.startsWith('People')).toBe(true);
    expect(label).toContain('living alone');
  });
});

describe('seeded question defaults', () => {
  it('opens the older/alone question with a non-tautological lens, so a bare ?question= link reproduces the answer', () => {
    const defaults = questionDefaults('older');
    expect(defaults.cohort).toEqual(olderAlone);
    expect(defaults.lens).not.toBe('age'); // age is already filtered; a different lens actually varies
    expect(defaults.mode).toBe('distribution');
    const answer = cohortAnswer(regionPeople(defaults.region), defaults.cohort);
    expect(answer.ageGroupTotal).toBeGreaterThan(0);
    expect(answer.matched).toBeGreaterThan(0);
  });

  it('opens the compare question with two distinct places and no filters', () => {
    const defaults = questionDefaults('compare');
    expect(defaults.mode).toBe('compare');
    expect(defaults.region).not.toBe(defaults.compare);
    expect(defaults.cohort).toEqual(EMPTY_COHORT);
  });

  it('opens the people question unfiltered', () => {
    const defaults = questionDefaults('people');
    expect(defaults.cohort).toEqual(EMPTY_COHORT);
    expect(defaults.mode).toBe('distribution');
  });
});
