import { describe, expect, it } from 'vitest';
import { columnAlignments, isFigureColumn } from './table-align';

describe('table twin alignment (UXD3-08)', () => {
  it('reads percentages, signed changes, counts and ordinals as figures', () => {
    const rows = [
      ['Porto', '51%', '+26 pp', '1 236', '1.º', 0.23],
      ['Sporting', '<0,1%', '−7,2 pp', '—', '12.º', 4],
      ['Benfica', '>99%', '0 pp', '12', '3.º', 1],
    ];
    expect([1, 2, 3, 4, 5].map(j => isFigureColumn(rows, j))).toEqual([true, true, true, true, true]);
  });

  it('reads the election bounds as figures ("menos de 1%", "over 99%")', () => {
    expect(isFigureColumn([['PS', 'menos de 1%'], ['AD', '51%'], ['CH', 'mais de 99%']], 1)).toBe(true);
    expect(isFigureColumn([['PS', 'under 1%'], ['AD', 'over 99%']], 1)).toBe(true);
    // A word after the bound is still a word.
    expect(isFigureColumn([['PS', 'menos de metade']], 1)).toBe(false);
  });

  it('keeps words, dates and labels with digits on the left', () => {
    const rows = [
      ['J2', 'Porto', '14 ago.', 'J2 · 14 ago.', 'Homens'],
      ['J3', 'Sporting', '21 ago.', 'J3 · 21 ago.', 'Mulheres'],
    ];
    expect([0, 1, 2, 3, 4].map(j => isFigureColumn(rows, j))).toEqual([false, false, false, false, false]);
    // A column with nothing but missing values says nothing: left.
    expect(isFigureColumn([['a', '—'], ['b', '—']], 1)).toBe(false);
  });

  it('keeps the label column left and lets the caller override a column', () => {
    const rows = [['0–4', 'Homens', '3,9%'], ['5–9', 'Mulheres', '4,1%']];
    expect(columnAlignments(3, rows)).toEqual(['left', 'left', 'right']);
    expect(columnAlignments(3, rows, [undefined, undefined, 'left'])).toEqual(['left', 'left', 'left']);
  });
});
