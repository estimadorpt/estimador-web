/**
 * schema.org Dataset markup for /populacao/dados: what search engines and
 * dataset search need to list the release (name, version, licence, files,
 * coverage, citation). Built from the release's own facts and download list.
 *
 * Local to the population section for now; a site-wide JSON-LD helper is
 * being added separately (the two should be unified when it lands).
 */
import { POPULATION_DOWNLOADS, POPULATION_RELEASE, POPULATION_ROUTES } from '@/lib/config/population';
import type { PopulationReleaseInfo } from '@/types/population';

const SITE = 'https://estimador.pt';

const FORMAT: Record<string, string> = {
  zip: 'application/zip',
  parquet: 'application/vnd.apache.parquet',
  csv: 'text/csv',
  json: 'application/json',
};

export function populationDatasetJsonLd(release: PopulationReleaseInfo, locale: 'pt' | 'en'): Record<string, unknown> {
  const pt = locale === 'pt';
  const url = `${SITE}/${locale}${POPULATION_ROUTES.data}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${SITE}/pt${POPULATION_ROUTES.data}/#dataset`,
    name: pt ? `População Sintética de Portugal v${POPULATION_RELEASE}` : `Synthetic Population of Portugal v${POPULATION_RELEASE}`,
    alternateName: release.name,
    description: pt
      ? `Microdados de uma população sintética de Portugal, freguesia a freguesia (${release.counts.persons} pessoas e ${release.counts.households} agregados gerados, ${release.counts.parishes_published} freguesias), gerada a partir dos Censos 2021 do INE. Pessoas e agregados gerados, não pessoas reais. Uma única execução do modelo.`
      : `Microdata of a synthetic population of Portugal, parish by parish (${release.counts.persons} generated people and ${release.counts.households} households, ${release.counts.parishes_published} parishes), generated from INE’s 2021 Census. Generated people and households, not real people. A single model run.`,
    url,
    sameAs: POPULATION_DOWNLOADS.release,
    version: release.version,
    datePublished: release.published,
    inLanguage: ['pt', 'en'],
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: { '@type': 'Organization', name: 'estimador.pt', url: SITE },
    publisher: { '@type': 'Organization', name: 'estimador.pt', url: SITE },
    isBasedOn: {
      '@type': 'Dataset',
      name: pt ? 'Censos 2021 (Recenseamento Geral da População e Habitação)' : '2021 Census (Population and Housing Census)',
      creator: { '@type': 'Organization', name: 'Instituto Nacional de Estatística, IP – Portugal' },
    },
    spatialCoverage: { '@type': 'Place', name: 'Portugal' },
    temporalCoverage: '2021',
    keywords: pt
      ? ['população sintética', 'microdados', 'freguesias', 'Censos 2021', 'Portugal']
      : ['synthetic population', 'microdata', 'parishes', '2021 Census', 'Portugal'],
    citation: release.attribution.cite_as,
    creditText: release.attribution[locale],
    distribution: POPULATION_DOWNLOADS.files
      .filter(file => file.key !== 'checksums' && file.key !== 'sums')
      .map(file => ({
        '@type': 'DataDownload',
        name: file.name,
        contentUrl: file.url,
        encodingFormat: FORMAT[file.name.split('.').pop() ?? ''] ?? 'application/octet-stream',
        contentSize: `${file.bytes} B`,
      })),
  };
}

/** The markup as script text: `<` escaped so the JSON cannot close the script element. */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
