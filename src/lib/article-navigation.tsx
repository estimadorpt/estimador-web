'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { articleLanguagePath, type ArticleLocales } from './article-language-path';

export type { ArticleLocales };
const ArticleLocalesContext = createContext<ArticleLocales>({});

export function ArticleLocalesProvider({ articles, children }: { articles: ArticleLocales; children: ReactNode }) {
  return <ArticleLocalesContext.Provider value={articles}>{children}</ArticleLocalesContext.Provider>;
}

/** The language switcher's target for `pathname`: see articleLanguagePath. */
export function useArticleLanguagePath(pathname: string, targetLocale: string): string {
  return articleLanguagePath(useContext(ArticleLocalesContext), pathname, targetLocale);
}
