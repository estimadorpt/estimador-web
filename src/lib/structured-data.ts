/**
 * schema.org JSON-LD for search engines: the site and its publisher on every
 * page (the [locale] layout), a Dataset for the open synthetic population, and
 * breadcrumbs for pages deep in a hierarchy.
 *
 * Pure functions returning plain objects, so pages can mount them however
 * they render (`<script type="application/ld+json"
 * dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />`) and tests can read
 * them. No Node imports: the parish page builds its head in the browser.
 */
import descriptor from './brand/descriptor.json';
import { POPULATION_DOWNLOADS, POPULATION_PUBLISHED, POPULATION_RELEASE, POPULATION_ROUTES } from './config/population';
import { formatCount } from './population/format';
import type { PopulationReleaseInfo } from '@/types/population';

export const SITE_URL = 'https://estimador.pt';

type Locale = 'pt' | 'en';
const asLocale = (locale: string): Locale => (locale === 'en' ? 'en' : 'pt');

/** BCP 47 tag for a site locale. */
export function languageTag(locale: string): string {
  return asLocale(locale) === 'pt' ? 'pt-PT' : 'en-GB';
}

/** The page URL the site's canonicals use: locale prefix and a trailing slash. */
function pageUrl(locale: string, pathname: string): string {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  return `${SITE_URL}/${asLocale(locale)}/${clean ? `${clean}/` : ''}`;
}

/**
 * Serialise for a <script> element. JSON is valid JavaScript, but a "</script>"
 * inside a string would end the element early; escaping "<" makes any string safe.
 */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
/**
 * One WebSite node per language, each named by its own start page: a single
 * id would carry a different url and inLanguage on every Portuguese and
 * English page (SEO3V-M3).
 */
const websiteId = (locale: Locale) => `${pageUrl(locale, '/')}#website`;

/** The publisher: who stands behind every page and dataset. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'estimador.pt',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    founder: { '@type': 'Person', name: 'Bernardo Caldas' },
    email: 'info@estimador.pt',
    sameAs: ['https://github.com/estimadorpt'],
  };
}

/** The site itself, in the reader's language. No SearchAction: the site has no search URL. */
export function websiteJsonLd(locale: string) {
  const lang = asLocale(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId(lang),
    name: 'estimador.pt',
    url: pageUrl(lang, '/'),
    description: `${descriptor.line[lang]} ${descriptor.descriptor[lang]}`,
    inLanguage: languageTag(lang),
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/** Both blocks the layout mounts on every page, as one @graph. */
export function siteJsonLd(locale: string) {
  const { '@context': _context, ...organization } = organizationJsonLd();
  const { '@context': _context2, ...website } = websiteJsonLd(locale);
  void _context; void _context2;
  return { '@context': 'https://schema.org', '@graph': [organization, website] };
}

export interface BreadcrumbItem {
  name: string;
  /** Locale-less site path ("/populacao/regiao/lisboa"); the last item may omit it. */
  path?: string;
}

/**
 * Portugal › distrito › concelho › freguesia, or Liga › club. The last item
 * is the page itself; Google accepts it without a URL.
 */
export function breadcrumbJsonLd(locale: string, items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path !== undefined ? { item: pageUrl(locale, item.path) } : {}),
    })),
  };
}

const DATASET_COPY = {
  pt: {
    name: 'População Sintética de Portugal',
    description: (counts: string) =>
      `Microdados de uma população sintética de Portugal, freguesia a freguesia${counts}, gerada a partir dos Censos 2021 do INE: `
      + 'idade, educação, situação perante o emprego e composição dos agregados. Pessoas e agregados gerados, não pessoas reais. '
      + 'Uma única execução do modelo, com a qualidade medida por freguesia.',
    counts: (persons: string, households: string, parishes: string) =>
      ` (${persons} pessoas e ${households} agregados gerados, ${parishes} freguesias dos Censos 2021, CAOP 2021)`,
    keywords: ['população sintética', 'microdados', 'Censos 2021', 'freguesias', 'Portugal', 'demografia'],
    census: 'Censos 2021 (Recenseamento Geral da População e Habitação)',
  },
  en: {
    name: 'Synthetic Population of Portugal',
    description: (counts: string) =>
      `Microdata of a synthetic population of Portugal, parish by parish${counts}, generated from INE’s 2021 Census: `
      + 'age, education, employment status and household composition. Generated people and households, not real people. '
      + 'A single model run, with quality measured per parish.',
    counts: (persons: string, households: string, parishes: string) =>
      ` (${persons} generated people and ${households} households, the ${parishes} parishes of the 2021 Census, CAOP 2021)`,
    keywords: ['synthetic population', 'microdata', '2021 Census', 'parishes', 'Portugal', 'demography'],
    census: '2021 Census (Population and Housing Census)',
  },
} as const;

const ENCODING: Record<string, string> = {
  parquet: 'application/vnd.apache.parquet',
  csv: 'text/csv',
  json: 'application/json',
  zip: 'application/zip',
};

/**
 * The Dataset block for /populacao/dados (Google Dataset Search reads it), the
 * one helper for it. Every value comes from the release config (version,
 * publication date, GitHub release and asset URLs) and, when the page passes
 * the release's own release.json, its counts, citation and credit line:
 *
 *   <script type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: jsonLd(populationDatasetJsonLd(locale, release)) }} />
 */
export function populationDatasetJsonLd(locale: string, release?: PopulationReleaseInfo | null) {
  const lang = asLocale(locale);
  const copy = DATASET_COPY[lang];
  const counts = release?.counts;
  const countText = counts?.persons && counts.households && counts.parishes_published
    ? copy.counts(formatCount(counts.persons, lang), formatCount(counts.households, lang), formatCount(counts.parishes_published, lang))
    : '';
  const distribution = POPULATION_DOWNLOADS.files
    .map(file => ({ file, format: ENCODING[file.name.split('.').pop() ?? ''] }))
    .filter(({ format }) => Boolean(format))
    .map(({ file, format }) => ({
      '@type': 'DataDownload',
      name: file.name,
      contentUrl: file.url,
      encodingFormat: format,
      contentSize: `${file.bytes} B`,
    }));
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${pageUrl('pt', POPULATION_ROUTES.data)}#dataset`,
    name: `${copy.name} v${POPULATION_RELEASE}`,
    alternateName: release?.name ?? 'pt-synthpop',
    description: copy.description(countText),
    url: pageUrl(lang, POPULATION_ROUTES.data),
    sameAs: POPULATION_DOWNLOADS.release,
    identifier: `pt-synthpop v${POPULATION_RELEASE}`,
    version: POPULATION_RELEASE,
    datePublished: POPULATION_PUBLISHED,
    inLanguage: languageTag(lang),
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    keywords: [...copy.keywords],
    creator: { '@id': ORGANIZATION_ID, '@type': 'Organization', name: 'estimador.pt', url: SITE_URL },
    publisher: { '@id': ORGANIZATION_ID, '@type': 'Organization', name: 'estimador.pt', url: SITE_URL },
    isBasedOn: {
      '@type': 'Dataset',
      name: copy.census,
      url: 'https://censos.ine.pt/',
      creator: { '@type': 'Organization', name: 'Instituto Nacional de Estatística, IP – Portugal' },
    },
    temporalCoverage: '2021',
    spatialCoverage: { '@type': 'Place', name: 'Portugal', geo: { '@type': 'GeoShape', box: '32.4 -31.5 42.2 -6.1' } },
    ...(release ? { citation: release.attribution.cite_as, creditText: release.attribution[lang] } : {}),
    distribution,
  };
}
