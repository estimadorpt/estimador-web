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

/** Whole numbers (simulation counts, seats) with the page's grouping: "9000" in pt-PT, "9,000" in en-GB. */
export function formatElectionNumber(value: number, locale: string, digits = 0): string {
  return value.toLocaleString(electionIntlLocale(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/**
 * A probability as a whole percentage. Values that round to 0 or 100 are shown
 * as "<1%" and ">99%": a few thousand simulations cannot support a claim of
 * certainty, or more precision than one point.
 */
export function formatElectionProbability(probability: number, locale: string): string {
  const pct = probability * 100;
  if (pct > 99) return '>99%';
  if (pct < 1) return '<1%';
  return `${Math.round(pct).toLocaleString(electionIntlLocale(locale))}%`;
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
  'CESOP-U.Católica': 'CESOP–Católica',
  'CESOP-UCP': 'CESOP–Católica',
};

export function pollsterDisplayName(name: string): string {
  return POLLSTER_NAMES[name] ?? name;
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

export function formatElectionDate(value: string | Date, locale: string): string {
  return calendarDate(value).toLocaleDateString(electionIntlLocale(locale), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
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

/**
 * Two panels can also disagree because they answer different questions in
 * time: a snapshot at the last poll versus a projection to election day. Name
 * the horizon beside the number rather than letting the ranges look comparable.
 * The archives are past forecasts, so the snapshot is named by its date
 * ("at the last poll"), never as "current".
 */
export function estimateHorizonLabel(kind: 'current' | 'electionDay', locale: string): string {
  const pt = electionLocale(locale) === 'pt';
  return kind === 'current'
    ? (pt ? 'estimativa à data da última sondagem' : 'estimate at the last poll')
    : (pt ? 'previsão para o dia da eleição' : 'forecast for election day');
}
