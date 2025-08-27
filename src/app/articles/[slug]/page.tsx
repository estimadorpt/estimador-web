import { getArticles, getArticleBySlug } from '@/lib/articles';
import { ArticleLayout } from '@/components/ArticleLayout';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const articles = getArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  
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
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      creator: '@estimadorpt',
    },
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticleBySlug(params.slug);
  
  if (!article) {
    notFound();
  }

  return <ArticleLayout article={article} />;
}