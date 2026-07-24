// Per-query citable permalinks for the tabulator (doc 26, LW item).
//
// A canonical query tuple maps to a STABLE, version-pinned slug: the same query
// always yields the same slug, so a citation ("estimador.pt/populacao/explorar?q=…")
// re-runs the identical cross-tab forever. dims and filter keys are canonicalised
// (sorted) so A×B and B×A cite to one slug — the data is the same cross-tab; the
// UI picks a default rows/cols. The slug is a URL-safe base64 of the canonical
// JSON (unicode-safe), decodable back to the tuple for a version-pinned re-run.

import type { TabQuery, GeoLevel, TabMeasure } from '@/types/populacao';

export const TAB_SCHEMA_VERSION = 'v1';

const GEO_LEVELS: GeoLevel[] = ['nacional', 'distrito', 'municipio', 'freguesia'];
const MEASURES: TabMeasure[] = ['count', 'share'];

function canonical(q: TabQuery): Record<string, unknown> {
  const dims = [...(q.dims ?? [])].filter(Boolean).sort();
  const filters = q.filters ?? {};
  const sortedFilters: Record<string, string> = {};
  for (const k of Object.keys(filters).sort()) sortedFilters[k] = filters[k];
  return {
    v: TAB_SCHEMA_VERSION,
    geoLevel: q.geoLevel,
    geo: q.geo ?? '',
    measure: q.measure,
    dims,
    filters: sortedFilters,
  };
}

function b64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(slug: string): string {
  const padded = slug.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Canonical query tuple -> stable, order-independent, version-pinned slug. */
export function encodeQuery(q: TabQuery): string {
  return b64urlEncode(JSON.stringify(canonical(q)));
}

/** Slug -> query tuple, or null if malformed / wrong schema version. */
export function decodeQuery(slug: string): TabQuery | null {
  if (!slug) return null;
  try {
    const obj = JSON.parse(b64urlDecode(slug)) as Partial<TabQuery>;
    if (obj.v !== TAB_SCHEMA_VERSION) return null;
    if (!obj.geoLevel || !GEO_LEVELS.includes(obj.geoLevel)) return null;
    if (!obj.measure || !MEASURES.includes(obj.measure)) return null;
    if (!Array.isArray(obj.dims) || obj.dims.length < 1 || obj.dims.length > 3) return null;
    if (!obj.dims.every((d) => typeof d === 'string' && d.length > 0)) return null;
    const filters =
      obj.filters && typeof obj.filters === 'object' ? (obj.filters as Record<string, string>) : {};
    return {
      v: TAB_SCHEMA_VERSION,
      geoLevel: obj.geoLevel,
      geo: typeof obj.geo === 'string' ? obj.geo : '',
      measure: obj.measure,
      dims: obj.dims,
      filters,
    };
  } catch {
    return null;
  }
}

/** Stable, human-readable one-line summary of a query (for chips / captions). */
export function describeQuery(q: TabQuery): string {
  const geo = q.geo ? `${q.geoLevel}:${q.geo}` : 'nacional';
  const dims = [...(q.dims ?? [])].join(' × ');
  const flt = q.filters && Object.keys(q.filters).length
    ? ' | ' + Object.entries(q.filters).map(([k, v]) => `${k}=${v}`).join(', ')
    : '';
  return `${dims} @ ${geo} (${q.measure})${flt}`;
}
