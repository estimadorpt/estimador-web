import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { COPY_REVISED, newestDate } from './sitemap-dates';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const PT_MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

let lastmod: Map<string, string | undefined>;

beforeAll(async () => {
  const entries = await sitemap();
  lastmod = new Map(entries.map(entry => [
    entry.url,
    entry.lastModified ? new Date(entry.lastModified).toISOString().slice(0, 10) : undefined,
  ]));
});

describe('sitemap revision dates (FRESH-07)', () => {
  it('matches the revision date each page prints', () => {
    expect(read('src/app/[locale]/metodologia/page.tsx')).toContain(`const HUB_REVISED = '${COPY_REVISED['/metodologia']}'`);
    expect(read('src/app/[locale]/desporto/liga/metodologia/page.tsx')).toContain(`const REVISED = '${COPY_REVISED['/desporto/liga/metodologia']}'`);
    const privacy = /\*\*Última revisão: (\d{1,2}) de ([a-zç]+) de (\d{4})\*\*/.exec(read('src/content/privacy/pt.mdx'));
    expect(privacy).not.toBeNull();
    const [, day, month, year] = privacy!;
    expect(`${year}-${String(PT_MONTHS.indexOf(month) + 1).padStart(2, '0')}-${day.padStart(2, '0')}`).toBe(COPY_REVISED['/privacidade']);
  });

  it('gives every prose page a lastmod no older than its copy', () => {
    for (const [route, revised] of Object.entries(COPY_REVISED)) {
      const url = `https://estimador.pt/pt${route}/`;
      if (!lastmod.has(url)) continue; // a hidden route (noindex) has no entry
      const date = lastmod.get(url);
      expect(date, route).toBeDefined();
      expect(date! >= revised, `${route}: ${date} < ${revised}`).toBe(true);
    }
    for (const route of ['/metodologia', '/desporto/liga/metodologia', '/eleicoes/metodologia', '/privacidade', '/sobre', '/desporto/liga/modelo']) {
      expect(lastmod.get(`https://estimador.pt/pt${route}/`), route).toBeDefined();
    }
  });

  it('dates the game and data pages by their newest file, not only the forecast', () => {
    const fixtures = JSON.parse(read('public/data/football/liga-2026-27/game_fixtures.json')).generated_at.slice(0, 10);
    expect(lastmod.get('https://estimador.pt/pt/desporto/liga/jogo-previsoes/')! >= fixtures).toBe(true);
    expect(lastmod.get('https://estimador.pt/pt/desporto/liga/dados/')! >= fixtures).toBe(true);
  });

  it('takes the newest of the dates it is given', () => {
    expect(newestDate(undefined, new Date('2026-01-02'), new Date('2025-12-31'))?.toISOString().slice(0, 10)).toBe('2026-01-02');
    expect(newestDate(undefined)).toBeUndefined();
  });
});
