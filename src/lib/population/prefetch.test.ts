import { afterEach, describe, expect, it, vi } from 'vitest';
import { POPULATION_DATA_PATH } from '@/lib/config/population';
import { PARISH_HEAD_ATTR } from '@/components/population/parish/head';
import { PARISH_PREFETCH_KEY, parishShellScript } from './prefetch';

interface FakeLink { attrs: Record<string, string>; setAttribute(name: string, value: string): void }

/** Runs the shell's script against a fake address, document and fetch. */
function run(pathname: string, locale = pathname.startsWith('/en/') ? 'en' : 'pt', fetch = (url: string) => Promise.resolve(url) as Promise<unknown>) {
  const head: FakeLink[] = [];
  const requested: string[] = [];
  const window: Record<string, unknown> = {};
  const document = {
    head: { appendChild: (element: FakeLink) => head.push(element) },
    createElement: () => {
      const attrs: Record<string, string> = {};
      return { attrs, setAttribute: (name: string, value: string) => { attrs[name] = value; } };
    },
  };
  const tracked = (url: string) => { requested.push(url); return fetch(url); };
  new Function('window', 'location', 'document', 'fetch', parishShellScript(locale))(window, { pathname }, document, tracked);
  const prefetch = window[PARISH_PREFETCH_KEY] as Record<string, Promise<unknown>> | undefined;
  return { requested, prefetch, links: head.map(link => link.attrs), window };
}

const META = `${POPULATION_DATA_PATH}/meta.json`;

describe('the parish shell script (UXM2V-01, SPV-03)', () => {
  it('starts meta.json and the parish file from the address, upper-casing the code', async () => {
    const pt = run('/pt/populacao/freguesia/0302fa/');
    expect(pt.requested).toEqual([META, `${POPULATION_DATA_PATH}/parish/0302FA.json`]);
    expect(Object.keys(pt.prefetch ?? {})).toEqual(pt.requested);
    expect(await pt.prefetch?.[META]).toBe(META);
    expect(run('/en/populacao/freguesia/010103').requested).toEqual([META, `${POPULATION_DATA_PATH}/parish/010103.json`]);
  });

  it('writes the canonical in the page language and the pt/en/x-default alternates, owned by head.ts', () => {
    const owned = { [PARISH_HEAD_ATTR]: '' };
    // No <link rel=preload>: one in the head before hydration duplicated og:title.
    expect(run('/en/populacao/freguesia/0302fa').links).toEqual([
      { rel: 'canonical', href: 'https://estimador.pt/en/populacao/freguesia/0302FA/', ...owned },
      { rel: 'alternate', hreflang: 'pt', href: 'https://estimador.pt/pt/populacao/freguesia/0302FA/', ...owned },
      { rel: 'alternate', hreflang: 'en', href: 'https://estimador.pt/en/populacao/freguesia/0302FA/', ...owned },
      { rel: 'alternate', hreflang: 'x-default', href: 'https://estimador.pt/pt/populacao/freguesia/0302FA/', ...owned },
    ]);
    expect(run('/pt/populacao/freguesia/010103/').links[0]).toEqual({ rel: 'canonical', href: 'https://estimador.pt/pt/populacao/freguesia/010103/', ...owned });
  });

  it('does nothing on other pages, in the other locale or without a valid code', () => {
    for (const pathname of ['/pt/', '/pt/populacao/', '/pt/populacao/freguesia/', '/pt/populacao/freguesia/_/', '/pt/populacao/freguesia/abc/', '/pt/populacao/freguesia/%E0%A4%A/', '/populacao/freguesia/010103/', '/pt/populacao/freguesia/010103/extra']) {
      const { requested, links, prefetch } = run(pathname);
      expect([...requested, ...links], pathname).toEqual([]);
      expect(prefetch, pathname).toBeUndefined();
    }
    // The Portuguese shell is only ever served for Portuguese addresses.
    expect(run('/en/populacao/freguesia/010103/', 'pt').requested).toEqual([]);
  });

  it('emits no backslash and no closing script tag into the HTML', () => {
    for (const locale of ['pt', 'en']) {
      expect(parishShellScript(locale)).not.toMatch(/\\|<\/script/i);
    }
  });
});

describe('client.ts takes the early requests (UXM2V-01)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('takes each early request once, then fetches again on a later page load', async () => {
    const body = (url: string) => new Response(JSON.stringify({ url }), { status: 200 });
    const network = vi.fn((url: string) => Promise.resolve(body(url)));
    const { window, requested } = run('/pt/populacao/freguesia/0302FA/', 'pt', url => Promise.resolve(body(url)));
    expect(requested).toHaveLength(2);
    vi.stubGlobal('window', window);
    vi.stubGlobal('fetch', network);
    const client = await import('./client');
    expect(await client.fetchMeta()).toEqual({ url: META });
    expect(await client.fetchParish('0302FA')).toEqual({ url: `${POPULATION_DATA_PATH}/parish/0302FA.json` });
    // Both answered by the script's requests: nothing else went to the network.
    expect(network).not.toHaveBeenCalled();
    expect(window[PARISH_PREFETCH_KEY]).toEqual({});
    // A file the script did not start goes to the network as before.
    await client.fetchPlaces();
    expect(network).toHaveBeenCalledWith(`${POPULATION_DATA_PATH}/places.json`, expect.anything());
  });
});
