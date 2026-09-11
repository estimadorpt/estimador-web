import type { MDXArticleMetadata } from './mdx-articles';

/**
 * How a reader gets from one piece to the next.
 *
 * Two mechanisms, both derived rather than authored: a URL for every tag, and
 * an ordering of what to read after the piece in hand. Neither is stored in the
 * MDX header, so adding a note never means also remembering to register it
 * somewhere.
 *
 * Pure on purpose — no filesystem, no next-intl — so the ranking can be tested
 * against fixtures instead of against whatever happens to be published today.
 */

/**
 * The URL segment for a tag.
 *
 * Tags are free text typed by hand ("Análise partidária", "Guia de leitura"),
 * so the slug has to be derived. Deriving it also means two spellings of the
 * same tag — a stray capital, a dropped accent — land on one page instead of
 * quietly splitting the archive in half.
 *
 * Collisions are therefore merged, not disambiguated with a numeric suffix: a
 * suffix would make a tag's URL depend on which *other* tags happen to be
 * published that week, and a URL that moves is worse than two subjects sharing
 * a page.
 *
 * Returns "" for a tag with no alphanumerics at all. Such a tag has no page;
 * callers render it as plain text rather than as a link to nothing.
 */
export function tagSlug(tag: string): string {
  return tag
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface TagGroup {
  slug: string;
  /** The spelling to print: whichever is used most, ties broken by sort order. */
  label: string;
  articles: MDXArticleMetadata[];
}

/**
 * Every routable tag in a locale, with the pieces carrying it.
 *
 * Article order inside a group is the order they arrived in, which is the
 * loader's newest-first. Group order is busiest-first, tie-broken on the ASCII
 * slug so the list does not reshuffle between a Mac and a CI container the way
 * localeCompare on accented labels would.
 */
export function buildTagIndex(articles: MDXArticleMetadata[]): TagGroup[] {
  const groups = new Map<string, { spellings: Map<string, number>; articles: MDXArticleMetadata[] }>();

  for (const article of articles) {
    // An article tagged both "Sondagens" and "sondagens" is still one article
    // on that tag's page.
    const seen = new Set<string>();
    for (const tag of article.tags) {
      const slug = tagSlug(tag);
      if (!slug) continue;

      const group = groups.get(slug) ?? { spellings: new Map(), articles: [] };
      group.spellings.set(tag, (group.spellings.get(tag) ?? 0) + 1);
      if (!seen.has(slug)) {
        group.articles.push(article);
        seen.add(slug);
      }
      groups.set(slug, group);
    }
  }

  return [...groups.entries()]
    .map(([slug, group]) => ({
      slug,
      label: [...group.spellings.entries()]
        .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0],
      articles: group.articles,
    }))
    .sort((a, b) => b.articles.length - a.articles.length || (a.slug < b.slug ? -1 : 1));
}

/** The group a URL segment refers to, or null when nothing carries that tag. */
export function findTagGroup(articles: MDXArticleMetadata[], slug: string): TagGroup | null {
  return buildTagIndex(articles).find(group => group.slug === slug) ?? null;
}

/**
 * What to offer at the end of a piece, best first.
 *
 * Shared tags rank first, then the same register, then recency. With four
 * pieces published this is close to "everything else, most relevant first",
 * which is why the section is headed "keep reading" and not "related": the
 * archive is too small to promise a real relationship, and claiming one we
 * cannot support is the kind of thing that stops being true silently.
 *
 * `pool` should be the same locale as `current` — a link to a piece that was
 * never exported in the language being read is a 404.
 */
export function relatedArticles(
  current: MDXArticleMetadata,
  pool: MDXArticleMetadata[],
  limit = 3,
): MDXArticleMetadata[] {
  const currentTags = new Set(current.tags.map(tagSlug).filter(Boolean));

  return pool
    .filter(article => article.slug !== current.slug)
    .map(article => ({
      article,
      shared: new Set(article.tags.map(tagSlug).filter(slug => slug && currentTags.has(slug))).size,
      sameKind: article.kind === current.kind ? 1 : 0,
    }))
    .sort((a, b) =>
      b.shared - a.shared
      || b.sameKind - a.sameKind
      || b.article.date.localeCompare(a.article.date)
      || (a.article.slug < b.article.slug ? -1 : 1))
    .slice(0, Math.max(0, limit))
    .map(entry => entry.article);
}
