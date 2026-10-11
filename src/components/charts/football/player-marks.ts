/**
 * The colours of the player charts (/jogadores lists, player pages).
 *
 * The bars, the interval whiskers and their caps carry the estimate and its
 * uncertainty, so they reach 3:1 against every ground they sit on (WCAG
 * 1.4.11; audit A11Y3-10). They are the stone-400 token (#6b6b6b), not the
 * faint grey (#8a8a87, 2.98:1 on paper), which stays for marks that carry no
 * meaning. player-marks.test.ts holds them to it against globals.css.
 */
export const PLAYER_MARKS = {
  /** A value above the reference level (stone-900). */
  bar: '#141414',
  /** A value below the reference level (stone-400). */
  barNegative: '#6b6b6b',
  /** The credible interval: its line and its two caps (stone-400). */
  whisker: '#6b6b6b',
  /** The reference level (zero, or the positional average): a hairline (stone-300). */
  zero: '#cfcfcb',
  /** Other published players, as faint ticks behind one player's estimate (stone-200). */
  peer: '#e2e2df',
  /** The ground of a bar track (stone-50, the cream token). */
  track: '#ffffff',
} as const;

/** The opacity the list's bars are drawn at over their track. */
export const PLAYER_BAR_OPACITY = 0.85;
