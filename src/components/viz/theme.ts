/**
 * Chart theme: the parameters the data-visualisation method needs, filled in
 * with the instrument's values. Series colours are four data hues, validated
 * on white (light) and on ink (dark): lightness band, chroma floor,
 * colour-vision separation, normal-vision separation and 3:1 contrast all
 * pass in this fixed order. Never cycle past four: fold into "Outros" or
 * facet. Never the signal yellow, which is the model's margin only.
 */
import { BRAND, FONT_STACK } from '@/lib/brand';
import { withMinus } from '@/lib/typography';

export const SERIES = ['#159881', '#a27d27', '#697fc5', '#ba6b4f'] as const;
export const SERIES_DARK = ['#0d957e', '#9f7a23', '#677cc2', '#b7684c'] as const;
export const SERIES_NAMES = ['teal', 'ouro', 'pervinca', 'coral'] as const;

/** The one series when only one thing is plotted, and the emphasis hue when one series is the point. */
export const ACCENT = SERIES[0];
/** Context series when one series is the point. */
export const DEEMPHASIS = '#bdbdbd';

export const STATUS = {
  good: BRAND.tree,
  warning: BRAND.gold,
  serious: '#b45309',
  critical: BRAND.terracotta,
} as const;

export const FURNITURE = {
  surface: BRAND.paper,
  surfaceDark: BRAND.forest,
  grid: BRAND.line,
  gridDark: '#3a3a3a',
  axis: BRAND.muted,
  axisDark: '#a8a8a8',
  text: BRAND.ink,
  textMuted: BRAND.muted,
  /** Retired: bars stand on a scale rule, not on a grey track (ProbBar). */
  track: BRAND.parchment,
  font: FONT_STACK,
} as const;

export const NUMBER = {
  pt: new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 1 }),
  en: new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }),
};

/** A chart value in the page's format; negatives take the minus sign U+2212. */
export function formatValue(value: number, locale: 'pt' | 'en' = 'pt', unit = ''): string {
  return `${withMinus(NUMBER[locale].format(value))}${unit}`;
}

/** A series colour by slot, in fixed order, wrapping only into the de-emphasis grey. */
export function seriesColor(index: number, dark = false): string {
  const set = dark ? SERIES_DARK : SERIES;
  return index < set.length ? set[index] : DEEMPHASIS;
}
