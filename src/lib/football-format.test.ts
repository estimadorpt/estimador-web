import { describe, expect, it } from 'vitest';
import {
  formatDecimal,
  formatInteger,
  formatKickoff,
  formatLongDate,
  formatProbability,
  formatSigned,
} from './football-format';

// Intl inserts narrow no-break spaces as group separators; compare on plain spaces.
const plain = (s: string) => s.replace(/[  ]/g, ' ');

describe('football number formats', () => {
  it('uses pt-PT on Portuguese pages and en-GB on English ones', () => {
    expect(formatDecimal(81.1, 'pt')).toBe('81,1');
    expect(formatDecimal(81.1, 'en')).toBe('81.1');
    expect(plain(formatInteger(50000, 'pt'))).toBe('50 000');
    expect(formatInteger(50000, 'en')).toBe('50,000');
    expect(formatSigned(-2.7, 'pt')).toBe('-2,7');
    expect(formatSigned(2.7, 'en')).toBe('+2.7');
    expect(formatSigned(0, 'pt')).toBe('0,0');
  });

  it('rounds probabilities plainly, with <1% and >99% guards', () => {
    expect(formatProbability(0.5149, 'pt')).toBe('51%');
    expect(formatProbability(0.3878, 'pt')).toBe('39%');
    expect(formatProbability(0.0293, 'pt')).toBe('3%');
    expect(formatProbability(0.0024, 'pt')).toBe('<1%');
    expect(formatProbability(0, 'pt')).toBe('0%');
    expect(formatProbability(0.9973, 'en')).toBe('>99%');
    expect(formatProbability(1, 'en')).toBe('100%');
  });
});

describe('football date formats', () => {
  it('reads timestamps in Lisbon and prints bare dates as written', () => {
    expect(formatLongDate('2026-09-25T14:50:48.445152+00:00', 'pt')).toBe('25 de setembro de 2026');
    expect(formatLongDate('2026-09-25T14:50:48+00:00', 'en')).toBe('25 September 2026');
    // 23:30Z on 9 October is 00:30 on the 10th in Lisbon (summer time).
    expect(formatLongDate('2026-10-09T23:30:00Z', 'pt', { year: false })).toBe('10 de outubro');
    expect(formatLongDate('2026-10-05', 'pt')).toBe('5 de outubro de 2026');
    expect(formatLongDate(null, 'pt')).toBe('');
  });

  it('prints a kickoff in Lisbon time', () => {
    expect(formatKickoff('2026-10-09T17:45:00Z', 'pt')).toBe('sexta-feira, 9 de outubro às 18:45');
    expect(formatKickoff('2026-12-20T20:30:00Z', 'en')).toBe('Sunday 20 December at 20:30');
  });
});
