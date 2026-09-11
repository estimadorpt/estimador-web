import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getMDXArticlesByLocale, getArticleWithFallback, getArticlePath, articleExistsInLocale } from '@/lib/mdx-articles';
import { createPageMetadata, getOgImageUrl, SITE_LOCALES } from '@/lib/metadata';
import { paramsOrPlaceholder } from '@/lib/static-params';
import { Header } from "@/components/Header";
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
  const { article, locale: actualLocale } = getArticleWithFallback(slug, locale);
  
  if (!article) {
    return { title: 'Article Not Found | estimador.pt', robots: { index: false, follow: false } };
  }

  // Only name the translations that exist: an alternate pointing at a page we
  // never exported is worse than no alternate at all.
  const availableLocales = SITE_LOCALES.filter(candidate => articleExistsInLocale(slug, candidate));

  return createPageMetadata({
    locale: actualLocale,
    path: `/artigos/${slug}`,
    title: `${article.title} | estimador.pt`,
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

        <main className="max-w-3xl mx-auto px-4 py-10">
          <nav className="mb-8">
            <Link href="/artigos" locale={locale} className="text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800">
              ← {t('articles.backToArticles')}
            </Link>
          </nav>

          {actualLocale !== locale && (
            <p className="mb-8 border-l-2 border-stone-400 bg-stone-50 py-3 pl-4 text-sm text-stone-600">
              {locale === 'en'
                ? 'This article is only available in Portuguese. Showing the Portuguese version.'
                : 'Este artigo apenas está disponível em português.'}
            </p>
          )}

          <header className="mb-10 border-b border-stone-200 pb-8">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-wider">
              <span className="text-stone-800">
                {t(article.kind === 'nota' ? 'articles.kindNota' : 'articles.kindExplicador')}
              </span>
              <time dateTime={article.date} className="text-stone-500">
                {dateFormat.format(new Date(article.date))}
              </time>
              <TagLinks tags={article.tags} locale={actualLocale} />
            </div>

            <h1 className="mb-4 text-3xl md:text-4xl leading-tight tracking-tight text-stone-900">
              {article.title}
            </h1>

            <p className="mb-6 text-lg leading-relaxed text-stone-600">
              {article.excerpt}
            </p>

            <p className="text-sm text-stone-500">
              {t('articles.by')} {article.author} · {article.readTime} {t('articles.readTimeSuffix')}
              {/* A revised piece says so on its face. Silent edits are how a
                  dated archive quietly stops being an archive. */}
              {article.updated && (
                <>
                  {' · '}
                  <span className="text-stone-600">
                    {t('articles.updated')} <time dateTime={article.updated}>{dateFormat.format(new Date(article.updated))}</time>
                  </span>
                </>
              )}
            </p>
          </header>

          <article className="article-body">
            <MDXRemote source={mdxContent} components={components} />
          </article>
        </main>

        <div className="max-w-3xl mx-auto px-4 pb-16">
          {/* Onward reading before the email ask: a reader who just finished a
              piece is readier to open another one than to hand over an address. */}
          <KeepReading articles={onward} locale={actualLocale} />

          <div className="mt-12">
            <Subscribe />
          </div>

          <p className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-center">
            <Link
              href="/artigos"
              locale={locale}
              className="text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              ← {t('articles.backToArticles')}
            </Link>
            <Link
              href="/artigos/tema"
              locale={locale}
              className="text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {t('articles.topicsAll')}
            </Link>
          </p>
        </div>
        <SiteFooter locale={locale} />
      </div>
    </>
  );
}
