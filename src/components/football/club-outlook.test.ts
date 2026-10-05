import { promises as fs } from 'fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LigaPrediction, ScenarioData } from '@/types/football';
import type { GameFixturesData } from '@/lib/football-fixtures';
import { buildClubOutlooks, formatClubPercent, positionSpread } from './club-outlook';

async function loadBundle() {
  const dir = path.join(process.cwd(), 'src', 'test-fixtures', 'liga-2026-27');
  const prediction: LigaPrediction = JSON.parse(await fs.readFile(path.join(dir, 'md06.json'), 'utf8'));
  const scenarios: ScenarioData = JSON.parse(await fs.readFile(path.join(dir, 'md06_scenarios.json'), 'utf8'));
  const gameFixtures: GameFixturesData = JSON.parse(await fs.readFile(path.join(dir, 'game_fixtures.json'), 'utf8'));
  return { prediction, scenarios, gameFixtures };
}

describe('buildClubOutlooks (frozen md06 bundle)', () => {
  it("builds Sporting's title stakes against Arouca, matching the diagnosis's worked example", async () => {
    const { prediction, scenarios, gameFixtures } = await loadBundle();
    const entries = buildClubOutlooks('pt', prediction, scenarios, gameFixtures);
    const sporting = entries.find(e => e.team === 'Sporting CP');
    expect(sporting).toBeDefined();
    expect(sporting?.objective).toBe('p_champion');
    expect(sporting?.baseline).toBeCloseTo(0.4425, 3);
    expect(sporting?.win).toBeCloseTo(0.4636, 3);
    expect(sporting?.draw).toBeCloseTo(0.3510, 3);
    expect(sporting?.loss).toBeCloseTo(0.3119, 3);
    expect(sporting?.opponent).toBe('Arouca');
    expect(sporting?.opponentLabel).toBe('Arouca');
    expect(sporting?.venue).toBe('home');
    expect(sporting?.fixtureStatusKind).not.toBeNull();
    expect(sporting?.matchHref).toBe('/desporto/liga/jogo/sporting-arouca');
    expect(sporting?.clubHref).toBe('/desporto/liga/sporting');
    expect(sporting?.simulatorHref).toContain('goal=p_champion');
    expect(sporting?.simulatorHref).toContain('team=Sporting');
  });

  it("builds Arouca's relegation stakes for the same fixture, oriented as the away club", async () => {
    const { prediction, scenarios, gameFixtures } = await loadBundle();
    const entries = buildClubOutlooks('pt', prediction, scenarios, gameFixtures);
    const arouca = entries.find(e => e.team === 'Arouca');
    expect(arouca).toBeDefined();
    expect(arouca?.objective).toBe('p_relegation');
    expect(arouca?.baseline).toBeCloseTo(0.0229, 3);
    expect(arouca?.win).toBeCloseTo(0.0089, 3);
    expect(arouca?.draw).toBeCloseTo(0.0181, 3);
    expect(arouca?.loss).toBeCloseTo(0.0245, 3);
    expect(arouca?.venue).toBe('away');
    expect(arouca?.opponent).toBe('Sporting CP');
    expect(arouca?.simulatorHref).toContain('goal=p_relegation');
  });

  it('marks a club with a postponed leftover fixture accordingly, with no resolvable match href', async () => {
    const { prediction, scenarios, gameFixtures } = await loadBundle();
    const entries = buildClubOutlooks('pt', prediction, scenarios, gameFixtures);
    const braga = entries.find(e => e.team === 'SC Braga');
    expect(braga?.hasFixture).toBe(true);
    expect(braga?.fixtureStatusKind).toBe('postponed');
    expect(braga?.matchHref).toBeNull();
  });

  it('never substitutes a rival fixture for a club with none supported', async () => {
    const { prediction, scenarios, gameFixtures } = await loadBundle();
    // A scenarios bundle covering only one match, involving neither of two
    // clubs still present in the prediction table.
    const narrowScenarios: ScenarioData = {
      ...scenarios,
      next_matchday_scenarios: {
        matchday: scenarios.next_matchday_scenarios!.matchday,
        baseline: scenarios.next_matchday_scenarios!.baseline,
        matches: scenarios.next_matchday_scenarios!.matches.filter(
          m => m.home_team === 'Sporting CP' || m.away_team === 'Sporting CP',
        ),
      },
    };
    const entries = buildClubOutlooks('pt', prediction, narrowScenarios, gameFixtures);
    const uncovered = entries.find(e => e.team !== 'Sporting CP' && e.team !== 'Arouca');
    expect(uncovered?.hasFixture).toBe(false);
    expect(uncovered?.win).toBeNull();
    expect(uncovered?.matchHref).toBeNull();
    // The club-level objective/baseline must still be present (the dated
    // baseline is shown even without a supported fixture).
    expect(uncovered?.objective === null || typeof uncovered?.baseline === 'number').toBe(true);
  });
});

describe('formatClubPercent', () => {
  it('uses one decimal below 10%, matching the diagnosis figures for Arouca', () => {
    expect(formatClubPercent(0.0229, 'pt')).toBe('2,3%');
    expect(formatClubPercent(0.0089, 'pt')).toBe('0,9%');
    expect(formatClubPercent(0.0181, 'pt')).toBe('1,8%');
    expect(formatClubPercent(0.0245, 'pt')).toBe('2,5%');
  });

  it('uses whole numbers at 10% and above, matching the diagnosis figures for Sporting', () => {
    expect(formatClubPercent(0.4425, 'pt')).toBe('44%');
    expect(formatClubPercent(0.4636, 'pt')).toBe('46%');
    expect(formatClubPercent(0.3510, 'pt')).toBe('35%');
    expect(formatClubPercent(0.3119, 'pt')).toBe('31%');
  });

  it('uses a period as the decimal separator in English', () => {
    expect(formatClubPercent(0.0229, 'en')).toBe('2.3%');
  });
});

describe('positionSpread', () => {
  it('reports a 5th-9th range when neighbouring positions carry comparable probability to the 7th-place mode', () => {
    // 7th (index 6) at 12%, with 5th-9th all carrying at least half of that.
    const probs = [0, 0, 0, 0, 0.07, 0.09, 0.12, 0.10, 0.08, 0.05, 0, 0, 0, 0, 0, 0, 0, 0];
    const result = positionSpread(probs);
    expect(result?.modalPosition).toBe(7);
    expect(result?.broad).toBe(true);
    expect(result?.rangeStart).toBe(5);
    expect(result?.rangeEnd).toBe(9);
  });

  it('reports a confident single position when neighbours trail far behind', () => {
    const probs = [0.9, 0.05, 0.02, 0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const result = positionSpread(probs);
    expect(result?.modalPosition).toBe(1);
    expect(result?.broad).toBe(false);
    expect(result?.rangeStart).toBe(1);
    expect(result?.rangeEnd).toBe(1);
  });

  it('returns null for an empty or all-zero distribution', () => {
    expect(positionSpread([])).toBeNull();
    expect(positionSpread([0, 0, 0])).toBeNull();
  });
});
