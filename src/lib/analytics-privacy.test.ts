import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyticsPath, sanitizeAnalyticsEvent } from './analytics-privacy';
import { PUBLISHED_ARTICLE_SLUGS } from './published-articles.generated';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/articles');

/**
 * The same enumeration the generator does, written independently of it.
 *
 * Drafts are skipped for the same reason the generator skips them — they are
 * never exported, so no reader reaches them — and because content.test.ts
 * writes a draft fixture into this directory while it runs. Vitest runs the two
 * files in parallel workers, so counting drafts here would fail this assertion
 * whenever the two overlapped.
 */
function slugsOnDisk(): string[] {
  const found = new Set<string>();
  for (const locale of ['pt', 'en']) {
    const dir = path.join(CONTENT_DIR, locale);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.mdx') || file.startsWith('fixture-')) continue;
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      const header = source.match(/^export const metadata = (\{[\s\S]*?\n\});?\s*/);
      if (header && JSON.parse(header[1]).draft === true) continue;
      found.add(file.slice(0, -4));
    }
  }
  return [...found].sort();
}

describe('analytics publication boundary', () => {
  it('removes reversible queries and selected geography from page categories', () => {
    expect(analyticsPath('/pt/populacao/explorar/?q=household#income')).toBe('/pt/populacao/explorar/');
    expect(analyticsPath('/en/populacao/retrato/010200/?income=3500')).toBe('/en/populacao/retrato/');
    expect(analyticsPath('/pt/populacao/v/release/q/secret')).toBe('/pt/populacao/consulta/');
    expect(analyticsPath('/pt/unknown/private-name')).toBe('/pt/other/');
  });
  it('filters SDK-enriched automatic properties and person updates too', () => {
    const cleaned = sanitizeAnalyticsEvent({ uuid: 'test', event: '$pageview',
      properties: { $current_url: 'https://estimador.pt/pt/populacao/retrato/010200/?q=secret',
        $referrer: 'https://example.com/?email=person', $initial_current_url: '?q=secret',
        answers: { income: 3500 }, token: 'public-project-key', distinct_id: '$posthog_cookieless' },
      $set: { email: 'private' }, $set_once: { geography: '010200' },
    });
    const payload = JSON.stringify(cleaned);
    for (const value of ['010200', 'secret', 'income', 'email', '$referrer', '$set']) expect(payload).not.toContain(value);
    expect(cleaned?.properties.$current_url).toBe('https://estimador.pt/pt/populacao/retrato/');
    expect(cleaned?.properties.$process_person_profile).toBe(false);
  });
  it('rejects replay, automatic interactions and undeclared events', () => {
    for (const event of ['$snapshot', '$autocapture', '$identify', 'population_query_completed']) {
      expect(sanitizeAnalyticsEvent({ uuid: 'test', event, properties: { private: true } })).toBeNull();
    }
    expect(sanitizeAnalyticsEvent(null)).toBeNull();
  });

  // Both halves are asserted separately because an empty archive is a real
  // state — the site can publish nothing and still be correct — and a single
  // assertion over the published list would pass vacuously in it.
  it('keeps the slug of a published article, in both languages', () => {
    for (const slug of PUBLISHED_ARTICLE_SLUGS) {
      expect(analyticsPath(`/pt/artigos/${slug}/`)).toBe(`/pt/artigos/${slug}/`);
      expect(analyticsPath(`/en/artigos/${slug}`)).toBe(`/en/artigos/${slug}/`);
    }
  });

  it('strips the query from an article path, published or not', () => {
    const unpublished = 'nao-existe-neste-arquivo';
    expect(PUBLISHED_ARTICLE_SLUGS).not.toContain(unpublished);
    expect(analyticsPath(`/pt/artigos/${unpublished}/?utm_source=news&email=quem@example.pt#fim`))
      .toBe('/pt/artigos/artigo/');
    expect(sanitizeAnalyticsEvent({ uuid: 'test', event: '$pageview',
      properties: { $current_url: `https://estimador.pt/pt/artigos/${unpublished}/?email=quem@example.pt` },
    })?.properties.$current_url).toBe('https://estimador.pt/pt/artigos/artigo/');

    for (const slug of PUBLISHED_ARTICLE_SLUGS.slice(0, 1)) {
      expect(analyticsPath(`/pt/artigos/${slug}/?email=quem@example.pt`)).toBe(`/pt/artigos/${slug}/`);
    }
  });

  it('collapses any path under /artigos that is not a published slug', () => {
    const published = PUBLISHED_ARTICLE_SLUGS[0];
    for (const crafted of [
      '/pt/artigos/nao-publicado/',
      `/pt/artigos/${published}-tracking-id-9f2c/`,
      `/pt/artigos/${published}/extra/`,
      '/pt/artigos/visitante@example.pt/',
      `/pt/artigos/${'a'.repeat(600)}/`,
    ]) {
      expect(analyticsPath(crafted)).toBe('/pt/artigos/artigo/');
    }
    expect(analyticsPath('/en/artigos/<script>x</script>')).toBe('/en/artigos/artigo/');
    // Traversal resolves before the segments are read, so it cannot smuggle a
    // segment into the article branch — nor carry the geography out of the other.
    expect(analyticsPath('/pt/artigos/../populacao/retrato/010200/')).toBe('/pt/populacao/retrato/');
    // The bucket name must not double as a real article, or the two rows merge.
    expect(PUBLISHED_ARTICLE_SLUGS).not.toContain('artigo');
    const cleaned = sanitizeAnalyticsEvent({ uuid: 'test', event: '$pageview',
      properties: { $current_url: 'https://estimador.pt/pt/artigos/crafted-payload-abc123/' },
    });
    expect(JSON.stringify(cleaned)).not.toContain('crafted-payload-abc123');
  });

  it('leaves every other category collapsed exactly as before', () => {
    expect(analyticsPath('/pt/artigos/')).toBe('/pt/artigos/');
    expect(analyticsPath('/pt/desporto/liga/jogador/joao-silva/')).toBe('/pt/desporto/liga/jogador/');
    expect(analyticsPath('/pt/desporto/liga/benfica/')).toBe('/pt/desporto/liga/equipa/');
    expect(analyticsPath('/pt/desporto/liga/jogo/benfica-porto/')).toBe('/pt/desporto/liga/jogo/');
    expect(analyticsPath('/pt/desporto/liga/')).toBe('/pt/desporto/liga/');
    expect(analyticsPath('/pt/')).toBe('/pt/');
    expect(analyticsPath('/fr/artigos/como-ler-sondagens/')).toBe('/other/');
    expect(analyticsPath('::not a url::')).toBe('/other/');
  });

  it('ships a slug list that matches what is actually published', () => {
    // The browser cannot read src/content, so the list is generated. When this
    // fails, run: node scripts/generate-article-slugs.mjs
    expect([...PUBLISHED_ARTICLE_SLUGS]).toEqual(slugsOnDisk());
  });
});
