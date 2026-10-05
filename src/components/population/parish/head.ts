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
 */

const SITE = 'https://estimador.pt';
const MARK = 'data-parish-head';

export function parishUrl(locale: string, code: string): string {
  return `${SITE}/${locale}/populacao/freguesia/${code}/`;
}

function upsert(selector: string, create: () => HTMLElement): HTMLElement {
  const found = document.head.querySelector<HTMLElement>(selector);
  if (found) return found;
  const element = create();
  element.setAttribute(MARK, '');
  document.head.appendChild(element);
  return element;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  const element = upsert(`meta[${attribute}="${key}"]`, () => {
    const meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    return meta;
  });
  element.setAttribute('content', content);
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  const element = upsert(selector, () => {
    const link = document.createElement('link');
    link.setAttribute('rel', rel);
    if (hreflang) link.setAttribute('hreflang', hreflang);
    return link;
  });
  element.setAttribute('href', href);
}

export function setParishHead({ locale, code, title, description }: { locale: string; code: string; title: string; description: string }) {
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', parishUrl(locale, code));
  setLink('canonical', parishUrl(locale, code));
  setLink('alternate', parishUrl('pt', code), 'pt');
  setLink('alternate', parishUrl('en', code), 'en');
  setLink('alternate', parishUrl('pt', code), 'x-default');
  for (const meta of document.head.querySelectorAll('meta[name="robots"], meta[name="googlebot"]')) {
    meta.setAttribute('content', 'index, follow');
  }
}

/** For a code that is not a parish: keep it out of the index, and claim no canonical. */
export function setUnknownHead({ title }: { title: string }) {
  document.title = title;
  document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]').forEach(link => link.remove());
  setMeta('name', 'robots', 'noindex, follow');
  const googlebot = document.head.querySelector('meta[name="googlebot"]');
  if (googlebot) googlebot.setAttribute('content', 'noindex, follow');
}
