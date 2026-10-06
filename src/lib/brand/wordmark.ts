import wordmark from './wordmark-paths.json';

/**
 * The signature outlined: "estimador" and ".pt" in Manrope 800 as paths, the
 * same drawing as public/brand/estimador-logo.svg (wordmark.test.ts holds the
 * two together). For SVG that leaves the page, such as the miniatura's
 * exported postcard, where no web font loads. In the logo's 220×24 box the mark
 * (MARK_FULL) sits at 0–48 and the wordmark at
 * `translate(WORDMARK_X WORDMARK_BASELINE)`, "estimador" in BRAND.ink and
 * ".pt" in BRAND.muted. Its own module, so the pages that set the signature in
 * Manrope (LogoHorizontal) do not ship these paths.
 */
export const { WORDMARK_WIDTH, WORDMARK_HEIGHT, WORDMARK_X, WORDMARK_BASELINE, WORDMARK_NAME, WORDMARK_TLD } = wordmark;
