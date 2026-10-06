export type ElectionLocale = 'pt' | 'en';

export function electionLocale(locale: string): ElectionLocale {
  return locale === 'en' ? 'en' : 'pt';
}

/** The Intl locale of the page: pt-PT or en-GB, never the runtime default. */
export function electionIntlLocale(locale: string): 'pt-PT' | 'en-GB' {
  return electionLocale(locale) === 'pt' ? 'pt-PT' : 'en-GB';
}

export function formatElectionPercent(value: number, locale: string, digits = 1): string {
  return (value * 100).toLocaleString(electionIntlLocale(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits }) + '%';
}

/**
 * Numbers with the page's grouping: "9 000" in pt-PT, "9,000" in en-GB.
 * Grouping is forced from four digits, as formatInteger does elsewhere on the
 * site: pt-PT alone would print "9000" beside "50 000".
 */
export function formatElectionNumber(value: number, locale: string, digits = 0): string {
  return value.toLocaleString(electionIntlLocale(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: 'always' });
}

/** A signed value with a true minus and an explicit plus: "+0,22", "−0,04", "0,00". */
export function formatElectionSigned(value: number, locale: string, digits = 2): string {
  const magnitude = formatElectionNumber(Math.abs(value), locale, digits);
  // Zero after rounding carries no sign ("0,00", never "−0,00").
  if (Number(Math.abs(value).toFixed(digits)) === 0) return magnitude;
  return `${value > 0 ? '+' : '−'}${magnitude}`;
}

/**
 * A probability as a whole percentage. Values that round to 0 or 100 are shown
 * as "menos de 1%" and "mais de 99%" ("under 1%" / "over 99%"): a few thousand
 * simulations cannot support a claim of certainty, or more precision than one
 * point. Words, not "<" and ">", in tables as in headlines, so one quantity
 * has one notation and the methodology's promise holds.
 */
export function formatElectionProbability(probability: number, locale: string): string {
  return formatElectionProbabilityText(probability, locale);
}

/**
 * The same probability split for a headline figure: the bound in words
 * ("mais de" / "menos de") and the number. In a display face at 800 the bare
 * "<" and ">" read as chevrons, so the big numbers set the bound as text.
 */
export function electionProbabilityParts(probability: number, locale: string): { bound: string | null; value: string } {
  const pt = electionLocale(locale) === 'pt';
  const pct = probability * 100;
  if (pct > 99) return { bound: pt ? 'mais de' : 'over', value: '99%' };
  if (pct < 1) return { bound: pt ? 'menos de' : 'under', value: '1%' };
  return { bound: null, value: `${Math.round(pct).toLocaleString(electionIntlLocale(locale))}%` };
}

/** The same in running text: "mais de 99%", "menos de 1%", "43%". */
export function formatElectionProbabilityText(probability: number, locale: string): string {
  const { bound, value } = electionProbabilityParts(probability, locale);
  return bound ? `${bound} ${value}` : value;
}

/** A share's interval as a range, "19,7%–23,4%": never "±", which reads as a poll's margin of error. */
export function formatElectionRange(lower: number, upper: number, locale: string, digits = 1): string {
  return `${formatElectionPercent(lower, locale, digits)}–${formatElectionPercent(upper, locale, digits)}`;
}

/** A difference between two shares, in percentage points: "3,0 p.p." / "3.0 pp". */
export function formatElectionPoints(difference: number, locale: string, digits = 1): string {
  return `${formatElectionNumber(difference * 100, locale, digits)} ${electionLocale(locale) === 'pt' ? 'p.p.' : 'pp'}`;
}

/**
 * Pollster names as the archives print them. The exports carry the name each
 * source used ("Pitagorica" without its accent in the 2025 file; "ICS" for one
 * ICS/ISCTE poll in the 2026 file), so one firm is written one way on both
 * archives. The 2026 model estimated a separate effect for "ICS" and
 * "ICS/ISCTE"; that is a data fix for the exporter, not a label.
 */
const POLLSTER_NAMES: Record<string, string> = {
  Pitagorica: 'Pitagórica',
  ICS: 'ICS/ISCTE',
  // The 2025 file writes the firm "GFK"; its own name, and the prose, say "GfK".
  'ICS/ISCTE/GFK Metris': 'ICS/ISCTE/GfK Metris',
  'CESOP-U.Católica': 'CESOP–Católica',
  'CESOP-UCP': 'CESOP–Católica',
};

export function pollsterDisplayName(name: string): string {
  return POLLSTER_NAMES[name] ?? name;
}

