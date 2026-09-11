import { MDXArticleMetadata } from "@/lib/mdx-articles";
import { localizedUrl } from "@/lib/metadata";

const PUBLISHER = {
  "@type": "Organization",
  name: "estimador.pt",
  url: "https://estimador.pt",
  logo: {
    "@type": "ImageObject",
    url: "https://estimador.pt/logo.png",
    width: 60,
    height: 60,
  },
} as const;

/** BCP 47 tag for a site locale. */
function language(locale: string): string {
  return locale === "pt" ? "pt-PT" : "en-GB";
}

interface ArticleStructuredDataProps {
  article: MDXArticleMetadata;
  /** The locale the article is actually being served in. */
  locale: string;
}

export function ArticleStructuredData({ article, locale }: ArticleStructuredDataProps) {
  const url = localizedUrl(locale, `/artigos/${article.slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    author: {
      "@type": "Person",
      name: article.author,
      url: "https://estimador.pt",
    },
    publisher: PUBLISHER,
    datePublished: article.date,
    // A revised piece that still reports its publication date as the last
    // change is telling search engines the revision never happened.
    dateModified: article.updated ?? article.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    keywords: article.tags.join(", "),
    inLanguage: language(locale),
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
    title: string;
    excerpt: string;
    author: string;
    date: string;
    slug: string;
  }>;
  locale: string;
}

export function ArticleListStructuredData({ articles, locale }: ArticleListStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "estimador.pt",
    url: localizedUrl(locale, "/artigos"),
    inLanguage: language(locale),
    publisher: PUBLISHER,
    blogPost: articles.map(article => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      author: { "@type": "Person", name: article.author },
      datePublished: article.date,
      inLanguage: language(locale),
      url: localizedUrl(locale, `/artigos/${article.slug}`),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
