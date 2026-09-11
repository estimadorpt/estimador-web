import { createPageMetadata } from '@/lib/metadata';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getMDXComponents } from '@/mdx-components';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return createPageMetadata({
    locale,
    path: '/privacidade',
    title: t('meta.privacyTitle'),
    description: t('meta.privacyDescription'),
  });
}

function contentPath(locale: string): string {
  return path.join(process.cwd(), 'src/content/privacy', `${locale}.mdx`);
}

function getContent(locale: string): { content: string; actualLocale: string } {
  for (const candidate of [locale, 'pt', 'en']) {
    const file = contentPath(candidate);
    if (existsSync(file)) {
      return { content: readFileSync(file, 'utf8'), actualLocale: candidate };
    }
  }
  throw new Error('No privacy content found');
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { content, actualLocale } = getContent(locale);
  const components = getMDXComponents();

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        {actualLocale !== locale && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              {locale === 'en'
                ? 'This page is only available in Portuguese. Showing the Portuguese version.'
                : 'Esta página apenas está disponível em português.'}
            </p>
          </div>
        )}

        <article className="article-body max-w-none">
          <MDXRemote source={content} components={components} />
        </article>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
