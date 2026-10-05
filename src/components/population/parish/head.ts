'use client';
/**
 * Head tags for a parish page, set in the browser.
 *
 * All 3,092 parish pages are one exported shell (code "_") behind a host
 * rewrite, so the static HTML cannot name the parish: a canonical there would
 * fold every parish into one URL and a noindex would hide them all. The shell
 * ships neither; this sets the parish's own title, description, canonical and
 * language alternates once the code is known, and noindex only for a code that
 * is not a parish.
 *
 * Next can stream the shell's metadata after hydration, and not always into
 * <head>: with streamed metadata the <title> and <meta> tags arrive in <body>.
 * So every lookup covers the whole document, and `watchHead` re-applies the
 * tags whenever a title, meta or link element is added or changed anywhere.
 * Each write happens only when a value differs, so the observer settles
 * instead of looping. Elements React rendered are only ever re-valued, never
 * removed; only the ones this module added are removed.
 */

const SITE = 'https://estimador.pt';
/** Marks the elements this module added, so they leave with the page. */
const OWNED = 'data-parish-head';

export function parishUrl(locale: string, code: string): string {
  return `${SITE}/${locale}/populacao/freguesia/${code}/`;
}

export interface HeadSpec {
  title: string;
  description?: string;
  /** The page's own URL; absent for an unknown code. */
  canonical?: string;
  alternates?: Array<{ hreflang: string; href: string }>;
  robots: string;
}

export function parishHead({ locale, code, title, description }: { locale: string; code: string; title: string; description: string }): HeadSpec {
  return {
    title,
    description,
    canonical: parishUrl(locale, code),
    alternates: [
      { hreflang: 'pt', href: parishUrl('pt', code) },
      { hreflang: 'en', href: parishUrl('en', code) },
      { hreflang: 'x-default', href: parishUrl('pt', code) },
    ],
    robots: 'index, follow',
  };
}

export function unknownHead(title: string): HeadSpec {
  return { title, robots: 'noindex, follow' };
}

function setAttr(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/** Every element matching the selector anywhere in the document, or a new one in <head>. */
function ensure(selector: string, make: () => Element): Element[] {
  const found = [...document.querySelectorAll(selector)];
  if (found.length) return found;
  const element = make();
  element.setAttribute(OWNED, '');
  document.head.appendChild(element);
  return [element];
}

function meta(attribute: 'name' | 'property', key: string, content: string) {
  for (const element of ensure(`meta[${attribute}="${key}"]`, () => {
    const created = document.createElement('meta');
    created.setAttribute(attribute, key);
    return created;
  })) setAttr(element, 'content', content);
}

function link(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  for (const element of ensure(selector, () => {
    const created = document.createElement('link');
    created.setAttribute('rel', rel);
    if (hreflang) created.setAttribute('hreflang', hreflang);
    return created;
  })) setAttr(element, 'href', href);
}

function setTitle(title: string) {
  const titles = [...document.querySelectorAll('title')];
  if (titles.length === 0) {
    document.title = title;
    return;
  }
  for (const element of titles) if (element.textContent !== title) element.textContent = title;
}

export function applyHead(spec: HeadSpec) {
  setTitle(spec.title);
  meta('name', 'robots', spec.robots);
  // The layout's googlebot line carries preview limits worth keeping; it only changes to keep a page out.
  if (spec.robots.startsWith('noindex')) {
    for (const element of document.querySelectorAll('meta[name="googlebot"]')) setAttr(element, 'content', spec.robots);
  }
  if (spec.description) {
    meta('name', 'description', spec.description);
    meta('property', 'og:description', spec.description);
  }
  meta('property', 'og:title', spec.title);
  meta('name', 'twitter:title', spec.title);
  if (spec.canonical) {
    link('canonical', spec.canonical);
    meta('property', 'og:url', spec.canonical);
  } else {
    document.querySelectorAll(`link[rel="canonical"][${OWNED}]`).forEach(element => element.remove());
  }
  const wanted = new Set((spec.alternates ?? []).map(alt => alt.hreflang));
  document.querySelectorAll(`link[rel="alternate"][hreflang][${OWNED}]`).forEach(element => {
    if (!wanted.has(element.getAttribute('hreflang') ?? '')) element.remove();
  });
  for (const alt of spec.alternates ?? []) link('alternate', alt.href, alt.hreflang);
}

const HEAD_TAGS = new Set(['TITLE', 'META', 'LINK']);

/** Whether a mutation touched a title, meta or link element (and not, say, a chart's style). */
function touchesHeadTags(record: MutationRecord): boolean {
  const target = record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : record.target as Element;
  if (target && HEAD_TAGS.has(target.tagName)) return true;
  for (const node of record.addedNodes) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const element = node as Element;
    if (HEAD_TAGS.has(element.tagName) || element.querySelector('title, meta, link')) return true;
  }
  return false;
}

/** Applies the tags now and keeps them applied until the returned cleanup runs. */
export function watchHead(spec: HeadSpec): () => void {
  applyHead(spec);
  const observer = new MutationObserver(records => {
    if (records.some(touchesHeadTags)) applyHead(spec);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['content', 'href', 'rel', 'name', 'property', 'hreflang'],
  });
  return () => {
    observer.disconnect();
    // A client-side navigation away must not carry this parish's canonical or alternates to the next page.
    document.querySelectorAll(`[${OWNED}]`).forEach(element => element.remove());
  };
}
