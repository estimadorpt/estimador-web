import type { ReactNode } from 'react';

/** A stable anchor from a heading's text ("O que é ajustado e o que é derivado?" → o-que-e-ajustado-e-o-que-e-derivado). */
export function headingSlug(node: ReactNode): string | undefined {
  const text = typeof node === 'string' ? node : Array.isArray(node) ? node.filter(n => typeof n === 'string').join('') : '';
  if (!text) return undefined;
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * The methodology's anchors other pages link to (MR2-10, PRO2-11): the
 * section that says which fields are fitted and which derived, per locale (the
 * headings are the slugs of the MDX's own "## " lines; a test keeps them in
 * step), and one id per field row, the same in both locales.
 */
export const METHODOLOGY_ANCHORS = {
  fitted: { pt: 'o-que-e-ajustado-e-o-que-e-derivado', en: 'what-is-fitted-and-what-is-derived' },
  tiers: { pt: 'quando-e-que-um-numero-aparece', en: 'when-does-a-figure-appear' },
  cite: { pt: 'como-cito', en: 'how-do-i-cite-it' },
} as const;

export function methodologyFieldAnchor(field: string): string {
  return `campo-${field.replace(/_/g, '-')}`;
}

/** The methodology row a card's "Como foi feito" should open: the field that card groups or derives. */
const RECIPE_FIELD: Record<string, string> = {
  age: 'age_5y',
  education: 'education_level_coarse5',
  employment: 'employment_status_coarse3',
  household_size: 'hh_size_bin',
  household_type: 'hh_type_top',
  elders_alone: 'living_alone',
  who_lives_alone: 'living_alone',
  multigenerational: 'multigenerational',
};

export function methodologyAnchorForRecipe(recipe: string, locale: 'pt' | 'en'): string {
  const field = RECIPE_FIELD[recipe];
  return field ? methodologyFieldAnchor(field) : METHODOLOGY_ANCHORS.fitted[locale];
}
