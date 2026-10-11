// Liga Portugal's sections, defined once: the tab row under the header
// (LigaSectionNav) and the header's Liga menu (site-navigation.ts) both read
// this list, so the two cannot drift. Plain data, no 'use client': the root
// 404's server-rendered header reads it too.

export type LigaPage = 'previsoes' | 'jogadores' | 'jogo' | 'modelo' | 'dados';

/**
 * The tabs, in order. Club, match, methodology and 2025-26 pages count as
 * "Previsões" (a club's and a match's figures are the season forecast's; the
 * method and the review sit under it), a player page as "Jogadores".
 * "Contra o Modelo" is the weekly game's name, `nav.game` in the catalogue;
 * the menu adds "(jogo semanal)".
 */
export const LIGA_TABS: ReadonlyArray<{ key: LigaPage; href: string; pt: string; en: string }> = [
  { key: 'previsoes', href: '/desporto/liga', pt: 'Previsões', en: 'Forecasts' },
  { key: 'jogadores', href: '/desporto/liga/jogadores', pt: 'Jogadores', en: 'Players' },
  { key: 'jogo', href: '/desporto/liga/jogo-previsoes', pt: 'Contra o Modelo', en: 'Beat the Model' },
  { key: 'modelo', href: '/desporto/liga/modelo', pt: 'Modelo', en: 'Model' },
  { key: 'dados', href: '/desporto/liga/dados', pt: 'Dados', en: 'Data' },
];
