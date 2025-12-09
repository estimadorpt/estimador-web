import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { useMDXComponents } from '@/mdx-components';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t('meta.aboutTitle'),
    description: t('about.subtitle'),
    openGraph: {
      title: t('meta.aboutTitle'),
      description: t('about.subtitle'),
      url: `https://estimador.pt/${locale}/about`,
    },
    alternates: {
      canonical: `https://estimador.pt/${locale}/about`,
    },
  };
}

function getAboutPath(locale: string): string {
  return path.join(process.cwd(), 'src/content/about', `${locale}.mdx`);
}

function getAboutContent(locale: string): { content: string; actualLocale: string } {
  // Try preferred locale first
  let mdxPath = getAboutPath(locale);

  if (existsSync(mdxPath)) {
    return {
      content: readFileSync(mdxPath, 'utf8'),
      actualLocale: locale
    };
  }

  // Fallback to Portuguese
  if (locale !== 'pt') {
    mdxPath = getAboutPath('pt');
    if (existsSync(mdxPath)) {
      return {
        content: readFileSync(mdxPath, 'utf8'),
        actualLocale: 'pt'
      };
    }
  }

  // Fallback to English
  mdxPath = getAboutPath('en');
  if (existsSync(mdxPath)) {
    return {
      content: readFileSync(mdxPath, 'utf8'),
      actualLocale: 'en'
    };
  }

  throw new Error('No about content found');
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const { content: mdxContent, actualLocale } = getAboutContent(locale);
  const components = useMDXComponents({});

  return (
    <div className="min-h-screen bg-green-pale">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Locale Notice (if fallback) */}
        {actualLocale !== locale && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              {locale === 'en'
                ? `This page is only available in Portuguese. Showing Portuguese version.`
                : `Esta página apenas está disponível em português.`
              }
            </p>
          </div>
        )}

        <Card>
          <CardContent className="p-8">
            <article className="prose prose-lg max-w-none mdx-content">
              <MDXRemote source={mdxContent} components={components} />
            </article>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-green-medium/30 bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="estimador.pt" className="h-8 w-auto opacity-60" />
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
        </div>
      </footer>
    </div>
  );
}
