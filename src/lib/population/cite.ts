/**
 * How to cite a parish page. The release's own cite line (release.json
 * `attribution.cite_as`, tested to match) followed by the parish's name, code
 * and address, so a quotation can be traced back to the page and the release.
 */
import { POPULATION_RELEASE } from '@/lib/config/population';

/** The release's cite line, as release.json writes it. */
export function releaseCitation(release = POPULATION_RELEASE, year = '2026'): string {
  return `estimador.pt, População Sintética de Portugal v${release} (${year}), CC BY 4.0.`;
}

/**
 * The parish page shows the current release, so its address is not versioned:
 * with `accessed` (the reader's date at copy time, ISO or formatted, e.g.
 * "6 out. 2026") the citation says when it was read, as a citation of a web
 * page should; after a new release the same address shows that release's
 * figures (PRO2-10). A value without a year is ignored.
 */
export function parishCitation({ name, code, url, accessed, locale = 'pt' }: {
  name: string;
  code: string;
  url: string;
  accessed?: string;
  locale?: 'pt' | 'en';
}): string {
  const base = `${releaseCitation()} ${name} (${code}): ${url}`;
  if (!accessed || !/\b\d{4}\b/.test(accessed)) return base;
  return `${base} (${locale === 'pt' ? 'consultado a' : 'accessed'} ${accessed})`;
}

/** The licence's short attribution, for a quotation that travels without the page. */
export const SHORT_ATTRIBUTION = {
  pt: 'Fonte: INE, Censos 2021 · informação modificada por estimador.pt · CC BY 4.0',
  en: 'Source: INE, 2021 Census · information modified by estimador.pt · CC BY 4.0',
} as const;
