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
