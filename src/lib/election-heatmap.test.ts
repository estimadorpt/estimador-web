import { describe, expect, it } from 'vitest';
import { BRAND } from '@/lib/brand';
import { getHeatmapColor } from './election-heatmap';

function channels(colour: string): number[] {
  if (colour.startsWith('#')) return [1, 3, 5].map(i => parseInt(colour.slice(i, i + 2), 16));
  return (colour.match(/\d+/g) ?? []).map(Number);
}

function luminance(colour: string): number {
  const [r, g, b] = channels(colour).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('house-effects heatmap', () => {
  it('keeps forest text at 4.5:1 or more on every fill the ramp can produce', () => {
    for (let effect = -0.6; effect <= 0.6; effect += 0.005) {
      expect(contrast(getHeatmapColor(effect), BRAND.forest), `effect ${effect.toFixed(3)}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('colours above zero red and below zero blue, and near zero as the panel', () => {
    const [r1, , b1] = channels(getHeatmapColor(0.2));
    const [r2, , b2] = channels(getHeatmapColor(-0.2));
    expect(r1).toBeGreaterThan(b1);
    expect(b2).toBeGreaterThan(r2);
    expect(getHeatmapColor(0.01)).toBe(BRAND.cream);
  });
});
