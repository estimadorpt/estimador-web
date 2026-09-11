import { createPageMetadata } from '@/lib/metadata';
import { Header } from "@/components/Header";
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getMDXComponents } from '@/mdx-components';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return createPageMetadata({
    locale,
    path: '/sobre',
    title: t('meta.aboutTitle'),
    description: t('about.subtitle'),
  });
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
  const components = getMDXComponents();

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-10 md:py-16">
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

        <article className="article-body max-w-none">
          <MDXRemote source={mdxContent} components={components} />
        </article>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
