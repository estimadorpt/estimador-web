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

/** The typographic minus sign (U+2212), used for every negative football figure. */
export const MINUS = '\u2212';

/**
 * A number with a fixed number of decimals in the page's format ("81,1"),
 * negatives with U+2212 ("\u22120,4") as formatSigned and formatInteger write
 * them. A negative that rounds to zero prints unsigned ("0,0", not "\u22120,0").
 */
export function formatDecimal(value: number, locale: string, digits = 1): string {
  const abs = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value));
  const negative = value < 0 && (!Number.isFinite(value) || /[1-9]/.test(abs));
  return negative ? `${MINUS}${abs}` : abs;
}

/** The Portuguese thousands separator: a no-break space, as Intl's pt-PT writes it. */
const PT_GROUP = String.fromCharCode(0xa0);

/**
 * A whole number with the page's grouping, from the thousands up: "4 942"
 * and "50 000" in Portuguese (a no-break space; Intl's pt-PT leaves four
 * digits ungrouped), "4,942" in English. The same rule as the population
 * pages' formatCount, so a count reads the same everywhere on the site.
 */
export function formatInteger(value: number, locale: string): string {
  const rounded = Math.round(value);
  const digits = String(Math.abs(rounded));
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'en' ? ',' : PT_GROUP);
  return rounded < 0 ? `${MINUS}${grouped}` : grouped;
}

/** A signed number ("+2,7", "−0,4" with U+2212). Zero gets no sign. */
export function formatSigned(value: number, locale: string, digits = 1): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: 'exceptZero',
  })
    .format(value)
    .replace('-', MINUS);
}

/**
 * The one percentage rule for every football figure: whole numbers from 10%
 * up, one decimal below 10% (so a 2,3% relegation risk does not read "2%" on
 * one page and "2,3%" on another), and guards at both ends: a non-zero value
 * never prints as "0%" and a value short of certain never prints as "100%".
 */
export function formatPercent(p: number, locale: string): string {
  if (!Number.isFinite(p)) return '—';
  if (p <= 0) return '0%';
  if (p >= 1) return '100%';
  if (p < 0.0005) return locale === 'en' ? '<0.1%' : '<0,1%';
  if (p >= 0.995) return '>99%';
  const pct = p * 100;
  if (pct < 9.95) return `${formatDecimal(pct, locale, 1)}%`;
  return `${formatInteger(Math.round(pct), locale)}%`;
}

/** Kept for existing callers: the same rule as formatPercent. */
export function formatProbability(p: number, locale: string): string {
  return formatPercent(p, locale);
}

/**
 * A change in percentage points, from the difference of two raw
 * probabilities (0–1 scale): "+26 pp", "−1,4 pp" (one decimal below
 * 10 pp, U+2212), "0 pp" when it rounds away. Same digits rule as
 * formatPercent.
 */
export function formatPp(delta: number, locale: string): string {
  if (!Number.isFinite(delta)) return '—';
  const pp = delta * 100;
  const abs = Math.abs(pp);
  if (abs < 0.05) return '0 pp';
  return `${formatSigned(pp, locale, abs < 9.95 ? 1 : 0)} pp`;
}

/**
 * The words beside a coloured delta, for screen readers and for anyone who
 * cannot tell the colours apart: "subiu 26 pontos percentuais face à
 * jornada anterior".
 */
export function describePp(delta: number, locale: string, since?: string): string {
  const pt = locale !== 'en';
  const pp = delta * 100;
  const abs = Math.abs(pp);
  if (abs < 0.05) return pt ? 'sem alteração' : 'no change';
  const amount = abs < 9.95 ? formatDecimal(abs, locale, 1) : formatInteger(Math.round(abs), locale);
  const verb = pp > 0 ? (pt ? 'subiu' : 'up') : (pt ? 'desceu' : 'down');
  const unit = pt ? 'pontos percentuais' : 'percentage points';
  return `${verb} ${amount} ${unit}${since ? ` ${since}` : ''}`;
}

/**
 * The one ordinal (audit FA2-M4, UXD2-V03): pt-PT "5.º" (with the full stop,
 * never "5º"), en-GB "5th".
 */
