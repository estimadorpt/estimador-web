import { describe, expect, it } from 'vitest';
import {
  describePp,
  formatDateSpan,
  formatDecimal,
  formatInteger,
  formatKickoff,
  formatKickoffShort,
  formatLongDate,
  formatPercent,
  formatPp,
  formatProbability,
  formatShortDate,
  formatSigned,
  matchLabel,
  MINUS,
} from './football-format';

// Group separators are no-break spaces; compare on plain spaces.
const plain = (s: string) => s.replace(/[  ]/g, ' ');

describe('football number formats', () => {
  it('uses pt-PT on Portuguese pages and en-GB on English ones', () => {
    expect(formatDecimal(81.1, 'pt')).toBe('81,1');
    expect(formatDecimal(81.1, 'en')).toBe('81.1');
    expect(plain(formatInteger(50000, 'pt'))).toBe('50 000');
    expect(formatInteger(50000, 'en')).toBe('50,000');
    expect(formatSigned(2.7, 'en')).toBe('+2.7');
    expect(formatSigned(0, 'pt')).toBe('0,0');
  });

  it('groups four-digit counts the way the population pages do', () => {
    expect(formatInteger(4942, 'pt')).toBe('4 942');
    expect(formatInteger(4942, 'en')).toBe('4,942');
    expect(formatInteger(810, 'pt')).toBe('810');
  });

  it('writes negative numbers with the minus sign, never a hyphen', () => {
    expect(formatSigned(-2.7, 'pt')).toBe(`${MINUS}2,7`);
    expect(formatSigned(-3, 'en', 0)).toBe(`${MINUS}3`);
    expect(formatInteger(-12, 'pt')).toBe(`${MINUS}12`);
  });

  it('has one percentage rule: whole from 10%, one decimal below, guards at both ends', () => {
    expect(formatPercent(0.5149, 'pt')).toBe('51%');
    expect(formatPercent(0.3878, 'pt')).toBe('39%');
    expect(formatPercent(0.0839, 'pt')).toBe('8,4%');
    expect(formatPercent(0.0839, 'en')).toBe('8.4%');
    expect(formatPercent(0.0997, 'pt')).toBe('10%');
    expect(formatPercent(0.0024, 'pt')).toBe('0,2%');
    expect(formatPercent(0.0001, 'pt')).toBe('<0,1%');
    expect(formatPercent(0, 'pt')).toBe('0%');
    expect(formatPercent(0.9973, 'en')).toBe('>99%');
    expect(formatPercent(0.9978, 'pt')).toBe('>99%');
    expect(formatPercent(1, 'en')).toBe('100%');
    expect(formatProbability(0.0839, 'pt')).toBe(formatPercent(0.0839, 'pt'));
  });

  it('formats percentage-point changes with the same digits rule and U+2212', () => {
    expect(formatPp(0.257, 'pt')).toBe('+26 pp');
    expect(formatPp(-0.014, 'pt')).toBe(`${MINUS}1,4 pp`);
    expect(formatPp(0.0002, 'en')).toBe('0 pp');
  });

  it('says a delta in words for screen readers', () => {
    expect(describePp(0.26, 'pt', 'face à jornada anterior')).toBe('subiu 26 pontos percentuais face à jornada anterior');
    expect(describePp(-0.014, 'en')).toBe('down 1.4 percentage points');
    expect(describePp(0, 'pt')).toBe('sem alteração');
  });

  it('separates the two clubs of a fixture the same way everywhere', () => {
    expect(matchLabel('Benfica', 'Vitória')).toBe('Benfica – Vitória');
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

  it('prints a short kickoff for cards, in Lisbon time', () => {
    expect(formatKickoffShort('2026-10-09T17:45:00Z', 'pt')).toBe('sex. 9 out. · 18:45');
    expect(formatKickoffShort('2026-10-09T17:45:00Z', 'en')).toBe('Fri 9 Oct · 18:45');
    expect(formatKickoffShort('2026-10-09T23:30:00Z', 'pt', { confirmed: false })).toBe('sáb. 10 out.');
    expect(formatShortDate('2026-09-25T14:50:48+00:00', 'pt')).toBe('25 set.');
    expect(formatShortDate('2026-09-25T14:50:48+00:00', 'en')).toBe('25 Sept');
  });

  it('prints the span of a round', () => {
    const md8 = ['2026-10-12T19:15:00Z', '2026-10-09T17:45:00Z', '2026-10-10T14:30:00Z'];
    expect(formatDateSpan(md8, 'pt')).toBe('9 a 12 de outubro');
    expect(formatDateSpan(md8, 'pt', { short: true })).toBe('9–12 out.');
    expect(formatDateSpan(md8, 'en')).toBe('9–12 October');
    expect(formatDateSpan(['2026-09-30T19:00:00Z', '2026-10-02T19:00:00Z'], 'pt')).toBe('30 de setembro a 2 de outubro');
    expect(formatDateSpan(['2026-10-09T17:45:00Z'], 'pt')).toBe('9 de outubro');
    expect(formatDateSpan([], 'pt')).toBe('');
  });
});
