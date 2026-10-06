// The site's typographic conventions for numbers, in one place (CLAUDE.md,
// "Numbers and ordinals"). Pure and server-safe, so server pages, client
// charts and SVG labels can share them.
//
// - Negatives use the minus sign U+2212 ("−4"), never the ASCII hyphen-minus,
//   which is shorter than a plus sign and breaks lines in some browsers.
// - Portuguese ordinals carry the abbreviation point: "5.º", "1.ª" (never
//   "5º"); English ordinals use the suffix: "5th", "1st".

/** The typographic minus sign (U+2212). */
export const MINUS = '−';

/**
 * Swaps the hyphen-minus in front of a digit for U+2212, for numbers that
 * arrive already formatted ("-0,4" from Intl or toFixed). Hyphens between
 * words ("pós-jogo") and ranges ("1-0") are left alone.
 */
export function withMinus(text: string): string {
  return text.replace(/(^|[\s(\[:=])-(?=\d)/g, `$1${MINUS}`);
}

/**
 * A signed number in the page's format: "+2,7", "−0,4" (U+2212), and zero
 * without a sign. `digits` fixes the number of decimals; Portuguese uses
 * pt-PT, English en-GB.
 */
export function formatSignedNumber(value: number, locale: string, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  const text = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: 'exceptZero',
  }).format(value);
  return withMinus(text);
}

/**
 * An ordinal: "5.º" and "1.ª" in Portuguese (masculine by default: lugar,
 * posição is feminine: "a 5.ª posição"), "5th", "1st", "22nd" in English.
 */
export function ordinal(n: number, locale: string, gender: 'm' | 'f' = 'm'): string {
  if (locale !== 'en') return `${n}.${gender === 'f' ? 'ª' : 'º'}`;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}
