import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_PATH } from '@/lib/config/population';
import { parishPrefetchScript } from './prefetch';

/** Runs the inline script against a fake address and fetch; returns the URLs it requested. */
function run(pathname: string): string[] {
  const requested: string[] = [];
  const window: { __populationPrefetch?: Record<string, unknown> } = {};
  const fetch = (url: string) => { requested.push(url); return Promise.resolve({ ok: true }); };
  new Function('window', 'location', 'fetch', parishPrefetchScript())(window, { pathname }, fetch);
  expect(Object.keys(window.__populationPrefetch ?? {})).toEqual(requested);
  return requested;
}

describe('the parish shell prefetch (UXM2V-01)', () => {
  it('starts meta.json and the parish file from the address, upper-casing the code', () => {
    expect(run('/pt/populacao/freguesia/0302fa/')).toEqual([`${POPULATION_DATA_PATH}/meta.json`, `${POPULATION_DATA_PATH}/parish/0302FA.json`]);
    expect(run('/en/populacao/freguesia/010103')).toEqual([`${POPULATION_DATA_PATH}/meta.json`, `${POPULATION_DATA_PATH}/parish/010103.json`]);
  });

  it('starts nothing for an address without a valid code', () => {
    expect(run('/pt/populacao/freguesia/_/')).toEqual([]);
    expect(run('/pt/populacao/freguesia/')).toEqual([]);
    expect(run('/pt/populacao/')).toEqual([]);
  });
});
