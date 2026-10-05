import { describe, expect, it } from 'vitest';
import { formFor } from './football-form';
import type { LigaPrediction } from '@/types/football';

const md = (matchday: number, results: LigaPrediction['matchday_results']) =>
  ({ matchday, matchday_results: results }) as unknown as LigaPrediction;

describe('formFor', () => {
  it('orders by the round a result belongs to, not the file it was published in', () => {
    const historical = [
      md(6, [{ home: 'Sporting CP', away: 'Arouca', home_goals: 2, away_goals: 2, matchday: 6 }]),
      // md07 carries a late backfill from matchday 2 alongside its own round.
      md(7, [
        { home: 'Sporting CP', away: 'Porto', home_goals: 0, away_goals: 1, matchday: 7 },
        { home: 'Estoril', away: 'Sporting CP', home_goals: 0, away_goals: 3, matchday: 2 },
      ]),
    ];
    const form = formFor('Sporting CP', historical, null);
    expect(form.map(f => f.matchday)).toEqual([7, 6, 2]);
    expect(form[0]).toMatchObject({ opponent: 'Porto', venue: 'H', result: 'L' });
    expect(form[2]).toMatchObject({ opponent: 'Estoril', venue: 'A', result: 'W' });
  });

  it('counts a result published in two files once', () => {
    const r = { home: 'Porto', away: 'Benfica', home_goals: 3, away_goals: 1, matchday: 7 };
    const latest = md(7, [r]);
    const form = formFor('Porto', [md(7, [r]), latest], latest);
    expect(form).toHaveLength(1);
  });

  it('falls back to the file matchday when a result carries none', () => {
    const form = formFor('Porto', [md(3, [{ home: 'Porto', away: 'Nacional', home_goals: 1, away_goals: 0 }])], null);
    expect(form[0].matchday).toBe(3);
  });
});
