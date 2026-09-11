/**
 * Chart theme: the parameters the data-visualisation method needs, filled in
 * with the brand's values. Series colours are data steps of the four brand
 * hues, validated on the cream surface (light) and the forest surface (dark):
 * lightness band, chroma floor, colour-vision separation, normal-vision
 * separation and 3:1 contrast all pass in this fixed order. Never cycle past
 * four: fold into "Outros" or facet.
 */
import { BRAND } from '@/lib/brand';

export const SERIES = ['#159881', '#a27d27', '#697fc5', '#ba6b4f'] as const;
export const SERIES_DARK = ['#0d957e', '#9f7a23', '#677cc2', '#b7684c'] as const;
export const SERIES_NAMES = ['teal', 'ouro', 'pervinca', 'coral'] as const;

/** The one series when only one thing is plotted, and the emphasis hue when one series is the point. */
export const ACCENT = SERIES[0];
/** Context series when one series is the point. */
export const DEEMPHASIS = '#c3c8bb';

export const STATUS = {
  good: BRAND.tree,
  warning: BRAND.gold,
  serious: '#c9784d',
  critical: BRAND.terracotta,
} as const;

export const FURNITURE = {
  surface: BRAND.cream,
  surfaceDark: BRAND.forest,
  grid: BRAND.line,
  gridDark: '#2a4b43',
  axis: BRAND.muted,
  axisDark: '#9bb3a3',
  text: BRAND.ink,
  textMuted: BRAND.muted,
  track: BRAND.parchment,
  font: 'Manrope, system-ui, sans-serif',
} as const;

export const NUMBER = {
  pt: new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 1 }),
  en: new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }),
};

export function formatValue(value: number, locale: 'pt' | 'en' = 'pt', unit = ''): string {
  return `${NUMBER[locale].format(value)}${unit}`;
}

/** A series colour by slot, in fixed order, wrapping only into the de-emphasis grey. */
export function seriesColor(index: number, dark = false): string {
  const set = dark ? SERIES_DARK : SERIES;
  return index < set.length ? set[index] : DEEMPHASIS;
}
