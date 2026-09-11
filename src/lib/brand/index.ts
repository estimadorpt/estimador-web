/**
 * The estimador.pt mark and palette, in one place.
 *
 * The mark is a credible interval: square caps, one rounded band and a
 * slightly left-offset counter, drawn as a single colour. It is split into three paths so
 * the whiskers can move on hover; the combined path is what the static SVG
 * assets in public/brand use. All coordinates live in a 48×24 box.
 */
import geometry from './geometry.json';

export const { MARK_LEFT, MARK_BAND, MARK_RIGHT, MARK_SMALL, COUNTER_X } = geometry;
export const MARK_FULL = `${MARK_LEFT} ${MARK_BAND} ${MARK_RIGHT}`;

/** Compact marks retain shorter whiskers and thicker caps in a 32×32 box. */
/** Same values as the tokens in globals.css; exported for SVG and canvas code that cannot read CSS variables. */
export const BRAND = {
  paper: '#f5f3ea',
  cream: '#fcfbf5',
  parchment: '#ece9dc',
  line: '#dadccf',
  ink: '#234c40',
  inkDark: '#16362e',
  muted: '#5f7062',
  faint: '#7f9284',
  forest: '#122f2c',
  forestDeep: '#0d2927',
  // Data pastels: chart categoricals and the atlas's people.
  mint: '#72c8b4',
  mustard: '#e5b958',
  coral: '#e29a83',
  periwinkle: '#a9b9ed',
  // Surface pastels: the same hues a step quieter, for mosaic, covers and backgrounds.
  mintSoft: '#9dcec1',
  mustardSoft: '#e3c994',
  coralSoft: '#dcafa1',
  periwinkleSoft: '#bdc7e7',
  terracotta: '#a3543a',
  gold: '#c49536',
  tree: '#4e8056',
  teal: '#245c68',
} as const;

export const SOFT_PASTELS = [BRAND.mintSoft, BRAND.mustardSoft, BRAND.coralSoft, BRAND.periwinkleSoft] as const;
export const DATA_PASTELS = [BRAND.mint, BRAND.mustard, BRAND.coral, BRAND.periwinkle] as const;
