import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from '@/i18n/routing';
import { buildTagIndex } from '@/lib/article-discovery';
import { getMDXArticlesByLocale } from '@/lib/mdx-articles';
import { createPageMetadata, SITE_LOCALES } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return createPageMetadata({
    locale,
    path: '/artigos/tema',
    title: t('meta.topicsTitle'),
    description: t('articles.topicsIntro'),
  });
}

export function generateStaticParams() {
  return SITE_LOCALES.map(locale => ({ locale }));
}

/**
 * The directory the individual topic pages hang off.
 *
 * It exists as much for the reader who deletes a segment off the end of
 * /artigos/tema/sondagens as for anyone who navigates to it deliberately —
 * landing on a 404 there would reintroduce exactly the dead end these pages
 * were added to remove.
 */
export default async function TopicsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const groups = buildTagIndex(getMDXArticlesByLocale(locale));

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <nav className="mb-8">
          <Link
            href="/artigos"
            locale={locale}
            className="text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            ← {t('articles.backToArticles')}
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl text-stone-900">{t('articles.topicsHeading')}</h1>
          <p className="mt-3 max-w-2xl text-lg text-stone-600">{t('articles.topicsIntro')}</p>
        </header>

        {groups.length === 0 ? (
          <p className="border-l-2 border-stone-300 py-6 pl-6 text-stone-600">{t('articles.empty')}</p>
        ) : (
          <ul className="border-t-2 border-stone-800">
            {groups.map(group => (
              <li key={group.slug} className="border-b border-stone-200">
                <Link
                  href={`/artigos/tema/${group.slug}`}
                  locale={locale}
                  className="group flex items-baseline justify-between gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="text-base font-medium text-stone-900 group-hover:text-ink">
                    {group.label}
                  </span>
                  <span className="text-xs tabular-nums text-stone-500">
                    {t('articles.topicCount', { count: group.articles.length })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
