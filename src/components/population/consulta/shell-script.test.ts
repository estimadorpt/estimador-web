import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_PATH, POPULATION_RELEASE } from '@/lib/config/population';
import { PARISH_PREFETCH_KEY } from '@/lib/population/prefetch';
import { consultaShellScript } from './shell-script';
import { targetFor } from './resolve';

const ID = 'q1_dc0bf3434c913975a9b6';
const LOOKUP: Record<string, [string, string]> = {
  [ID]: ['010103', 'elders_alone'],
  q1_d00000000000000000aa: ['PT', 'age'],
  q1_d11111111111111111aa: ['0302FA', 'household_type'],
  q1_d11111111222222222bb: ['0302FA', 'age'],
};

/** Runs the shell's script against a fake address and fetch; resolves once its promise chain has settled. */
async function run(pathname: string, locale: 'pt' | 'en' = 'pt', lookup: Record<string, unknown> = LOOKUP) {
  const requested: string[] = [];
  const replaced: string[] = [];
  const window: Record<string, unknown> = {};
  const response = { ok: true, clone: () => ({ json: () => Promise.resolve(lookup) }), json: () => Promise.resolve(lookup) };
  const fetch = (url: string) => { requested.push(url); return Promise.resolve(response); };
  const location = { pathname, replace: (href: string) => replaced.push(href) };
  // Strict, as the page runs it: an inline module script (UXM3-13).
  new Function('window', 'location', 'fetch', `'use strict';${consultaShellScript(locale)}`)(window, location, fetch);
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
  return { requested, replaced, prefetch: window[PARISH_PREFETCH_KEY] as Record<string, unknown> | undefined };
}

const R = POPULATION_RELEASE;
const BUCKET = `${POPULATION_DATA_PATH}/q/d.json`;

describe('the consulta shell script (SEO3V-M2)', () => {
  it('opens the parish page at the card, from the bare canonical path, before the bundle loads', async () => {
    const { requested, replaced, prefetch } = await run(`/populacao/v/${R}/q/${ID}`);
    expect(requested).toEqual([BUCKET]);
    expect(replaced).toEqual([targetFor(LOOKUP[ID], 'pt')]);
    expect(replaced[0]).toBe('/pt/populacao/freguesia/010103/#vivem-sozinhas');
    // The request is left for the React resolver, which reads it instead of fetching again.
    expect(Object.keys(prefetch ?? {})).toEqual([BUCKET]);
  });

  it('follows the link’s locale, an upper-case id, a "v" before the release and a shortened id', async () => {
    expect((await run(`/en/populacao/v/${R}/q/${ID}/`)).replaced).toEqual(['/en/populacao/freguesia/010103/#vivem-sozinhas']);
    expect((await run(`/populacao/v/${R}/q/${ID}`, 'en')).replaced).toEqual(['/en/populacao/freguesia/010103/#vivem-sozinhas']);
    expect((await run(`/pt/populacao/v/v${R}/q/${ID.toUpperCase().replace('Q1_', 'q1_')}`)).replaced).toEqual(['/pt/populacao/freguesia/010103/#vivem-sozinhas']);
    expect((await run(`/pt/populacao/v/${R}/q/${ID.slice(0, 11)}`)).replaced).toEqual(['/pt/populacao/freguesia/010103/#vivem-sozinhas']);
    expect((await run(`/pt/populacao/v/${R}/q/q1_d00000000000000000aa`)).replaced).toEqual(['/pt/populacao/#idade']);
  });

  it('agrees with targetFor on every recipe it knows', async () => {
    for (const [id, entry] of Object.entries(LOOKUP)) {
      for (const locale of ['pt', 'en'] as const) {
        expect((await run(`/${locale}/populacao/v/${R}/q/${id}`, locale)).replaced, id).toEqual([targetFor(entry, locale)]);
      }
    }
  });

  it('leaves to the React resolver what it cannot place: another release, a bad, unknown or ambiguous id', async () => {
    const other = await run(`/pt/populacao/v/1.0.1/q/${ID}`);
    expect([...other.requested, ...other.replaced]).toEqual([]);
    expect((await run(`/pt/populacao/v/${R}/q/abc`)).requested).toEqual([]);
    expect((await run(`/pt/populacao/v/${R}/q/q1_ffffffffffffffffffff`)).replaced).toEqual([]);
    // Two ids start with this prefix: no guess.
    expect((await run(`/pt/populacao/v/${R}/q/q1_d1111111`)).replaced).toEqual([]);
    expect((await run('/pt/populacao/consulta/')).requested).toEqual([]);
    expect((await run(`/pt/populacao/v/${R}/q/${ID}`, 'pt', { [ID]: ['nonsense', 'age'] })).replaced).toEqual([]);
  });

  it('emits no backslash and no closing script tag into the HTML', () => {
    for (const locale of ['pt', 'en'] as const) {
      expect(consultaShellScript(locale)).not.toMatch(/\\|<\/script/i);
    }
  });
});
