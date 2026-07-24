// Behavioural lock for the uncertainty primitives (adaptive precision + the
// comparative-significance guard). These tests pin the two mechanisms and their
// HONEST DEGRADATION path: with no real replicate interval (n_replicates < 2 or
// missing lo/hi) numbers show in full as uncertified point estimates, and the
// guard treats every comparison as NOT distinguishable so superlatives hedge.
//
// Assertions on `display` normalise whitespace because pt-PT uses U+00A0 as the
// thousands separator (see `norm`); numeric behaviour is pinned on `rounded`.

import { describe, expect, it } from 'vitest';
import {
  adaptivePrecision,
  significanceGuard,
  claimIsSupported,
  overlaps,
  hasInterval,
} from './uncertainty';
import type { ReplicateInterval } from '@/types/populacao';

/** Collapse every unicode space (incl. NBSP U+00A0) to a plain space. */
const norm = (s: string) => s.replace(/\s/g, ' ');

/** Build a value ± halfWidth interval with a given replicate count. */
const band = (value: number, half: number, n = 3): ReplicateInterval => ({
  value,
  lo: value - half,
  hi: value + half,
  n_replicates: n,
});

describe('hasInterval', () => {
  it('accepts a real interval (>=2 replicates, positive width)', () => {
    expect(hasInterval(band(12345, 820))).toBe(true);
  });

  it('rejects a single-replicate feed (point regime)', () => {
    expect(hasInterval({ value: 100, lo: 90, hi: 110, n_replicates: 1 })).toBe(false);
  });

  it('rejects a missing bound', () => {
    expect(hasInterval({ value: 100, hi: 110, n_replicates: 3 })).toBe(false);
    expect(hasInterval({ value: 100, lo: 90, n_replicates: 3 })).toBe(false);
  });

  it('rejects a zero/degenerate-width interval', () => {
    expect(hasInterval({ value: 100, lo: 100, hi: 100, n_replicates: 3 })).toBe(false);
    expect(hasInterval({ value: 100, lo: 110, hi: 90, n_replicates: 3 })).toBe(false);
  });

  it('rejects non-finite bounds', () => {
    expect(hasInterval({ value: 100, lo: 90, hi: Infinity, n_replicates: 3 })).toBe(false);
    expect(hasInterval({ value: 100, lo: NaN, hi: 110, n_replicates: 3 })).toBe(false);
  });

  it('treats a missing n_replicates as 0 (point regime)', () => {
    expect(hasInterval({ value: 100, lo: 90, hi: 110 })).toBe(false);
  });
});

describe('adaptivePrecision — real interval', () => {
  it('rounds to the order of magnitude of the half-width: 12345 ± 820 -> "12 300"', () => {
    const r = adaptivePrecision(band(12345, 820), 'pt');
    expect(r.rounded).toBe(12300);
    expect(norm(r.display)).toBe('12 300');
    expect(r.certified).toBe(true);
    expect(r.halfWidth).toBe(820);
  });

  it('a wider band rounds coarser: 12345 ± 8200 -> "12 000"', () => {
    const r = adaptivePrecision(band(12345, 8200), 'pt');
    expect(r.rounded).toBe(12000);
    expect(norm(r.display)).toBe('12 000');
    expect(r.certified).toBe(true);
  });

  it('picks the confidence chip from the relative half-width', () => {
    // rel < 0.05 -> high  (200/12345 = 0.0162)
    expect(adaptivePrecision(band(12345, 200)).confidence).toBe('high');
    // rel < 0.15 -> medium  (820/12345 = 0.066)
    expect(adaptivePrecision(band(12345, 820)).confidence).toBe('medium');
    // else -> low  (8200/12345 = 0.664)
    expect(adaptivePrecision(band(12345, 8200)).confidence).toBe('low');
  });

  it('is exclusive at the confidence thresholds (rel == 0.05 is not high)', () => {
    // half = 0.05 * value exactly -> rel == 0.05, NOT < 0.05 -> medium
    expect(adaptivePrecision(band(10000, 500)).confidence).toBe('medium');
    // half = 0.15 * value exactly -> rel == 0.15, NOT < 0.15 -> low
    expect(adaptivePrecision(band(10000, 1500)).confidence).toBe('low');
  });

  it('reports a positive sigfig count for a certified value', () => {
    const r = adaptivePrecision(band(12345, 820));
    expect(r.sigfigs).toBeGreaterThanOrEqual(1);
    expect(Number.isNaN(r.sigfigs)).toBe(false);
  });

  it('handles sub-unit half-widths with fractional display (SRMSE-style)', () => {
    // 0.089 ± 0.004 -> step 0.001 -> rounded 0.089, high precision
    const r = adaptivePrecision(band(0.089, 0.004), 'pt');
    expect(r.rounded).toBeCloseTo(0.089, 6);
    expect(norm(r.display)).toBe('0,089');
    expect(r.certified).toBe(true);
    expect(r.confidence).toBe('high'); // 0.004/0.089 = 0.045 -> rel < 0.05
  });

  it('formats en-GB with a comma thousands separator', () => {
    const r = adaptivePrecision(band(12345, 820), 'en');
    expect(r.display).toBe('12,300');
  });

  it('handles a signed negative value (child deficit -0.017 ± 0.004)', () => {
    // step 0.001 -> rounded -0.017; rel = 0.004/0.017 = 0.235 -> low
    const r = adaptivePrecision(band(-0.017, 0.004), 'pt');
    expect(r.rounded).toBeCloseTo(-0.017, 6);
    expect(norm(r.display)).toBe('-0,017');
    expect(r.confidence).toBe('low');
    expect(r.certified).toBe(true);
  });
});

