import { Newsreader } from 'next/font/google';

/**
 * The site's two faces, served from estimador.pt itself: no page view asks
 * Google (or any other font host) for anything.
 *
 * Inter, the interface face, comes from @fontsource/inter. Its @font-face
 * rules keep the family name 'Inter', which matters: the Plot charts and the
 * canvas share card name the family directly ("Inter, system-ui, sans-serif"),
 * and next/font would register it under a hashed name those call sites cannot
 * see. Every weight the site uses, all subsets behind unicode-range, so a
 * browser fetches only what it needs. Manrope 800 stays for the wordmark.
 *
 * Newsreader, the reading face, appears only through var(--font-serif), so
 * next/font/google can own it: it downloads the files at build time and
 * serves them from /_next/static. The variable is mapped in globals.css.
 */
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
// The wordmark alone keeps Manrope 800 (Logo.tsx, the share cards).
import '@fontsource/manrope/800.css';

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
