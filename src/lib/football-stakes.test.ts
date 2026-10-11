import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { clubStake, stakeSentence, STAKE_MIN_SPREAD } from './football-stakes';
import type { NextMatchdayScenarioMatch } from '@/types/football';

const match = (home: string, away: string, h: Record<string, number>, d: Record<string, number>, a: Record<string, number>, metric = 'p_relegation'): NextMatchdayScenarioMatch => ({
  home_team: home,
  away_team: away,
  conditionals: {
    H: { teams: Object.fromEntries(Object.entries(h).map(([t, v]) => [t, { [metric]: v }])) },
    D: { teams: Object.fromEntries(Object.entries(d).map(([t, v]) => [t, { [metric]: v }])) },
    A: { teams: Object.fromEntries(Object.entries(a).map(([t, v]) => [t, { [metric]: v }])) },
  } as unknown as NextMatchdayScenarioMatch['conditionals'],
});

describe('clubStake', () => {
  it('reads the stake from the side of the club playing away', () => {
    const s = clubStake(match('Estrela Amadora', 'Casa Pia', { 'Casa Pia': 0.61, 'Estrela Amadora': 0.08 }, { 'Casa Pia': 0.53, 'Estrela Amadora': 0.1 }, { 'Casa Pia': 0.41, 'Estrela Amadora': 0.13 }))!;
    expect(s.team).toBe('Casa Pia');
    expect([s.win, s.draw, s.lose]).toEqual([0.41, 0.53, 0.61]);
    expect(stakeSentence(s, 'pt')).toBe('Despromoção do Casa Pia: 41% se ganhar, 53% se empatar, 61% se perder.');
  });
  it('never names a rival who is not playing', () => {
    const s = clubStake(match('Gil Vicente', 'Porto', { Porto: 0.39, Sporting: 0.45, 'Gil Vicente': 0 }, { Porto: 0.43, Sporting: 0.4, 'Gil Vicente': 0 }, { Porto: 0.55, Sporting: 0.2, 'Gil Vicente': 0 }, 'p_champion'))!;
    expect(s.team).toBe('Porto');
    expect(stakeSentence(s, 'pt')).toBe('Título do Porto: 55% se ganhar, 43% se empatar, 39% se perder.');
  });
  it('says little is at stake under 5 pp', () => {
    expect(clubStake(match('A', 'B', { A: 0.1, B: 0.1 }, { A: 0.11, B: 0.12 }, { A: 0.12, B: 0.1 }))).toBeNull();
    expect(stakeSentence(null, 'pt')).toMatch(/^Pouco em jogo/);
    expect(STAKE_MIN_SPREAD).toBe(0.05);
  });
  it('finds a stake for most games of the published round', () => {
    const file = path.join(process.cwd(), 'public/data/football/liga-2026-27/md08_scenarios.json');
    const scenarios = JSON.parse(readFileSync(file, 'utf8')) as { next_matchday_scenarios: { matches: NextMatchdayScenarioMatch[] } };
    const stakes = scenarios.next_matchday_scenarios.matches.map(clubStake);
    expect(stakes.filter(Boolean).length).toBeGreaterThan(0);
    for (const s of stakes.filter(Boolean)) expect(s!.spread).toBeGreaterThanOrEqual(STAKE_MIN_SPREAD);
  });
});
