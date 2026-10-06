import { describe, expect, it } from 'vitest';
import { forecastStatusLine, forecastStatusLinePlayed, type ForecastStatusInput } from '@/lib/football-status';
import { splitForecastRound } from './football-status-pill';

const input: ForecastStatusInput = {
  matchday: 7,
  timestamp: '2026-09-25T10:00:00Z',
  inProgress: false,
  nextRound: 8,
  nextRoundKickoffs: ['2026-10-09T19:15:00Z', '2026-10-12T19:15:00Z'],
};

describe('splitForecastRound', () => {
  it('puts the round in the pill and keeps the rest of the dated line', () => {
    const { round, rest } = splitForecastRound(forecastStatusLine(input, 'pt'), 'pt');
    expect(round).toBe('Depois da jornada 7');
    expect(rest.startsWith('Atualizado a ')).toBe(true);
    expect(rest).toContain('próxima atualização após a jornada 8');
    expect(rest).not.toContain('Depois da jornada');
  });

  it('works in English and while a round is being played', () => {
    const { round, rest } = splitForecastRound(forecastStatusLine({ ...input, inProgress: true, nextRound: 7 }, 'en'), 'en');
    expect(round).toBe('During matchday 7');
    expect(rest.startsWith('Updated ')).toBe(true);
  });

  it('splits the line shown once the next round is played the same way', () => {
    const { round, rest } = splitForecastRound(forecastStatusLinePlayed(input, 'pt'), 'pt');
    expect(round).toBe('Depois da jornada 7');
    expect(rest).toMatch(/^Atualizado a .* · jornada 8 jogada, nova previsão em preparação$/);
  });

  it('copes with a line that has no second part', () => {
    expect(splitForecastRound('Depois da jornada 34', 'pt')).toEqual({ round: 'Depois da jornada 34', rest: '' });
  });
});
