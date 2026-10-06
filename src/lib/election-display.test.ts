import { describe, expect, it } from 'vitest';
import {
  credibleIntervalLabel,
  electionProbabilityParts,
  formatElectionDate,
  formatElectionDayMonth,
  formatElectionLongDate,
  formatElectionNumber,
  formatElectionPercent,
  formatElectionPoints,
  formatElectionProbability,
  formatElectionRange,
  pollsterDisplayName,
  voteShareScopeLabel,
} from './election-display';

describe('election display', () => {
  it('names intervals from the supplied quantiles', () => {
    expect(credibleIntervalLabel(.25, .75, 'pt')).toBe('Intervalo de credibilidade de 50% (P25–P75)');
    expect(credibleIntervalLabel(.05, .95, 'en')).toBe('90% credible interval (P5–P95)');
  });
  it('names fractional quantiles (e.g. a 95% interval published as ci_lower/ci_upper)', () => {
    expect(credibleIntervalLabel(.025, .975, 'pt')).toBe('Intervalo de credibilidade de 95% (P2,5–P97,5)');
    expect(credibleIntervalLabel(.025, .975, 'en')).toBe('95% credible interval (P2.5–P97.5)');
  });
  it('uses the visitor locale for election values', () => {
    expect(formatElectionPercent(.1234, 'pt')).toBe('12,3%');
    expect(formatElectionPercent(.1234, 'en')).toBe('12.3%');
    expect(formatElectionDate('2026-01-18', 'pt')).toMatch(/18/);
    expect(formatElectionNumber(9000, 'pt')).toBe('9000');
    expect(formatElectionNumber(9000, 'en')).toBe('9,000');
  });
  it('reads a date as written, whatever the server time zone', () => {
    expect(formatElectionLongDate('2026-01-16', 'pt')).toBe('16 de janeiro de 2026');
    expect(formatElectionLongDate('2026-01-16T21:21:29.753922', 'en')).toBe('16 January 2026');
    expect(formatElectionLongDate('2026-02-06T00:30:00', 'pt')).toBe('6 de fevereiro de 2026');
    expect(formatElectionDayMonth('2026-01-15', 'pt')).toBe('15 de janeiro');
  });
  it('never prints certainty a few thousand simulations cannot support', () => {
    expect(formatElectionProbability(1, 'pt')).toBe('>99%');
    expect(formatElectionProbability(0, 'en')).toBe('<1%');
    expect(formatElectionProbability(0.00012, 'pt')).toBe('<1%');
    expect(formatElectionProbability(0.4477, 'pt')).toBe('45%');
  });
  it('states the vote-share denominator instead of leaving two numbers to disagree silently', () => {
    expect(voteShareScopeLabel('validVotes', 'pt')).toBe('dos votos válidos');
    expect(voteShareScopeLabel('allBallots', 'pt')).toBe('incluindo brancos e nulos');
    expect(voteShareScopeLabel('validVotes', 'en')).toBe('of valid votes');
    expect(voteShareScopeLabel('allBallots', 'en')).toBe('including blank and void ballots');
  });
  it('sets the bound of a headline probability in words, not as a chevron', () => {
    expect(electionProbabilityParts(1, 'pt')).toEqual({ bound: 'mais de', value: '99%' });
    expect(electionProbabilityParts(0.001, 'en')).toEqual({ bound: 'under', value: '1%' });
    expect(electionProbabilityParts(0.4328, 'pt')).toEqual({ bound: null, value: '43%' });
  });
  it('prints an interval as a range and a gap in percentage points', () => {
    expect(formatElectionRange(0.1965, 0.2338, 'pt')).toBe('19,7%–23,4%');
    expect(formatElectionPoints(0.296 - 0.266, 'pt')).toBe('3,0 p.p.');
    expect(formatElectionPoints(0.03, 'en')).toBe('3.0 pp');
  });
  it('writes one firm one way on both archives', () => {
    expect(pollsterDisplayName('Pitagorica')).toBe('Pitagórica');
    expect(pollsterDisplayName('ICS')).toBe('ICS/ISCTE');
    expect(pollsterDisplayName('Intercampus')).toBe('Intercampus');
  });
});
