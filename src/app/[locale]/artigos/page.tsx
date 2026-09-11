import { createPageMetadata, SITE_LOCALES } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { Mosaic } from '@/components/brand/Mosaic';
import { SiteFooter } from '@/components/SiteFooter';
import { Subscribe } from "@/components/Subscribe";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Rss } from 'lucide-react';
import type { Metadata } from 'next';
import {
  getArticlesByKind,
  type ArticleKind,
} from '@/lib/mdx-articles';
import { buildTagIndex } from '@/lib/article-discovery';
import { ArticleRow } from '@/components/articles/ArticleRow';
import { ArticleListStructuredData } from '@/components/StructuredData';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return createPageMetadata({
    locale,
    path: '/artigos',
    title: t('meta.articlesTitle'),
    description: t('articles.subtitle'),
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
      <ArticleListStructuredData articles={articles} locale={locale} />
      <Header />

      <PageHero
        width="4xl"
        eyebrow={t('articles.title')}
        title={t('articles.title')}
        lede={t('articles.subtitle')}
        meta={
          <a
            href={`/${locale}/feed.xml`}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Rss aria-hidden="true" className="w-3.5 h-3.5" />
            {t('articles.feedLink')}
          </a>
        }
        art={<Mosaic variant="corner" className="h-full w-full" />}
      />

      <main className="max-w-4xl mx-auto px-4 py-10">

        {articles.length === 0 ? (
          <p className="border-l-2 border-stone-300 pl-6 py-6 text-stone-600">
            {t('articles.empty')}
          </p>
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
      </main>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        <Subscribe variant="inline" />
      </div>

      <SiteFooter locale={locale} />
    </div>
  );
}
