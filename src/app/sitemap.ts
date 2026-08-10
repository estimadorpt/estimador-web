import { MetadataRoute } from 'next'
import { loadUpcomingFixtures } from '@/lib/utils/football-data-loader'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://estimador.pt'

  const locales = ['en', 'pt']

  const pages = [
    { path: '', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/desporto/liga', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/desporto/liga/metodologia', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/desporto/liga/modelo', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/desporto/liga/dados', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/desporto/liga/2025-26', changeFrequency: 'yearly' as const, priority: 0.6 },
    { path: '/eleicoes/presidenciais', changeFrequency: 'daily' as const, priority: 0.8 },
    { path: '/eleicoes/legislativas', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: '/eleicoes/mapa', changeFrequency: 'weekly' as const, priority: 0.6 },
    { path: '/artigos', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: '/sobre', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/metodologia', changeFrequency: 'monthly' as const, priority: 0.5 },
  ]

  const urls: MetadataRoute.Sitemap = []

  // Add root redirect
  urls.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  })

  // Add localized pages
  for (const locale of locales) {
    for (const page of pages) {
      urls.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  // Per-match pages for the fixtures currently published (fail soft: skip on error)
  try {
    const fixtures = await loadUpcomingFixtures()
    for (const locale of locales) {
      for (const fixture of fixtures) {
        urls.push({
          url: `${baseUrl}/${locale}/desporto/liga/jogo/${fixture.slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.7,
        })
      }
    }
  } catch {
    // no fixture pages in the sitemap this build
  }

  return urls
}
