import { describe, expect, it } from 'vitest';
import {
  credibleIntervalLabel,
  estimateHorizonLabel,
  formatElectionDate,
  formatElectionPercent,
  voteShareScopeLabel,
} from './election-display';

describe('election display', () => {
  it('names intervals from the supplied quantiles', () => {
    expect(credibleIntervalLabel(.25, .75, 'pt')).toBe('Intervalo de credibilidade de 50% (P25–P75)');
    expect(credibleIntervalLabel(.05, .95, 'en')).toBe('90% credible interval (P5–P95)');
  });
  it('names fractional quantiles (e.g. a 95% interval published as ci_lower/ci_upper)', () => {
    expect(credibleIntervalLabel(.025, .975, 'pt')).toBe('Intervalo de credibilidade de 95% (P2.5–P97.5)');
    expect(credibleIntervalLabel(.025, .975, 'en')).toBe('95% credible interval (P2.5–P97.5)');
  });
  it('uses the visitor locale for election values', () => {
    expect(formatElectionPercent(.1234, 'pt')).toBe('12,3%');
    expect(formatElectionPercent(.1234, 'en')).toBe('12.3%');
    expect(formatElectionDate('2026-01-18', 'pt')).toMatch(/18/);
  });
  it('states the vote-share denominator instead of leaving two numbers to disagree silently', () => {
    expect(voteShareScopeLabel('validVotes', 'pt')).toBe('dos votos válidos');
    expect(voteShareScopeLabel('allBallots', 'pt')).toBe('incluindo brancos e nulos');
    expect(voteShareScopeLabel('validVotes', 'en')).toBe('of valid votes');
    expect(voteShareScopeLabel('allBallots', 'en')).toBe('including blank and void ballots');
  });
  it('states the estimate horizon so a snapshot is never confused with an election-day forecast', () => {
    expect(estimateHorizonLabel('current', 'pt')).toBe('estimativa atual');
    expect(estimateHorizonLabel('electionDay', 'pt')).toBe('previsão para o dia da eleição');
    expect(estimateHorizonLabel('current', 'en')).toBe('current estimate');
    expect(estimateHorizonLabel('electionDay', 'en')).toBe('forecast for election day');
  });
});
