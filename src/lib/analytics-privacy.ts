import type { CaptureResult } from 'posthog-js';
import { PUBLISHED_ARTICLE_SLUGS } from './published-articles.generated';

const PUBLIC_ROUTES = new Set([
  '', 'economia', 'economia/metodologia', 'sobre', 'metodologia', 'artigos', 'privacidade',
  'eleicoes/presidenciais', 'eleicoes/legislativas', 'eleicoes/legislativas/mapa',
  'desporto/liga', 'desporto/liga2', 'desporto/liga/jogadores', 'desporto/liga/modelo',
  'desporto/liga/metodologia', 'desporto/liga/dados', 'desporto/liga/2025-26',
  'desporto/liga/simulador', 'desporto/liga/jogo-previsoes',
]);
const POPULATION_SURFACES = new Set(['casas', 'explorar', 'incerteza', 'metodologia', 'misteriosa', 'retrato']);

/**
 * An article slug names a thing the site published; it says nothing about who
 * read it. Every other reduction below anonymises reader-supplied input — the
 * household answers under /populacao, a selected geography, a query string, an
 * unrecognised URL — and an article title does not belong to that class. For a
 * site whose purpose is publishing, which piece was read is the one number
 * worth having, and keeping it costs the reader nothing.
 *
 * It stays an allow-list rather than a pass-through of `parts[1]` because the
 * URL is attacker-controlled: a crafted segment would otherwise become an
 * arbitrary string in the analytics store, and the boundary would no longer
 * fail closed. Anything not on the list still collapses to the old category.
 *
 * The list arrives as generated source (scripts/generate-article-slugs.mjs)
 * rather than a fetch or a prop: this function runs in the browser and cannot
 * read src/content, and a frozen module-level array is the only shape that
 * leaves it a pure function of its argument, testable without a DOM or a build.
 */
const ARTICLE_SLUGS: ReadonlySet<string> = new Set(PUBLISHED_ARTICLE_SLUGS);

/** A fixed page category, never a query, household answer, place or arbitrary URL. */
export function analyticsPath(value: string): string {
  let pathname: string;
  try { pathname = new URL(value, 'https://estimador.pt').pathname; }
  catch { return '/other/'; }
  const parts = pathname.split('/').filter(Boolean);
  const locale = parts.shift();
  if (locale !== 'pt' && locale !== 'en') return '/other/';
  const route = parts.join('/');
  if (PUBLIC_ROUTES.has(route)) return `/${locale}/${route ? `${route}/` : ''}`;
  if (parts[0] === 'populacao') {
    const surface = POPULATION_SURFACES.has(parts[1]) ? parts[1] : parts[1] === 'v' ? 'consulta' : '';
    return `/${locale}/populacao/${surface ? `${surface}/` : ''}`;
  }
  if (parts[0] === 'artigos') {
    // Length two exactly: a deeper path is not a page this site serves.
    const slug = parts.length === 2 && ARTICLE_SLUGS.has(parts[1]) ? parts[1] : 'artigo';
    return `/${locale}/artigos/${slug}/`;
  }
  if (parts[0] === 'desporto' && parts[1] === 'liga') {
    return `/${locale}/desporto/liga/${parts[2] === 'jogo' ? 'jogo' : parts[2] === 'jogador' ? 'jogador' : 'equipa'}/`;
  }
  return `/${locale}/other/`;
}

/** Applied after SDK enrichment. Unknown events and properties fail closed. */
export function sanitizeAnalyticsEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event || event.event !== '$pageview') return null;
  const source = event.properties ?? {};
  const pathname = analyticsPath(typeof source.$current_url === 'string' ? source.$current_url : '');
  const properties: CaptureResult['properties'] = {
    $current_url: `https://estimador.pt${pathname}`,
    $pathname: pathname,
    $process_person_profile: false,
    $geoip_disable: true,
  };
  // Only transport identity and SDK version fields; no referrers, campaign
  // values, browser storage properties, person data or custom nested payloads.
  for (const key of ['token', 'distinct_id', '$lib', '$lib_version', '$cookieless_mode']) {
    if (typeof source[key] === 'string' || typeof source[key] === 'boolean') properties[key] = source[key];
  }
  return { uuid: event.uuid, event: '$pageview', timestamp: event.timestamp, properties };
}
