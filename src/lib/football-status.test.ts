import { describe, expect, it } from 'vitest';
import {
  clockValue,
  forecastAsOf,
  forecastStatusLine,
  kickoffSteps,
  matchPlayedAt,
  matchPlayedLine,
  nextRoundTiming,
} from './football-status';

const md8 = ['2026-10-09T17:45:00Z', '2026-10-11T17:00:00Z', '2026-10-12T19:15:00Z'];

describe('forecast status line (audit CL-11, CL-M4)', () => {
  it('says which matchday the forecast follows, when it was updated and when the next one comes', () => {
    const input = { matchday: 7, timestamp: '2026-09-25T14:50:48+00:00', inProgress: false, nextRound: 8, nextRoundKickoffs: md8 };
    expect(forecastStatusLine(input, 'pt')).toBe(
      'Depois da jornada 7 · atualizado a 25 set. · próxima atualização após a jornada 8 (9–12 out.)',
    );
    expect(forecastStatusLine(input, 'en')).toBe('After matchday 7 · updated 25 Sept · next update after matchday 8 (9–12 Oct)');
  });

  it('drops the span when no kickoff is known, and says when the season is over', () => {
    expect(
      forecastStatusLine({ matchday: 7, timestamp: '2026-09-25T14:50:48+00:00', inProgress: true, nextRound: 7, nextRoundKickoffs: [] }, 'pt'),
    ).toBe('Durante a jornada 7 · atualizado a 25 set. · próxima atualização após a jornada 7');
    expect(
      forecastStatusLine({ matchday: 34, timestamp: '2027-05-20T10:00:00Z', inProgress: false, nextRound: null, nextRoundKickoffs: [] }, 'pt'),
    ).toBe('Depois da jornada 34 · atualizado a 20 mai. · época terminada');
  });
});

describe('one game and the round it belongs to (audit FR3-01, FR3-02, FR3-04)', () => {
  const ts = '2026-09-25T14:50:48+00:00';

  it('counts a game as played two hours after its kickoff, and says so', () => {
    expect(matchPlayedAt('2026-10-09T17:45:00Z')).toBe('2026-10-09T19:45:00.000Z');
    expect(matchPlayedAt(null)).toBeNull();
    expect(matchPlayedLine(ts, 'pt')).toBe('Jogo disputado · previsão de 25 set.');
    expect(matchPlayedLine(ts, 'en')).toBe('Played · forecast of 25 Sept');
  });

  it('steps from "started" to "played", and not at all for a placeholder kickoff', () => {
    const steps = kickoffSteps('2026-10-09T17:45:00Z', true, 'started', 'played');
    expect(clockValue('before', steps, Date.parse('2026-10-09T17:00:00Z'))).toBe('before');
    expect(clockValue('before', steps, Date.parse('2026-10-09T18:00:00Z'))).toBe('started');
    expect(clockValue('before', steps, Date.parse('2026-10-20T12:00:00Z'))).toBe('played');
    expect(kickoffSteps('2026-10-09T17:45:00Z', false, 'started', 'played')).toEqual([]);
  });

  it('dates a stale "now"', () => {
    expect(forecastAsOf(ts, 'pt')).toBe('na previsão de 25 set.');
    expect(forecastAsOf(ts, 'pt', { capital: true })).toBe('Na previsão de 25 set.');
    expect(forecastAsOf(ts, 'en', { capital: true })).toBe('In the 25 Sept forecast');
  });

  it('times the next round from the forecast, and lists the leftovers of earlier rounds', () => {
    const upcoming = [
      ...md8.map(kickoff => ({ matchday: 8, kickoff })),
      { matchday: 2, kickoff: '2026-10-19T19:15:00Z', postponed: true },
    ];
    const timing = nextRoundTiming({ matchday: 7, matches_remaining: [], next_matchday: { matchday: 8 } }, upcoming);
    expect(timing.round).toBe(8);
    expect(timing.startsAt).toBe('2026-10-09T17:45:00.000Z');
    // The postponed game does not stretch the round: 12 Oct 19:15 + 2 h.
    expect(timing.playedAt).toBe('2026-10-12T21:15:00.000Z');
    expect(timing.postponed.map(f => f.matchday)).toEqual([2]);
    // A forecast published mid-round waits for that round.
    expect(nextRoundTiming({ matchday: 7, matches_remaining: [{}], next_matchday: { matchday: 8 } }, upcoming).round).toBe(7);
  });
});
