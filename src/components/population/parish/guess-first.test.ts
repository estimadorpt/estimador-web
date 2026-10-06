import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The suite runs in node, with no layout engine, so the 390px measurement of
 * the guess slider (UXM3-06, A11Y3-03: 16px tall where h-11 asked for 44px)
 * lives in the round's Playwright check. This guards the cause: in the phone
 * layout the slider sits in a column flex box, where a bare `flex-1` (basis 0)
 * overrides its height.
 */
const source = readFileSync(path.join(import.meta.dirname, 'GuessFirst.tsx'), 'utf8');

describe('the parish guess slider', () => {
  const range = /type="range"[\s\S]*?className="([^"]+)"/.exec(source);

  it('keeps its 44px height in the phone column (no bare flex-1)', () => {
    expect(range, 'the range input').not.toBeNull();
    const classes = range![1].split(/\s+/);
    expect(classes).toContain('h-11');
    expect(classes).not.toContain('flex-1');
    expect(classes.some(name => name === 'flex-none' || name === 'shrink-0' || name === 'basis-auto')).toBe(true);
    // Side by side from sm, where the row's width is what flex-1 shares.
    expect(classes).toContain('sm:flex-1');
  });

  it('names the reader’s dots in the slider’s own words, with no article to agree ("50 em cada 100 pessoas", A11Y3-M3)', () => {
    expect(source).not.toMatch(/dos \$\{unit\}/);
    expect(source).toMatch(/preview: \(value: number, unit: string\) => `O teu palpite: \$\{value\} em cada 100 \$\{unit\}\.`/);
  });
});
