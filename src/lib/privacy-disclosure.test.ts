import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLUB_PREFERENCE_KEY } from '@/components/football/club-preference';
import { GAME_STORAGE_KEY } from '@/lib/population/game';
import { CREDENTIALS_KEY } from '@/lib/utils/prediction-game-api';
import { STORAGE_KEY } from '@/lib/utils/prediction-game';

/**
 * /privacidade lists every key the site writes to localStorage. These tests
 * hold that list to the code: a new key, or a renamed one, fails here until
 * the privacy page says so in both languages.
 */
const ROOT = process.cwd();
const privacy = ['pt', 'en'].map(locale => ({
  locale,
  text: readFileSync(path.join(ROOT, 'src/content/privacy', `${locale}.mdx`), 'utf8'),
}));

/** Keys the code names through exported constants. */
const KNOWN_KEYS = [CLUB_PREFERENCE_KEY, GAME_STORAGE_KEY, CREDENTIALS_KEY, STORAGE_KEY, 'liga-team-hint-seen'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

describe('privacy page: browser storage', () => {
  it.each(privacy)('lists every known localStorage key ($locale)', ({ text }) => {
    for (const key of KNOWN_KEYS) expect(text).toContain(`\`${key}\``);
  });

  it('knows every key written with a literal name', () => {
    const literal = /localStorage\.setItem\(\s*(['"`])([^'"`$]+)\1/g;
    const written = new Set<string>();
    for (const file of sourceFiles(path.join(ROOT, 'src'))) {
      for (const match of readFileSync(file, 'utf8').matchAll(literal)) written.add(match[2]);
    }
    for (const key of written) expect(KNOWN_KEYS).toContain(key);
  });

  it.each(privacy)('names no third-party font host ($locale)', ({ text }) => {
    expect(text).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
  });
});

describe('fonts are self-hosted', () => {
  it('globals.css imports nothing from a font CDN', () => {
    const css = readFileSync(path.join(ROOT, 'src/app/globals.css'), 'utf8');
    expect(css).not.toMatch(/fonts\.googleapis|fonts\.gstatic|@import\s+url\(\s*['"]?https?:/);
  });
});
