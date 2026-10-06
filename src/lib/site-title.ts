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

/** Lengths a search result shows before cutting: what the parish head aims for. */
export const PARISH_META_TARGET = { title: 70, description: 155 } as const;

// "União das freguesias de X, Y e Z" (759 of the 3,092 names, the longest 138
// characters) and its variants: "União de freguesias de", "… do/da/das".
const UNION_PREFIX = /^União (?:das|de) freguesias (de|do|da|dos|das) /i;
const ARTICLE = { de: '', do: 'o', da: 'a', dos: 'os', das: 'as' } as const;

/**
 * A parish name as a title can carry it: the union prefix dropped, keeping the
 * article it ended in ("da Ribeira do Neiva") so the Portuguese preposition
 * still agrees. Names are never cut.
 */
export function shortParishName(name: string): { name: string; article: '' | 'o' | 'a' | 'os' | 'as' } {
  const match = UNION_PREFIX.exec(name);
  if (!match) return { name, article: '' };
  return { name: name.slice(match[0].length), article: ARTICLE[match[1].toLowerCase() as keyof typeof ARTICLE] };
}

/** "em Aguada de Cima", "na Ribeira do Neiva"; "in …" in English, without the article. */
function placePhrase(name: string, locale: string): string {
  const short = shortParishName(name);
  if (locale !== 'pt') return `in ${short.name}`;
  return short.article ? `n${short.article} ${short.name}` : `em ${short.name}`;
}

/**
 * A parish page's title: the page's question, with the union prefix dropped,
 * and the one site suffix. No section label and no second separator (SPV-01,
 * SP2-11); the description says what the page is.
 */
export function parishPageTitle(name: string, locale: string): string {
  const where = placePhrase(name, locale);
  return siteTitle(locale === 'pt' ? `Quem vive ${where}?` : `Who lives ${where}?`);
}

/**
 * A parish page's description, at most about 155 characters where the name
 * allows: what the page holds and where it comes from, then the INE resident
 * count while it fits. `residents` comes formatted (formatCount), so this
 * module stays free of the population code. A name too long for every form
 * keeps the shortest one rather than being cut.
 */
export function parishPageDescription({ name, municipalityName, residents, locale }: {
  name: string;
  municipalityName: string;
  residents: string;
  locale: string;
}): string {
  const where = placePhrase(name, locale);
  const pt = locale === 'pt';
  const stem = pt
    ? `Idades, trabalho, escolaridade e agregados ${where} (${municipalityName}): população sintética dos Censos 2021.`
    : `Ages, work, education and households ${where} (${municipalityName}): a synthetic population from the 2021 Census.`;
  const withResidents = `${stem} ${residents} ${pt ? 'residentes (INE).' : 'residents (INE).'}`;
  const shortest = pt
    ? `População sintética dos Censos 2021 ${where} (${municipalityName}).`
    : `Synthetic population from the 2021 Census ${where} (${municipalityName}).`;
  const limit = PARISH_META_TARGET.description;
  if (withResidents.length <= limit) return withResidents;
  if (stem.length <= limit) return stem;
  return shortest;
}
