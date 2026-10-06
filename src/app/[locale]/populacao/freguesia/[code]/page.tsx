import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { ParishPage } from '@/components/population/parish/ParishPage';
import { feedAlternates, getOgImageSize, getOgImageUrl, siteTitle, SITE_URL } from '@/lib/metadata';
import { parishPrefetchScript } from '@/lib/population/prefetch';
import { setRequestLocale } from '@/i18n/request-locale';

/**
 * The parish page: one exported shell for all 3,092 parishes. Azure rewrites
 * /{locale}/populacao/freguesia/{CODE}/ to this file (staticwebapp.config.json)
 * and the client reads the code from the address. In `next dev` the segment
 * renders directly, which is the same component.
 */
export function generateStaticParams() {
  return [{ code: '_' }];
}

/**
 * Static metadata that names no parish. Deliberately not createPageMetadata:
 * it always sets a canonical, and a canonical (or a noindex) in this shell
 * would apply to every parish at once. `alternates` is replaced, not merged,
 * so this also drops the layout's homepage canonical and hreflang links; the
 * client sets the parish's own (ParishPage → setParishHead).
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  const title = siteTitle(pt ? 'Freguesia · População sintética' : 'Parish · Synthetic population');
  const description = pt
    ? 'Quem vive em cada freguesia de Portugal: idades, trabalho, escolaridade e agregados numa população sintética gerada a partir dos Censos 2021.'
    : 'Who lives in each parish of Portugal: ages, work, education and households in a synthetic population generated from the 2021 Census.';
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    // No canonical and no hreflang (see above); the feed link only once this
    // locale has an article, the same rule createPageMetadata applies.
    alternates: { types: feedAlternates(locale) },
    openGraph: {
      title,
      description,
      siteName: 'estimador.pt',
      locale: pt ? 'pt_PT' : 'en_GB',
      type: 'website',
      // Link previews do not run the page's JavaScript, so every parish shares the
      // population section's card (not the site's general one). Per-parish
      // previews need a server-side step; see the round-2 follow-ups.
      images: [{ url: getOgImageUrl(locale, '/populacao'), ...getOgImageSize(), alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@estimadorpt',
      images: [getOgImageUrl(locale, '/populacao')],
    },
  };
}

export default async function ParishRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-paper">
      {/* Starts the parish's data before the page's JavaScript has loaded (UXM2V-01). */}
      <script dangerouslySetInnerHTML={{ __html: parishPrefetchScript() }} />
      <Header />
      <ParishPage locale={locale === 'en' ? 'en' : 'pt'} />
      <SiteFooter locale={locale} />
    </div>
  );
}
