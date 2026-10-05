import { MetadataRoute } from 'next'
import fs from 'node:fs'
import path from 'node:path'
import {
  loadLigaPlayersDetail,
  loadUpcomingFixtures,
} from '@/lib/utils/football-data-loader'
import { ligaTeamSlugs } from '@/lib/config/football'
import { getMDXArticlesByLocale } from '@/lib/mdx-articles'
import { buildTagIndex } from '@/lib/article-discovery'
import { SITE_URL, SITE_LOCALES, localizedUrl } from '@/lib/metadata'
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
  '/': { changeFrequency: 'daily', priority: 0.9 },
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
  '/eleicoes/presidenciais': { changeFrequency: 'monthly', priority: 0.7 },
  '/eleicoes/legislativas': { changeFrequency: 'monthly', priority: 0.7 },
  '/eleicoes/legislativas/mapa': { changeFrequency: 'monthly', priority: 0.6 },
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
 * Routes that exist on disk but are not published: they carry `index: false`
 * in their metadata, are linked from nowhere, and a sitemap entry would
 * contradict the noindex. The brand guide is reference for the site itself;
 * Liga 2 waits until the second tier earns a place in the navigation.
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

/** Every localized route template with no dynamic segment, read from the app directory. */
function staticRoutes(): string[] {
  const root = path.join(process.cwd(), 'src/app/[locale]')
  const found: string[] = []

  function walk(directory: string, route: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
    if (entries.some(entry => entry.isFile() && /^page\.(tsx|ts|jsx|js|mdx)$/.test(entry.name))) {
      const normalized = route === '' ? '/' : route
      if (!HIDDEN_ROUTES.has(normalized)) found.push(normalized)
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
  const lastModified = new Date()
  const urls: MetadataRoute.Sitemap = []
  const seen = new Set<string>()

  const add = (
    locale: string,
    route: string,
    hint?: { changeFrequency: Frequency; priority: number; lastModified?: Date },
  ) => {
    const url = localizedUrl(locale, route)
    if (seen.has(url)) return
    seen.add(url)
    urls.push({
      url,
      // The build date is the honest answer for a page rendered from data that
      // moves with the build. Anything that carries its own date says so.
      lastModified: hint?.lastModified ?? lastModified,
      changeFrequency: hint?.changeFrequency ?? 'monthly',
      priority: hint?.priority ?? 0.5,
    })
  }

  urls.push({ url: `${SITE_URL}/`, lastModified, changeFrequency: 'daily', priority: 1 })

  for (const locale of SITE_LOCALES) {
    for (const route of staticRoutes()) {
      add(locale, route, ROUTE_HINTS[route])
    }

    // Articles exist per locale: only list the translations that were published.
    // A note is true as of its date and is not revised into something else; an
    // explainer is maintained, so a crawler is worth sending back for it.
    for (const article of getMDXArticlesByLocale(locale)) {
      add(locale, `/artigos/${article.slug}`, {
        changeFrequency: article.kind === 'nota' ? 'yearly' : 'monthly',
        priority: 0.6,
        lastModified: new Date(`${article.updated ?? article.date}T00:00:00Z`),
      })
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
      add(locale, `/artigos/tema/${group.slug}`, {
        changeFrequency: 'monthly',
        priority: 0.4,
        ...(newest ? { lastModified: new Date(`${newest}T00:00:00Z`) } : {}),
      })
    }

    for (const slug of Object.values(ligaTeamSlugs)) {
      add(locale, `/desporto/liga/${slug}`, { changeFrequency: 'daily', priority: 0.7 })
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
        add(locale, `/desporto/liga/jogo/${fixture.slug}`, { changeFrequency: 'daily', priority: 0.7 })
      }
    }
  } catch {
    // no fixture pages in the sitemap this build
  }

  // Per-player pages for the published ranking (fail soft: skip on error).
  // The placeholder page is never listed — it exists only so the static
  // export has something to build when no players are published.
  try {
    const players = await loadLigaPlayersDetail()
    for (const locale of SITE_LOCALES) {
      for (const player of players?.players ?? []) {
        add(locale, `/desporto/liga/jogador/${player.slug}`, { changeFrequency: 'weekly', priority: 0.6 })
      }
    }
  } catch {
    // no player pages in the sitemap this build
  }

  return urls
}