/**
 * The pressed state of the archives' toggles and pills (the round switch, the
 * candidate and party chips) without colour: forced-colours mode drops their
 * ink fill, so the pressed one gets a 2px outline in the system colour and
 * every one a transparent border, which forced colours draws as the button's
 * edge (A11Y3-11). Keyboard focus keeps its own ring.
 */
export const PRESSED_IN_FORCED_COLORS = 'forced-colors:aria-pressed:outline-2 forced-colors:aria-pressed:outline-offset-2 forced-colors:aria-pressed:outline-solid';

/**
 * The 2025 parliamentary parties in one order for every party chip, matrix
 * column, bloc card and table twin on the archive (AEE3-06): the forecast's
 * election-day vote share, largest first, which is also the seat chart's
 * order. Parties not listed keep their relative order after these.
 */
export const PARLIAMENTARY_PARTY_ORDER = ['AD', 'PS', 'CH', 'IL', 'L', 'CDU', 'BE', 'PAN'] as const;

export function sortByPartyOrder<T extends string>(parties: readonly T[]): T[] {
  const rank = (party: string) => {
    const i = (PARLIAMENTARY_PARTY_ORDER as readonly string[]).indexOf(party);
    return i === -1 ? PARLIAMENTARY_PARTY_ORDER.length : i;
  };
  return parties.map((party, i) => ({ party, i })).sort((a, b) => rank(a.party) - rank(b.party) || a.i - b.i).map(({ party }) => party);
}

/**
 * The calendar date an ISO string names. The archives store plain dates
 * ("2026-01-18") and local timestamps without a zone ("2026-01-16T21:21:29");
 * both are read as the date written, so a server in another time zone never
 * shifts a forecast to the previous day.
 */
function calendarDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const day = /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0];
  return day ? new Date(`${day}T12:00:00Z`) : new Date(value);
}

/**
 * A date in a table column: "09/01/2026" / "9 Jan 2026". pt-PT's own short
 * pattern leaves the day unpadded ("9/01/2026" under "15/01/2026"), so the
 * Portuguese column is written dd/mm/aaaa and its dates line up (AEE3-07).
 */
export function formatElectionDate(value: string | Date, locale: string): string {
  const date = calendarDate(value);
  return electionLocale(locale) === 'pt'
    ? date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/**
 * A date spelled out, short: "6 fev. 2026" / "6 Feb 2026", for chart ticks
 * and tips, where the page's prose spells dates out (VUXD-05). pt-PT's Intl
 * turns day + short month + year into digits, so the parts are joined here.
 */
export function formatElectionShortDate(value: string | Date, locale: string): string {
  const date = calendarDate(value);
  if (electionLocale(locale) === 'en') {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  const month = date.toLocaleDateString('pt-PT', { month: 'short', timeZone: 'UTC' });
  return `${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`;
}

/** "16 de janeiro de 2026" / "16 January 2026". */
export function formatElectionLongDate(value: string | Date, locale: string): string {
  return calendarDate(value).toLocaleDateString(electionIntlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** "16 de janeiro" / "16 January", for a second date in the same year. */
export function formatElectionDayMonth(value: string | Date, locale: string): string {
  return calendarDate(value).toLocaleDateString(electionIntlLocale(locale), { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

/** The data files publish quantiles, so labels must describe those exact spans. */
export function credibleIntervalLabel(lowerQuantile: number, upperQuantile: number, locale: string): string {
  const coverage = Math.round((upperQuantile - lowerQuantile) * 100);
  // The page's decimal sign: "P2,5" in Portuguese, "P2.5" in English.
  const q = (p: number) => `P${formatElectionNumber(p * 100, locale, Math.round(p * 1000) % 10 === 0 ? 0 : 1)}`;
  const quantiles = `${q(lowerQuantile)}–${q(upperQuantile)}`;
  return electionLocale(locale) === 'pt' ? `Intervalo de credibilidade de ${coverage}% (${quantiles})` : `${coverage}% credible interval (${quantiles})`;
}

/**
 * Two panels can legitimately show different percentages for the same
 * candidate because they use different denominators. State the denominator
 * beside the number instead of letting two visually identical percentages
 * disagree silently.
 */
export function voteShareScopeLabel(scope: 'validVotes' | 'allBallots', locale: string): string {
  const pt = electionLocale(locale) === 'pt';
  return scope === 'validVotes'
    ? (pt ? 'dos votos válidos' : 'of valid votes')
    : (pt ? 'incluindo brancos e nulos' : 'including blank and void ballots');
}
