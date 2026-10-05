// Number and date formatting for the football pages.
//
// One rule for every football surface: Portuguese pages use pt-PT, English
// pages en-GB, and every calendar date is read in Europe/Lisbon (kickoffs are
// published in UTC; a 23:00Z placeholder is the next day in Lisbon half the
// year). Pure and server-safe so it can be used from server pages and client
// charts alike, and unit tested without a DOM.

export type FootballLocale = 'pt' | 'en';

export const LISBON_TZ = 'Europe/Lisbon';

/** The Intl locale tag for a page locale. Anything that is not 'en' is pt. */
export function intlLocale(locale: string): 'pt-PT' | 'en-GB' {
  return locale === 'en' ? 'en-GB' : 'pt-PT';
}

/** A number with a fixed number of decimals in the page's format ("81,1"). */
export function formatDecimal(value: number, locale: string, digits = 1): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** A whole number with the page's grouping ("50 000" / "50,000"). */
export function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(value);
}

/** A signed number ("+2,7", "−0,4"). Zero gets no sign. */
export function formatSigned(value: number, locale: string, digits = 1): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: 'exceptZero',
  }).format(value);
}

/**
 * A probability (0–1) as a whole percentage, with the guards every table on
 * the site uses: a non-zero value never prints as "0%" and a value short of
 * certain never prints as "100%".
 */
export function formatProbability(p: number, locale: string): string {
  if (!Number.isFinite(p)) return '—';
  if (p > 0 && p < 0.005) return '<1%';
  if (p < 1 && p >= 0.995) return '>99%';
  return `${formatInteger(Math.round(p * 100), locale)}%`;
}

/** True for a bare calendar date ("2026-10-05"), which has no time zone. */
function isDateOnly(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso.trim());
}

function toDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * A calendar date in words ("9 de outubro de 2026" / "9 October 2026").
 * Timestamps are read in Lisbon; a bare date is printed as written (reading
 * it in a zone west of UTC would move it back a day).
 */
export function formatLongDate(
  iso: string | null | undefined,
  locale: string,
  { year = true }: { year?: boolean } = {},
): string {
  if (!iso) return '';
  const d = toDate(iso);
  if (!d) return '';
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'long',
    ...(year ? { year: 'numeric' } : {}),
    timeZone: isDateOnly(iso) ? 'UTC' : LISBON_TZ,
  }).format(d);
}

/** Weekday, date and Lisbon time of a kickoff ("sexta-feira, 9 de outubro às 18:45"). */
export function formatKickoff(iso: string | null | undefined, locale: string): string {
  if (!iso) return '';
  const d = toDate(iso);
  if (!d) return '';
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: LISBON_TZ,
  }).format(d);
}

/** Whole days from `fromIso` to `toIso` (positive when `toIso` is later). */
export function daysBetween(fromIso: string, toIso: string): number | null {
  const a = toDate(fromIso);
  const b = toDate(toIso);
  if (!a || !b) return null;
  return (b.getTime() - a.getTime()) / 86_400_000;
}
