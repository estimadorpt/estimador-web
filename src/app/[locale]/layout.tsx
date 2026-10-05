import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/routing';

import { PostHogProvider } from '../providers';
import '../globals.css';
import { fontVariables } from '../fonts';
import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';
import { getMDXArticlesByLocale } from '@/lib/mdx-articles';
import { ArticleLocalesProvider, type ArticleLocales } from '@/lib/article-navigation';

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const page = createPageMetadata({
    locale,
    path: '/',
    title: t('meta.defaultTitle'),
    description: t('meta.defaultDescription'),
    keywords: ['portugal', 'previsões', 'dados', 'futebol', 'economia', 'população', 'eleições', 'forecasting'],
    authors: ['Bernardo Caldas'],
  });
  // Defaults only. No canonical, no hreflang and no robots here: every page
  // states its own, and a layout default leaks into the pages that state none
  // on purpose — a not-found placeholder would otherwise carry "index, follow"
  // and a canonical pointing at the homepage.
  const { robots: _robots, alternates, openGraph, ...defaults } = page;
  void _robots;
  return {
    ...defaults,
    alternates: { types: alternates?.types },
    openGraph: openGraph ? { ...openGraph, url: undefined } : undefined,
    creator: 'Bernardo Caldas',
    publisher: 'estimador.pt',
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
  };
}

export default async function RootLayout({
  children,
  params
}: RootLayoutProps) {
  const { locale } = await params;
  // Ensure that the incoming `locale` is valid
  if (!locales.some(supportedLocale => supportedLocale === locale)) {
    notFound();
  }
  // The static export has no middleware: this is what tells implicit
  // getTranslations()/getLocale() calls below this layout which locale they
  // render. Pages call it too, since Next may render them separately.
  setRequestLocale(locale);

  const messages = await getMessages({ locale });
  const articles: ArticleLocales = {};
  for (const articleLocale of locales) {
    for (const article of getMDXArticlesByLocale(articleLocale)) {
      (articles[article.slug] ??= []).push(articleLocale);
    }
  }
  
  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <PostHogProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <ArticleLocalesProvider articles={articles}>{children}</ArticleLocalesProvider>
          </NextIntlClientProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
