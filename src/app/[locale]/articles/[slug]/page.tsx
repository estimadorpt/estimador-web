import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getMDXArticleBySlug, getMDXArticlesByLocale, getArticleWithFallback, getArticlePath } from '@/lib/mdx-articles';
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Link } from '@/i18n/routing';
import { ArticleStructuredData } from "@/components/StructuredData";
import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { useMDXComponents } from '@/mdx-components';

interface MDXArticlePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const locales = ['pt', 'en'];
  const params: { locale: string; slug: string }[] = [];
  
  for (const locale of locales) {
    const articles = getMDXArticlesByLocale(locale);
    for (const article of articles) {
      params.push({
        locale,
        slug: article.slug
      });
    }
  }
  
  return params;
}

export async function generateMetadata({ params }: MDXArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { article, locale: actualLocale } = getArticleWithFallback(slug, locale);
  
  if (!article) {
    return {
      title: 'Article Not Found | estimador.pt',
    };
  }

  return {
    title: `${article.title} | estimador.pt`,
    description: article.excerpt,
    keywords: article.tags.join(', '),
    authors: [{ name: article.author }],
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      authors: [article.author],
      publishedTime: article.date,
      tags: article.tags,
      siteName: 'estimador.pt',
      url: `https://estimador.pt/${locale}/articles/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      creator: '@estimadorpt',
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/articles/${slug}`,
    },
  };
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

  const components = useMDXComponents({});

  return (
    <>
      <ArticleStructuredData article={article} />
      <div className="min-h-screen bg-green-pale">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <Link href="/articles" className="text-green-medium hover:text-green-dark hover:underline">
              ← {t('articles.backToArticles')}
            </Link>
          </nav>

          {/* Locale Notice (if fallback) */}
          {actualLocale !== locale && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                {locale === 'en' 
                  ? `This article is only available in Portuguese. Showing Portuguese version.`
                  : `Este artigo apenas está disponível em português.`
                }
              </p>
            </div>
          )}

          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-green-dark mb-4 leading-tight">
              {article.title}
            </h1>
            
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {article.excerpt}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span>{t('articles.by')} {article.author}</span>
              <span>•</span>
              <span>{new Date(article.date).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
              <span>•</span>
              <span>{article.readTime} {t('articles.readTime')}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </header>

          {/* MDX Content */}
          <article className="prose prose-lg max-w-none mdx-content">
            <MDXRemote source={mdxContent} components={components} />
          </article>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <Link 
                href="/articles" 
                className="inline-flex items-center text-green-medium hover:text-green-dark hover:underline"
              >
                ← {t('articles.backToArticles')}
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}