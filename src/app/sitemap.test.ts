import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import sitemap from './sitemap';
import { ECONOMY_PUBLISHED } from '@/lib/config/economy-status';
import { getMDXArticlesByLocale } from '@/lib/mdx-articles';
import { SITE_LOCALES } from '@/lib/metadata';
import { ligaTeamSlugs } from '@/lib/config/football';
import { loadLigaData } from '@/lib/utils/football-data-loader';

const APP = path.join(process.cwd(), 'src/app/[locale]');

let entries: Awaited<ReturnType<typeof sitemap>>;
let urls: Set<string>;

beforeAll(async () => {
  entries = await sitemap();
  urls = new Set(entries.map(entry => entry.url));
});

const url = (locale: string, route: string) => `https://estimador.pt/${locale}${route === '/' ? '/' : `${route}/`}`;

/** Static page routes whose metadata always says `index: false`. */
function noindexStaticRoutes(): string[] {
  const found: string[] = [];
  const walk = (dir: string, route: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('[') && !entry.name.startsWith('_')) walk(path.join(dir, entry.name), `${route}/${entry.name}`);
      } else if (entry.name === 'page.tsx' && /\bindex:\s*false\b/.test(fs.readFileSync(path.join(dir, entry.name), 'utf8'))) {
        found.push(route || '/');
      }
    }
  };
  walk(APP, '');
  return found;
}

describe('sitemap', () => {
  it('lists the locale homepages and not the bare root, which only redirects', () => {
    expect(urls.has('https://estimador.pt/')).toBe(false);
    for (const locale of SITE_LOCALES) expect(urls.has(url(locale, '/'))).toBe(true);
  });

  it('leaves out every static page that declares noindex', () => {
    const routes = noindexStaticRoutes();
    expect(routes).toContain('/marca');
    for (const route of routes) {
      for (const locale of SITE_LOCALES) expect(urls.has(url(locale, route)), `${locale}${route}`).toBe(false);
    }
  });

  it('follows the economy flag', () => {
    for (const locale of SITE_LOCALES) {
      expect(urls.has(url(locale, '/economia'))).toBe(ECONOMY_PUBLISHED);
      expect(urls.has(url(locale, '/economia/metodologia'))).toBe(ECONOMY_PUBLISHED);
    }
  });

  it('lists the articles index only in a locale that has published a piece', () => {
    for (const locale of SITE_LOCALES) {
      const hasArticles = getMDXArticlesByLocale(locale).length > 0;
      expect(urls.has(url(locale, '/artigos'))).toBe(hasArticles);
      expect(urls.has(url(locale, '/artigos/tema'))).toBe(hasArticles);
    }
  });

  it('lists club pages only for the clubs in the current prediction table', async () => {
    const { prediction } = await loadLigaData();
    const current = new Set((prediction?.table ?? []).map(row => ligaTeamSlugs[row.team]));
    expect(current.size).toBeGreaterThan(0);
    for (const slug of Object.values(ligaTeamSlugs)) {
      expect(urls.has(url('pt', `/desporto/liga/${slug}`)), slug).toBe(current.has(slug));
    }
  });

  it('dates the frozen archives by what they archive, not by the build', () => {
    const byUrl = new Map(entries.map(entry => [entry.url, entry]));
    const presidential = byUrl.get(url('pt', '/eleicoes/presidenciais'));
    expect(presidential?.changeFrequency).toBe('yearly');
    expect(new Date(presidential!.lastModified!).toISOString().slice(0, 10)).toBe('2026-02-08');
    const legislativas = byUrl.get(url('en', '/eleicoes/legislativas/mapa'));
    expect(new Date(legislativas!.lastModified!).toISOString().slice(0, 10)).toBe('2025-05-18');
  });
});
