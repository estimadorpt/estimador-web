import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getArticles } from "@/lib/articles";
import { ArticleListStructuredData } from "@/components/StructuredData";
import type { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('meta.articlesTitle'),
    description: t('articles.subtitle'),
    openGraph: {
      title: t('meta.articlesTitle'),
      description: t('articles.subtitle'),
      url: `https://estimador.pt/${locale}/articles`,
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/articles`,
    },
  };
}

export default async function ArticlesPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const articles = getArticles();

  return (
    <>
      <ArticleListStructuredData articles={articles} />
      <div className="min-h-screen bg-green-pale">
        <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-dark mb-4">{t('articles.title')}</h1>
          <p className="text-lg text-green-dark/70">
            {t('articles.subtitle')}
          </p>
        </div>

        <div className="grid gap-6">
          {articles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">
                      <Link href={`/articles/${article.slug}`} className="hover:text-green-medium transition-colors">
                        {article.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-base">
                      {article.excerpt}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>{t('articles.by')} {article.author}</span>
                    <span>•</span>
                    <span>{new Date(article.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                    <span>•</span>
                    <span>{article.readTime} {t('articles.readTime')}</span>
                  </div>
                  <div className="flex gap-2">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-green-dark mb-2">
                {t('articles.comingSoon')}
              </h3>
              <p className="text-green-dark/70 mb-4">
                {t('articles.comingSoonDescription')}
              </p>
              <p className="text-sm text-slate-500">
                {t('articles.newsletterNotification')}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-green-medium/30 bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-600">
            <p>{t('about.footerCopyright')}</p>
            <p className="mt-2">
              {t('about.footerDeveloper')} • 
              <Link href="mailto:info@estimador.pt" className="text-green-medium hover:text-green-dark hover:underline ml-1">
                info@estimador.pt
              </Link>
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}