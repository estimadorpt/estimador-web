import { describe, expect, it } from 'vitest';
import { formFor, kickoffsByPair } from './football-form';
import type { GameFixturesData } from '@/lib/football-fixtures';
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

  it('orders by the date played when the manifest has the kickoffs (audit FA3-01)', () => {
    const manifest = {
      season: '2026-27',
      generated_at: '',
      n_matchdays: 34,
      matchdays: [
        { matchday: 3, fixtures: [{ id: 'a', home: 'Moreirense', away: 'Benfica', kickoff: '2026-09-09T19:15:00Z', kickoff_confirmed: true }] },
        { matchday: 4, fixtures: [{ id: 'b', home: 'Benfica', away: 'Estoril', kickoff: '2026-08-31T19:15:00Z', kickoff_confirmed: true }] },
        { matchday: 5, fixtures: [{ id: 'c', home: 'Maritimo', away: 'Benfica', kickoff: '2026-09-05T19:15:00Z', kickoff_confirmed: true }] },
      ],
    } as unknown as GameFixturesData;
    const historical = [
      md(4, [{ home: 'Benfica', away: 'Estoril', home_goals: 2, away_goals: 0, matchday: 4 }]),
      md(5, [{ home: 'Maritimo', away: 'Benfica', home_goals: 0, away_goals: 1, matchday: 5 }]),
      // The postponed jornada-3 game, played on 9 September, after jornada 5.
      md(6, [{ home: 'Moreirense', away: 'Benfica', home_goals: 1, away_goals: 1, matchday: 3 }]),
    ];
    const form = formFor('Benfica', historical, null, 5, kickoffsByPair(manifest));
    expect(form.map(f => f.opponent)).toEqual(['Moreirense', 'Maritimo', 'Estoril']);
    // Without the kickoffs, the round order stands.
    expect(formFor('Benfica', historical, null).map(f => f.opponent)).toEqual(['Maritimo', 'Estoril', 'Moreirense']);
  });

  it('keeps a postponed game played last among the last five (Braga – Gil Vicente, 19 October)', () => {
    const fixtures = [
      { id: 'j2', home: 'SC Braga', away: 'Gil Vicente', kickoff: '2026-10-19T19:15:00Z', kickoff_confirmed: true },
      ...[3, 4, 5, 6, 7, 8].map(n => ({ id: `j${n}`, home: 'SC Braga', away: `Rival ${n}`, kickoff: `2026-09-${10 + n}T19:15:00Z`, kickoff_confirmed: true })),
    ];
    const manifest = { season: '2026-27', generated_at: '', n_matchdays: 34, matchdays: fixtures.map((fx, i) => ({ matchday: i === 0 ? 2 : Number(fx.id.slice(1)), fixtures: [fx] })) } as unknown as GameFixturesData;
    const results = fixtures.map(fx => ({ home: fx.home, away: fx.away, home_goals: 1, away_goals: 0, matchday: fx.id === 'j2' ? 2 : Number(fx.id.slice(1)) }));
    const form = formFor('SC Braga', [md(9, results)], null, 5, kickoffsByPair(manifest));
    expect(form).toHaveLength(5);
    expect(form[0].opponent).toBe('Gil Vicente');
    expect(form.map(f => f.matchday)).toEqual([2, 8, 7, 6, 5]);
  });

  it('falls back to the file matchday when a result carries none', () => {
    const form = formFor('Porto', [md(3, [{ home: 'Porto', away: 'Nacional', home_goals: 1, away_goals: 0 }])], null);
    expect(form[0].matchday).toBe(3);
  });
});
