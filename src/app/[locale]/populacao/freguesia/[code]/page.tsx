import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { ParishPage } from '@/components/population/parish/ParishPage';
import { feedAlternates, getOgImageAlt, getOgImageSize, getOgImageUrl, siteTitle, SITE_URL } from '@/lib/metadata';
import { parishShellScript } from '@/lib/population/prefetch';
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
 * so this also drops the layout's homepage canonical and hreflang links. The
 * shell's early script writes the parish's own before hydration
 * (parishShellScript) and ParishPage keeps them right (head.ts → watchHead).
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const pt = locale === 'pt';
  const title = siteTitle(pt ? 'Freguesia · População sintética' : 'Parish · Synthetic population');
  const description = pt
    ? 'Quem vive em cada freguesia de Portugal: idades, trabalho, escolaridade e agregados numa população sintética gerada a partir dos Censos 2021.'
    : 'Who lives in each parish of Portugal: ages, work, education and households in a synthetic population generated from the 2021 Census.';
  const image = getOgImageUrl(locale, '/populacao');
  // The alt describes the card the preview shows (the population card), not the page (SPV-04).
  const imageAlt = getOgImageAlt(locale, '/populacao', title);
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
      images: [{ url: image, ...getOgImageSize(), alt: imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
  };
}

export default async function ParishRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-paper">
      {/* The one early script: starts the parish's data and writes its canonical and
          alternates before the page's JavaScript has loaded (UXM2V-01, SPV-03). */}
      <script dangerouslySetInnerHTML={{ __html: parishShellScript(locale === 'en' ? 'en' : 'pt') }} />
      <Header />
      <ParishPage locale={locale === 'en' ? 'en' : 'pt'} />
      <SiteFooter locale={locale} />
    </div>
  );
}
