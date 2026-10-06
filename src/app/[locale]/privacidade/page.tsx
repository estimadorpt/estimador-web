import { createPageMetadata } from '@/lib/metadata';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { RevisedDate } from '@/components/brand/RevisedDate';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from '@/i18n/request-locale';
import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getMDXComponents } from '@/mdx-components';

/** When this page was last checked against what the site does (move it with the text). */
const PRIVACY_REVISED = '2026-10-06';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
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

/**
 * Whether email delivery is switched on in this build, read from the same
 * variable the subscribe card reads, so the page cannot describe a form the
 * site does not show (or hide one it does).
 */
function NewsletterStatus({ locale }: { locale: string }) {
  const active = Boolean(process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT);
  const pt = locale !== 'en';
  return (
    <p>
      <strong>
        {active
          ? (pt ? 'O envio por e-mail está ativo.' : 'Email delivery is active.')
          : (pt ? 'Neste momento, o envio por e-mail não está ativo.' : 'Email delivery is not active at the moment.')}
      </strong>{' '}
      {active
        ? (pt ? 'É assim que funciona:' : 'This is how it works:')
        : (pt
            ? 'O site não mostra nenhum campo de e-mail e não envia nada ao Buttondown. O que se segue descreve o serviço tal como funcionará quando for ligado.'
            : 'The site shows no email field and sends nothing to Buttondown. What follows describes the service as it will work once it is switched on.')}
    </p>
  );
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale !== 'en';
  const { content, actualLocale } = getContent(locale);
  const components = getMDXComponents({
    NewsletterStatus: () => <NewsletterStatus locale={actualLocale} />,
  });

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
        <PageHero
          measure="reading"
          compact
          title={pt ? 'Privacidade' : 'Privacy'}
          lede={pt
            ? 'O que o estimador.pt regista sobre quem o visita. Descreve o comportamento real do site, não intenções.'
            : 'What estimador.pt records about its visitors. It describes what the site actually does, not what it intends to do.'}
          meta={<RevisedDate date={PRIVACY_REVISED} locale={locale} />}
        />

        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:py-12"><div className="max-w-3xl">
          {actualLocale !== locale && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {locale === 'en'
                  ? 'This page is only available in Portuguese. Showing the Portuguese version.'
                  : 'Esta página apenas está disponível em português.'}
              </p>
            </div>
          )}

          <article className="article-body max-w-none [&>:first-child]:!mt-0" lang={actualLocale}>
            <MDXRemote source={content} components={components} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
          </article>
        </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
