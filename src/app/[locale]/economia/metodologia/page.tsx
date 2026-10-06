import { createPageMetadata } from '@/lib/metadata';
// Methodology page for the economy section, from its bilingual MDX in
// src/content/economics-methodology/{locale}.mdx. While the section is in
// preparation it describes the prototype tested up to July 2026, in the past
// or conditional tense: the sources, the four labels, how it was evaluated and
// what the internal backtest showed. Every HonestyNote "read more" and every
// StatusBadge on the dashboard links here — at launch, bring it back in step
// with what the tiles claim.

import { Header } from '@/components/Header';
import { PageHero } from '@/components/PageHero';
import { SiteFooter } from '@/components/SiteFooter';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from "lucide-react";
import { RevisedDate } from '@/components/brand/RevisedDate';
import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getMDXComponents } from '@/mdx-components';
import { ECONOMY_PUBLISHED } from '@/lib/config/economy-status';
import { setRequestLocale } from '@/i18n/request-locale';

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
    path: '/economia/metodologia',
    title: t('meta.economicsMethodologyTitle'),
    description: t('meta.economicsMethodologyDescription'),
    // Out of search while the section is in preparation (economy-status.json).
    index: ECONOMY_PUBLISHED,
  });
}

function contentPath(locale: string): string {
  return path.join(process.cwd(), 'src/content/economics-methodology', `${locale}.mdx`);
}

function getContent(locale: string): { content: string; actualLocale: string } {
  for (const candidate of [locale, 'pt', 'en']) {
    const p = contentPath(candidate);
    if (existsSync(p)) {
      return { content: readFileSync(p, 'utf8'), actualLocale: candidate };
    }
  }
  throw new Error('No economics methodology content found');
}

/** The month the prototype the page describes was last tested (no feed is shipped until launch). */
const PROTOTYPE_TESTED = '2026-07';

/** When this page's text was last checked (a day, like every methodology page). */
const REVISED = '2026-10-06';

export default async function EconomicsMethodologyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'economics' });

  const { content: mdxContent, actualLocale } = getContent(locale);

  // In preparation, the page says so before anything else, dated by the month
  // the prototype it describes was last tested.
  const testedUntil = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${PROTOTYPE_TESTED}-01T00:00:00Z`));
  // Set as reading prose like every methodology page, with the shared MDX
  // components (ink links); the PageHero carries the title, so the file's own
  // "# " line is dropped.
  const components = getMDXComponents({ h1: () => null });

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
      {/* One kicker (the way back to the section) and one statement of the
          status, the lede (M-5): the body does not repeat it. */}
      <PageHero
        measure="wide"
        back={{ href: "/economia", label: t(ECONOMY_PUBLISHED ? 'title' : 'preparingTitle') }}
        title={t('methodologyTitle')}
        lede={ECONOMY_PUBLISHED ? undefined : t('methodologyPreparingNotice', { date: testedUntil })}
        meta={<RevisedDate date={REVISED} locale={locale} />}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-8"><div className="max-w-4xl">

        {actualLocale !== locale && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              {locale === 'en'
                ? 'This page is only available in Portuguese. Showing the Portuguese version.'
                : 'Esta página apenas está disponível em inglês. A mostrar a versão inglesa.'}
            </p>
          </div>
        )}

        <article className="article-body max-w-none" lang={actualLocale}>
          <MDXRemote
            source={mdxContent}
            components={components}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </article>

        <div className="mt-10 border-t border-line pt-6">
          <Link
            href="/economia"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink"
          >
            <ArrowLeft aria-hidden="true" className="w-4 h-4" />
            {t(ECONOMY_PUBLISHED ? 'title' : 'preparingTitle')}
          </Link>
        </div>
      </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
