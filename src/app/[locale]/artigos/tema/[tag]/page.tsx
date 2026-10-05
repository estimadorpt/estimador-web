import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
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
    return { title: t('notFound.title'), robots: { index: false, follow: false } };
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
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const group = findTagGroup(getMDXArticlesByLocale(locale), tag);

  if (!group) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
        <PageHero
          width="4xl"
          compact
          back={{ href: '/artigos/tema', label: t('articles.topicsHeading'), locale }}
          eyebrow={t('articles.topicEyebrow')}
          title={group.label}
          meta={<span>{t('articles.topicCount', { count: group.articles.length })}</span>}
        />

        <div className="max-w-4xl mx-auto px-4 pt-8 pb-12">
          <ul className="border-t-2 border-stone-800">
            {group.articles.map(article => (
              <ArticleRow key={article.slug} article={article} locale={locale} />
            ))}
          </ul>

          <p className="mt-10 text-sm">
            <Link href="/artigos" locale={locale} className="font-semibold text-ink underline underline-offset-4">
              {t('articles.backToArticles')}
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
