import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import pt from '../../../messages/pt.json';
import en from '../../../messages/en.json';
import { CLIENT_MESSAGE_KEYS, pickMessages } from './client-messages';
import { clientMessageKeys, messageKeysOf } from './client-messages-analysis';

const APP = path.join(process.cwd(), 'src/app/[locale]');

function routeEntries(): string[] {
  const found: string[] = [];
  const walk = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/^(page|layout|not-found)\.(tsx|ts|jsx|js)$/.test(entry.name)) found.push(full);
    }
  };
  walk(APP);
  return found.sort();
}

const covered = (key: string) => CLIENT_MESSAGE_KEYS.some(listed => key === listed || key.startsWith(`${listed}.`));

describe('client message payload', () => {
  it('lists every key a client component under any route reads', () => {
    const missing: string[] = [];
    for (const entry of routeEntries()) {
      for (const [key, users] of clientMessageKeys(entry)) {
        if (!covered(key)) missing.push(`${key} (read by ${users.join(', ')}; route ${path.relative(APP, entry)})`);
      }
    }
    // Add the key to CLIENT_MESSAGE_KEYS in src/lib/i18n/client-messages.ts.
    expect(missing).toEqual([]);
  });

  it('names only keys that exist, in both locales', () => {
    for (const catalogue of [pt, en]) {
      const picked = pickMessages(catalogue, CLIENT_MESSAGE_KEYS);
      for (const key of CLIENT_MESSAGE_KEYS) {
        const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], picked);
        expect(value, key).toBeDefined();
      }
    }
  });

  it('keeps the payload small and the dormant economy figures out of it', () => {
    const full = JSON.stringify(pt).length;
    const picked = JSON.stringify(pickMessages(pt, CLIENT_MESSAGE_KEYS));
    expect(picked.length).toBeLessThan(full / 5);
    // EC-M1: the July prototype's model figures sit in economics.* strings.
    for (const figure of ['Brier', 'pinball', '0,69', 'recessões']) expect(picked).not.toContain(figure);
    expect(Object.keys(JSON.parse(picked))).not.toContain('football');
  });

  it('picks nested paths without the rest of their namespace', () => {
    const messages = { a: { b: 'x', c: 'y', d: { e: 'z' } }, f: 'w' };
    expect(pickMessages(messages, ['a.b', 'a.d.e', 'missing.key'])).toEqual({ a: { b: 'x', d: { e: 'z' } } });
    expect(pickMessages(messages, ['a'])).toEqual({ a: messages.a });
  });

  it('reads literal, namespaced and computed keys', () => {
    const header = path.join(process.cwd(), 'src/components/Header.tsx');
    expect(messageKeysOf(header)).toEqual(expect.arrayContaining(['nav.home', 'nav.economicsPreparing', 'elections.navPresidential']));
  });
});
