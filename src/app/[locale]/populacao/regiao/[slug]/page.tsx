import { setRequestLocale } from '@/i18n/request-locale';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPinned } from 'lucide-react';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { PageHero } from '@/components/PageHero';
import { PopulationSectionNav } from '@/components/population/SectionNav';
import { PopulationMap } from '@/components/population/map/PopulationMap';
import { RegionParishes } from '@/components/population/hub/RegionParishes';
import { formatCount, regionBySlug, regionListing, regionTables } from '@/components/population/hub/places';
import { POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import { createPageMetadata, SITE_LOCALES } from '@/lib/metadata';
import { ofRegion, regionSlug } from '@/lib/population/places';
import type { Locale } from '@/lib/population/labels';
import { paramsOrPlaceholder } from '@/lib/static-params';
import { loadPopulationPlaces } from '@/lib/utils/population-data-loader';
import { breadcrumbJsonLd, jsonLd } from '@/lib/structured-data';

type Params = Promise<{ locale: string; slug: string }>;

export const dynamicParams = false;

/** One page per region (18 districts and the two autonomous regions) and locale. */
export async function generateStaticParams() {
  const places = await loadPopulationPlaces();
  const params = places
    ? SITE_LOCALES.flatMap(locale => places.regions.map(([, name]) => ({ locale, slug: regionSlug(name) })))
    : [];
  return paramsOrPlaceholder(params, 'slug', 'indisponivel');
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = raw === 'en' ? 'en' : 'pt';
  setRequestLocale(locale);
  const places = await loadPopulationPlaces();
  const region = places ? regionBySlug(places, slug) : null;
  if (!region) return {};
  const of = ofRegion(region.id, region.name, locale);
  return createPageMetadata({
    locale,
    path: POPULATION_ROUTES.region(slug),
    title: locale === 'pt' ? `Freguesias ${of}` : `Parishes of ${of}`,
    description: locale === 'pt'
      ? `Os concelhos e as freguesias ${of}, com o link para a página de cada freguesia na população sintética de Portugal (Censos 2021).`
      : `The municipalities and parishes of ${of}, each linked to its page in Portugal’s synthetic population (2021 Census).`,
    index: true,
  });
}

export default async function RegionPage({ params }: { params: Params }) {
  const { locale: raw, slug } = await params;
  const locale: Locale = raw === 'en' ? 'en' : 'pt';
  setRequestLocale(locale);
  const pt = locale === 'pt';
  const places = await loadPopulationPlaces();
  const region = places ? regionBySlug(places, slug) : null;
  if (!places || !region) notFound();

  const municipalities = regionListing(places, region.id);
  const parishCount = municipalities.reduce((count, m) => count + m.parishes.length, 0);
  const counts = pt
    ? `${formatCount(municipalities.length, locale)} ${municipalities.length === 1 ? 'concelho' : 'concelhos'} e ${formatCount(parishCount, locale)} freguesias.`
    : `${formatCount(municipalities.length, locale)} ${municipalities.length === 1 ? 'municipality' : 'municipalities'} and ${formatCount(parishCount, locale)} parishes.`;

  return (
    <div className="min-h-screen bg-paper">
      {/* Population › region, for search results (SP-10). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd(locale, [
        { name: pt ? 'População' : 'Population', path: POPULATION_ROUTES.hub },
        { name: region.name },
      ])) }} />
      <Header />
      <main id="main-content" tabIndex={-1}>
      {/* The parish pages' header: population data pages share one. */}
      <PageHero
        compact
        field="periwinkle"
        measure="wide"
        back={{ href: POPULATION_ROUTES.hub, label: pt ? 'Todas as regiões' : 'All regions', locale }}
        icon={<MapPinned aria-hidden="true" className="h-4 w-4" />}
        eyebrow={pt ? `População sintética · v${POPULATION_RELEASE} · Censos 2021` : `Synthetic population · v${POPULATION_RELEASE} · 2021 Census`}
        title={pt ? `Freguesias ${ofRegion(region.id, region.name, locale)}` : `Parishes of ${ofRegion(region.id, region.name, locale)}`}
        lede={pt
          ? `${counts} Escolhe uma no mapa ou na lista para ver as respostas da população gerada.`
          : `${counts} Pick one on the map or in the list to see the generated population’s answers.`}
      />
      <PopulationSectionNav current="region" locale={locale} />

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <PopulationMap locale={locale} initialRegion={region.id} height={480} />
        <div className="mt-10">
          <RegionParishes municipalities={regionTables(municipalities)} locale={locale} />
        </div>
      </div>

      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
