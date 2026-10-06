import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BRAND } from '@/lib/brand';
import { FURNITURE, STATUS } from './theme';

const css = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');

/** A custom property's hex value in globals.css (`--color-x` or a bare `--x`). */
function variable(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`no --${name}`);
  return match[1].toLowerCase();
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

const GROUNDS = ['color-paper', 'color-cream', 'color-parchment'];

/**
 * A11Y2-08: the green steps and aliases that colour text (gains, the model's
 * figures on /modelo, "success" states) read at 4.5:1 on every ground text
 * sits on. #4e8056 gave 4.16:1 on paper.
 */
describe('green text tokens', () => {
  for (const name of ['color-green-600', 'color-green-700', 'color-positive', 'color-tree', 'success', 'green-medium']) {
    it(`${name} reaches 4.5:1`, () => {
      for (const ground of GROUNDS) {
        expect(contrast(variable(name), variable(ground)), `${name} on ${ground}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  it('keeps the green ramp ordered from light to dark', () => {
    const steps = [500, 600, 700, 800].map(step => luminance(variable(`color-green-${step}`)));
    for (let i = 1; i < steps.length; i += 1) expect(steps[i], `green ${i}`).toBeLessThan(steps[i - 1]);
  });

  it('mirrors the retuned value in the brand constants used by SVG and canvas code', () => {
    expect(BRAND.tree.toLowerCase()).toBe(variable('color-tree'));
    expect(STATUS.good.toLowerCase()).toBe(variable('color-tree'));
  });
});

/** A11Y2-09: chart text (ticks, axis captions) is the muted step, never the faint one. */
describe('chart text', () => {
  it('uses a muted grey that reaches 4.5:1 on paper and cream', () => {
    for (const ground of [BRAND.paper, BRAND.cream]) {
      expect(contrast(FURNITURE.axis, ground)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the faint grey for strokes only: it fails as text', () => {
    expect(contrast(BRAND.faint, BRAND.paper)).toBeLessThan(4.5);
  });
});
