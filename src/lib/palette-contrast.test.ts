import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`no --color-${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const c = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * A11Y-05: the retuned red and emerald steps are used as text (losses,
 * "<1%" relegation cells, deltas, "live" labels), so each must read at
 * 4.5:1 on the grounds text sits on, its own pale tints included.
 */
describe('retuned ramps as text', () => {
  const grounds = ['paper', 'cream', 'red-50', 'emerald-50', 'stone-100'];
  for (const step of ['red-500', 'red-600', 'red-700', 'emerald-600', 'emerald-700', 'stone-400', 'stone-500']) {
    it(`${step} reaches 4.5:1`, () => {
      for (const ground of grounds) {
        expect(contrast(token(step), token(ground)), `${step} on ${ground}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  it('keeps each ramp ordered from light to dark', () => {
    for (const ramp of ['red', 'emerald']) {
      const steps = [500, 600, 700, 800].map(step => luminance(token(`${ramp}-${step}`)));
      for (let i = 1; i < steps.length; i += 1) expect(steps[i], `${ramp} ${i}`).toBeLessThan(steps[i - 1]);
    }
  });
});
