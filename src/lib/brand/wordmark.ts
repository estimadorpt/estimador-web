import wordmark from './wordmark-paths.json';

/**
 * The signature outlined: "estimador" and ".pt" in IBM Plex Sans 700 as paths,
 * the same drawing as public/brand/estimador-logo.svg, which
 * scripts/generate-brand-identity.mjs writes from this file and geometry.json
 * (wordmark.test.ts holds the two together). For SVG that leaves the page,
 * such as the miniatura's exported postcard, where no web font loads. In the
 * logo's WORDMARK_WIDTH×24 box the mark
 * (MARK_FULL) sits at 0–48 and the wordmark at
 * `translate(WORDMARK_X WORDMARK_BASELINE)`, "estimador" in BRAND.ink and
 * ".pt" in BRAND.muted. LogoHorizontal and the canvas share card draw it, so
 * the logo never depends on the interface typeface.
 */
export const { WORDMARK_WIDTH, WORDMARK_HEIGHT, WORDMARK_X, WORDMARK_BASELINE, WORDMARK_NAME, WORDMARK_TLD } = wordmark;
