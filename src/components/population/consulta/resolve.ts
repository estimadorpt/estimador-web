/**
 * The producer's canonical paths, /populacao/v/{release}/q/{query_id}, name one
 * approved response. The host rewrites every such path to the consulta shell;
 * these pure helpers turn the path into the page that shows that response.
 */
import { RECIPE_COPY } from '@/lib/population/labels';
import { POPULATION_ROUTES } from '@/lib/config/population';
import type { PortraitRecipe } from '@/types/population';

/** A contract-v1 query id: "q1_" and 20 lowercase hex digits. */
const QUERY_ID = /^q1_[0-9a-f]{20}$/;

export interface CanonicalPath {
  release: string;
  id: string;
  /** The locale prefix the link carried ("/en/populacao/v/…"), or null for the bare canonical path. */
  locale: 'pt' | 'en' | null;
}

/**
 * Reads `/populacao/v/{release}/q/{id}` out of a pathname (with or without a
 * locale prefix or a trailing slash). Returns null when the path does not have
 * that shape. The id is lower-cased (ids are lower-case hex; a link retyped in
 * capitals still resolves) and validated separately.
 */
export function parseCanonicalPath(pathname: string): CanonicalPath | null {
  const match = /^(?:\/(pt|en))?\/populacao\/v\/([^/]+)\/q\/([^/]+)\/?$/i.exec(pathname);
  if (!match) return null;
  let release: string;
  let id: string;
  try {
    release = decodeURIComponent(match[2]);
    id = decodeURIComponent(match[3]);
  } catch {
    return null;
  }
  const locale = match[1] ? (match[1].toLowerCase() as 'pt' | 'en') : null;
  return { release: release.replace(/^v/i, ''), id: id.trim().toLowerCase(), locale };
}

export function isQueryId(id: string): boolean {
  return QUERY_ID.test(id);
}

/** The lookup bucket a query id lives in (q/<bucket>.json). */
export function queryBucket(id: string): string {
  return id[3];
}

/**
 * Where an id's response is shown: the national age chart on the hub, or the
 * card's anchor on its parish page. Null for a row the site cannot place.
 */
export function targetFor(entry: readonly [string, string] | undefined, locale: string): string | null {
  if (!entry) return null;
  const [code, recipe] = entry;
  if (code === 'PT') return `/${locale}/populacao/#idade`;
  if (!/^[0-9A-Z]{6}$/.test(code)) return null;
  const copy = Object.prototype.hasOwnProperty.call(RECIPE_COPY, recipe)
    ? RECIPE_COPY[recipe as PortraitRecipe]
    : undefined;
  // The same shape as parishHref (ParishLink.tsx), kept JSX-free so the unit
  // tests can import it.
  return `/${locale}${POPULATION_ROUTES.parish(code)}/${copy ? `#${copy.anchor}` : ''}`;
}
