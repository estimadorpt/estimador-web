import { MetadataRoute } from 'next'
import fs from 'node:fs'
import path from 'node:path'
import {
  loadLigaData,
  loadLigaPlayersDetail,
  loadPlayedFixtures,
  loadUpcomingFixtures,
} from '@/lib/utils/football-data-loader'
import { ligaTeamSlugs } from '@/lib/config/football'
import { getMDXArticlesByLocale } from '@/lib/mdx-articles'
import { buildTagIndex } from '@/lib/article-discovery'
import { SITE_LOCALES, languageAlternates, localizedUrl } from '@/lib/metadata'
import { ECONOMY_PUBLISHED } from '@/lib/config/economy-status'
import { PARLIAMENTARY_2025, PRESIDENTIAL_2026_SECOND_ROUND_DATE } from '@/lib/config/elections'
import { loadPopulationPlaces } from '@/lib/utils/population-data-loader'
import { POPULATION_PUBLISHED, POPULATION_ROUTES } from '@/lib/config/population'
import { regionSlug } from '@/lib/population/places'

export const dynamic = 'force-static'

type Frequency = MetadataRoute.Sitemap[number]['changeFrequency']

/**
 * Hints for routes we know something about. Anything discovered on disk and
 * missing here still gets listed — the sitemap follows the exported routes
 * rather than a hand-maintained list that silently falls behind them.
 */
const ROUTE_HINTS: Record<string, { changeFrequency: Frequency; priority: number }> = {
  // The locale homepages stand in for the bare root, which only redirects.
  '/': { changeFrequency: 'daily', priority: 1 },
  '/economia': { changeFrequency: 'daily', priority: 0.9 },
  '/economia/metodologia': { changeFrequency: 'monthly', priority: 0.5 },
  '/desporto/liga': { changeFrequency: 'daily', priority: 0.9 },
  '/desporto/liga/jogadores': { changeFrequency: 'weekly', priority: 0.7 },
  '/desporto/liga/jogo-previsoes': { changeFrequency: 'weekly', priority: 0.7 },
  '/desporto/liga/simulador': { changeFrequency: 'weekly', priority: 0.7 },
  '/desporto/liga/modelo': { changeFrequency: 'monthly', priority: 0.6 },
  '/desporto/liga/dados': { changeFrequency: 'monthly', priority: 0.6 },
  '/desporto/liga/metodologia': { changeFrequency: 'monthly', priority: 0.5 },
  '/desporto/liga/2025-26': { changeFrequency: 'yearly', priority: 0.6 },
  '/eleicoes/presidenciais': { changeFrequency: 'yearly', priority: 0.7 },
  '/eleicoes/legislativas': { changeFrequency: 'yearly', priority: 0.7 },
  '/eleicoes/legislativas/mapa': { changeFrequency: 'yearly', priority: 0.6 },
  '/eleicoes/arquivo': { changeFrequency: 'yearly', priority: 0.6 },
  '/artigos': { changeFrequency: 'weekly', priority: 0.7 },
  '/sobre': { changeFrequency: 'monthly', priority: 0.5 },
  '/metodologia': { changeFrequency: 'monthly', priority: 0.5 },
  '/privacidade': { changeFrequency: 'yearly', priority: 0.3 },
  '/populacao': { changeFrequency: 'monthly', priority: 0.9 },
  '/populacao/misteriosa': { changeFrequency: 'daily', priority: 0.7 },
  '/populacao/qualidade': { changeFrequency: 'monthly', priority: 0.6 },
  '/populacao/dados': { changeFrequency: 'monthly', priority: 0.6 },
  '/populacao/metodologia': { changeFrequency: 'monthly', priority: 0.5 },
}

/**
 * Routes that exist on disk but always carry `index: false` in their metadata:
 * a sitemap entry would contradict the noindex. The brand guide is reference
 * for the site itself (the footer links it, search does not need it); Liga 2
 * waits until the second tier earns a place in the navigation. src/lib/sitemap.test.ts
 * fails when a static page declares `index: false` and is missing here.
 */
const HIDDEN_ROUTES = new Set([
  '/marca',
  '/desporto/liga2',
  // An imagined explainer with invented people, not the published population.
  '/populacao/miniatura',
  // The shared-query landing: every /populacao/v/… link is rewritten to it,
  // and on its own it answers nothing.
  '/populacao/consulta',
])

/**
 * The economy is noindexed while its editorial flag is off
 * (src/lib/config/economy-status.json); setting it restores these entries.
 */
const ECONOMY_ROUTES = ['/economia', '/economia/metodologia']

/**
 * Frozen pages: dated by what they archive, not by the build. The elections
 * by their (last) election day; the 2025-26 Liga review by its generation.
 */
function archiveDates(): Record<string, Date> {
  const dates: Record<string, Date> = {
    '/eleicoes/presidenciais': day(PRESIDENTIAL_2026_SECOND_ROUND_DATE),
    '/eleicoes/legislativas': day(PARLIAMENTARY_2025.date),
    '/eleicoes/legislativas/mapa': day(PARLIAMENTARY_2025.date),
    '/eleicoes/arquivo': day(PRESIDENTIAL_2026_SECOND_ROUND_DATE),
  }
  try {
    const review = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/football/liga-2025-26/review.json'), 'utf8'))
    if (typeof review.generated === 'string') dates['/desporto/liga/2025-26'] = day(review.generated)
  } catch {
    // no review file: the route falls back to the build date
  }
  return dates
}

