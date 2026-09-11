import fs from 'fs';
import path from 'path';
import type { SectionConfig } from '@/lib/config/sections';

/**
 * Two registers publish through the same pipeline and the same URL space.
 *
 * `explicador` is the evergreen reference piece — how to read a poll, how the
 * electoral system works — written once and linked to for years.
 * `nota` is dated ad-hoc analysis: a thing found in the data this week, often
 * one chart and four hundred words, true as of its date and not revised into
 * silence afterwards.
 *
 * They are listed apart because a chronological feed buries the explainers and
 * a reference index makes the notes look abandoned.
 */
export const ARTICLE_KINDS = ['nota', 'explicador'] as const;
export type ArticleKind = (typeof ARTICLE_KINDS)[number];
const DEFAULT_KIND: ArticleKind = 'explicador';

/**
 * Which forecast surface a piece belongs to, so the note about Liga Portugal
 * can appear on /desporto/liga, where the readers are, instead of only in a
 * chronological feed nobody arrives at first.
 *
 * The vocabulary is the platform's own, borrowed from the section registry
 * rather than reinvented: an article filed under a word the sections do not
 * use could never be surfaced on any of them.
 */
export type ArticleSection = SectionConfig['type'];

/**
 * Written out as a record keyed by that union — a fifth section type added to
 * SectionConfig stops this object compiling, which is the point: the alternative
 * is a type no article can be filed under and nobody notices for a year.
 * Not derived from SECTIONS itself, because a type is legitimate before any
 * section of that type is built.
 */
const SECTION_VOCABULARY: Record<ArticleSection, true> = {
  football: true,
  elections: true,
  economics: true,
  demographics: true,
};

export const ARTICLE_SECTIONS = Object.keys(SECTION_VOCABULARY) as ArticleSection[];

export function isArticleSection(value: unknown): value is ArticleSection {
  return typeof value === 'string' && Object.hasOwn(SECTION_VOCABULARY, value);
}

export interface MDXArticleMetadata {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  /** Set when a piece was materially revised after publication; shown next to the date. */
  updated?: string;
  kind: ArticleKind;
  /** The forecast surface this piece belongs to. Absent for site-wide pieces. */
  section?: ArticleSection;
  /** Committed but unfinished. Present so a listing can label or skip it. */
  draft?: boolean;
  tags: string[];
  readTime: string;
  slug: string;
}

export interface MDXArticle extends MDXArticleMetadata {
  content: string;
  locale: string;
}

export interface ArticleQuery {
  /**
   * Drafts are listed only by `next dev`. Pass it explicitly where the answer
   * must not depend on the environment — a test, or the placeholder check that
   * exists precisely to look at unfinished pieces.
   */
  includeDrafts?: boolean;
}

/**
 * Only the dev server lists drafts. Stated as what may show them rather than
 * what must hide them, so an environment nobody anticipated errs towards
 * hiding an unfinished piece rather than towards publishing one.
 */
function draftsAreListed(): boolean {
  return process.env.NODE_ENV === 'development';
}

const contentDirectory = path.join(process.cwd(), 'src/content/articles');
const articleLocales = ['pt', 'en'];
const metadataPattern = /^export const metadata = (\{[\s\S]*?\n\});?\s*/;

/** A calendar date that survives a round trip, so "2025-02-30" is rejected. */
function isCalendarDate(value: unknown): value is string {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;
}

export function getAvailableLocales(): string[] {
  return articleLocales.filter(locale => fs.existsSync(path.join(contentDirectory, locale)));
}

export function getArticlePath(slug: string, locale: string = 'pt'): string {
  if (!articleLocales.includes(locale) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Invalid article locale or slug');
  }
  return path.join(contentDirectory, locale, `${slug}.mdx`);
}

