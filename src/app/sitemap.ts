import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://estimador.pt'

  const locales = ['en', 'pt']

  const pages = [
    { path: '', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/desporto/liga', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/desporto/liga/metodologia', changeFrequency: 'monthly' as const, priority: 0.5 },
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

  return urls
}
