import { describe, expect, it } from 'vitest';
import { createPageMetadata, PARISH_PREFETCH_KEY, parishHeadScript, resolveOgImageAlt, siteTitle, TITLE_SUFFIX, type OgManifest } from './metadata';

describe('page titles', () => {
  it('appends the one site suffix to a bare title', () => {
    expect(siteTitle('Metodologia da economia')).toBe('Metodologia da economia | estimador.pt');
  });

  it('replaces every suffix variant the catalogue still types', () => {
    for (const typed of [
      'Previsões Liga Portugal - estimador.pt',
      'Previsões Liga Portugal | estimador.pt',
      'Previsões Liga Portugal | Estimador',
      'Previsões Liga Portugal — estimador.pt',
      'Previsões Liga Portugal · estimador.pt',
    ]) {
      expect(siteTitle(typed), typed).toBe(`Previsões Liga Portugal${TITLE_SUFFIX}`);
    }
  });

  it('is idempotent', () => {
    const once = siteTitle('Temas — Artigos');
    expect(siteTitle(once)).toBe(once);
  });

  it('leaves a title that already names the site as written', () => {
    expect(siteTitle('estimador.pt — Dados para compreender Portugal')).toBe('estimador.pt — Dados para compreender Portugal');
    expect(siteTitle('Sobre o estimador.pt')).toBe('Sobre o estimador.pt');
  });

  it('keeps a dash that belongs to the title itself', () => {
    expect(siteTitle('Temas — Artigos | estimador.pt')).toBe('Temas — Artigos | estimador.pt');
  });

  it('is what createPageMetadata emits for the document and the share card', () => {
    const metadata = createPageMetadata({ locale: 'pt', path: '/economia', title: 'Economia (em preparação)', description: 'y' });
    expect(metadata.title).toBe('Economia (em preparação) | estimador.pt');
    expect(metadata.openGraph?.title).toBe('Economia (em preparação) | estimador.pt');
  });

  it('marks a page noindex when asked', () => {
    const metadata = createPageMetadata({ locale: 'pt', path: '/economia', title: 'x', description: 'y', index: false });
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});

describe('og:image:alt (SPV-04)', () => {
  const manifest: OgManifest = {
    files: { pt: 'og-image-pt-aaaa1111.png' },
    cards: { pt: { '/desporto/liga': 'og-image-liga-pt-cccc3333.png' } },
    alt: { 'og-image-liga-pt-cccc3333.png': 'Liga Portugal 2026-27 depois da jornada 7: probabilidade de título, Porto 51%.' },
  };

  it('describes the card a page shares, not the page', () => {
    expect(resolveOgImageAlt(manifest, 'pt', '/desporto/liga/jogo/porto-alverca', 'Porto – Alverca | estimador.pt'))
      .toBe('Liga Portugal 2026-27 depois da jornada 7: probabilidade de título, Porto 51%.');
  });

  it('falls back to the title when the card has no description', () => {
    expect(resolveOgImageAlt(manifest, 'pt', '/sobre', 'Sobre | estimador.pt')).toBe('Sobre | estimador.pt');
    expect(resolveOgImageAlt(null, 'pt', '/desporto/liga', 'Liga | estimador.pt')).toBe('Liga | estimador.pt');
  });
});

describe('parish head script (UXM2V-01, SPV-03)', () => {
  interface FakeLink { attrs: Record<string, string>; setAttribute(name: string, value: string): void }
  function run(pathname: string) {
    const head: FakeLink[] = [];
    const fetched: string[] = [];
    const window: Record<string, unknown> = {};
    const document = {
      head: { appendChild: (element: FakeLink) => head.push(element) },
      createElement: () => {
        const attrs: Record<string, string> = {};
        return { attrs, setAttribute: (name: string, value: string) => { attrs[name] = value; } };
      },
    };
    const fetch = (url: string) => { fetched.push(url); return Promise.resolve(url); };
    new Function('location', 'document', 'window', 'fetch', parishHeadScript('/data/population/v9.9.9'))({ pathname }, document, window, fetch);
    return { links: head.map(link => link.attrs), fetched, prefetch: window[PARISH_PREFETCH_KEY] as Record<string, Promise<string>> | undefined };
  }

  it('starts the parish data requests and writes the canonical and alternates, owned by head.ts', async () => {
    const { links, fetched, prefetch } = run('/en/populacao/freguesia/0302fa');
    expect(fetched).toEqual(['/data/population/v9.9.9/meta.json', '/data/population/v9.9.9/parish/0302FA.json']);
    expect(await prefetch?.['/data/population/v9.9.9/parish/0302FA.json']).toBe('/data/population/v9.9.9/parish/0302FA.json');
    // No <link rel=preload>: one in the head before hydration duplicated og:title.
    expect(links).toEqual([
      { rel: 'canonical', href: 'https://estimador.pt/en/populacao/freguesia/0302FA/', 'data-parish-head': '' },
      { rel: 'alternate', hreflang: 'pt', href: 'https://estimador.pt/pt/populacao/freguesia/0302FA/', 'data-parish-head': '' },
      { rel: 'alternate', hreflang: 'en', href: 'https://estimador.pt/en/populacao/freguesia/0302FA/', 'data-parish-head': '' },
      { rel: 'alternate', hreflang: 'x-default', href: 'https://estimador.pt/pt/populacao/freguesia/0302FA/', 'data-parish-head': '' },
    ]);
  });

  it('does nothing on other pages or without a valid code', () => {
    for (const pathname of ['/pt/', '/pt/populacao/', '/pt/populacao/freguesia/', '/pt/populacao/freguesia/_/', '/pt/populacao/freguesia/abc/', '/pt/populacao/freguesia/%E0%A4%A/']) {
      const { links, fetched } = run(pathname);
      expect([...links, ...fetched], pathname).toEqual([]);
    }
  });
});