function readArticle(slug: string, locale: string): MDXArticle {
  const source = fs.readFileSync(getArticlePath(slug, locale), 'utf8');
  const match = source.match(metadataPattern);
  if (!match) throw new Error(`Missing article metadata: ${locale}/${slug}`);

  // Metadata is JSON inside the MDX export: parse data without evaluating code.
  const metadata: Record<string, unknown> = JSON.parse(match[1]);
  const requiredStrings = ['title', 'excerpt', 'author', 'date', 'slug'] as const;
  for (const key of requiredStrings) {
    if (typeof metadata[key] !== 'string' || !metadata[key].trim()) {
      throw new Error(`Invalid article ${key}: ${locale}/${slug}`);
    }
  }
  if (metadata.slug !== slug || !isCalendarDate(metadata.date)
    || !Array.isArray(metadata.tags) || !metadata.tags.every(tag => typeof tag === 'string')) {
    throw new Error(`Invalid article metadata: ${locale}/${slug}`);
  }

  // Omitted means the original register: the four pieces written before notes
  // existed stay explainers without being edited.
  const kind = metadata.kind === undefined ? DEFAULT_KIND : metadata.kind;
  if (!ARTICLE_KINDS.includes(kind as ArticleKind)) {
    throw new Error(`Invalid article kind: ${locale}/${slug} (${String(kind)})`);
  }

  // Unfiled is a real answer — a piece about the site itself belongs to no
  // forecast surface — but a misspelt one is not: it would silently never
  // appear on the page it was written for.
  let section: ArticleSection | undefined;
  if (metadata.section !== undefined) {
    if (!isArticleSection(metadata.section)) {
      throw new Error(`Invalid article section: ${locale}/${slug} (${String(metadata.section)})`);
    }
    section = metadata.section;
  }

  // A revision date earlier than publication is a typo, and it would render as
  // a piece updated before it existed.
  const updated = metadata.updated;
  if (updated !== undefined && (!isCalendarDate(updated) || updated < (metadata.date as string))) {
    throw new Error(`Invalid article updated date: ${locale}/${slug}`);
  }

  // What a draft is allowed to leave unfinished is the prose, not the header:
  // the metadata is still parsed and validated, because a broken header would
  // take the whole index down with it in `next dev`.
  const draft = metadata.draft;
  if (draft !== undefined && typeof draft !== 'boolean') {
    throw new Error(`Invalid article draft flag: ${locale}/${slug}`);
  }

  const content = source.slice(match[0].length);
  const words = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split(/\s+/).filter(Boolean).length;
  return {
    title: metadata.title as string,
    excerpt: metadata.excerpt as string,
    author: metadata.author as string,
    date: metadata.date as string,
    ...(updated === undefined ? {} : { updated: updated as string }),
    kind: kind as ArticleKind,
    ...(section === undefined ? {} : { section }),
    ...(draft ? { draft: true } : {}),
    tags: metadata.tags as string[],
    slug,
    readTime: `${Math.max(1, Math.ceil(words / 200))} min`,
    content,
    locale,
  };
}

/**
 * Every listing on the site goes through here — the index, both feeds, the
 * sitemap, generateStaticParams. Dropping drafts at this one point is what
 * makes a half-written piece safe to commit: no page has to remember to guard
 * against it, and none of them can leak one by forgetting.
 */
export function getMDXArticlesByLocale(locale: string = 'pt', options: ArticleQuery = {}): MDXArticleMetadata[] {
  if (!articleLocales.includes(locale)) return [];
  const localeDir = path.join(contentDirectory, locale);
  if (!fs.existsSync(localeDir)) return [];
  const includeDrafts = options.includeDrafts ?? draftsAreListed();
  return fs.readdirSync(localeDir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => readArticle(file.slice(0, -4), locale))
    .filter(article => includeDrafts || !article.draft)
    .map(({ title, excerpt, author, date, updated, kind, section, draft, tags, readTime, slug }) => ({
      title, excerpt, author, date, ...(updated ? { updated } : {}), kind,
      ...(section ? { section } : {}), ...(draft ? { draft } : {}), tags, readTime, slug,
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

/** The index renders the two registers separately; this is the one split point. */
export function getArticlesByKind(locale: string = 'pt', options: ArticleQuery = {}): Record<ArticleKind, MDXArticleMetadata[]> {
  const articles = getMDXArticlesByLocale(locale, options);
  return {
    nota: articles.filter(article => article.kind === 'nota'),
    explicador: articles.filter(article => article.kind === 'explicador'),
  };
}

/**
 * The pieces one forecast page may show, newest first. Goes through the same
 * listing function as everything else, so a draft stays off a section page for
 * the same reason it stays off the index — not because this filter remembered.
 */
export function getArticlesBySection(
  section: ArticleSection,
  locale: string = 'pt',
  options: ArticleQuery = {},
): MDXArticleMetadata[] {
  return getMDXArticlesByLocale(locale, options).filter(article => article.section === section);
}

export function articleExistsInLocale(slug: string, locale: string): boolean {
  if (!articleLocales.includes(locale) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;
  return fs.existsSync(getArticlePath(slug, locale));
}

/**
 * Returns drafts too. A draft is written by previewing it, so the page itself
 * must render; it is the listings that keep it out of the published site.
 */
export function getMDXArticleBySlug(slug: string, locale: string = 'pt'): MDXArticle | null {
  return articleExistsInLocale(slug, locale) ? readArticle(slug, locale) : null;
}

export function getArticleWithFallback(slug: string, preferredLocale: string): { article: MDXArticle | null; locale: string } {
  const article = getMDXArticleBySlug(slug, preferredLocale);
  if (article || preferredLocale === 'pt') return { article, locale: preferredLocale };
  return { article: getMDXArticleBySlug(slug, 'pt'), locale: 'pt' };
}
