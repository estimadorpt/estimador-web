import { describe, expect, it } from 'vitest';
import { BRAND } from '@/lib/brand';
import {
  COLORS,
  fmtSignedInt,
  fmtSignedNum,
  fmtSignedPct,
  fmtSignedPctValue,
  fmtSignedPp,
  fmtSignedPpValue,
  verdictColor,
} from './economy-format';

const MINUS = '−';

// Audit FA2-17 / UXD2-24: negatives carry U+2212, never the hyphen-minus.
describe('signed economy figures', () => {
  it('writes a negative with the minus sign', () => {
    expect(fmtSignedPct(-0.004)).toBe(`${MINUS}0.40%`);
    expect(fmtSignedPp(-0.00037)).toBe(`${MINUS}0.04pp`);
    expect(fmtSignedPctValue(-1.648)).toBe(`${MINUS}1.6%`);
    expect(fmtSignedNum(-0.4838)).toBe(`${MINUS}0.48`);
    expect(fmtSignedPpValue(-0.536, 1, 'pt')).toBe(`${MINUS}0,5pp`);
    expect(fmtSignedInt(-5727, 'en')).toBe(`${MINUS}5,727`);
  });

  it('keeps the plus sign on gains and leaves no hyphen anywhere', () => {
    expect(fmtSignedPct(0.004)).toBe('+0.40%');
    expect(fmtSignedPctValue(1.648)).toBe('+1.6%');
    expect(fmtSignedInt(5727, 'en')).toBe('+5,727');
    for (const text of [fmtSignedPct(-0.1), fmtSignedPp(-0.2), fmtSignedNum(-3), fmtSignedPpValue(-2), fmtSignedInt(-40, 'pt')]) {
      expect(text).not.toContain('-');
    }
  });

  it('signs an integer by its rounded value', () => {
    expect(fmtSignedInt(-0.3, 'pt')).toBe('+0');
  });

  it('answers missing values with a dash', () => {
    expect(fmtSignedPct(null)).toBe('—');
    expect(fmtSignedInt(undefined, 'pt')).toBe('—');
  });
});

describe('economy palette', () => {
  it('uses the text-strength green token for a strong verdict (A11Y2-08)', () => {
    expect(COLORS.emerald).toBe(BRAND.tree);
    expect(verdictColor('strong')).toBe(BRAND.tree);
  });
});
