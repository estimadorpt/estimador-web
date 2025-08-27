import { MDXArticleMetadata } from "@/lib/mdx-articles";

interface ArticleStructuredDataProps {
  article: MDXArticleMetadata;
}

export function ArticleStructuredData({ article }: ArticleStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "author": {
      "@type": "Person",
      "name": article.author,
      "url": "https://estimador.pt",
    },
    "publisher": {
      "@type": "Organization",
      "name": "estimador.pt",
      "url": "https://estimador.pt",
      "logo": {
        "@type": "ImageObject",
        "url": "https://estimador.pt/logo.png",
        "width": 60,
        "height": 60
      }
    },
    "datePublished": article.date,
    "dateModified": article.date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://estimador.pt/articles/${article.slug}`
    },
    "keywords": article.tags.join(", "),
    "articleSection": "Politics",
    "inLanguage": "en-US",
    "about": [
      {
        "@type": "Thing",
        "name": "Portuguese Politics"
      },
      {
        "@type": "Thing", 
        "name": "Election Forecasting"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface ArticleListStructuredDataProps {
  articles: Array<{
    id: string;
    title: string;
    excerpt: string;
    author: string;
    date: string;
    slug: string;
  }>;
}

export function ArticleListStructuredData({ articles }: ArticleListStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "estimador.pt Analysis & Articles",
    "description": "In-depth analysis of Portuguese politics, election trends, and forecasting methodology",
    "url": "https://estimador.pt/articles",
    "publisher": {
      "@type": "Organization",
      "name": "estimador.pt",
      "url": "https://estimador.pt"
    },
    "blogPost": articles.map(article => ({
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.excerpt,
      "author": {
        "@type": "Person",
        "name": article.author
      },
      "datePublished": article.date,
      "url": `https://estimador.pt/articles/${article.slug}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}