export function formatOrdinal(n: number, locale: string): string {
  if (locale !== 'en') return `${n}.º`;
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

/** The one separator between two clubs in a fixture: "Benfica – Vitória". */
export function matchLabel(home: string, away: string): string {
  return `${home} \u2013 ${away}`;
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

const PT_MONTHS_SHORT = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
const PT_MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const PT_WEEKDAYS_SHORT = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

/** Day, month, year, weekday and time of an instant, in Lisbon. */
function lisbonParts(d: Date, dateOnly = false) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: dateOnly ? 'UTC' : LISBON_TZ,
  }).formatToParts(d);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    day: Number(get('day')),
    month: Number(get('month')),
    year: Number(get('year')),
    weekday: weekdays.indexOf(get('weekday')),
    time: `${get('hour')}:${get('minute')}`,
  };
}

/**
 * A short date ("25 set." / "25 Sept"), read in Lisbon. pt-PT's Intl short
 * month is numeric ("25/09"), so the Portuguese abbreviations are written here.
 */
export function formatShortDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '';
  const d = toDate(iso);
  if (!d) return '';
  if (locale === 'en') {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: isDateOnly(iso) ? 'UTC' : LISBON_TZ }).format(d);
  }
  const p = lisbonParts(d, isDateOnly(iso));
  return `${p.day} ${PT_MONTHS_SHORT[p.month - 1]}`;
}

/**
 * A short kickoff for cards and lists, in Lisbon time: "sex. 9 out. ·
 * 18:45" / "Fri 9 Oct · 18:45". An unconfirmed kickoff shows its day only.
 */
export function formatKickoffShort(
  iso: string | null | undefined,
  locale: string,
  { confirmed = true }: { confirmed?: boolean } = {},
): string {
  if (!iso) return '';
  const d = toDate(iso);
  if (!d) return '';
  const p = lisbonParts(d);
  const day = locale === 'en'
    ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: LISBON_TZ }).format(d).replace(/,/g, '')
    : `${PT_WEEKDAYS_SHORT[p.weekday]} ${p.day} ${PT_MONTHS_SHORT[p.month - 1]}`;
  return confirmed ? `${day} · ${p.time}` : day;
}

/**
 * The calendar span of a set of kickoffs, in Lisbon: "9 a 12 de outubro" /
 * "9–12 October"; across months "30 de setembro a 2 de outubro"; with
 * `short`, "9–12 out." / "9–12 Oct". Empty when nothing parses.
 */
export function formatDateSpan(
  isos: Array<string | null | undefined>,
  locale: string,
  { short = false }: { short?: boolean } = {},
): string {
  const dates = isos
    .map(iso => (iso ? toDate(iso) : null))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return '';
  const pt = locale !== 'en';
  const a = lisbonParts(dates[0]);
  const b = lisbonParts(dates[dates.length - 1]);
  const enMonth = (m: number) =>
    new Intl.DateTimeFormat('en-GB', { month: short ? 'short' : 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m - 1, 15)));
  const month = (m: number) => (pt ? (short ? PT_MONTHS_SHORT[m - 1] : PT_MONTHS[m - 1]) : enMonth(m));
  const sameDay = a.day === b.day && a.month === b.month && a.year === b.year;
  if (sameDay) return pt && !short ? `${a.day} de ${month(a.month)}` : `${a.day} ${month(a.month)}`;
  if (a.month === b.month && a.year === b.year) {
    if (pt && !short) return `${a.day} a ${b.day} de ${month(a.month)}`;
    return `${a.day}–${b.day} ${month(a.month)}`;
  }
  if (pt && !short) return `${a.day} de ${month(a.month)} a ${b.day} de ${month(b.month)}`;
  return `${a.day} ${month(a.month)}–${b.day} ${month(b.month)}`;
}

/** Whole days from `fromIso` to `toIso` (positive when `toIso` is later). */
export function daysBetween(fromIso: string, toIso: string): number | null {
  const a = toDate(fromIso);
  const b = toDate(toIso);
  if (!a || !b) return null;
  return (b.getTime() - a.getTime()) / 86_400_000;
}
