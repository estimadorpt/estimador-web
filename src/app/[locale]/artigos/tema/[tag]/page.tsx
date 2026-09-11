import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { ArticleRow } from '@/components/articles/ArticleRow';
import { Link } from '@/i18n/routing';
import { buildTagIndex, findTagGroup } from '@/lib/article-discovery';
import { getMDXArticlesByLocale } from '@/lib/mdx-articles';
import { createPageMetadata, SITE_LOCALES } from '@/lib/metadata';
import { paramsOrPlaceholder } from '@/lib/static-params';

interface TagPageProps {
  params: Promise<{ locale: string; tag: string }>;
}

/**
 * A topic page exists only where that locale actually publishes the tag.
 *
 * The two catalogues are tagged in their own languages — "Sondagens" in
 * Portuguese, "Polling" in English — so the sets barely overlap, and generating
 * the union would export a page reading "no pieces" for most of it.
 */
export function generateStaticParams() {
  return paramsOrPlaceholder(
    SITE_LOCALES.flatMap(locale =>
      buildTagIndex(getMDXArticlesByLocale(locale)).map(group => ({ locale, tag: group.slug }))),
    'tag',
    'sem-temas',
  );
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, tag } = await params;
  const t = await getTranslations({ locale });
  const group = findTagGroup(getMDXArticlesByLocale(locale), tag);

  if (!group) {
    return { title: 'estimador.pt', robots: { index: false, follow: false } };
  }

  const availableLocales = SITE_LOCALES.filter(candidate =>
    findTagGroup(getMDXArticlesByLocale(candidate), tag));

  return createPageMetadata({
    locale,
    path: `/artigos/tema/${tag}`,
    title: t('meta.topicTitle', { topic: group.label }),
    description: t('meta.topicDescription', { topic: group.label }),
    keywords: group.label,
    availableLocales,
  });
}

export default async function TagPage({ params }: TagPageProps) {
  const { locale, tag } = await params;
  const t = await getTranslations({ locale });
  const group = findTagGroup(getMDXArticlesByLocale(locale), tag);

  if (!group) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <nav className="mb-8">
          <Link
            href="/artigos/tema"
            locale={locale}
            className="text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            ← {t('articles.topicsHeading')}
          </Link>
        </nav>

        <header className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            {t('articles.topicEyebrow')}
          </p>
          <h1 className="mt-2 text-3xl text-stone-900">{group.label}</h1>
          <p className="mt-3 text-sm text-stone-500">
            {t('articles.topicCount', { count: group.articles.length })}
          </p>
        </header>

        <ul className="border-t-2 border-stone-800">
          {group.articles.map(article => (
            <ArticleRow key={article.slug} article={article} locale={locale} />
          ))}
        </ul>

        <p className="mt-10">
          <Link
            href="/artigos"
            locale={locale}
            className="text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            ← {t('articles.backToArticles')}
          </Link>
        </p>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
