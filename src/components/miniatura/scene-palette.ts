import { BRAND } from '@/lib/brand';
import { SERIES } from '@/components/viz/theme';

/**
 * The scene's palette, in the instrument's grammar: ink lines on white, light
 * grey fills for buildings and ground, and colour only for the data (each
 * figure's group, in SERIES order, never the signal yellow). The SVG is also
 * cloned into the postcard, where no stylesheet applies, so colours are
 * attributes, not CSS.
 */
export const INK = BRAND.ink;
export const PAPER = BRAND.paper;
/** Lit faces, paths, the lighter ground. */
export const FIELD = BRAND.parchment;
/** Roofs, water, the middle ground. */
export const GRID = BRAND.grid;
/** Shaded faces, roads, deep water. */
export const RULE = BRAND.line;
/** Doors and small dark details; a fill, never text. */
export const STONE = '#bdbdbd';
/** Secondary words in the drawing (the postcard caption, the groups' units). */
export const GRAPHITE = BRAND.muted;

/** The figures' groups: the four series colours, in their fixed order. */
export const COLOURS = SERIES;

/** A 1px ink line at every zoom (the camera scales the drawing up to 4×). */
export const LINE = { stroke: INK, strokeWidth: 1, vectorEffect: 'non-scaling-stroke', strokeLinejoin: 'round' } as const;
/** A fainter 1px line for furrows, courses and contours. */
export const HAIR = { stroke: BRAND.faint, strokeWidth: 1, vectorEffect: 'non-scaling-stroke' } as const;
