/** Slug → the locales that piece was exported in. */
export type ArticleLocales = Record<string, string[]>;

/**
 * Where the language switcher should send a reader of `pathname`.
 *
 * Only an article that exists but was never written in `targetLocale` falls
 * back to the article index; everything else keeps its path. A segment under
 * /artigos that is not an article slug (/artigos/tema, say) is a page that
 * exists in both languages, and must not be relabelled "translation
 * unavailable".
 */
export function articleLanguagePath(articles: ArticleLocales, pathname: string, targetLocale: string): string {
  const match = pathname.match(/^\/artigos\/([^/]+)\/?$/);
  if (!match) return pathname;
  const locales = Object.prototype.hasOwnProperty.call(articles, match[1]) ? articles[match[1]] : undefined;
  return locales && !locales.includes(targetLocale) ? '/artigos' : pathname;
}
