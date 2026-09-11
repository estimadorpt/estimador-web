// Locale-aware formatting helpers for the economics "data stories" section and
// the inflation tile. European Portuguese conventions (decimal comma, spaced
// thousands via Intl) when locale === 'pt'; en-US otherwise. Pure and
// dependency-free (no React, no I/O) — usable from server and client alike.
//
// The dashboard's economy-format.ts keeps its original dot-decimal helpers for
// the existing tiles; new surfaces use these.

const DASH = '—';

function ok(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function tag(locale: string): string {
  return locale === 'pt' ? 'pt-PT' : 'en-US';
}

/** Plain localized number. 1.44 → "1,44" (pt) / "1.44" (en). */
export function fmtNumLoc(v: number | null | undefined, locale: string, dp = 1): string {
  if (!ok(v)) return DASH;
  return v.toLocaleString(tag(locale), { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/** Percent (value already in % units). 3.1 → "3,1%" (pt). */
export function fmtPctLoc(v: number | null | undefined, locale: string, dp = 1): string {
  if (!ok(v)) return DASH;
  return `${fmtNumLoc(v, locale, dp)}%`;
}

/** Signed percent (value already in % units). 6.1 → "+6,1%" (pt). */
export function fmtSignedPctLoc(v: number | null | undefined, locale: string, dp = 1): string {
  if (!ok(v)) return DASH;
  return `${v >= 0 ? '+' : ''}${fmtNumLoc(v, locale, dp)}%`;
}

/** Signed percentage points (value already in pp units). 0.1 → "+0,10 p.p.". */
export function fmtSignedPpLoc(v: number | null | undefined, locale: string, dp = 2): string {
  if (!ok(v)) return DASH;
  const unit = locale === 'pt' ? 'p.p.' : 'pp';
  return `${v >= 0 ? '+' : ''}${fmtNumLoc(v, locale, dp)} ${unit}`;
}

/** Euro amount. 638.97 → "638,97 €" (pt) / "€638.97" (en). */
export function fmtEurLoc(v: number | null | undefined, locale: string, dp = 2): string {
  if (!ok(v)) return DASH;
  const n = fmtNumLoc(v, locale, dp);
  return locale === 'pt' ? `${n} €` : `€${n}`;
}

/** Signed euro amount. 59.76 → "+59,76 €". */
export function fmtSignedEurLoc(v: number | null | undefined, locale: string, dp = 2): string {
  if (!ok(v)) return DASH;
  const n = fmtNumLoc(Math.abs(v), locale, dp);
  const s = v >= 0 ? '+' : '−';
  return locale === 'pt' ? `${s}${n} €` : `${s}€${n}`;
}

/** Localized integer with thousands separators. 8017760 → "8 017 760" (pt). */
export function fmtIntLoc(v: number | null | undefined, locale: string): string {
  if (!ok(v)) return DASH;
  return Math.round(v).toLocaleString(tag(locale));
}

/** Millions-of-EUR value shown in billions. 288659.1 → "288,7" (caller adds unit). */
export function meurToBn(v: number | null | undefined, locale: string, dp = 1): string {
  if (!ok(v)) return DASH;
  return fmtNumLoc(v / 1000, locale, dp);
}

/** 'YYYY-MM' (or full ISO date) → "junho de 2026" / "June 2026". */
export function fmtMonthLoc(period: string | null | undefined, locale: string): string {
  if (!period) return DASH;
  const m = /^(\d{4})-(\d{2})/.exec(period);
  if (!m) return period;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return d.toLocaleDateString(tag(locale), { month: 'long', year: 'numeric' });
}

/** 'YYYYQn' or 'YYYY-Qn' → "1.º trimestre de 2026" / "Q1 2026". */
export function fmtQuarterLoc(period: string | null | undefined, locale: string): string {
  if (!period) return DASH;
  const m = /^(\d{4})-?Q(\d)$/i.exec(period.trim());
  if (!m) return period;
  const [, y, q] = m;
  return locale === 'pt' ? `${q}.º trimestre de ${y}` : `Q${q} ${y}`;
}

/** Best-effort period label: quarter, month, full date, or the raw string. */
export function fmtPeriodLoc(period: string | null | undefined, locale: string): string {
  if (!period) return DASH;
  if (/^\d{4}-?Q\d$/i.test(period.trim())) return fmtQuarterLoc(period, locale);
  if (/^\d{4}-\d{2}$/.test(period.trim())) return fmtMonthLoc(period, locale);
  if (/^\d{4}-\d{2}-\d{2}/.test(period.trim())) {
    const d = new Date(period.length <= 10 ? `${period}T00:00:00` : period);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(tag(locale), { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
  return period;
}
