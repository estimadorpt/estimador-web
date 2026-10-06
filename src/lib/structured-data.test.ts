import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DOWNLOADS, POPULATION_PUBLISHED, POPULATION_RELEASE } from './config/population';
import { breadcrumbJsonLd, jsonLd, organizationJsonLd, populationDatasetJsonLd, siteJsonLd, websiteJsonLd } from './structured-data';

describe('structured data', () => {
  it('serialises safely inside a <script> element', () => {
    const text = jsonLd({ name: '</script><script>alert(1)</script>' });
    expect(text).not.toContain('</script>');
    expect(JSON.parse(text)).toEqual({ name: '</script><script>alert(1)</script>' });
  });

  it('describes the site and its publisher in the reader’s language', () => {
    expect(websiteJsonLd('en')).toMatchObject({ '@type': 'WebSite', url: 'https://estimador.pt/en/', inLanguage: 'en-GB' });
    // One node id per definition: the two languages' WebSite nodes differ in
    // url and inLanguage, so they cannot share an @id (SEO3V-M3).
    expect(websiteJsonLd('pt')['@id']).toBe('https://estimador.pt/pt/#website');
    expect(websiteJsonLd('en')['@id']).toBe('https://estimador.pt/en/#website');
    expect(websiteJsonLd('pt').description).toMatch(/^Dados para compreender Portugal\./);
    const graph = siteJsonLd('pt')['@graph'];
    expect(graph.map(node => node['@type'])).toEqual(['Organization', 'WebSite']);
    // The logo's declared size is the file's.
    const png = fs.readFileSync(path.join(process.cwd(), 'public/logo.png'));
    expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }).toEqual({ width: organizationJsonLd().logo.width, height: organizationJsonLd().logo.height });
  });

  it('builds the population Dataset from the release config', () => {
    const dataset = populationDatasetJsonLd('pt');
    expect(dataset).toMatchObject({
      '@type': 'Dataset',
      version: POPULATION_RELEASE,
      datePublished: POPULATION_PUBLISHED,
      license: 'https://creativecommons.org/licenses/by/4.0/',
      url: 'https://estimador.pt/pt/populacao/dados/',
      sameAs: POPULATION_DOWNLOADS.release,
      temporalCoverage: '2021',
    });
    expect(dataset.distribution.length).toBeGreaterThanOrEqual(4);
    for (const file of dataset.distribution) expect(file.contentUrl).toContain(`/v${POPULATION_RELEASE}/`);
    expect(dataset.distribution.map(file => file.encodingFormat)).toContain('application/vnd.apache.parquet');
  });

  it('numbers breadcrumbs and links all but the page itself', () => {
    const crumbs = breadcrumbJsonLd('en', [
      { name: 'Population', path: '/populacao' },
      { name: 'Lisboa', path: '/populacao/regiao/lisboa' },
      { name: 'Ajuda' },
    ]);
    expect(crumbs.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Population', item: 'https://estimador.pt/en/populacao/' },
      { '@type': 'ListItem', position: 2, name: 'Lisboa', item: 'https://estimador.pt/en/populacao/regiao/lisboa/' },
      { '@type': 'ListItem', position: 3, name: 'Ajuda' },
    ]);
  });
});
