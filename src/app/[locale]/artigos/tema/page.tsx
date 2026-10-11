import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { Link } from '@/i18n/routing';
import { buildTagIndex } from '@/lib/article-discovery';
import { getMDXArticlesByLocale } from '@/lib/mdx-articles';
import { createPageMetadata, SITE_LOCALES } from '@/lib/metadata';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { PageHero } from '@/components/PageHero';
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
    path: '/artigos/tema',
    title: t('meta.topicsTitle'),
    description: t('articles.topicsIntro'),
    // Out of search while this locale has nothing to group (see /artigos).
    index: getMDXArticlesByLocale(locale).length > 0,
  });
}

export function generateStaticParams() {
  return SITE_LOCALES.map(locale => ({ locale }));
}

/**
 * The directory the individual topic pages hang off.
 *
 * It exists as much for the reader who deletes a segment off the end of
 * /artigos/tema/sondagens as for anyone who navigates to it deliberately —
 * landing on a 404 there would reintroduce exactly the dead end these pages
 * were added to remove.
 */
export default async function TopicsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const groups = buildTagIndex(getMDXArticlesByLocale(locale));

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main id="main-content" tabIndex={-1}>
        <PageHero
          measure="wide"
          compact
          back={{ href: '/artigos', label: t('articles.title'), locale }}
          title={t('articles.topicsHeading')}
          lede={t('articles.topicsIntro')}
        />
        <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-12"><div className="max-w-4xl">
        {groups.length === 0 ? (
          <div className="flex items-center gap-6 py-6">
            <EmptyStateMark />
            <div>
              <p className="text-graphite">{t('articles.empty')}</p>
              <p className="mt-4">
                <Link
                  href="/populacao"
                  locale={locale}
                  className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-ink underline underline-offset-4 hover:no-underline"
                >
                  {t('articles.emptyNextStep')}
                  <span aria-hidden="true">→</span>
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <ul className="border-t border-ink">
            {groups.map(group => (
              <li key={group.slug} className="border-b border-rule">
                <Link
                  href={`/artigos/tema/${group.slug}`}
                  locale={locale}
                  className="group flex items-baseline justify-between gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="text-base font-medium text-ink group-hover:text-ink">
                    {group.label}
                  </span>
                  <span className="text-xs tabular-nums text-graphite">
                    {t('articles.topicCount', { count: group.articles.length })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        </div></div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
