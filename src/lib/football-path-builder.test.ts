import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { ScenarioData } from '@/types/football';
import { decisiveGames, likelihoodRatio, pickedPoints, runningProbabilities, scenarioProbability, singleGameSwing, type PathOutcome } from './football-path-builder';

function load(file: string): ScenarioData {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
}

const bundles: Array<[string, ScenarioData]> = [
  ['md06 test fixture', load('src/test-fixtures/liga-2026-27/md06_scenarios.json')],
  ['published md07', load('public/data/football/liga-2026-27/md07_scenarios.json')],
];

describe.each(bundles)('scenario builder on %s', (_name, scenarios) => {
  const paths = Object.entries(scenarios.critical_paths ?? {});
  const nms = scenarios.next_matchday_scenarios;

  it('has paths to test', () => {
    expect(paths.length).toBeGreaterThan(5);
  });

  it('shows the page baseline before any pick', () => {
    for (const [, p] of paths) {
      expect(scenarioProbability(p.p_current, p.matches, {})).toBe(p.p_current);
    }
  });

  it('never lowers the target after a win, never raises it after a loss', () => {
    for (const [team, p] of paths) {
      p.matches.forEach((_, i) => {
        const win = scenarioProbability(p.p_current, p.matches, { [i]: 'W' });
        const loss = scenarioProbability(p.p_current, p.matches, { [i]: 'L' });
        expect(win, `${team} W #${i}`).toBeGreaterThanOrEqual(p.p_current - 1e-12);
        expect(loss, `${team} L #${i}`).toBeLessThanOrEqual(p.p_current + 1e-12);
        expect(win).toBeGreaterThanOrEqual(loss);
      });
    }
  });

  it('keeps every scenario inside 0–100%', () => {
    for (const [, p] of paths) {
      const allWins: Record<number, PathOutcome> = {};
      const allLosses: Record<number, PathOutcome> = {};
      p.matches.forEach((_, i) => { allWins[i] = 'W'; allLosses[i] = 'L'; });
      const w = scenarioProbability(p.p_current, p.matches, allWins);
      const l = scenarioProbability(p.p_current, p.matches, allLosses);
      expect(w).toBeGreaterThanOrEqual(p.p_current);
      expect(w).toBeLessThanOrEqual(1);
      expect(l).toBeLessThanOrEqual(p.p_current);
      expect(l).toBeGreaterThanOrEqual(0);
    }
  });

  it('reproduces the published next-matchday conditional for a single pick', () => {
    let checked = 0;
    for (const [team, p] of paths) {
      p.matches.forEach((m, i) => {
        const fixture = nms?.matches.find(f =>
          f.matchday === m.matchday &&
          ((m.venue === 'H' && f.home_team === team && f.away_team === m.opponent) ||
            (m.venue === 'A' && f.away_team === team && f.home_team === m.opponent)),
        );
        if (!fixture) return;
        const map: Record<PathOutcome, 'H' | 'D' | 'A'> = m.venue === 'H'
          ? { W: 'H', D: 'D', L: 'A' }
          : { W: 'A', D: 'D', L: 'H' };
        for (const o of ['W', 'D', 'L'] as PathOutcome[]) {
          const teams = fixture.conditionals[map[o]].teams[team];
          const published = p.target === 'champion' ? teams.p_champion : 1 - teams.p_relegation;
          const ours = scenarioProbability(p.p_current, p.matches, { [i]: o });
          // Both are read off the same 50 000 simulations; the file rounds to
          // four decimals, and the direction guard can only move a value
          // toward the baseline.
          expect(Math.abs(ours - published), `${team} ${o} md${m.matchday}`).toBeLessThan(0.002);
          checked++;
        }
      });
    }
    expect(checked).toBeGreaterThan(10);
  });

  it('shows each pick as its own step down the list', () => {
    const [, p] = paths[0];
    const steps = runningProbabilities(p.p_current, p.matches, { 0: 'W', 2: 'L' });
    expect(steps).toHaveLength(p.matches.length);
    expect(steps[0]).toBeGreaterThanOrEqual(p.p_current);
    expect(steps[1]).toBe(steps[0]);
    expect(steps[2]).toBeLessThanOrEqual(steps[1]);
    expect(steps[steps.length - 1]).toBe(steps[2]);
  });
});

