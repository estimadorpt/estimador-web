/**
 * The estimador.pt mark and palette, in one place.
 *
 * The mark is a credible interval drawn the way the pages draw one: square
 * caps on whiskers, a square-ended band and a median slot a little left of
 * centre (COUNTER_X), in a single colour. It is split into three paths so the
 * whiskers can move on hover; the combined path is what the static SVG assets
 * in public/brand use. All coordinates live in a 48×24 box; the slot is a
 * hole (counter-wound), so the mark reads on any ground.
 */
import geometry from './geometry.json';

export const { MARK_LEFT, MARK_BAND, MARK_RIGHT, MARK_SMALL, COUNTER_X } = geometry;
export const MARK_FULL = `${MARK_LEFT} ${MARK_BAND} ${MARK_RIGHT}`;

/** Compact marks keep shorter whiskers and a taller band in a 32×32 box (MARK_SMALL). */
/**
 * The interface font stacks, for SVG, Plot and canvas code that cannot read
 * CSS variables. They mirror --font-sans and --font-display in globals.css;
 * change them together.
 */
export const FONT_STACK = "'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, sans-serif";
export const DISPLAY_FONT_STACK = FONT_STACK;

/** Same values as the tokens in globals.css; exported for SVG and canvas code that cannot read CSS variables. */
export const BRAND = {
  paper: '#ffffff',
  cream: '#ffffff',
  parchment: '#f4f4f4',
  line: '#d9d9d9',
  grid: '#ececec',
  ink: '#111111',
  inkDark: '#000000',
  muted: '#5e5e5e',
  faint: '#8a8a8a',
  forest: '#111111',
  forestDeep: '#000000',
  // The model's margin: the band of an interval, and nothing else.
  signal: '#ffd400',
  signalLow: '#fff1b3',
  terracotta: '#b91c1c',
  gold: '#b7791f',
  tree: '#15803d',
  teal: '#0f766e',
} as const;

