/**
 * When the prose of a page last changed, for the sitemap's lastmod (FRESH-07).
 *
 * Data pages are dated by their data (sitemap.ts → contentDates). Prose pages
 * have no data date, so each carries the date its copy was last revised. Where
 * the page prints a revision date, the date here is that same date, and
 * sitemap-dates.test.ts reads the page (or its MDX) and fails when the two
 * drift: change the page's revision line and this entry together.
 *
 *   /metodologia                HUB_REVISED in metodologia/page.tsx
 *   /desporto/liga/metodologia  REVISED in desporto/liga/metodologia/page.tsx
 *   /eleicoes/metodologia       ELECTION_METHODOLOGY_REVISED (imported)
 *   /privacidade                PRIVACY_REVISED in src/app/[locale]/privacidade/page.tsx
 *
 * The others print no date; their entry is the day their copy last changed.
 */
import { ELECTION_METHODOLOGY_REVISED } from './election-methodology';

export const COPY_REVISED: Readonly<Record<string, string>> = {
  '/metodologia': '2026-10-06',
  '/desporto/liga/metodologia': '2026-10-06',
  '/eleicoes/metodologia': ELECTION_METHODOLOGY_REVISED,
  '/privacidade': '2026-10-05',
  '/sobre': '2026-10-06',
  // The reconstituted forecasts were labelled on 6 October; the review data is of 10 August.
  '/desporto/liga/2025-26': '2026-10-06',
  '/desporto/liga/jogadores': '2026-10-06',
  '/desporto/liga/modelo': '2026-10-06',
  '/populacao/metodologia': '2026-10-06',
  '/populacao/qualidade': '2026-10-06',
  '/populacao/dados': '2026-10-06',
  '/eleicoes/arquivo': '2026-10-06',
};

/** The later of the dates given (any may be missing); undefined when none is. */
export function newestDate(...dates: Array<Date | undefined>): Date | undefined {
  const known = dates.filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime()));
  return known.length ? new Date(Math.max(...known.map(date => +date))) : undefined;
}

/** A YYYY-MM-DD (or a timestamp's date part) as a UTC day. */
export function sitemapDay(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}