describe('the md07 Benfica acceptance case (audit B1)', () => {
  const scenarios = load('public/data/football/liga-2026-27/md07_scenarios.json');
  const benfica = scenarios.critical_paths?.Benfica;

  it('a win over Vitória on matchday 8 reads 25%, as the rest of the page says', () => {
    if (!benfica || scenarios.matchday !== 7) return;
    const i = benfica.matches.findIndex(m => m.matchday === 8);
    expect(i).toBeGreaterThanOrEqual(0);
    const p = scenarioProbability(benfica.p_current, benfica.matches, { [i]: 'W' });
    expect(Math.round(p * 1000) / 1000).toBeCloseTo(0.252, 3);
    expect(Math.round(benfica.p_current * 100)).toBe(22);
  });
});

describe('the decisive games the builder marks (md08)', () => {
  // A frozen copy of md08's scenarios as first published mid-round.
  const md08 = load('src/test-fixtures/liga-2026-27/md08_scenarios.json');
  const paths = md08.critical_paths ?? {};
  const marked = (team: string) => {
    const p = paths[team];
    const { indices } = decisiveGames(p.p_current, p.matches);
    return [...indices].map(i => `${p.matches[i].matchday} ${p.matches[i].opponent}`).sort();
  };

  it('marks a title contender\'s direct duels and nothing else', () => {
    expect(marked('Porto')).toEqual(['12 Sporting CP', '24 Benfica', '29 Sporting CP']);
    for (const team of ['Benfica', 'Sporting CP']) {
      for (const row of marked(team)) expect(row, team).toMatch(/Porto|Benfica|Sporting CP/);
    }
  });

  it('marks none of Casa Pia\'s games, which all weigh about the same', () => {
    expect(marked('Casa Pia')).toEqual([]);
    const { range } = decisiveGames(paths['Casa Pia'].p_current, paths['Casa Pia'].matches);
    // The sentence the builder says instead: every game between 16 and 22 points.
    expect(Math.round(range[0] * 100)).toBe(16);
    expect(Math.round(range[1] * 100)).toBe(22);
  });

  it('reads each swing from the exact single-pick conditionals', () => {
    const p = paths['Porto'];
    const m = p.matches[0];
    expect(singleGameSwing(p.p_current, m)).toBeCloseTo(
      scenarioProbability(p.p_current, [m], { 0: 'W' }) - scenarioProbability(p.p_current, [m], { 0: 'L' }),
      12,
    );
  });
});

describe('likelihood ratio guards', () => {
  const m = {
    opponent: 'X', venue: 'H' as const, matchday: 9,
    p_win_overall: 0.5, p_draw_overall: 0.25, p_loss_overall: 0.25,
    p_win_given_target: 0.49, p_draw_given_target: 0.25, p_loss_given_target: 0.26,
    win_uplift: -0.01,
  };

  it('holds a noisy win at no change rather than a fall', () => {
    expect(likelihoodRatio(m, 'W', 0.97)).toBe(1);
    expect(likelihoodRatio(m, 'L', 0.97)).toBe(1);
  });

  it('survives a target probability at the edge', () => {
    expect(Number.isFinite(likelihoodRatio({ ...m, p_win_given_target: 0.6 }, 'W', 0.9999))).toBe(true);
    expect(scenarioProbability(0, [m], { 0: 'W' })).toBe(0);
    expect(scenarioProbability(1, [m], { 0: 'L' })).toBe(1);
  });

  it('counts the picked points', () => {
    expect(pickedPoints({ 0: 'W', 1: 'D', 2: 'L' })).toBe(4);
  });
});
