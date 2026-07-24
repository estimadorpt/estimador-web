// Uncertainty rendering primitives for the synthetic-population surfaces.
//
// Two mechanisms, both from doc 26 (LW items) and guardrails G4/G12/G16:
//   1. adaptivePrecision — round each published number to the significant figures
//      its replicate band actually supports, plus a categorical confidence chip.
//      Intervals become credibility, not clutter.
//   2. significanceGuard / claimIsSupported — veto rankings and superlatives whose
//      replicate intervals overlap (you cannot say "the parish with the most X" when
//      the top two bands touch).
//
// HONEST DEGRADATION: until R=3 replicates land, feeds carry n_replicates < 2 and
// no interval. In that regime adaptivePrecision returns confidence 'point' /
// certified=false (render the number without a spurious interval), and the guard
// treats every comparison as NOT distinguishable — so superlatives are hedged
// rather than asserted on evidence we do not yet have. When real intervals arrive
// the same components light up automatically.

import type { ReplicateInterval } from '@/types/populacao';

export type Confidence = 'high' | 'medium' | 'low' | 'point';

export interface AdaptivePrecisionResult {
  display: string;
  rounded: number;
  sigfigs: number;
  halfWidth: number | null;
  confidence: Confidence;
  certified: boolean; // true only when the interval is real (n_replicates >= 2)
}

/** A real, usable replicate interval (>=2 draws, positive width). */
export function hasInterval(x: ReplicateInterval): boolean {
  return (
    x.lo != null &&
    x.hi != null &&
    Number.isFinite(x.lo) &&
    Number.isFinite(x.hi) &&
    x.hi > x.lo &&
    (x.n_replicates ?? 0) >= 2
  );
}

function intlLocale(locale?: 'pt' | 'en'): string {
  return locale === 'en' ? 'en-GB' : 'pt-PT';
}

function formatNumber(value: number, decimals: number, locale?: 'pt' | 'en'): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Round a value to the precision its interval supports and classify confidence.
 *
 * The last shown digit sits at the order of magnitude of the interval half-width:
 * 12 345 ± 820 -> "12 300" (step 100); 12 345 ± 8 200 -> "12 000" (step 1000).
 * With no real interval the value is shown in full and flagged certified=false.
 */
export function adaptivePrecision(
  v: ReplicateInterval,
  locale?: 'pt' | 'en',
): AdaptivePrecisionResult {
  const value = v.value;

  if (!hasInterval(v)) {
    // Point estimate: no certified precision. Show a sensible full-value display
    // (integers plain; fractional values to 3 dp) without inventing an interval.
    const isInt = Number.isInteger(value);
    const decimals = isInt ? 0 : 3;
    return {
      display: formatNumber(value, decimals, locale),
      rounded: value,
      sigfigs: NaN,
      halfWidth: null,
      confidence: 'point',
      certified: false,
    };
  }

  const halfWidth = (v.hi! - v.lo!) / 2;
  // Rounding step = order of magnitude of the half-width (>=1 => integer steps).
  const rawStep = Math.pow(10, Math.floor(Math.log10(halfWidth)));
  const step = rawStep > 0 && Number.isFinite(rawStep) ? rawStep : 1;
  const rounded = Math.round(value / step) * step;

  const decimals = step < 1 ? Math.min(6, Math.round(-Math.log10(step))) : 0;
  const display = formatNumber(rounded, decimals, locale);

  const sigfigs =
    rounded === 0
      ? 1
      : Math.max(1, Math.floor(Math.log10(Math.abs(rounded))) - Math.floor(Math.log10(step)) + 1);

  // Relative half-width -> confidence chip.
  const rel = value !== 0 ? halfWidth / Math.abs(value) : Infinity;
  const confidence: Confidence = rel < 0.05 ? 'high' : rel < 0.15 ? 'medium' : 'low';

  return { display, rounded, sigfigs, halfWidth, confidence, certified: true };
}

// ---- comparative significance ----------------------------------------------

function bounds(x: ReplicateInterval): [number, number] {
  if (hasInterval(x)) return [x.lo!, x.hi!];
  return [x.value, x.value]; // degenerate point
}

/** Do two quantities' intervals overlap (i.e. are they statistically tied)? */
export function overlaps(a: ReplicateInterval, b: ReplicateInterval): boolean {
  const [aLo, aHi] = bounds(a);
  const [bLo, bHi] = bounds(b);
  return !(aHi < bLo || bHi < aLo);
}

/**
 * Is a superlative/ranking claim "top beats runnerUp" statistically supported?
 * Requires BOTH to carry real intervals and top's lower bound to clear runnerUp's
 * upper bound. Returns false whenever we lack the evidence (point estimates) — the
 * caller should hedge the claim, per guardrails G4/G12/G16.
 */
export function claimIsSupported(top: ReplicateInterval, runnerUp: ReplicateInterval): boolean {
  if (!hasInterval(top) || !hasInterval(runnerUp)) return false;
  return top.lo! > runnerUp.hi!;
}

export interface RankedItem<T> {
  rank: number;
  tiedWith: number[]; // original indices of statistically-tied items
  distinguishableFromNext: boolean;
}

/**
 * Annotate a list (descending by value = "most" first) with ranks, statistical
 * ties (overlapping intervals) and whether each item is distinguishable from the
 * next-ranked one. Returned sorted descending; each element keeps its input fields
 * plus an `_index` back-reference to its position in the input array.
 */
export function significanceGuard<T extends ReplicateInterval>(
  items: T[],
): Array<T & RankedItem<T> & { _index: number }> {
  const withIndex = items.map((it, i) => ({ ...it, _index: i }));
  const sorted = [...withIndex].sort((a, b) => b.value - a.value);

  return sorted.map((it, pos) => {
    const next = sorted[pos + 1];
    const distinguishableFromNext = next
      ? hasInterval(it) && hasInterval(next) && it.lo! > next.hi!
      : true;
    const tiedWith = sorted
      .filter((other) => other._index !== it._index && overlaps(it, other))
      .map((other) => other._index);
    return { ...it, rank: pos + 1, tiedWith, distinguishableFromNext };
  });
}
