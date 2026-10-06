import { createPageMetadata, SITE_LOCALES } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Subscribe } from "@/components/Subscribe";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Rss } from 'lucide-react';
import type { Metadata } from 'next';
import {
  getArticlesByKind,
  getMDXArticlesByLocale,
  type ArticleKind,
} from '@/lib/mdx-articles';
import { Mosaic } from '@/components/brand/Mosaic';
import { buildTagIndex } from '@/lib/article-discovery';
import { ArticleRow } from '@/components/articles/ArticleRow';
import { ArticleListStructuredData } from '@/components/StructuredData';
import { setRequestLocale } from '@/i18n/request-locale';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return createPageMetadata({
    locale,
    path: '/artigos',
    title: t('meta.articlesTitle'),
    description: t('articles.subtitle'),
    // An empty index stays reachable by URL but out of search (and out of the
    // sitemap and the site's navigation) until this locale publishes a piece.
    index: getMDXArticlesByLocale(locale).length > 0,
  });
}

export function generateStaticParams() {
  return SITE_LOCALES.map(locale => ({ locale }));
}

export default async function ArticlesPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  // Only what this locale publishes. An article listed here but exported in
  // another language would be a link to a page the build never produced — and
  // the same holds for the topics derived from it further down.
  const byKind = getArticlesByKind(locale);
  const articles = [...byKind.nota, ...byKind.explicador];
  const topics = buildTagIndex(articles);

  function Section({ kind, heading, intro }: { kind: ArticleKind; heading: string; intro: string }) {
    const items = byKind[kind];
    if (!items.length) return null;
    return (
      <section className="mb-14 last:mb-0">
        <div className="border-b-2 border-stone-800 pb-2 mb-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-800">{heading}</h2>
        </div>
        <p className="text-sm text-stone-500 py-3 border-b border-stone-200">{intro}</p>
        <ul>
          {items.map(article => <ArticleRow key={article.slug} article={article} locale={locale} />)}
        </ul>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* No Blog structured data for an empty list. */}
      {articles.length > 0 && <ArticleListStructuredData articles={articles} locale={locale} />}
      <Header />

      <main id="main-content" tabIndex={-1}>
      <PageHero
        measure="wide"
        compact
        field="mustard"
        eyebrow={t('articles.eyebrow')}
        title={t('articles.title')}
        lede={t('articles.subtitle')}
        meta={articles.length > 0 ? (
          <a
            href={`/${locale}/feed.xml`}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Rss aria-hidden="true" className="w-3.5 h-3.5" />
            {t('articles.feedLink')}
          </a>
        ) : undefined}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-10"><div className="max-w-4xl">


        {articles.length === 0 ? (
          <div className="flex items-center gap-6 py-6">
            <Mosaic variant="quarters" className="hidden h-20 w-20 shrink-0 sm:block" />
            <div>
              <p className="text-stone-600">{t('articles.empty')}</p>
              <p className="mt-4">
                <Link
                  href="/populacao"
                  locale={locale}
                  className="inline-flex items-center gap-1.5 font-semibold text-ink underline underline-offset-4 hover:no-underline"
                >
                  {t('articles.emptyNextStep')}
                  <span aria-hidden="true">→</span>
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <>
            <Section kind="nota" heading={t('articles.notesHeading')} intro={t('articles.notesIntro')} />
            <Section kind="explicador" heading={t('articles.explainersHeading')} intro={t('articles.explainersIntro')} />

            {/* The tags printed on each row above cannot be links — the whole
                row is already one. This is where they become navigable. */}
            {topics.length > 0 && (
              <section className="mt-14">
                <div className="border-b-2 border-stone-800 pb-2 mb-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-stone-800">
                    {t('articles.topicsHeading')}
                  </h2>
                </div>
                <p className="text-sm text-stone-500 py-3 border-b border-stone-200">
                  {t('articles.topicsIntro')}
                </p>
                <ul className="flex flex-wrap gap-2 pt-5">
                  {topics.map(topic => (
                    <li key={topic.slug}>
                      <Link
                        href={`/artigos/tema/${topic.slug}`}
                        locale={locale}
                        className="flex items-baseline gap-2 border border-stone-300 bg-cream px-2.5 py-1.5 text-xs text-stone-700 hover:border-stone-800 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        {topic.label}
                        <span className="tabular-nums text-stone-400">{topic.articles.length}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div></div>
      </main>

      {/* No decorative subscription box on an honestly empty index — nothing
          to subscribe to yet in this language. */}
      {articles.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-4 pb-16"><div className="max-w-4xl">
          <Subscribe variant="inline" locale={locale} />
        </div></div>
      )}

      <SiteFooter locale={locale} />
    </div>
  );
}
