/**
 * Page titles, kept free of Node imports so client components (the parish
 * page sets its own head after it loads) can share the rule with
 * createPageMetadata in metadata.ts.
 */

/** The one site suffix every page title carries. */
export const TITLE_SUFFIX = ' | estimador.pt';

// The variants the catalogue and older pages still type by hand:
// " - estimador.pt", " | estimador.pt", " | Estimador", " — estimador.pt".
const TYPED_SUFFIX = /\s*[|·—–-]\s*estimador(?:\.pt)?\s*$/i;

/**
 * A page title with exactly one " | estimador.pt" at the end. Idempotent, so a
 * page that still types a suffix of its own gets the same result. A title that
 * already names the site ("estimador.pt — Dados para compreender Portugal",
 * "Sobre o estimador.pt") is left as written rather than naming it twice.
 */
export function siteTitle(title: string): string {
  const bare = title.replace(TYPED_SUFFIX, '').trim();
  if (/estimador\.pt/i.test(bare)) return bare;
  return `${bare}${TITLE_SUFFIX}`;
}
