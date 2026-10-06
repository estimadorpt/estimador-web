import { describe, expect, it } from 'vitest';
import { MINUS, formatSignedNumber, ordinal, withMinus } from './typography';

describe('withMinus', () => {
  it('turns a hyphen before a digit into U+2212', () => {
    expect(withMinus('-4')).toBe(`${MINUS}4`);
    expect(withMinus('DG: -4')).toBe(`DG: ${MINUS}4`);
    expect(withMinus('(-0,4 pp)')).toBe(`(${MINUS}0,4 pp)`);
  });

  it('leaves words, ranges and positive numbers alone', () => {
    expect(withMinus('pós-jogo')).toBe('pós-jogo');
    expect(withMinus('1-0')).toBe('1-0');
    expect(withMinus('+2,7')).toBe('+2,7');
  });
});

describe('formatSignedNumber', () => {
  it('signs both directions and leaves zero bare', () => {
    expect(formatSignedNumber(-4, 'pt')).toBe(`${MINUS}4`);
    expect(formatSignedNumber(3, 'pt')).toBe('+3');
    expect(formatSignedNumber(0, 'pt')).toBe('0');
  });

  it('uses the page locale for decimals', () => {
    expect(formatSignedNumber(-0.44, 'pt', 1)).toBe(`${MINUS}0,4`);
    expect(formatSignedNumber(2.66, 'en', 1)).toBe('+2.7');
  });

  it('never emits an ASCII hyphen-minus', () => {
    for (const value of [-1, -12.5, -1234.5]) {
      expect(formatSignedNumber(value, 'pt', 1)).not.toContain('-');
      expect(formatSignedNumber(value, 'en', 1)).not.toContain('-');
    }
  });

  it('prints a dash for a missing value, never zero', () => {
    expect(formatSignedNumber(Number.NaN, 'pt')).toBe('—');
  });
});

describe('ordinal', () => {
  it('writes the Portuguese abbreviation point', () => {
    expect(ordinal(5, 'pt')).toBe('5.º');
    expect(ordinal(1, 'pt', 'f')).toBe('1.ª');
    expect(ordinal(17, 'pt')).not.toMatch(/\dº/);
  });

  it('writes English suffixes, teens included', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map(n => ordinal(n, 'en'))).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '101st',
    ]);
  });
});
