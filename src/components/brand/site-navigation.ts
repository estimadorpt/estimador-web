import { POPULATION_ROUTES } from '@/lib/config/population';
import { LIGA_TABS } from '@/components/football/liga-tabs';

/**
 * The site's navigation, defined once: the order, the hrefs, the labels and
 * which addresses light up each item. The client Header and the static root
 * 404 header (src/app/not-found.tsx) both render from it, so the two can no
 * longer drift (audit UXD2-19).
 *
 * Plain data, no 'use client': the root 404 is a server component and cannot
 * read exports of a client module. The translated labels come in from the
 * caller (each reads them with its own `t`, Header.tsx with literal keys so
 * the client message payload test sees them); the few labels that only the
 * menu uses are written here in both languages.
 *
 * Ordered by what is live: Início, População, Liga Portugal, Eleições
 * (arquivo), Economia once it publishes, then Sobre.
 * Football has one public name, "Liga Portugal" (CLAUDE.md); the URLs keep
 * /desporto.
 */

export interface NavLink {
  href: string;
  label: string;
}

export interface NavItem {
  id: 'home' | 'population' | 'sport' | 'elections' | 'economics' | 'articles' | 'about';
  label: string;
  /** A plain link (no dropdown). */
  href?: string;
  dropdown?: NavLink[];
  /**
   * Address prefixes that make the item current, beyond its own links: every
   * page under /desporto (Liga 2 included) belongs to the Liga item.
   */
  match?: string[];
}

/** The translated labels each caller reads from the catalogue. */
export interface NavLabels {
  home: string;
  population: string;
  populationSearch: string;
  populationGame: string;
  populationData: string;
  populationQuality: string;
  populationMethodology: string;
  sport: string;
  game: string;
  elections: string;
  electionsArchive: string;
  electionsPresidential: string;
  electionsParliamentary: string;
  electionsMethodology: string;
  economics: string;
  economicsPreparing: string;
  articles: string;
  about: string;
  aboutSite: string;
  methodology: string;
}

/**
 * The message key behind each label. Header.tsx and the root 404 read these
 * keys; site-navigation.test.ts checks both still do.
 */
export const NAV_LABEL_KEYS: Record<keyof NavLabels, string> = {
  home: 'nav.home',
  population: 'nav.population',
  populationSearch: 'nav.populationSearch',
  populationGame: 'nav.populationGame',
  populationData: 'nav.populationData',
  populationQuality: 'nav.populationQuality',
  populationMethodology: 'nav.populationMethodology',
  sport: 'nav.sport',
  game: 'nav.game',
  elections: 'nav.elections',
  electionsArchive: 'elections.navArchiveGuide',
  electionsPresidential: 'elections.navPresidential',
  electionsParliamentary: 'elections.navParliamentary',
  electionsMethodology: 'elections.navMethodology',
  economics: 'nav.economics',
  economicsPreparing: 'nav.economicsPreparing',
  articles: 'articles.title',
  about: 'nav.about',
  aboutSite: 'about.title',
  methodology: 'methodology.title',
};

/** Reads every label with a server-side translator (the root 404). */
export function navLabels(t: (key: string) => string): NavLabels {
  return Object.fromEntries(
    Object.entries(NAV_LABEL_KEYS).map(([id, key]) => [id, t(key)]),
  ) as unknown as NavLabels;
}

export function siteNavigation(
  labels: NavLabels,
  { locale, hasArticles, economyPublished }: { locale: string; hasArticles: boolean; economyPublished: boolean },
): NavItem[] {
  const pt = locale !== 'en';
  return [
    { id: 'home', href: '/', label: labels.home },
    {
      id: 'population', label: labels.population, match: ['/populacao'],
      dropdown: [
        { href: POPULATION_ROUTES.hub, label: labels.populationSearch },
        { href: POPULATION_ROUTES.game, label: labels.populationGame },
        { href: POPULATION_ROUTES.data, label: labels.populationData },
        { href: POPULATION_ROUTES.quality, label: labels.populationQuality },
        { href: POPULATION_ROUTES.methodology, label: labels.populationMethodology },
      ],
    },
    {
      // "Liga Portugal" at the top; the menu is the section's tab row
      // (LigaSectionNav), item for item, as População's is: the season
      // forecast, the players, the weekly game (which says it is a game,
      // CL2-13), the model's evaluation and the open data. The method is
      // linked from every chart and from the forecast.
      id: 'sport', label: labels.sport, match: ['/desporto'],
      dropdown: LIGA_TABS.map(tab => ({
        href: tab.href,
        label: tab.key === 'jogo'
          ? `${labels.game} ${pt ? '(jogo semanal)' : '(weekly game)'}`
          : pt ? tab.pt : tab.en,
      })),
    },
    {
      // The overview of the archive first; both forecasts are archives and
      // the labels say so before the click.
      id: 'elections', label: labels.elections, match: ['/eleicoes'],
      dropdown: [
        { href: '/eleicoes/arquivo', label: labels.electionsArchive },
        { href: '/eleicoes/presidenciais', label: labels.electionsPresidential },
        { href: '/eleicoes/legislativas', label: labels.electionsParliamentary },
        { href: '/eleicoes/metodologia', label: labels.electionsMethodology },
      ],
    },
    // The economy has no place in the navigation until it publishes (the
    // editorial flag in src/lib/config/economy-status.json, not data age):
    // a menu item that announces an absence is furniture.
    ...(economyPublished ? [{ id: 'economics' as const, href: '/economia', label: labels.economics }] : []),
    // No nav item for an index with nothing in it in this language.
    ...(hasArticles ? [{ id: 'articles' as const, href: '/artigos', label: labels.articles }] : []),
    {
      id: 'about', label: labels.about,
      dropdown: [
        { href: '/sobre', label: labels.aboutSite },
        { href: '/metodologia', label: labels.methodology },
        { href: '/privacidade', label: pt ? 'Privacidade' : 'Privacy' },
      ],
    },
  ];
}

const trim = (path: string) => path.replace(/\/$/, '') || '/';

/** The address is this link's page. */
export function isExactPath(pathname: string, href: string): boolean {
  return trim(pathname) === trim(href);
}

/** The address is this link's page or one under it. */
export function isUnderPath(pathname: string, href: string): boolean {
  return isExactPath(pathname, href) || (href !== '/' && pathname.startsWith(`${trim(href)}/`));
}

/** The nav item a page belongs to: its own link, a dropdown link, or a section prefix. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href) return isUnderPath(pathname, item.href);
  return Boolean(
    item.dropdown?.some(link => isUnderPath(pathname, link.href)) ||
    item.match?.some(prefix => isUnderPath(pathname, prefix)),
  );
}