const day = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`)
const validDay = (iso: unknown): Date | undefined =>
  typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}/.test(iso) ? day(iso) : undefined

/**
 * When the content of a live page last changed, from the data it renders:
 * the newest Liga forecast's timestamp for the Liga pages, the release date
 * for the population pages, the player file's cut-off for the player pages.
 * A page with no such date (about, privacy, methodology prose) carries no
 * lastmod at all: a build timestamp on every deploy told crawlers that
 * unchanged pages had changed, which teaches them to ignore the field.
 */
function contentDates({ liga, players }: { liga?: Date; players?: Date }): Record<string, Date | undefined> {
  const population = day(POPULATION_PUBLISHED)
  const newest = (...dates: Array<Date | undefined>) => {
    const known = dates.filter((date): date is Date => Boolean(date))
    return known.length ? new Date(Math.max(...known.map(date => +date))) : undefined
  }
  return {
    // The homepage shows the Liga forecast and the population release.
    '/': newest(liga, population),
    '/desporto/liga': liga,
    '/desporto/liga/simulador': liga,
    '/desporto/liga/jogo-previsoes': liga,
    '/desporto/liga/dados': liga,
    '/desporto/liga/jogadores': players,
    '/populacao': population,
    '/populacao/misteriosa': population,
    '/populacao/qualidade': population,
    '/populacao/dados': population,
    '/populacao/metodologia': population,
  }
}

/** Whether a route is published in this locale's sitemap for this build. */
function listedRoute(route: string, { hasArticles }: { hasArticles: boolean }): boolean {
  if (HIDDEN_ROUTES.has(route)) return false
  if (!ECONOMY_PUBLISHED && ECONOMY_ROUTES.includes(route)) return false
  // An empty index is noindexed (artigos/page.tsx, artigos/tema/page.tsx).
  if (!hasArticles && (route === '/artigos' || route.startsWith('/artigos/'))) return false
  return true
}

/** Every localized route template with no dynamic segment, read from the app directory. */
function staticRoutes(): string[] {
  const root = path.join(process.cwd(), 'src/app/[locale]')
  const found: string[] = []

  function walk(directory: string, route: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
    if (entries.some(entry => entry.isFile() && /^page\.(tsx|ts|jsx|js|mdx)$/.test(entry.name))) {
      found.push(route === '' ? '/' : route)
    }
    for (const entry of entries) {
      // Dynamic segments are expanded from published records further down.
      if (!entry.isDirectory() || entry.name.startsWith('[') || entry.name.startsWith('_')) continue
      walk(path.join(directory, entry.name), `${route}/${entry.name}`)
    }
  }

  walk(root, '')
  return found.sort()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = []
  const seen = new Set<string>()

  /**
   * One entry, with its hreflang alternates: every locale the page exists in,
   * plus x-default (the parish pages have no server-rendered hreflang, so for
   * them the sitemap is the only place a crawler learns the pairing).
   */
  const add = (
    locale: string,
    route: string,
    hint?: { changeFrequency: Frequency; priority: number; lastModified?: Date },
    available: readonly string[] = SITE_LOCALES,
  ) => {
    const url = localizedUrl(locale, route)
    if (seen.has(url)) return
    seen.add(url)
    urls.push({
      url,
      ...(hint?.lastModified ? { lastModified: hint.lastModified } : {}),
      changeFrequency: hint?.changeFrequency ?? 'monthly',
      priority: hint?.priority ?? 0.5,
      ...(available.length > 1 ? { alternates: { languages: languageAlternates(route, available) } } : {}),
    })
  }

  // No entry for the bare root: it answers 301 to /pt/, which is listed below.
  const archived = archiveDates()

  // Clubs in this season's prediction table only. ligaTeamSlugs also carries
  // relegated clubs (logos, the 2025-26 archive), whose pages would be empty.
  const { prediction } = await loadLigaData()
  const clubSlugs = [...new Set(
    (prediction?.table ?? []).map(row => ligaTeamSlugs[row.team]).filter((slug): slug is string => Boolean(slug)),
  )]
  const ligaDate = validDay(prediction?.timestamp)
  const players = await loadLigaPlayersDetail().catch(() => null)
  const playersDate = validDay((players as { appearances_through?: unknown } | null)?.appearances_through)
  const dated = { ...contentDates({ liga: ligaDate, players: playersDate }), ...archived }
  const withDate = <T extends { changeFrequency: Frequency; priority: number }>(hint: T, date: Date | undefined) =>
    date ? { ...hint, lastModified: date } : hint

  const hasArticlesIn = Object.fromEntries(SITE_LOCALES.map(locale => [locale, getMDXArticlesByLocale(locale).length > 0]))
  const articleLocales = new Map<string, string[]>()
  for (const locale of SITE_LOCALES) {
    for (const article of getMDXArticlesByLocale(locale)) {
      articleLocales.set(article.slug, [...(articleLocales.get(article.slug) ?? []), locale])
    }
  }

  for (const locale of SITE_LOCALES) {
    const hasArticles = hasArticlesIn[locale]
    for (const route of staticRoutes()) {
      if (!listedRoute(route, { hasArticles })) continue
      const hint = ROUTE_HINTS[route] ?? { changeFrequency: 'monthly' as Frequency, priority: 0.5 }
      const available = SITE_LOCALES.filter(other => listedRoute(route, { hasArticles: hasArticlesIn[other] }))
      add(locale, route, withDate(hint, dated[route]), available)
    }

    // Articles exist per locale: only list the translations that were published.
    // A note is true as of its date and is not revised into something else; an
    // explainer is maintained, so a crawler is worth sending back for it.
    for (const article of getMDXArticlesByLocale(locale)) {
      add(locale, `/artigos/${article.slug}`, {
        changeFrequency: article.kind === 'nota' ? 'yearly' : 'monthly',
        priority: 0.6,
        lastModified: new Date(`${article.updated ?? article.date}T00:00:00Z`),
      }, articleLocales.get(article.slug) ?? [locale])
    }

    // Tag pages are enumerated per locale, not across both: the catalogues are
    // tagged in their own language, so a union would list pages never exported.
    // Dated from the newest piece carrying the tag — that is when the page's
    // content last changed.
    for (const group of buildTagIndex(getMDXArticlesByLocale(locale))) {
      const newest = group.articles
        .map(article => article.updated ?? article.date)
        .sort()
        .at(-1)
      // Tags are written in each locale's language: no alternate.
      add(locale, `/artigos/tema/${group.slug}`, {
        changeFrequency: 'monthly',
        priority: 0.4,
        ...(newest ? { lastModified: new Date(`${newest}T00:00:00Z`) } : {}),
      }, [locale])
    }

    for (const slug of clubSlugs) {
      add(locale, `/desporto/liga/${slug}`, withDate({ changeFrequency: 'daily' as Frequency, priority: 0.7 }, ligaDate))
    }
  }

  // The synthetic population: the region pages and one page per parish, read
  // from the release's own place list. The parish pages share one exported
  // shell (/populacao/freguesia/_/) behind a host rewrite; the shell itself is
  // never listed, every real code is. A release is dated, not rebuilt, so the
  // publication date is their last modification.
  // Like the static routes, a family is listed only when its route exists.
  try {
    const places = await loadPopulationPlaces()
    const published = { lastModified: new Date(`${POPULATION_PUBLISHED}T00:00:00Z`) }
    const hasRoute = (segment: string) => fs.existsSync(path.join(process.cwd(), 'src/app/[locale]/populacao', segment))
    const regions = hasRoute('regiao') ? places?.regions ?? [] : []
    const parishes = hasRoute('freguesia') ? places?.parishes ?? [] : []
    for (const locale of SITE_LOCALES) {
      for (const [, name] of regions) {
        add(locale, POPULATION_ROUTES.region(regionSlug(name)), { changeFrequency: 'monthly', priority: 0.6, ...published })
      }
      for (const [code] of parishes) {
        add(locale, POPULATION_ROUTES.parish(code), { changeFrequency: 'monthly', priority: 0.5, ...published })
      }
    }
  } catch {
    // no population place pages in the sitemap this build
  }

  // Per-match pages for the fixtures currently published (fail soft: skip on error)
  try {
    const fixtures = await loadUpcomingFixtures()
    for (const locale of SITE_LOCALES) {
      for (const fixture of fixtures) {
        add(locale, `/desporto/liga/jogo/${fixture.slug}`, withDate({ changeFrequency: 'daily' as Frequency, priority: 0.7 }, ligaDate))
      }
    }
  } catch {
    // no fixture pages in the sitemap this build
  }

  // Played match pages stay online with the result and the pre-match odds
  // (audit SP-13), so they are listed too: they no longer change, and their
  // date is the kickoff (the result is the last thing they gained).
  try {
    const played = await loadPlayedFixtures()
    for (const locale of SITE_LOCALES) {
      for (const fixture of played) {
        const kickoff = fixture.kickoff ? new Date(fixture.kickoff) : undefined
        add(locale, `/desporto/liga/jogo/${fixture.slug}`, withDate(
          { changeFrequency: 'yearly' as Frequency, priority: 0.4 },
          kickoff && !Number.isNaN(kickoff.getTime()) ? kickoff : undefined,
        ))
      }
    }
  } catch {
    // no played match pages in the sitemap this build
  }

  // Per-player pages for the published ranking (fail soft: skip on error).
  // The placeholder page is never listed — it exists only so the static
  // export has something to build when no players are published.
  try {
    for (const locale of SITE_LOCALES) {
      for (const player of players?.players ?? []) {
        add(locale, `/desporto/liga/jogador/${player.slug}`, withDate({ changeFrequency: 'weekly' as Frequency, priority: 0.6 }, playersDate))
      }
    }
  } catch {
    // no player pages in the sitemap this build
  }

  return urls
}
