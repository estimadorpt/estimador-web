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
 * instead of looping.
 *
 * Leaving the page is the dangerous moment: on a client-side navigation Next
 * writes the next page's tags while this observer is still connected. So the
 * observer only acts while the address is still this parish's (`stillHere`),
 * and disconnects the moment it is not. Elements this module added leave with
 * the page; elements it only re-valued get their original value back, but only
 * if they still hold the value written here (Next may already have given them
 * the next page's).
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

/**
 * Whether the address still belongs to the parish page that set the head: a
 * `/freguesia/{code}` path (any case, with or without the trailing slash).
 * With no code (an address without a valid one), any parish path counts.
 */
export function isParishPath(pathname: string, code: string | null): boolean {
  const match = /\/populacao\/freguesia\/([^/]*)\/?$/.exec(pathname);
  if (!match) return false;
  if (code === null) return true;
  let segment: string;
  try {
    segment = decodeURIComponent(match[1]);
  } catch {
    return false;
  }
  return segment.trim().toUpperCase() === code;
}

/** What an element held before this module wrote to it: an attribute, or (attr null) its text. */
interface Original { element: Element; attr: string | null; before: string | null; written: string }

class Writer {
  originals: Original[] = [];

  private remember(element: Element, attr: string | null, written: string) {
    if (element.hasAttribute(OWNED)) return;
    const known = this.originals.find(item => item.element === element && item.attr === attr);
    if (known) { known.written = written; return; }
    this.originals.push({ element, attr, before: attr ? element.getAttribute(attr) : element.textContent, written });
  }

  setAttr(element: Element, name: string, value: string) {
    if (element.getAttribute(name) === value) return;
    this.remember(element, name, value);
    element.setAttribute(name, value);
  }

  setText(element: Element, value: string) {
    if (element.textContent === value) return;
    this.remember(element, null, value);
    element.textContent = value;
  }

  /** Puts back what was there, where nobody has written since. */
  restore() {
    for (const { element, attr, before, written } of this.originals) {
      if (!element.isConnected) continue;
      const now = attr ? element.getAttribute(attr) : element.textContent;
      if (now !== written) continue;
      if (attr) {
        if (before === null) element.removeAttribute(attr);
        else element.setAttribute(attr, before);
      } else {
        element.textContent = before ?? '';
      }
    }
    this.originals = [];
  }
}

/**
 * Every element matching the selector anywhere in the document, or a new one
 * in <head>. When Next's own tag arrives after this module made one (streamed
 * metadata), the one made here goes, so the page never carries the tag twice
 * (SP2-09).
 */
function ensure(selector: string, make: () => Element): Element[] {
  const found = [...document.querySelectorAll(selector)];
  const theirs = found.filter(element => !element.hasAttribute(OWNED));
  if (theirs.length && theirs.length < found.length) {
    found.filter(element => element.hasAttribute(OWNED)).forEach(element => element.remove());
    return theirs;
  }
  if (found.length) return found;
  const element = make();
  element.setAttribute(OWNED, '');
  document.head.appendChild(element);
  return [element];
}

function applyHead(spec: HeadSpec, writer: Writer) {
  const meta = (attribute: 'name' | 'property', key: string, content: string) => {
    for (const element of ensure(`meta[${attribute}="${key}"]`, () => {
      const created = document.createElement('meta');
      created.setAttribute(attribute, key);
      return created;
    })) writer.setAttr(element, 'content', content);
  };
  const link = (rel: string, href: string, hreflang?: string) => {
    const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
    for (const element of ensure(selector, () => {
      const created = document.createElement('link');
      created.setAttribute('rel', rel);
      if (hreflang) created.setAttribute('hreflang', hreflang);
      return created;
    })) writer.setAttr(element, 'href', href);
  };

  const titles = [...document.querySelectorAll('title')];
  if (titles.length === 0) document.title = spec.title;
  for (const element of titles) writer.setText(element, spec.title);

  meta('name', 'robots', spec.robots);
  // The layout's googlebot line carries preview limits worth keeping; it only changes to keep a page out.
  if (spec.robots.startsWith('noindex')) {
    for (const element of document.querySelectorAll('meta[name="googlebot"]')) writer.setAttr(element, 'content', spec.robots);
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

/**
 * Applies the tags now and keeps them applied while the address is still this
 * parish's (`code`; null for an address without a valid code), until the
 * returned cleanup runs.
 */
export function watchHead(spec: HeadSpec, code: string | null): () => void {
  const writer = new Writer();
  let done = false;
  const stillHere = () => isParishPath(window.location.pathname, code);
  const stop = () => {
    if (done) return;
    done = true;
    observer.disconnect();
    // A client-side navigation away must not carry this parish's tags to the next page.
    document.querySelectorAll(`[${OWNED}]`).forEach(element => element.remove());
    writer.restore();
  };
  const observer = new MutationObserver(records => {
    if (!stillHere()) { stop(); return; }
    if (records.some(touchesHeadTags)) applyHead(spec, writer);
  });
  if (stillHere()) applyHead(spec, writer);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['content', 'href', 'rel', 'name', 'property', 'hreflang'],
  });
  return stop;
}
