import { describe, expect, it } from 'vitest';
import { currentAbsences, INJURY_MAX_AGE_DAYS, LAST_GAME_MAX_AGE_DAYS } from './football-injuries';
import type { InjuriesData } from '@/components/charts/football/InjuriesPanel';

function feed(overrides: Partial<InjuriesData> = {}): InjuriesData {
  return {
    season: '2026-27',
    snapshot_date: '2026-10-05',
    stale: false,
    source: 'transfermarkt',
    n_out: 3,
    n_injuries: 3,
    n_suspensions: 0,
    teams: [
      { team: 'Benfica', n_out: 2, value_out_eur: 30_000_000, squad_value_eur: 300_000_000, share_of_squad: 0.1 },
      { team: 'Porto', n_out: 1, value_out_eur: 5_000_000, squad_value_eur: 400_000_000, share_of_squad: 0.0125 },
    ],
    players: [
      { player: 'A', team: 'Benfica', kind: 'injury', position: null, reason: null, expected_return: null, market_value_eur: 20_000_000 },
      { player: 'B', team: 'Benfica', kind: 'injury', position: null, reason: null, expected_return: '2026-09-01', market_value_eur: 10_000_000 },
      { player: 'C', team: 'Porto', kind: 'injury', position: null, reason: null, expected_return: '2026-08-31', market_value_eur: 5_000_000 },
    ],
    ...overrides,
  };
}

describe('currentAbsences', () => {
  const forecast = '2026-10-03T12:00:00+00:00';

  it('reports a missing feed as missing', () => {
    expect(currentAbsences(null, forecast).status).toBe('missing');
  });

  it('hides a list the collector flagged as stale', () => {
    const result = currentAbsences(feed({ stale: true }), forecast);
    expect(result.status).toBe('stale');
    expect(result.players).toEqual([]);
  });

  it(`hides a snapshot more than ${INJURY_MAX_AGE_DAYS} days older than the forecast`, () => {
    const result = currentAbsences(feed({ snapshot_date: '2026-08-10' }), '2026-09-25T14:50:48+00:00');
    expect(result.status).toBe('stale');
    expect(result.snapshotDate).toBe('2026-08-10');
    expect(currentAbsences(feed({ snapshot_date: '2026-09-20' }), '2026-09-25T14:50:48+00:00').status).toBe('current');
  });

  it('hides a feed with no snapshot date', () => {
    expect(currentAbsences(feed({ snapshot_date: null }), forecast).status).toBe('stale');
  });

  it('drops absences whose expected return has passed, and recomputes the club totals', () => {
    const result = currentAbsences(feed(), forecast);
    expect(result.status).toBe('current');
    expect(result.players.map(p => p.player)).toEqual(['A']);
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0]).toMatchObject({ team: 'Benfica', n_out: 1, value_out_eur: 20_000_000 });
    expect(result.teams[0].share_of_squad).toBeCloseTo(20 / 300, 6);
  });

  it('keeps an absence expected back after the forecast date', () => {
    const result = currentAbsences(
      feed({
        players: [
          { player: 'D', team: 'Porto', kind: 'injury', position: null, reason: null, expected_return: '2026-10-20', market_value_eur: 1 },
        ],
      }),
      forecast,
    );
    expect(result.players.map(p => p.player)).toEqual(['D']);
  });

  describe('a list read off each club\'s last game (SofaScore)', () => {
    const lastGame = (overrides: Partial<InjuriesData> = {}) =>
      feed({
        source: 'sofascore',
        basis: 'last_game',
        snapshot_date: '2026-11-09',
        teams: [
          { team: 'Benfica', as_of: '2026-11-09', opponent: 'Porto', n_out: 1, value_out_eur: 20_000_000, squad_value_eur: 300_000_000, share_of_squad: 0.0667 },
          { team: 'Porto', as_of: '2026-10-20', opponent: 'Braga', n_out: 1, value_out_eur: 5_000_000, squad_value_eur: 400_000_000, share_of_squad: 0.0125 },
        ],
        players: [
          { player: 'A', team: 'Benfica', kind: 'injury', position: 'Defender', reason: null, expected_return: null, market_value_eur: 20_000_000 },
          { player: 'C', team: 'Porto', kind: 'suspension', position: 'Forward', reason: 'Red card suspension', expected_return: null, market_value_eur: 5_000_000 },
        ],
        ...overrides,
      });

    it(`stays current up to ${LAST_GAME_MAX_AGE_DAYS} days after the latest game (an international break)`, () => {
      expect(currentAbsences(lastGame(), '2026-11-21T10:00:00+00:00').status).toBe('current');
      expect(currentAbsences(lastGame(), '2026-11-26T10:00:00+00:00').status).toBe('stale');
    });

    it('leaves out a club whose own last game is too old', () => {
      const result = currentAbsences(lastGame(), '2026-11-14T10:00:00+00:00');
      expect(result.players.map(p => p.player)).toEqual(['A']);
      expect(result.teams.map(t => t.team)).toEqual(['Benfica']);
    });
  });
});
