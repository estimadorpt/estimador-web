import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from '@/i18n/request-locale';
import { getMDXArticlesByLocale, getArticleWithFallback, getArticlePath, articleExistsInLocale } from '@/lib/mdx-articles';
import { createPageMetadata, getOgImageUrl, siteTitle, SITE_LOCALES } from '@/lib/metadata';
import { paramsOrPlaceholder } from '@/lib/static-params';
import { Header } from "@/components/Header";
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { Subscribe } from "@/components/Subscribe";
import { Link } from '@/i18n/routing';
import { ArticleStructuredData } from "@/components/StructuredData";
import { KeepReading } from "@/components/articles/KeepReading";
import { TagLinks } from "@/components/articles/TagLinks";
import { relatedArticles } from '@/lib/article-discovery';
import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getMDXComponents } from '@/mdx-components';

interface MDXArticlePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];

  for (const locale of SITE_LOCALES) {
    for (const article of getMDXArticlesByLocale(locale)) {
      params.push({ locale, slug: article.slug });
    }
  }

  return paramsOrPlaceholder(params, 'slug', 'sem-artigos');
}

export async function generateMetadata({ params }: MDXArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { article, locale: actualLocale } = getArticleWithFallback(slug, locale);

  if (!article) {
    const t = await getTranslations({ locale });
    return { title: siteTitle(t('notFound.title')), robots: { index: false, follow: false } };
  }

  // Only name the translations that exist: an alternate pointing at a page we
  // never exported is worse than no alternate at all.
  const availableLocales = SITE_LOCALES.filter(candidate => articleExistsInLocale(slug, candidate));

  return createPageMetadata({
    locale: actualLocale,
    path: `/artigos/${slug}`,
    title: siteTitle(article.title),
    description: article.excerpt,
    keywords: article.tags.join(', '),
    type: 'article',
    publishedTime: article.date,
    modifiedTime: article.updated,
    authors: [article.author],
    tags: article.tags,
    availableLocales: availableLocales.length ? availableLocales : [actualLocale],
    // The per-article card carries the headline and the register, so the alt
    // text has to say what the image says rather than repeat the page title.
    image: {
      url: getOgImageUrl(actualLocale, `/artigos/${slug}`),
      alt: article.title,
    },
  });
}

export default async function MDXArticlePage({ params }: MDXArticlePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const { article, locale: actualLocale } = getArticleWithFallback(slug, locale);

  if (!article) {
    notFound();
  }

  // Read the MDX file content
  const articlePath = getArticlePath(slug, actualLocale);
  let mdxContent: string;
  
  try {
    mdxContent = readFileSync(articlePath, 'utf8');
    // Remove the metadata export from the content
    mdxContent = mdxContent.replace(/export const metadata = \{[\s\S]*?\};\s*/, '');
  } catch (error) {
    console.error('Error reading MDX file:', error);
    notFound();
  }

  const components = getMDXComponents();
  const dateFormat = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Drawn from the locale the piece was actually written in, not the one being
  // browsed: only those translations were exported, so anything else is a link
  // to a page that does not exist.
  const onward = relatedArticles(article, getMDXArticlesByLocale(actualLocale));

  return (
    <>
      <ArticleStructuredData article={article} locale={actualLocale} />
      <div className="min-h-screen bg-paper">
        <Header />

        <main id="main-content" tabIndex={-1}>
          <PageHero
            width="3xl"
            compact
            back={{ href: '/artigos', label: t('articles.backToArticles'), locale }}
            eyebrow={
              <>
                {t(article.kind === 'nota' ? 'articles.kindNota' : 'articles.kindExplicador')}
                {' · '}
                <time dateTime={article.date}>{dateFormat.format(new Date(article.date))}</time>
              </>
            }
            title={article.title}
            lede={article.excerpt}
            meta={
              <>
                <span>
                  {t('articles.by')} {article.author} · {article.readTime} {t('articles.readTimeSuffix')}
                  {/* A revised piece says so on its face. Silent edits are how a
                      dated archive quietly stops being an archive. */}
                  {article.updated && (
                    <>
                      {' · '}
                      {t('articles.updated')} <time dateTime={article.updated}>{dateFormat.format(new Date(article.updated))}</time>
                    </>
                  )}
                </span>
                {article.tags.length > 0 && (
                  <span className="flex flex-wrap gap-x-3 gap-y-1">
                    <TagLinks tags={article.tags} locale={actualLocale} />
                  </span>
                )}
              </>
            }
          />

          <div className="max-w-3xl mx-auto px-4 pt-8 pb-16">
            {actualLocale !== locale && (
              <p lang={locale} className="mb-8 border-l-2 border-stone-400 bg-stone-50 py-3 pl-4 text-sm text-stone-600">
                {t('articles.onlyInPortugueseNotice')}
              </p>
            )}

            <article className="article-body" lang={actualLocale}>
              <MDXRemote source={mdxContent} components={components} />
            </article>

            {/* Onward reading before the email ask: a reader who just finished a
                piece is readier to open another one than to hand over an address. */}
            <KeepReading articles={onward} locale={actualLocale} />

            <div className="mt-12">
              <Subscribe locale={locale} />
            </div>

            <p className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-center text-sm">
              <Link href="/artigos" locale={locale} className="font-semibold text-ink underline underline-offset-4">
                {t('articles.backToArticles')}
              </Link>
              <Link href="/artigos/tema" locale={locale} className="font-semibold text-ink underline underline-offset-4">
                {t('articles.topicsAll')}
              </Link>
            </p>
          </div>
        </main>
        <SiteFooter locale={locale} />
      </div>
    </>
  );
}
