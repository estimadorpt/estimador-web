import { describe, expect, it } from 'vitest';
import { GET, generateStaticParams } from '@/app/[locale]/feed.xml/route';
import { getMDXArticlesByLocale } from './mdx-articles';
import { SITE_LOCALES, feedUrl } from './metadata';

async function feed(locale: string) {
  const response = await GET(new Request(feedUrl(locale)), { params: Promise.resolve({ locale }) });
  return response.text();
}

describe('rss feed', () => {
  it('is exported for every locale the site publishes', () => {
    expect(generateStaticParams().map(({ locale }) => locale).sort()).toEqual([...SITE_LOCALES].sort());
  });

  it('carries one item per published article, newest first', async () => {
    for (const locale of SITE_LOCALES) {
      const xml = await feed(locale);
      const articles = getMDXArticlesByLocale(locale);
      expect(xml.match(/<item>/g)?.length ?? 0, locale).toBe(articles.length);

      // Item links only: the channel's own <link> also points into /artigos.
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => match[1]);
      const order = items.map(item => item.match(/<link>([^<]*)<\/link>/)![1]);
      expect(order, locale).toEqual(articles.map(article => `https://estimador.pt/${locale}/artigos/${article.slug}/`));
    }
  });

  it('points its self link at the URL it is served from', async () => {
    for (const locale of SITE_LOCALES) {
      expect(await feed(locale)).toContain(`<atom:link href="${feedUrl(locale)}" rel="self"`);
    }
  });

  // An unescaped & or < in a title is the classic way a feed stops parsing —
  // silently, in the reader, long after the piece was published.
  it('escapes markup characters out of every title and summary', async () => {
    for (const locale of SITE_LOCALES) {
      const xml = await feed(locale);
      for (const [, inner] of xml.matchAll(/<(?:title|description)>([\s\S]*?)<\/(?:title|description)>/g)) {
        expect(inner, `${locale}: ${inner}`).not.toMatch(/[<>]|&(?!(?:amp|lt|gt|apos|quot);)/);
      }
    }
  });

  it('dates itself from the newest item rather than the build', async () => {
    for (const locale of SITE_LOCALES) {
      const articles = getMDXArticlesByLocale(locale);
      if (!articles.length) continue;
      const newest = articles[0].updated ?? articles[0].date;
      expect(await feed(locale)).toContain(
        `<lastBuildDate>${new Date(`${newest}T00:00:00Z`).toUTCString()}</lastBuildDate>`,
      );
    }
  });
});
