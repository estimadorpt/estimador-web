import { describe, expect, it } from 'vitest';
import { articleAuthor } from './structured-data';
import { ORGANIZATION_ID } from './structured-data';
import { SITE_LOCALES } from '@/lib/metadata';
import { getMDXArticlesByLocale } from '@/lib/mdx-articles';

describe('article byline as schema.org', () => {
  it('marks the publication as the Organization, not a Person named after it', () => {
    expect(articleAuthor('estimador.pt')).toMatchObject({ '@type': 'Organization', '@id': ORGANIZATION_ID });
  });

  it('keeps a person a Person', () => {
    expect(articleAuthor('Ana Silva')).toEqual({ '@type': 'Person', name: 'Ana Silva' });
  });

  it('gives every published piece an Organization author', () => {
    for (const locale of SITE_LOCALES) {
      for (const article of getMDXArticlesByLocale(locale)) {
        expect(articleAuthor(article.author)['@type'], `${locale}/${article.slug}`).toBe('Organization');
      }
    }
  });
});
