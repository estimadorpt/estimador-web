import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import pt from '../../../messages/pt.json';
import en from '../../../messages/en.json';
import { NAV_LABEL_KEYS, isNavItemActive, navLabels, siteNavigation, type NavItem } from './site-navigation';
import { LIGA_TABS } from '@/components/football/liga-tabs';

const lookup = (catalogue: unknown) => (key: string) => {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], catalogue);
  if (typeof value !== 'string') throw new Error(`missing ${key}`);
  return value;
};

const nav = (locale: 'pt' | 'en', hasArticles = false, economyPublished = false) =>
  siteNavigation(navLabels(lookup(locale === 'pt' ? pt : en)), { locale, hasArticles, economyPublished });

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
    expect(items.map(item => item.id)).toEqual(['home', 'population', 'sport', 'elections', 'about']);
    expect(items.find(item => item.id === 'sport')?.label).toBe('Liga Portugal');
    expect(nav('en').find(item => item.id === 'sport')?.label).toBe('Liga Portugal');
  });

  it('leaves the economy out until it publishes, then names it plainly', () => {
    expect(nav('pt').map(item => item.id)).not.toContain('economics');
    const published = nav('pt', false, true);
    expect(published.map(item => item.id)).toEqual(['home', 'population', 'sport', 'elections', 'economics', 'about']);
    expect(published.find(item => item.id === 'economics')?.label).toBe('Economia');
  });

  it('offers articles only once the locale has published one', () => {
    expect(nav('pt', true).map(item => item.id)).toContain('articles');
    expect(nav('pt', false).map(item => item.id)).not.toContain('articles');
  });

  it('gives the Liga menu the tab row\'s items, in its order, and a game that says it is one', () => {
    const sport = nav('pt').find(item => item.id === 'sport')!;
    expect(sport.dropdown!.map(link => link.href)).toEqual(LIGA_TABS.map(tab => tab.href));
    expect(sport.dropdown!.map(link => link.label)).toEqual(['Previsões', 'Jogadores', 'Contra o Modelo (jogo semanal)', 'Modelo', 'Dados']);
    expect(nav('en').find(item => item.id === 'sport')!.dropdown!.find(link => link.href === '/desporto/liga/jogo-previsoes')?.label).toBe('Beat the Model (weekly game)');
    // The simulator was retired: its two parts live on the club pages.
    expect(sport.dropdown!.map(link => link.href)).not.toContain('/desporto/liga/simulador');
  });

  it('keeps the tab row\'s game label the same as the menu\'s, without the suffix', () => {
    expect(LIGA_TABS.find(tab => tab.key === 'jogo')?.pt).toBe(pt.nav.game);
    expect(LIGA_TABS.find(tab => tab.key === 'jogo')?.en).toBe(en.nav.game);
  });

  it('lights the section a page belongs to, Liga 2 included', () => {
    const items = nav('pt');
    expect(active(items, '/desporto/liga2/')).toEqual(['sport']);
    expect(active(items, '/desporto/liga/benfica/')).toEqual(['sport']);
    expect(active(items, '/populacao/freguesia/010103/')).toEqual(['population']);
    expect(active(items, '/eleicoes/legislativas/mapa/')).toEqual(['elections']);
    expect(active(nav('pt', false, true), '/economia/metodologia/')).toEqual(['economics']);
    expect(active(items, '/privacidade/')).toEqual(['about']);
    expect(active(items, '/')).toEqual(['home']);
    expect(active(items, '/desportos/')).toEqual([]);
  });
});
