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
 * with `accessed` (a formatted date) the citation says when it was read
 * ("consultado a 6 out. 2026"), as a citation of a web page should.
 */
export function parishCitation({ name, code, url, accessed, locale = 'pt' }: { name: string; code: string; url: string; accessed?: string; locale?: 'pt' | 'en' }): string {
  const when = accessed ? ` (${locale === 'pt' ? 'consultado a' : 'accessed'} ${accessed})` : '';
  return `${releaseCitation()} ${name} (${code}): ${url}${when}`;
}

/** The licence's short attribution, for a quotation that travels without the page. */
export const SHORT_ATTRIBUTION = {
  pt: 'Fonte: INE, Censos 2021 · informação modificada por estimador.pt · CC BY 4.0',
  en: 'Source: INE, 2021 Census · information modified by estimador.pt · CC BY 4.0',
} as const;
