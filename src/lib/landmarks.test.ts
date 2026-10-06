import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * One <main id="main-content"> per page, and it holds the hero: the skip link
 * in the header targets #main-content, and a hero outside the landmark is
 * skipped by "skip to content" and missed by landmark navigation.
 */
const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'src/app/[locale]');
const OPEN = '<main id="main-content" tabIndex={-1}';

function walk(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (/\.tsx$/.test(name) && !/\.test\./.test(name)) found.push(full);
  }
  return found;
}

/** Components that render the page's main themselves. */
const MAIN_OWNERS = ['ParishPage', 'Miniature', 'NotFoundBody', 'NotFoundByLocale'];

/** Each render branch opens one main, closes it, and never shows a hero outside it. */
function expectHeroInsideMain(file: string, text: string) {
  let open = 0;
  for (const token of text.matchAll(/<main id="main-content"|<\/main>|<PageHero\b/g)) {
    if (token[0] === '</main>') open -= 1;
    else if (token[0] === '<PageHero') expect(open, `${file}: PageHero outside <main>`).toBe(1);
    else {
      open += 1;
      expect(open, `${file}: nested <main>`).toBe(1);
    }
  }
  expect(open, `${file}: unclosed <main>`).toBe(0);
}

describe('main landmark', () => {
  const sources = walk(path.join(ROOT, 'src')).map(file => ({ file: path.relative(ROOT, file), text: readFileSync(file, 'utf8') }));

  it('is always the skip-link target, never an unnamed <main>', () => {
    for (const { file, text } of sources) {
      for (const match of text.matchAll(/<main\b[^>]*>/g)) {
        expect(match[0], file).toContain(OPEN.slice(0, -1));
      }
    }
    expect(readFileSync(path.join(ROOT, 'src/components/Header.tsx'), 'utf8')).toContain('href="#main-content"');
  });

  it('exists on every page, opens once per render branch and contains the hero', () => {
    const pages = walk(PAGES_DIR).filter(file => /\/(page|not-found)\.tsx$/.test(file));
    expect(pages.length).toBeGreaterThan(30);
    for (const page of pages) {
      const file = path.relative(ROOT, page);
      const text = readFileSync(page, 'utf8');
      if (!text.includes(OPEN)) {
        expect(MAIN_OWNERS.some(owner => text.includes(`<${owner}`)), `${file} renders no main landmark`).toBe(true);
        continue;
      }
      expectHeroInsideMain(file, text);
    }
    // The components that own a page's main follow the same rule.
    for (const { file, text } of sources.filter(source => source.file.startsWith('src/components/') && source.text.includes(OPEN))) {
      expectHeroInsideMain(file, text);
    }
  });
});
