import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PLAYER_BAR_OPACITY, PLAYER_MARKS } from './player-marks';

const css = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`no --color-${name}`);
  return match[1].toLowerCase();
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** A colour drawn at `alpha` over a ground. */
function over(hex: string, alpha: number, ground: string): [number, number, number] {
  const a = rgb(hex);
  const g = rgb(ground);
  return [0, 1, 2].map(i => Math.round(a[i] * alpha + g[i] * (1 - alpha))) as [number, number, number];
}

const GROUNDS = ['paper', 'cream', 'parchment', 'stone-50'];

/** A11Y3-10: the marks that carry the estimate reach 3:1 for graphics. */
describe('player chart marks', () => {
  it('draws whiskers, caps and negative bars in the real stone-400 token', () => {
    expect(PLAYER_MARKS.whisker).toBe(token('stone-400'));
    expect(PLAYER_MARKS.barNegative).toBe(token('stone-400'));
    expect(PLAYER_MARKS.bar).toBe(token('stone-900'));
  });

  for (const key of ['whisker', 'barNegative', 'bar'] as const) {
    it(`${key} reaches 3:1 on every ground`, () => {
      for (const ground of GROUNDS) {
        expect(contrast(rgb(PLAYER_MARKS[key]), rgb(token(ground))), `${key} on ${ground}`).toBeGreaterThanOrEqual(3);
      }
    });
  }

  it('keeps 3:1 for the bars at the opacity the list draws them', () => {
    for (const key of ['bar', 'barNegative'] as const) {
      const drawn = over(PLAYER_MARKS[key], PLAYER_BAR_OPACITY, PLAYER_MARKS.track);
      expect(contrast(drawn, rgb(PLAYER_MARKS.track)), key).toBeGreaterThanOrEqual(3);
    }
  });

  it('no longer uses the faint grey that failed on paper', () => {
    for (const file of ['PlayerRatingList.tsx', 'PlayerProfile.tsx', 'PlayerSkillRanking.tsx']) {
      const src = fs.readFileSync(path.join(process.cwd(), 'src/components/charts/football', file), 'utf8');
      expect(src.toLowerCase(), file).not.toContain('#7f9284');
    }
  });
});
