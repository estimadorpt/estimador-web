import { BRAND } from '@/lib/brand';

/** Cells whose deviation is at most this (in absolute value) are left blank. */
export const HOUSE_EFFECT_BLANK_BELOW = 0.02;

// Ends of the two ramps. Darker reds and blues would fall in a band where
// neither forest nor white text reaches 4.5:1, so the ramps stop where forest
// still does (election-heatmap.test.ts sweeps them) and every value is set in one ink.
const RED_LIGHT = [254, 226, 226];
const RED_DARK = [233, 108, 108];
const BLUE_LIGHT = [219, 234, 254];
const BLUE_DARK = [108, 152, 182];

/** The fill of one cell: blue below zero, red above, saturating at ±0,4 logit. */
export function getHeatmapColor(value: number): string {
  const normalized = Math.max(-1, Math.min(1, value / 0.4));
  if (Math.abs(normalized) < 0.05) return BRAND.cream;
  const [light, dark] = normalized > 0 ? [RED_LIGHT, RED_DARK] : [BLUE_LIGHT, BLUE_DARK];
  const intensity = Math.abs(normalized);
  const [r, g, b] = light.map((c, i) => Math.round(c + (dark[i] - c) * intensity));
  return `rgb(${r}, ${g}, ${b})`;
}
