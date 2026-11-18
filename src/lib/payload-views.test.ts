import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Next serialises every server-rendered tree into each page's RSC payload,
 * twice (the .txt and the copy inlined in the HTML), and each page carries
 * its own footer plus both not-found boundaries in both languages. Drawn by
 * server components, the logo's outlined paths, five footers and four 404
 * bodies were about 70 KB of every payload: 62 MB of a 200 MB export
 * (November 2026, against a 220 MB budget). As client components with no
 * state they travel as a reference and a few strings.
 */
const CLIENT_VIEWS = [
  'src/components/Logo.tsx',
  'src/components/SiteFooterView.tsx',
  'src/components/NotFoundBodyView.tsx',
  'src/components/NotFoundHeaderView.tsx',
];

const read = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8');

describe('the chrome every page repeats travels as client views', () => {
  it.each(CLIENT_VIEWS)('%s is a client component', file => {
    expect(read(file).trimStart().startsWith("'use client'")).toBe(true);
  });

  it('keeps the wordmark paths out of server components', () => {
    // The server halves pass strings; only the views import the logo.
    for (const file of ['src/components/SiteFooter.tsx', 'src/components/NotFoundBody.tsx']) {
      const source = read(file);
      expect(source, file).not.toMatch(/from '\.\/Logo'|brand\/wordmark/);
      expect(source, file).not.toContain('<footer');
      expect(source, file).not.toContain('<main');
    }
  });
});
