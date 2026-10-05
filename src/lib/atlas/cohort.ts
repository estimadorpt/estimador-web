import type { Lens, Person } from '@/lib/miniatura/population';
import { matches, EMPTY_COHORT, type Cohort } from './population';
import type { Mode } from './journey';

export type SeededQuestion = 'older' | 'compare' | 'people';
export type QuestionDefaults = { region: string; compare: string; mode: Mode; lens: Lens; cohort: Cohort };

/**
 * The scope/cohort/lens a seeded question opens with. Both the prompt buttons
 * and a bookmarked `?question=` link use this, so a shared URL reproduces the
 * same answer instead of only restoring the question's label.
 */
export function questionDefaults(question: SeededQuestion): QuestionDefaults {
  if (question === 'older') return { region: 'Portugal', compare: 'Porto', mode: 'distribution', lens: 'employment', cohort: { age: 3, employment: -1, alone: true } };
  if (question === 'compare') return { region: 'Lisboa', compare: 'Bragança', mode: 'compare', lens: 'age', cohort: EMPTY_COHORT };
  return { region: 'Portugal', compare: 'Porto', mode: 'distribution', lens: 'age', cohort: EMPTY_COHORT };
}

/** A lens that only re-shows an already active filter teaches nothing new (100% one group). */
export function lensRestatesFilter(lens: Lens, cohort: Cohort): boolean {
  return lens === 'age' && cohort.age >= 0;
}

/** The lens actually worth displaying: swap away from one the active filter already answers. */
export function effectiveLens(lens: Lens, cohort: Cohort): Lens {
  return lensRestatesFilter(lens, cohort) ? 'employment' : lens;
}

export type CohortAnswer = {
  total: number;
  matched: number;
  matchedHouseholds: number;
  /** Population within the active age band alone, ignoring the other filters; null with no age filter. */
  ageGroupTotal: number | null;
};

/**
 * Household ids (0–29) are only unique within one region's fixture, not across
 * the national ATLAS_PEOPLE array: two people from different regions can share
 * the same `household` number for physically different households. Counting
 * households nationally must key on region+household, never household alone.
 */
function householdKey(person: Person & { region?: string }): string {
  return person.region !== undefined ? `${person.region}:${person.household}` : String(person.household);
}

/** Counts a cohort against explicit denominators instead of only "n of everyone". */
export function cohortAnswer(population: Person[], cohort: Cohort): CohortAnswer {
  const matched = population.filter(p => matches(p, cohort));
  const ageGroupTotal = cohort.age >= 0 ? population.filter(p => p.band === cohort.age).length : null;
  return { total: population.length, matched: matched.length, matchedHouseholds: new Set(matched.map(householdKey)).size, ageGroupTotal };
}

export type AloneComparison = { total: number; alone: number; withOthers: number };

/**
 * Among the cohort's age group (or the whole scope with no age filter), how many
 * live alone versus with others. This is the non-tautological comparison for the
 * older/alone journey: it does not restate the "living alone" filter as its own answer.
 */
export function aloneComparison(population: Person[], cohort: Cohort): AloneComparison {
  const group = cohort.age >= 0 ? population.filter(p => p.band === cohort.age) : population;
  const alone = group.filter(p => p.size === 1).length;
  return { total: group.length, alone, withOthers: group.length - alone };
}

export function shareOf(count: number, total: number): number {
  return total ? count / total : 0;
}

/** An outcome-shaped sentence for the active filters, e.g. "People aged 65+ living alone". */
export function filterOutcomeLabel(cohort: Cohort, ageLabels: string[], employmentLabels: string[], locale: 'pt' | 'en'): string | null {
  const parts: string[] = [];
  if (cohort.age >= 0) parts.push(locale === 'pt' ? `com ${ageLabels[cohort.age]}` : `aged ${ageLabels[cohort.age]}`);
  if (cohort.employment >= 0) parts.push(employmentLabels[cohort.employment].toLowerCase());
  if (cohort.alone) parts.push(locale === 'pt' ? 'que vivem sozinhas' : 'living alone');
  if (!parts.length) return null;
  const joined = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(parts);
  return locale === 'pt' ? `Pessoas ${joined}` : `People ${joined}`;
}
