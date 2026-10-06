import { describe, expect, it } from 'vitest';
import { forecastStatusLine } from './football-status';

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
