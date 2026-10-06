import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { getMDXArticlesByLocale } from './mdx-articles';
import { siteTitle } from './site-title';

export { siteTitle, TITLE_SUFFIX } from './site-title';

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

/**
 * hreflang for every locale the page exists in, plus x-default for a reader
 * whose language is neither: the Portuguese page, the site's own language.
 * A page that exists only in English (a translation-only article) points
 * x-default at the locale it has, never at a page that was not exported.
 */
export function languageAlternates(pathname: string, availableLocales: readonly string[] = SITE_LOCALES) {
  const languages: Record<string, string> = Object.fromEntries(
    availableLocales.map(locale => [locale, localizedUrl(locale, pathname)]));
  const fallback = availableLocales.includes('pt') ? 'pt' : availableLocales[0];
  if (fallback) languages['x-default'] = localizedUrl(fallback, pathname);
  return languages;
}

/**
 * The RSS autodiscovery link, only once this locale has published an article:
 * the chrome hides the articles nav item, footer link and feed until then
 * (the /feed.xml routes keep working). Same list as the footer's, so drafts
 * count only under `npm run dev`. Every hand-built head uses this too.
 */
export function feedAlternates(locale: string): { 'application/rss+xml': { url: string; title: string }[] } | undefined {
  if (getMDXArticlesByLocale(locale).length === 0) return undefined;
  return { 'application/rss+xml': [{ url: feedUrl(locale), title: FEED_TITLE[locale] ?? FEED_TITLE.pt }] };
}

export interface OgManifest {
  /** The per-locale fallback, for any page without a card of its own. */
  files?: Record<string, string>;
  /** Route path → card filename, per locale. Written by scripts/generate-og-images.mjs. */
  cards?: Record<string, Record<string, string>>;
  /** The pixel size every card was rendered at, read from the PNGs themselves. */
  size?: { width: number; height: number };
}

/** What a page declares as og:image:width/height when the manifest says nothing. */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * Pages under a section that must not inherit the section's card: the card
 * carries the live headline number (this season's title odds), which would be
 * wrong on an archived season, and the imagined miniature is not the release.
 */
const NO_SECTION_CARD = [/^\/desporto\/liga\/\d{4}-\d{2}(\/|$)/, /^\/populacao\/miniatura(\/|$)/];

/** One leading slash, no trailing one — the shape the generator writes. */
function cardKey(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '/';
}

/**
 * The card for a route: its own, else the nearest section above it that has
 * one (longest prefix, by whole segments: /desporto/liga/jogo/x takes the
 * /desporto/liga card, /desporto/liga2 does not). The root's card is the
 * locale default and is reached through the fallback, not inherited.
 */
function sectionCard(cards: Record<string, string> | undefined, pathname: string): string | undefined {
  if (!cards) return undefined;
  const key = cardKey(pathname);
  if (cards[key]) return cards[key];
  if (NO_SECTION_CARD.some(pattern => pattern.test(key))) return undefined;
  const segments = key.split('/').filter(Boolean);
  for (let length = segments.length - 1; length > 0; length -= 1) {
    const card = cards[`/${segments.slice(0, length).join('/')}`];
    if (card) return card;
  }
  return undefined;
}

/**
 * Kept pure so the fallback chain can be tested without a manifest on disk:
 * a page's own card, then its section's, then the locale default, then the
 * unversioned file that ships even when nobody has run the generator.
 */
export function resolveOgImageFile(
  manifest: OgManifest | null,
  locale: string,
  pathname?: string,
): string {
  const specific = pathname ? sectionCard(manifest?.cards?.[locale], pathname) : undefined;
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

/**
 * The size the cards really are, for og:image:width/height (a declared size
 * that differs from the file makes some platforms crop or refetch). Pages that
 * build their own head use this rather than typing 1200 × 630.
 */
export function getOgImageSize(): { width: number; height: number } {
  const size = readOgManifest()?.size;
  return size && size.width > 0 && size.height > 0 ? { width: size.width, height: size.height } : { ...OG_IMAGE_SIZE };
}

/** Lengths past which search results cut a title or a description. */
export const META_LIMITS = { title: 70, description: 160 } as const;

/** What is too long in a page's title (with its suffix) and description, if anything. */
export function metaLengthIssues(title: string, description: string): string[] {
  const issues: string[] = [];
  if (title.length > META_LIMITS.title) issues.push(`title is ${title.length} characters (keep to about 60, at most ${META_LIMITS.title})`);
  if (description.length > META_LIMITS.description) issues.push(`description is ${description.length} characters (keep to about 155, at most ${META_LIMITS.description})`);
  return issues;
}

const reportedLengths = new Set<string>();

/**
 * A build-log warning, once per page, for a title or description that search
 * results will truncate. A warning, not an error: the page is still correct,
 * and scripts/check-export-budget.mjs lists the same pages after an export.
 */
function warnMetaLength(url: string, title: string, description: string) {
  if (process.env.VITEST || reportedLengths.has(url)) return;
  const issues = metaLengthIssues(title, description);
  if (!issues.length) return;
  reportedLengths.add(url);
  console.warn(`[metadata] ${url}: ${issues.join('; ')}`);
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
  locale, path: pathname, title: typedTitle, description, keywords, type = 'website',
  publishedTime, modifiedTime, authors, tags, availableLocales = SITE_LOCALES,
  image, index = true,
}: PageMetadataOptions): Metadata {
  const title = siteTitle(typedTitle);
  const url = localizedUrl(locale, pathname);
  const feedTypes = feedAlternates(locale);
  warnMetaLength(url, title, description);
  const cardSize = getOgImageSize();
  const socialImage = {
    // A page gets its own card by route (or its section's), so a section page
    // needs no wiring here beyond the `path` it already passes.
    url: image?.url ?? getOgImageUrl(locale, pathname),
    width: image?.width ?? cardSize.width,
    height: image?.height ?? cardSize.height,
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
      // link has to be issued from here to appear on every page; and only
      // when the locale has an article to offer (feedAlternates).
      ...(feedTypes ? { types: feedTypes } : {}),
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
