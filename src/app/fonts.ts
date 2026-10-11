import { Newsreader } from 'next/font/google';

/**
 * The site's faces, served from estimador.pt itself: no page view asks
 * Google (or any other font host) for anything.
 *
 * IBM Plex Sans is the interface face (one variable file per subset, the
 * weight axis), and IBM Plex Sans Condensed the display cut: headlines,
 * headline figures, names in tables (500, 600 and 700). Both come from
 * @fontsource, whose @font-face rules keep plain family names ('IBM Plex
 * Sans Variable', 'IBM Plex Sans Condensed'), which matters: Plot charts, SVG
 * scenes and the canvas share card name the families directly through
 * FONT_STACK and DISPLAY_FONT_STACK (src/lib/brand), and next/font would
 * register them under hashed names those call sites cannot see.
 * unicode-range keeps a browser to the subsets it needs (Portuguese and
 * English are wholly latin): about 45 KB of text face and 19 KB per
 * condensed weight.
 *
 * The logo needs no font: LogoHorizontal draws the published wordmark as
 * outlined paths (src/lib/brand/wordmark.ts).
 *
 * Newsreader, the reading face, appears only through var(--font-serif), so
 * next/font/google can own it: it downloads the files at build time and
 * serves them from /_next/static. The variable is mapped in globals.css.
 */
import '@fontsource-variable/ibm-plex-sans/wght.css';
import '@fontsource/ibm-plex-sans-condensed/500.css';
import '@fontsource/ibm-plex-sans-condensed/600.css';
import '@fontsource/ibm-plex-sans-condensed/700.css';

/*
 * Not preloaded: only `.article-body` (methodology, about, privacy, articles)
 * sets the serif, and a preload made every page (the homepage, a shared parish
 * link, a club page) download about 460 KB of type it never draws. The
 * @font-face rules stay in the CSS, so a page that does render the serif
 * fetches it on first use, and unicode-range keeps that to the glyphs it needs.
 * Italic stays declared because the prose uses <em> for foreign terms
 * (*vintages*, *referrer*); without preload it costs nothing until it appears.
 * Portuguese and English are wholly inside the latin subset. The weight axis
 * only: the optical-size axis (opsz) made each file about 130 to 150 KB, more
 * than a prose page's own scripts, for a face set at one reading size (SEO3-06).
 */
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
  variable: '--font-newsreader',
});

/** Goes on <html> in every root document: the [locale] layout and the root 404. */
export const fontVariables = newsreader.variable;
