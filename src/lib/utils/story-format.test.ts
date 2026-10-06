import { describe, expect, it } from 'vitest';
import { MINUS } from '@/lib/typography';
import { fmtSignedPctLoc, fmtSignedPpLoc } from './story-format';

describe('story-format signed helpers', () => {
  it('print negatives with the minus sign U+2212, never the hyphen-minus', () => {
    expect(fmtSignedPctLoc(-0.4, 'pt')).toBe(`${MINUS}0,4%`);
    expect(fmtSignedPctLoc(-0.4, 'en')).toBe(`${MINUS}0.4%`);
    expect(fmtSignedPpLoc(-0.1, 'pt')).toBe(`${MINUS}0,10 p.p.`);
    expect(fmtSignedPpLoc(-0.1, 'en')).toBe(`${MINUS}0.10 pp`);
    for (const text of [fmtSignedPctLoc(-12.5, 'pt'), fmtSignedPpLoc(-3, 'en')]) {
      expect(text).not.toContain('-');
    }
  });

  it('keep the plus sign on positives and the dash for a missing value', () => {
    expect(fmtSignedPctLoc(6.1, 'pt')).toBe('+6,1%');
    expect(fmtSignedPpLoc(0.1, 'en')).toBe('+0.10 pp');
    expect(fmtSignedPctLoc(null, 'pt')).toBe('—');
    expect(fmtSignedPpLoc(Number.NaN, 'en')).toBe('—');
  });
});
