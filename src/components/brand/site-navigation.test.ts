import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import pt from '../../../messages/pt.json';
import en from '../../../messages/en.json';
import { NAV_LABEL_KEYS, isNavItemActive, navLabels, siteNavigation, type NavItem } from './site-navigation';

const lookup = (catalogue: unknown) => (key: string) => {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], catalogue);
  if (typeof value !== 'string') throw new Error(`missing ${key}`);
  return value;
};

const nav = (locale: 'pt' | 'en', hasArticles = false) =>
  siteNavigation(navLabels(lookup(locale === 'pt' ? pt : en)), { locale, hasArticles, economyPublished: false });

const active = (items: NavItem[], pathname: string) => items.filter(item => isNavItemActive(item, pathname)).map(item => item.id);

describe('site navigation', () => {
  it('reads every label key from both catalogues', () => {
    for (const catalogue of [pt, en]) {
      for (const key of Object.values(NAV_LABEL_KEYS)) expect(() => lookup(catalogue)(key), key).not.toThrow();
    }
  });

  it('is read by the client Header with the same literal keys', () => {
    // The client message payload test only sees literal t('…') calls, so the
    // Header must keep reading each label itself.
    const header = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf8');
    for (const key of Object.values(NAV_LABEL_KEYS)) expect(header, key).toContain(`t('${key}')`);
  });

  it('lists the sections in the order of what is live, under one football name', () => {
    const items = nav('pt');
    expect(items.map(item => item.id)).toEqual(['home', 'population', 'sport', 'elections', 'economics', 'about']);
    expect(items.find(item => item.id === 'sport')?.label).toBe('Liga Portugal');
    expect(nav('en').find(item => item.id === 'sport')?.label).toBe('Liga Portugal');
    expect(items.find(item => item.id === 'economics')?.label).toBe('Economia · em preparação');
  });

  it('offers articles only once the locale has published one', () => {
    expect(nav('pt', true).map(item => item.id)).toContain('articles');
    expect(nav('pt', false).map(item => item.id)).not.toContain('articles');
  });

  it('gives the Liga its method, its evaluation and a game that says it is one', () => {
    const sport = nav('pt').find(item => item.id === 'sport')!;
    const hrefs = sport.dropdown!.map(link => link.href);
    expect(hrefs).toEqual(expect.arrayContaining(['/desporto/liga/modelo', '/desporto/liga/metodologia']));
    expect(sport.dropdown!.find(link => link.href === '/desporto/liga/jogo-previsoes')?.label).toBe('Contra o Modelo (jogo semanal)');
    expect(nav('en').find(item => item.id === 'sport')!.dropdown!.find(link => link.href === '/desporto/liga/jogo-previsoes')?.label).toBe('Beat the Model (weekly game)');
  });

  it('lights the section a page belongs to, Liga 2 included', () => {
    const items = nav('pt');
    expect(active(items, '/desporto/liga2/')).toEqual(['sport']);
    expect(active(items, '/desporto/liga/benfica/')).toEqual(['sport']);
    expect(active(items, '/populacao/freguesia/010103/')).toEqual(['population']);
    expect(active(items, '/eleicoes/legislativas/mapa/')).toEqual(['elections']);
    expect(active(items, '/economia/metodologia/')).toEqual(['economics']);
    expect(active(items, '/privacidade/')).toEqual(['about']);
    expect(active(items, '/')).toEqual(['home']);
    expect(active(items, '/desportos/')).toEqual([]);
  });
});
