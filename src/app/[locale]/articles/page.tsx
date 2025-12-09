import { Header } from "@/components/Header";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
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

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-stone-900 mb-3">{t('articles.title')}</h1>
          <p className="text-lg text-stone-600">
            {t('articles.subtitle')}
          </p>
        </div>

        {/* Coming Soon */}
        <div className="border-l-2 border-amber-500 pl-6 py-8 bg-stone-100">
          <h3 className="text-xl font-semibold text-stone-900 mb-3">
            {t('articles.comingSoon')}
          </h3>
          <p className="text-stone-600 mb-4 max-w-xl">
            {t('articles.comingSoonDescription')}
          </p>
          <p className="text-sm text-stone-500">
            {t('articles.newsletterNotification')}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-800 text-stone-300 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-light.svg" alt="estimador.pt" className="h-8 w-auto opacity-80" />
            <div className="text-center text-sm">
              <p>{t('about.footerCopyright')}</p>
              <p className="mt-2">
                {t('about.footerDeveloper')} ·
                <Link href="mailto:info@estimador.pt" className="text-stone-100 hover:text-white hover:underline ml-1">
                  info@estimador.pt
                </Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}