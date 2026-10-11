/**
 * The colours of the player charts (/jogadores lists, player pages).
 *
 * The model's 90% credible intervals are not drawn with these: they are the
 * site's band (IntervalBand, yellow between ink caps with the estimate as an
 * ink tick), as every model margin is (review, October 2026: grey whiskers
 * did not say "the model's margin"). These colours are for what is left:
 * a value without an interval (its bar from zero), the per-season ±1 sd
 * whiskers on a player page, the reference level and the peers' ticks.
 * The marks that carry meaning reach 3:1 against every ground they sit on
 * (WCAG 1.4.11; audit A11Y3-10): the stone-400 token (#6b6b6b), not the
 * scale grey (#8a8a8a). player-marks.test.ts holds them to it.
 */
export const PLAYER_MARKS = {
  /** A value above the reference level (stone-900). */
  bar: '#111111',
  /** A value below the reference level (stone-400). */
  barNegative: '#6b6b6b',
  /** The credible interval: its line and its two caps (stone-400). */
  whisker: '#6b6b6b',
  /** The reference level (zero, or the positional average): a hairline (stone-300). */
  zero: '#bdbdbd',
  /** Other published players, as faint ticks behind one player's estimate (stone-200). */
  peer: '#d9d9d9',
  /** The ground the bars sit on: the page's white (there is no grey track). */
  track: '#ffffff',
} as const;

/** The opacity the list's bars are drawn at over their track. */
export const PLAYER_BAR_OPACITY = 0.85;
