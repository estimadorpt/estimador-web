import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findUnused, leafPaths, unusedMessageKeys } from '../../scripts/lib/unused-messages.mjs';

const read = (locale: string) => JSON.parse(readFileSync(path.join(process.cwd(), `messages/${locale}.json`), 'utf8'));

/**
 * The whole catalogue reaches every page, so a key nothing reads is weight on
 * every view and copy a translator keeps for nobody. Delete it, in both
 * locales, rather than letting the list grow back (HC-16).
 */
describe('message catalogue', () => {
  it('has the same keys in pt and en', () => {
    expect(leafPaths(read('en')).sort()).toEqual(leafPaths(read('pt')).sort());
  });

  it('has no key that nothing reads', () => {
    expect(unusedMessageKeys()).toEqual([]);
  });

  it('counts the ways a key is read', () => {
    const keys = ['a.full', 'ns.leaf', 'ns.dyn.x', 'ns.raw.y', 'ns.dead'];
    expect(findUnused(keys, [
      "t('a.full')",
      "useTranslations('ns'); t('leaf')",
      't(`ns.dyn.${id}`)',
      "t.raw('ns.raw')",
    ])).toEqual(['ns.dead']);
  });
});
