import type { Locale } from './labels';

/** The Portuguese thousands separator: a no-break space, as Intl's pt-PT writes it. */
const PT_GROUP = String.fromCharCode(0xa0);

/**
 * Whole counts (INE residents and households, release counts, parish totals)
 * in the page's format, grouped from the thousands up: "1 234" and
 * "10 340 441" in Portuguese (a no-break space, so the number never breaks
 * across a line), "1,234" in English. pt-PT's Intl format leaves four-digit
 * numbers ungrouped ("1234"), so the grouping is written here and every
 * population surface uses this one helper. Formatting only: the value is the
 * one given.
 */
export function formatCount(value: number, locale: Locale): string {
  const digits = String(Math.trunc(Math.abs(value)));
  const separator = locale === 'pt' ? PT_GROUP : ',';
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return value < 0 ? `-${grouped}` : grouped;
}
