import { Newsreader } from 'next/font/google';

/**
 * The site's two faces, served from estimador.pt itself: no page view asks
 * Google (or any other font host) for anything.
 *
 * Manrope comes from @fontsource/manrope, already a dependency for the OG
 * cards. Its @font-face rules keep the family name 'Manrope', which matters:
 * the Plot charts, the SVG scenes and the canvas share card name the family
 * directly ("Manrope, system-ui, sans-serif"), and next/font would register it
 * under a hashed name those call sites cannot see. Every weight the site uses,
 * all subsets behind unicode-range, so a browser fetches only what it needs.
 *
 * Newsreader, the reading face, appears only through var(--font-serif), so
 * next/font/google can own it: it downloads the files at build time and
 * serves them from /_next/static. The variable is mapped in globals.css.
 */
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';

const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-newsreader',
});

/** Goes on <html> in every root document: the [locale] layout and the root 404. */
export const fontVariables = newsreader.variable;
