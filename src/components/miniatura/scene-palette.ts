import { BRAND } from '@/lib/brand';
import { SERIES } from '@/components/viz/theme';

/**
 * The scene's palette, in the instrument's grammar: ink lines on white, light
 * greys for roofs and doors, and colour only for the data (each figure's age
 * group, in SERIES order, never the signal yellow).
 */
export const INK = BRAND.ink;
export const PAPER = BRAND.paper;
/** Roofs. */
export const FIELD = BRAND.parchment;
/** Doors; the ground lines. */
export const RULE = BRAND.line;
/** Secondary words in the drawing (a group's count). */
export const GRAPHITE = BRAND.muted;

/** The figures' age groups: the four series colours, in their fixed order. */
export const COLOURS = SERIES;

/** A 1px ink line, whatever the drawing's scale. */
export const LINE = { stroke: INK, strokeWidth: 1, vectorEffect: 'non-scaling-stroke', strokeLinejoin: 'round' } as const;
