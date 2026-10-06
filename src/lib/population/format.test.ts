import { describe, expect, it } from 'vitest';
import { formatCount } from './format';

const NBSP = String.fromCharCode(0xa0);

describe('formatCount', () => {
  it('groups from the thousands up, four digits included, in both locales', () => {
    expect(formatCount(1234, 'pt')).toBe(`1${NBSP}234`);
    expect(formatCount(10340441, 'pt')).toBe(`10${NBSP}340${NBSP}441`);
    expect(formatCount(987, 'pt')).toBe('987');
    expect(formatCount(1234, 'en')).toBe('1,234');
    expect(formatCount(0, 'en')).toBe('0');
  });

  it('writes the same separator as Intl’s pt-PT grouping', () => {
    const intl = new Intl.NumberFormat('pt-PT', { useGrouping: 'always' }).format(12345);
    expect(formatCount(12345, 'pt')).toBe(intl);
  });
});
