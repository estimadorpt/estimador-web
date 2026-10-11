import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { headingSlug } from './election-methodology';
import { TITLE_CALIBRATION } from './football-model-evaluation';

/**
 * The Liga methodology's h2s are statements, and their slugs are the anchors
 * the hub, the player pages, the simulator, the club and match pages link to
 * ("/desporto/liga/metodologia#como-medimos-os-jogadores"). Renaming a
 * heading must move every link with it.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const mdx = (locale: 'pt' | 'en') =>
  readFileSync(path.join(ROOT, 'src/content/football-methodology', `${locale}.mdx`), 'utf8');
const headings = (locale: 'pt' | 'en') =>
  [...mdx(locale).matchAll(/^## (.+)$/gm)].map(m => m[1].trim());

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(tsx?|mdx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

describe('Liga methodology anchors', () => {
  const slugs = new Set([...headings('pt'), ...headings('en')].map(headingSlug));

  it('has no question headlines', () => {
    for (const h of [...headings('pt'), ...headings('en')]) expect(h).not.toMatch(/\?$/);
  });

  it('every link into the methodology lands on a heading', () => {
    const links: Array<{ file: string; slug: string }> = [];
    for (const file of sourceFiles(path.join(ROOT, 'src'))) {
      for (const m of readFileSync(file, 'utf8').matchAll(/\/desporto\/liga\/metodologia\/?#([a-z0-9-]+)/g)) {
        links.push({ file: path.relative(ROOT, file), slug: m[1] });
      }
    }
    expect(links.length).toBeGreaterThan(10);
    for (const { file, slug } of links) expect(slugs.has(slug), `${file} → #${slug}`).toBe(true);
  });

  it('states the title-calibration finding the dated assessment supports', () => {
    // The heading says leaders win more often than the model gives them.
    expect(headings('pt')).toContain('Quem lidera ganha o título mais vezes do que o modelo diz');
    expect(headings('en')).toContain('Leaders win the title more often than the model says');
    expect(TITLE_CALIBRATION.leadersWonClean).toBeGreaterThan(TITLE_CALIBRATION.modelMeanClean);
  });
});
