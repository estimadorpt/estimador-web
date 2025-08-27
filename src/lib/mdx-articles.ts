import fs from 'fs';
import path from 'path';

export interface MDXArticleMetadata {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  tags: string[];
  readTime: string;
  slug: string;
}

export interface MDXArticle extends MDXArticleMetadata {
  content: string;
  locale: string;
}

const contentDirectory = path.join(process.cwd(), 'src/content/articles');

export function getAvailableLocales(): string[] {
  try {
    return fs.readdirSync(contentDirectory).filter(item => {
      const fullPath = path.join(contentDirectory, item);
      return fs.statSync(fullPath).isDirectory();
    });
  } catch (error) {
    return ['pt']; // Default to Portuguese if directory doesn't exist
  }
}

export function getMDXArticlesByLocale(locale: string = 'pt'): MDXArticleMetadata[] {
  const localeDir = path.join(contentDirectory, locale);
  
  try {
    const files = fs.readdirSync(localeDir).filter(file => file.endsWith('.mdx'));
    
    return files.map(file => {
      const filePath = path.join(localeDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Extract metadata from the export statement
      const metadataMatch = fileContent.match(/export const metadata = \{([\s\S]*?)\}/);
      if (!metadataMatch) {
        throw new Error(`No metadata found in ${file}`);
      }
      
      // Parse the metadata (this is a simplified approach)
      // In production, you might want to use a proper MDX parser
      const metadataString = metadataMatch[1];
      const metadata = parseMetadata(metadataString);
      
      return {
        ...metadata,
        slug: metadata.slug || file.replace('.mdx', '')
      };
    });
  } catch (error) {
    console.warn(`No MDX articles found for locale ${locale}:`, error);
    return [];
  }
}

function parseMetadata(metadataString: string): Omit<MDXArticleMetadata, 'slug'> {
  // Simple metadata parser - extracts key-value pairs
  const lines = metadataString.split('\n').map(line => line.trim()).filter(Boolean);
  const metadata: any = {};
  
  for (const line of lines) {
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      let value = valueParts.join(':').trim();
      
      // Remove quotes and trailing commas
      value = value.replace(/^["']/, '').replace(/["'],?$/, '');
      
      const cleanKey = key.trim();
      
      if (cleanKey === 'tags') {
        // Parse array
        metadata[cleanKey] = value.replace(/[\[\]]/g, '').split(',').map(t => t.trim().replace(/"/g, ''));
      } else {
        metadata[cleanKey] = value;
      }
    }
  }
  
  return metadata;
}

export function getMDXArticleBySlug(slug: string, locale: string = 'pt'): MDXArticleMetadata | null {
  const articles = getMDXArticlesByLocale(locale);
  return articles.find(article => article.slug === slug) || null;
}

export function getArticlePath(slug: string, locale: string = 'pt'): string {
  return path.join(contentDirectory, locale, `${slug}.mdx`);
}

// Check if an article exists in a specific locale
export function articleExistsInLocale(slug: string, locale: string): boolean {
  const articlePath = getArticlePath(slug, locale);
  return fs.existsSync(articlePath);
}

// Get fallback article (Portuguese if English doesn't exist)
export function getArticleWithFallback(slug: string, preferredLocale: string): { article: MDXArticleMetadata | null, locale: string } {
  // Try preferred locale first
  let article = getMDXArticleBySlug(slug, preferredLocale);
  if (article) {
    return { article, locale: preferredLocale };
  }
  
  // Fallback to Portuguese
  if (preferredLocale !== 'pt') {
    article = getMDXArticleBySlug(slug, 'pt');
    if (article) {
      return { article, locale: 'pt' };
    }
  }
  
  return { article: null, locale: preferredLocale };
}