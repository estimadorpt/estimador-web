// Pure, dependency-free formatting + scale helpers for the economy dashboard.
// Shared by server tiles and client components alike (no React, no I/O).
//
// UNIT CONVENTIONS (do not mix these up):
//  - GDP growth values (point_qoq, GaR quantiles, contributions) are stored as
//    fractions: 0.004 == +0.40%. Use fmtSignedPct (×100) for % display and
//    fmtSignedPp (×100) for "percentage-point" contribution display.
//  - The pulse value is ALREADY in percent units (yoy_gdp_growth_pct): 1.648
//    means 1.65%. Use fmtPctValue / fmtSignedPctValue (NO scaling).
//  - Probabilities are 0..1: 0.086 == 8.6%. Use fmtProbPct (×100).

const DASH = '—';

function ok(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Fraction → signed percent. 0.004 → "+0.40%". */
export function fmtSignedPct(frac: number | null | undefined, dp = 2): string {
  if (!ok(frac)) return DASH;
  const pct = frac * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(dp)}%`;
}

/** Fraction → unsigned percent. 0.004 → "0.40%". */
export function fmtPct(frac: number | null | undefined, dp = 2): string {
  if (!ok(frac)) return DASH;
  return `${(frac * 100).toFixed(dp)}%`;
}

/** Fraction → signed percentage points. -0.00037 → "-0.04pp". */
export function fmtSignedPp(frac: number | null | undefined, dp = 2): string {
  if (!ok(frac)) return DASH;
  const pp = frac * 100;
  return `${pp >= 0 ? '+' : ''}${pp.toFixed(dp)}pp`;
}

/** Probability 0..1 → percent. 0.086 → "9%" (dp 0) or "8.6%" (dp 1). */
export function fmtProbPct(prob: number | null | undefined, dp = 0): string {
  if (!ok(prob)) return DASH;
  return `${(prob * 100).toFixed(dp)}%`;
}

/** Already-percent value → unsigned percent string. 1.648 → "1.6%". */
export function fmtPctValue(v: number | null | undefined, dp = 1): string {
  if (!ok(v)) return DASH;
  return `${v.toFixed(dp)}%`;
}

/** Already-percent value → signed percent string. 1.648 → "+1.6%". */
export function fmtSignedPctValue(v: number | null | undefined, dp = 1): string {
  if (!ok(v)) return DASH;
  return `${v >= 0 ? '+' : ''}${v.toFixed(dp)}%`;
}

/** Plain signed number (for z-score-style sector composites). -0.4838 → "-0.48". */
export function fmtSignedNum(v: number | null | undefined, dp = 2): string {
  if (!ok(v)) return DASH;
  return `${v >= 0 ? '+' : ''}${v.toFixed(dp)}`;
}

/** Correlation / ratio, 2dp, no sign forcing. 0.69 → "0.69". */
export function fmtNum(v: number | null | undefined, dp = 2): string {
  if (!ok(v)) return DASH;
  return v.toFixed(dp);
}

/** Round a 0..100 score to an integer string. 49.7 → "50". */
export function fmtScore(v: number | null | undefined): string {
  if (!ok(v)) return DASH;
  return Math.round(v).toString();
}

/** Already-pp value → signed pp string. -0.536 → "-0.5pp" / "-0,5pp" (NO scaling). */
export function fmtSignedPpValue(v: number | null | undefined, dp = 1, locale = 'en'): string {
  if (!ok(v)) return DASH;
  const s = v.toFixed(dp);
  return `${v >= 0 ? '+' : ''}${locale === 'pt' ? s.replace('.', ',') : s}pp`;
}

/** Signed integer with locale thousands separators. 5727 → "+5,727" / "+5 727". */
export function fmtSignedInt(v: number | null | undefined, locale: string): string {
  if (!ok(v)) return DASH;
  const s = Math.abs(Math.round(v)).toLocaleString(locale === 'pt' ? 'pt-PT' : 'en-US');
  return `${v >= 0 ? '+' : '-'}${s}`;
}

/** Localized long date from an ISO date or datetime string. */
export function fmtDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return DASH;
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Short localized date (e.g. axis ticks). */
export function fmtDateShort(iso: string | null | undefined, locale: string): string {
  if (!iso) return DASH;
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US', {
    month: 'short',
    year: '2-digit',
  });
}

// ---- shared palette (brand teal + stone + semantic) -------------------------

export const COLORS = {
  teal: '#1B4D5E', // brand accent
  tealLight: '#3a7d92',
  stone: '#a8a29e',
  stoneDark: '#57534e',
  stoneFaint: '#e7e5e4',
  grid: '#e7e5e4',
  red: '#b91c1c',
  redSoft: '#ef4444',
  amber: '#b45309',
  green: '#15803d',
  emerald: '#047857',
} as const;

// ---- health verdict scale ---------------------------------------------------
// Fixed anchor bands tying the 0..100 score to a verdict word + color. These
// mirror the backend's documented anchors (a GFC/Troika/COVID-class
// contraction maps near 0; trend growth ~50; a boom ~90-100).

export type VerdictKey =
  | 'contracting'
  | 'softening'
  | 'steady'
  | 'expanding'
  | 'strong';

export function verdictForScore(score: number | null | undefined): VerdictKey {
  if (!ok(score)) return 'steady';
  if (score < 20) return 'contracting';
  if (score < 40) return 'softening';
  if (score < 60) return 'steady';
  if (score < 80) return 'expanding';
  return 'strong';
}

/** Normalize a backend verdict string to a known key (falls back by score). */
export function normalizeVerdict(
  verdict: string | null | undefined,
  score?: number | null
): VerdictKey {
  const v = (verdict ?? '').toLowerCase();
  if (
    v === 'contracting' ||
    v === 'softening' ||
    v === 'steady' ||
    v === 'expanding' ||
    v === 'strong'
  ) {
    return v;
  }
  return verdictForScore(score);
}

export function verdictColor(key: VerdictKey): string {
  switch (key) {
    case 'contracting':
      return COLORS.red;
    case 'softening':
      return COLORS.amber;
    case 'steady':
      return COLORS.stoneDark;
    case 'expanding':
      return COLORS.teal;
    case 'strong':
      return COLORS.emerald;
  }
}

// ---- gauge geometry (semicircle) --------------------------------------------
// Shared so every dial on the page is drawn identically. Angle sweeps 180° (at
// the left, = min) to 0° (at the right, = max) across the top semicircle.

export function polarToXY(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

/** Fraction 0..1 → angle in degrees on the top semicircle (180 → 0). */
export function fracToAngle(frac: number): number {
  const f = Math.max(0, Math.min(1, frac));
  return 180 * (1 - f);
}

/**
 * SVG arc path between two fractions (0..1) of a semicircle gauge.
 * sweep-flag 1 draws left→right along the top.
 */
export function gaugeArcPath(
  cx: number,
  cy: number,
  r: number,
  fromFrac: number,
  toFrac: number
): string {
  const start = polarToXY(cx, cy, r, fracToAngle(fromFrac));
  const end = polarToXY(cx, cy, r, fracToAngle(toFrac));
  const large = Math.abs(toFrac - fromFrac) > 0.5 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}
