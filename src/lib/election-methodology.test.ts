import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { ELECTION_METHOD_ANCHORS, electionMethodHref, headingSlug, headingText } from './election-methodology';

const read = (relative: string) => readFileSync(path.join(process.cwd(), relative), 'utf8');

/** The h2 and h3 lines of an MDX file, as the page gives them ids (fenced code skipped). */
function headingSlugs(mdx: string): string[] {
  let fenced = false;
  const slugs: string[] = [];
  for (const line of mdx.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    const match = !fenced && /^#{2,3} (.+)$/.exec(line);
    if (match) slugs.push(headingSlug(match[1].replace(/\*\*/g, '')));
  }
  return slugs;
}

describe('methodology heading anchors (METH3-16)', () => {
  it('slugs a heading as the Liga methodology does', () => {
    expect(headingSlug('Método de Hondt e atribuição de mandatos')).toBe('metodo-de-hondt-e-atribuicao-de-mandatos');
    expect(headingSlug("D'Hondt method and seat allocation")).toBe('d-hondt-method-and-seat-allocation');
    expect(headingSlug('O que mostrou o teste interno?')).toBe('o-que-mostrou-o-teste-interno');
    expect(headingText(['Antes ', createElement('strong', null, 'depois')])).toBe('Antes depois');
  });

  for (const [locale, file] of [['pt', 'src/content/methodology/eleicoes/pt.mdx'], ['en', 'src/content/methodology/eleicoes/en.mdx']] as const) {
    it(`gives every ${locale} election heading its own id, and every chart link a target`, () => {
      const slugs = headingSlugs(read(file));
      expect(slugs.length).toBeGreaterThan(10);
      expect(new Set(slugs).size).toBe(slugs.length);
      // The section wrappers the archive pages and the /metodologia hub already link to.
      for (const id of ['legislativas', 'presidenciais', 'segunda-volta-2026']) expect(slugs).not.toContain(id);
      for (const anchors of Object.values(ELECTION_METHOD_ANCHORS)) expect(slugs).toContain(anchors[locale]);
    });
  }

  for (const file of ['src/content/economics-methodology/pt.mdx', 'src/content/economics-methodology/en.mdx']) {
    it(`gives every economy methodology heading its own id (${path.basename(file)})`, () => {
      const slugs = headingSlugs(read(file));
      expect(slugs.length).toBeGreaterThan(5);
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  }

  it('links a chart to its method in the reader’s language', () => {
    expect(electionMethodHref('houseEffects', 'pt')).toBe('/eleicoes/metodologia#efeitos-das-empresas-de-sondagens');
    expect(electionMethodHref('houseEffects', 'en')).toBe('/eleicoes/metodologia#pollster-house-effects');
  });
});
