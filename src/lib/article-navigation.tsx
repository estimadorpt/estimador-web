'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type ArticleLocales = Record<string, string[]>;
const ArticleLocalesContext = createContext<ArticleLocales>({});

export function ArticleLocalesProvider({ articles, children }: { articles: ArticleLocales; children: ReactNode }) {
  return <ArticleLocalesContext.Provider value={articles}>{children}</ArticleLocalesContext.Provider>;
}

export function useArticleLanguagePath(pathname: string, targetLocale: string): string {
  const articles = useContext(ArticleLocalesContext);
  const article = pathname.match(/^\/artigos\/([^/]+)\/?$/);
  return article && !articles[article[1]]?.includes(targetLocale) ? '/artigos' : pathname;
}

/**
 * Whether this locale has at least one article the reader can open. The site
 * chrome hides the articles nav item until it does (the index stays reachable
 * by URL, noindexed while empty). Same map as above, so drafts count only
 * where they render: under `npm run dev`.
 */
export function useHasArticles(locale: string): boolean {
  const articles = useContext(ArticleLocalesContext);
  return Object.values(articles).some(locales => locales.includes(locale));
}
