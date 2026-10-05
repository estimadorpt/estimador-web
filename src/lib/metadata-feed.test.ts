import { afterEach, describe, expect, it, vi } from 'vitest';

// Which locales have published something, per test. The real list is empty
// today, so both branches of the rule are exercised against a stub.
const published = vi.hoisted(() => ({ locales: new Set<string>() }));

vi.mock('./mdx-articles', () => ({
  getMDXArticlesByLocale: (locale: string) => (published.locales.has(locale) ? [{ slug: 'nota' }] : []),
}));

const { createPageMetadata, feedAlternates, languageAlternates } = await import('./metadata');

afterEach(() => published.locales.clear());

describe('feed advertisement', () => {
  it('names no feed while a locale has published nothing', () => {
    expect(feedAlternates('pt')).toBeUndefined();
    const metadata = createPageMetadata({ locale: 'pt', path: '/sobre', title: 'x', description: 'y' });
    expect(metadata.alternates?.types).toBeUndefined();
  });

  it('names the locale feed once that locale has an article, and only for that locale', () => {
    published.locales.add('en');
    const en = createPageMetadata({ locale: 'en', path: '/sobre', title: 'x', description: 'y' });
    const feeds = en.alternates?.types?.['application/rss+xml'];
    expect(Array.isArray(feeds) && feeds[0].url).toBe('https://estimador.pt/en/feed.xml');
    expect(feedAlternates('pt')).toBeUndefined();
  });
});

describe('x-default', () => {
  it('points at the Portuguese page when there is one', () => {
    expect(languageAlternates('/desporto/liga')['x-default']).toBe('https://estimador.pt/pt/desporto/liga/');
    expect(languageAlternates('/artigos/x', ['en', 'pt'])['x-default']).toBe('https://estimador.pt/pt/artigos/x/');
  });

  it('points at the only locale a page exists in, never at a page that was not exported', () => {
    expect(languageAlternates('/artigos/only-english', ['en'])).toEqual({
      en: 'https://estimador.pt/en/artigos/only-english/',
      'x-default': 'https://estimador.pt/en/artigos/only-english/',
    });
  });
});