describe('adaptivePrecision — point estimate (honest degradation)', () => {
  it('n_replicates < 2 -> confidence "point", uncertified, full value', () => {
    const r = adaptivePrecision({ value: 12345, n_replicates: 1 }, 'pt');
    expect(r.confidence).toBe('point');
    expect(r.certified).toBe(false);
    expect(r.halfWidth).toBeNull();
    expect(Number.isNaN(r.sigfigs)).toBe(true);
    expect(r.rounded).toBe(12345); // shown in full, not rounded away
    expect(norm(r.display)).toBe('12 345');
  });

  it('a bare value (no interval, no n_replicates) degrades to point', () => {
    const r = adaptivePrecision({ value: 3092 }, 'pt');
    expect(r.confidence).toBe('point');
    expect(r.certified).toBe(false);
    expect(norm(r.display)).toBe('3092'); // no grouping below 10000 in pt-PT
  });

  it('shows a fractional point estimate to 3 dp without inventing an interval', () => {
    const r = adaptivePrecision({ value: 0.089, n_replicates: 1 }, 'pt');
    expect(r.confidence).toBe('point');
    expect(norm(r.display)).toBe('0,089');
  });

  it('a present-but-unusable interval (n_replicates 1) is still point', () => {
    const r = adaptivePrecision({ value: 100, lo: 90, hi: 110, n_replicates: 1 });
    expect(r.confidence).toBe('point');
    expect(r.certified).toBe(false);
  });
});

describe('overlaps', () => {
  it('two real intervals that touch/overlap are tied', () => {
    expect(overlaps(band(100, 10), band(105, 10))).toBe(true);
  });

  it('two real intervals that clear each other do not overlap', () => {
    expect(overlaps(band(100, 5), band(130, 5))).toBe(false);
  });

  it('point estimates are treated as degenerate [value,value] intervals', () => {
    // both points, equal -> overlap; different -> not
    expect(overlaps({ value: 100 }, { value: 100 })).toBe(true);
    expect(overlaps({ value: 100 }, { value: 101 })).toBe(false);
  });
});

describe('claimIsSupported', () => {
  it('true only when both carry real intervals and top.lo > runnerUp.hi', () => {
    expect(claimIsSupported(band(130, 5), band(100, 5))).toBe(true);
  });

  it('false when the bands overlap (a statistical tie)', () => {
    expect(claimIsSupported(band(105, 10), band(100, 10))).toBe(false);
  });

  it('false when either side is a point estimate (no evidence to assert)', () => {
    expect(claimIsSupported({ value: 130, n_replicates: 1 }, band(100, 5))).toBe(false);
    expect(claimIsSupported(band(130, 5), { value: 100, n_replicates: 1 })).toBe(false);
    expect(claimIsSupported({ value: 130 }, { value: 100 })).toBe(false);
  });

  it('is directional: swapping top/runnerUp flips a supported claim', () => {
    expect(claimIsSupported(band(130, 5), band(100, 5))).toBe(true);
    expect(claimIsSupported(band(100, 5), band(130, 5))).toBe(false);
  });
});

describe('significanceGuard', () => {
  it('sorts descending by value and assigns 1-based ranks', () => {
    const out = significanceGuard([band(100, 5), band(300, 5), band(200, 5)]);
    expect(out.map((o) => o.value)).toEqual([300, 200, 100]);
    expect(out.map((o) => o.rank)).toEqual([1, 2, 3]);
  });

  it('keeps an _index back-reference to the input position', () => {
    const out = significanceGuard([band(100, 5), band(300, 5), band(200, 5)]);
    // sorted: 300 (input idx 1), 200 (idx 2), 100 (idx 0)
    expect(out.map((o) => o._index)).toEqual([1, 2, 0]);
  });

  it('marks distinguishableFromNext only when the next band clears', () => {
    // 300±5 vs 200±5 clear; 200±5 vs 100±5 clear
    const clear = significanceGuard([band(300, 5), band(200, 5), band(100, 5)]);
    expect(clear.map((o) => o.distinguishableFromNext)).toEqual([true, true, true]);
    // last item is always distinguishableFromNext = true (no next)
    expect(clear[clear.length - 1].distinguishableFromNext).toBe(true);
  });

  it('flags a statistical tie (overlapping neighbours) as NOT distinguishable', () => {
    // 205±10 and 200±10 overlap
    const out = significanceGuard([band(205, 10), band(200, 10)]);
    expect(out[0].distinguishableFromNext).toBe(false);
  });

  it('records tiedWith by original input index', () => {
    // idx0=205±10, idx1=200±10 overlap each other; idx2=50±2 is alone
    const out = significanceGuard([band(205, 10), band(200, 10), band(50, 2)]);
    const top = out.find((o) => o._index === 0)!;
    const second = out.find((o) => o._index === 1)!;
    const lonely = out.find((o) => o._index === 2)!;
    expect(top.tiedWith).toContain(1);
    expect(second.tiedWith).toContain(0);
    expect(lonely.tiedWith).toEqual([]);
  });

  it('point estimates are never distinguishable (superlatives hedge in the point regime)', () => {
    const out = significanceGuard([
      { value: 300, n_replicates: 1 },
      { value: 200, n_replicates: 1 },
    ]);
    expect(out[0].distinguishableFromNext).toBe(false);
    // equal-value degenerate points do not overlap unless exactly equal
    expect(out[0].tiedWith).toEqual([]);
  });

  it('the guard + claimIsSupported agree on a clearly-separated leader', () => {
    const out = significanceGuard([band(100, 5), band(300, 5), band(200, 5)]);
    expect(out[0].distinguishableFromNext).toBe(true);
    expect(claimIsSupported(out[0], out[1])).toBe(true);
  });

  it('does not mutate the input array', () => {
    const input = [band(100, 5), band(300, 5)];
    const snapshot = JSON.stringify(input);
    significanceGuard(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
