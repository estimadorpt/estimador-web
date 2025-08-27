import { MetadataRoute } from 'next'

export const dynamic = 'force-static'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://estimador.pt'
  
  // Generate URLs for both locales
  const pages = ['', '/forecast', '/articles', '/about', '/methodology']
  const locales = ['en', 'pt']
  
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
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' || page === '/forecast' ? 'daily' : 'weekly',
        priority: page === '' ? 0.9 : 0.8,
      })
    }
  }
  
  return urls
}