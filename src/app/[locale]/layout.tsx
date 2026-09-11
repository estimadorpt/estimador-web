import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/routing';

import { PostHogProvider } from '../providers';
import '../globals.css';
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
  return {
    ...createPageMetadata({
      locale,
      path: '/',
      title: t('meta.defaultTitle'),
      description: t('meta.defaultDescription'),
      keywords: ['portugal', 'previsões', 'dados', 'futebol', 'economia', 'população', 'eleições', 'forecasting'],
      authors: ['Bernardo Caldas'],
    }),
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
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
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

  const messages = await getMessages({ locale });
  const articles: ArticleLocales = {};
  for (const articleLocale of locales) {
    for (const article of getMDXArticlesByLocale(articleLocale)) {
      (articles[article.slug] ??= []).push(articleLocale);
    }
  }
  
  return (
    <html lang={locale} suppressHydrationWarning>
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
