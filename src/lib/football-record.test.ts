import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { poissonBinomial, quantile, seasonRecord } from './football-record';

describe('poissonBinomial', () => {
  it('is a distribution with the right mean', () => {
    const d = poissonBinomial([0.2, 0.5, 0.9]);
    expect(d.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(d.reduce((a, v, k) => a + v * k, 0)).toBeCloseTo(1.6, 12);
    expect(quantile(d, 0.5)).toBe(2);
  });
});

describe('seasonRecord', () => {
  it('counts only priced, played games and ranks the outcome against its range', () => {
    const r = seasonRecord([
      { p_home: 0.6, p_draw: 0.25, p_away: 0.15, played: { home_goals: 2, away_goals: 0 } },
      { p_home: 0.3, p_draw: 0.3, p_away: 0.4, played: { home_goals: 1, away_goals: 1 } },
      { p_home: null, p_draw: null, p_away: null, played: { home_goals: 0, away_goals: 3 } },
      { p_home: 0.5, p_draw: 0.3, p_away: 0.2, played: null },
    ], 'pt');
    expect(r.games).toBe(2);
    expect(r.outcomes.map(o => o.happened)).toEqual([1, 1, 0]);
    expect(r.outcomes[1].expected).toBeCloseTo(0.55, 12);
    for (const o of r.outcomes) expect(o.q05).toBeLessThanOrEqual(o.q95);
  });

  it('reproduces the published 2026-27 record from game_fixtures.json', () => {
    const file = path.join(process.cwd(), 'public/data/football/liga-2026-27/game_fixtures.json');
    const manifest = JSON.parse(readFileSync(file, 'utf8')) as { matchdays: Array<{ fixtures: Array<{ kickoff?: string; published_at?: string; p_home?: number; p_draw?: number; p_away?: number; home_goals?: number | null; away_goals?: number | null }> }> };
    const games = manifest.matchdays.flatMap(md => md.fixtures).map(f => {
      const before = f.published_at && f.kickoff && Date.parse(f.published_at) <= Date.parse(f.kickoff);
      const priced = typeof f.p_home === 'number' && typeof f.p_draw === 'number' && typeof f.p_away === 'number';
      const played = typeof f.home_goals === 'number' && typeof f.away_goals === 'number' ? { home_goals: f.home_goals, away_goals: f.away_goals } : null;
      return before && priced ? { p_home: f.p_home!, p_draw: f.p_draw!, p_away: f.p_away!, played } : { p_home: null, p_draw: null, p_away: null, played };
    });
    const r = seasonRecord(games, 'pt');
    expect(r.games).toBeGreaterThan(0);
    const draws = r.outcomes.find(o => o.key === 'draw')!;
    expect(draws.q05).toBeLessThanOrEqual(draws.q50);
    expect(draws.q50).toBeLessThanOrEqual(draws.q95);
    expect(Math.abs(draws.expected - draws.q50)).toBeLessThanOrEqual(1);
  });
});
