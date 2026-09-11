import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';

export const SITE_URL = 'https://estimador.pt';
export const SITE_LOCALES = ['pt', 'en'] as const;

export function localizedUrl(locale: string, pathname = '/'): string {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  return `${SITE_URL}/${locale}/${cleanPath ? `${cleanPath}/` : ''}`;
}

/** Autodiscovery target for the per-locale RSS route. */
export function feedUrl(locale: string): string {
  return `${SITE_URL}/${locale}/feed.xml`;
}

const FEED_TITLE: Record<string, string> = {
  pt: 'estimador.pt — notas e explicadores',
  en: 'estimador.pt — notes and explainers',
};

export function languageAlternates(pathname: string, availableLocales: readonly string[] = SITE_LOCALES) {
  return Object.fromEntries(availableLocales.map(locale => [locale, localizedUrl(locale, pathname)]));
}

export interface OgManifest {
  /** The per-locale fallback, for any page without a card of its own. */
  files?: Record<string, string>;
  /** Route path → card filename, per locale. Written by scripts/generate-og-images.mjs. */
  cards?: Record<string, Record<string, string>>;
}

/** One leading slash, no trailing one — the shape the generator writes. */
function cardKey(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '/';
}

/**
 * Kept pure so the fallback chain can be tested without a manifest on disk:
 * a page's own card, then the locale default, then the unversioned file that
 * ships even when nobody has run the generator.
 */
export function resolveOgImageFile(
  manifest: OgManifest | null,
  locale: string,
  pathname?: string,
): string {
  const specific = pathname ? manifest?.cards?.[locale]?.[cardKey(pathname)] : undefined;
  const fallback = manifest?.files?.[locale];
  return specific ?? fallback ?? `og-image-${locale}.png`;
}

// Read once: a static export asks for this on every page it renders.
let manifestCache: OgManifest | null | undefined;

function readOgManifest(): OgManifest | null {
  if (manifestCache === undefined) {
    try {
      manifestCache = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/og-manifest.json'), 'utf8'));
    } catch {
      manifestCache = null;
    }
  }
  return manifestCache;
}

/** The card for a page, or the locale's default when that page has none. */
export function getOgImageUrl(locale: string, pathname?: string): string {
  return new URL(resolveOgImageFile(readOgManifest(), locale, pathname), `${SITE_URL}/`).href;
}

interface PageMetadataOptions {
  locale: string;
  path: string;
  title: string;
  description: string;
  keywords?: string | string[];
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
  availableLocales?: readonly string[];
  image?: { url: string; width?: number; height?: number; alt?: string };
  index?: boolean;
}

/** Use for each page: Next replaces nested metadata instead of merging it. */
export function createPageMetadata({
  locale, path: pathname, title, description, keywords, type = 'website',
  publishedTime, modifiedTime, authors, tags, availableLocales = SITE_LOCALES,
  image, index = true,
}: PageMetadataOptions): Metadata {
  const url = localizedUrl(locale, pathname);
  const socialImage = {
    // A page gets its own card by route, so a section page needs no wiring here
    // beyond the `path` it already passes.
    url: image?.url ?? getOgImageUrl(locale, pathname),
    width: image?.width ?? 1200,
    height: image?.height ?? 630,
    alt: image?.alt ?? title,
  };
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    ...(keywords ? { keywords } : {}),
    ...(authors ? { authors: authors.map(name => ({ name })) } : {}),
    alternates: {
      canonical: url,
      languages: languageAlternates(pathname, availableLocales),
      // Page metadata replaces the layout's rather than merging, so the feed
      // link has to be issued from here to appear on every page.
      types: {
        'application/rss+xml': [{ url: feedUrl(locale), title: FEED_TITLE[locale] ?? FEED_TITLE.pt }],
      },
    },
    openGraph: {
      title, description, url, siteName: 'estimador.pt',
      locale: locale === 'pt' ? 'pt_PT' : 'en_GB',
      alternateLocale: availableLocales.filter(other => other !== locale).map(other => other === 'pt' ? 'pt_PT' : 'en_GB'),
      images: [socialImage],
      ...(type === 'article' ? { type, publishedTime, modifiedTime, authors, tags } : { type }),
    },
    twitter: {
      card: 'summary_large_image', title, description,
      creator: '@estimadorpt', images: [socialImage.url],
    },
    robots: { index, follow: true },
  };
}
