import { promises as fs } from 'fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LigaPrediction, ScenarioData } from '@/types/football';
import {
  clubStakes,
  fixtureStatus,
  formatObjectiveLabel,
  listSupportedFixtures,
  nextSupportedFixtureFor,
  relevantObjective,
  type GameFixturesData,
  type SupportedFixture,
} from './football-fixtures';

/* ---------------------------------------------------------------- fixtures */

function scenarioMatch(
  home: string,
  away: string,
  matchday: number,
  teamValues: Record<string, { H: number; D: number; A: number }>,
  objective: 'p_champion' | 'p_relegation' | 'p_top3' = 'p_champion',
) {
  const teams = (outcome: 'H' | 'D' | 'A') =>
    Object.fromEntries(
      Object.entries(teamValues).map(([team, v]) => [
        team,
        { p_champion: 0, p_top3: 0, p_relegation: 0, [objective]: v[outcome] },
      ]),
    );
  return {
    home_team: home,
    away_team: away,
    matchday,
    conditionals: {
      H: { n_sims: 100, teams: teams('H') },
      D: { n_sims: 100, teams: teams('D') },
      A: { n_sims: 100, teams: teams('A') },
    },
  };
}

function minimalPrediction(overrides: Partial<LigaPrediction> = {}): LigaPrediction {
  return {
    season: '2026-27',
    matchday: 6,
    model: 'test',
    n_sims: 1,
    timestamp: '2026-09-13T21:32:58.412242+00:00',
    table: [],
    position_probs: {},
    next_matchday: { matchday: 7, matches: [] },
    matches_remaining: [],
    ...overrides,
  } as unknown as LigaPrediction;
}

function minimalScenarios(overrides: Partial<ScenarioData> = {}): ScenarioData {
  return {
    season: '2026-27',
    matchday: 6,
    n_sims: 1,
    timestamp: '2026-09-13T21:32:58.412242+00:00',
    decisive_matches: [],
    critical_paths: {},
    ...overrides,
  } as unknown as ScenarioData;
}

/* ------------------------------------------------------------- eligibility */

describe('listSupportedFixtures / nextSupportedFixtureFor: eligibility', () => {
  it('marks a fixture below the bundle matchday as postponed, and a same-or-later one as not', () => {
    const prediction = minimalPrediction({
      matchday: 6,
      matches_remaining: [{ home: 'A', away: 'B', kickoff: '2026-09-12T23:00:00' }],
      next_matchday: { matchday: 7, matches: [{ home: 'C', away: 'D', p_home: 0.4, p_draw: 0.3, p_away: 0.3 }] },
    });
    const scenarios = minimalScenarios({
      matchday: 6,
      next_matchday_scenarios: {
        matchday: 2,
        baseline: { A: { p_champion: 0.1, p_top3: 0.5, p_relegation: 0 }, B: { p_champion: 0, p_top3: 0, p_relegation: 0.1 } },
        matches: [
          scenarioMatch('X', 'Y', 2, { X: { H: 0.1, D: 0.1, A: 0.1 } }), // leftover from an earlier round
          scenarioMatch('A', 'B', 6, { A: { H: 0.2, D: 0.1, A: 0.1 } }), // current round, still to play
          scenarioMatch('C', 'D', 7, { C: { H: 0.2, D: 0.1, A: 0.1 } }), // next round
        ],
      },
    });

    const fixtures = listSupportedFixtures(prediction, scenarios);
    expect(fixtures).toHaveLength(3);
    expect(fixtures[0]).toMatchObject({ matchday: 2, postponed: true, slug: null });
    expect(fixtures[1]).toMatchObject({ matchday: 6, postponed: false });
    expect(fixtures[2]).toMatchObject({ matchday: 7, postponed: false });
    // Resolvable pages: the current-round and next-round fixtures both come
    // from matches_remaining / next_matchday, so they get a slug.
    expect(fixtures[1].slug).not.toBeNull();
    expect(fixtures[2].slug).not.toBeNull();
  });

  it("picks a club's lowest-matchday entry as its supported fixture, even when it also appears later", () => {
    const scenarios = minimalScenarios({
      matchday: 6,
      next_matchday_scenarios: {
        matchday: 2,
        baseline: {},
        matches: [
          scenarioMatch('SC Braga', 'Gil Vicente', 2, { 'SC Braga': { H: 0.1, D: 0.1, A: 0.1 } }),
          scenarioMatch('SC Braga', 'Estoril', 6, { 'SC Braga': { H: 0.1, D: 0.1, A: 0.1 } }),
          scenarioMatch('Santa Clara', 'SC Braga', 7, { 'SC Braga': { H: 0.1, D: 0.1, A: 0.1 } }),
        ],
      },
    });
    const fixtures = listSupportedFixtures(minimalPrediction({ matchday: 6 }), scenarios);
    const supported = nextSupportedFixtureFor('SC Braga', fixtures);
    expect(supported?.matchday).toBe(2);
    expect(supported?.postponed).toBe(true);
  });

  it('returns null for a club with no entry at all, rather than substituting a rival match', () => {
    const scenarios = minimalScenarios({
      matchday: 6,
      next_matchday_scenarios: {
        matchday: 6,
        baseline: {},
        matches: [scenarioMatch('A', 'B', 6, { A: { H: 0.1, D: 0.1, A: 0.1 } })],
      },
    });
    const fixtures = listSupportedFixtures(minimalPrediction({ matchday: 6 }), scenarios);
    expect(nextSupportedFixtureFor('Nonexistent FC', fixtures)).toBeNull();
  });

  it('returns [] when the bundle carries no next_matchday_scenarios', () => {
    expect(listSupportedFixtures(minimalPrediction(), minimalScenarios())).toEqual([]);
    expect(listSupportedFixtures(minimalPrediction(), null)).toEqual([]);
  });
});

/* -------------------------------------------------------------- orientation */

describe('clubStakes: orientation', () => {
  const scenarios = minimalScenarios({
    matchday: 6,
    next_matchday_scenarios: {
      matchday: 6,
      baseline: {
        Home: { p_champion: 0.3, p_top3: 0.8, p_relegation: 0 },
        Away: { p_champion: 0, p_top3: 0.1, p_relegation: 0.2 },
      },
      matches: [
        scenarioMatch('Home', 'Away', 7, {
          Home: { H: 0.4, D: 0.25, A: 0.2 },
        }),
      ],
    },
  });
  const fixtures = listSupportedFixtures(minimalPrediction({ matchday: 6 }), scenarios);
  const fixture = fixtures[0] as SupportedFixture;

  it('uses the H conditional as "win" for the home club and the A conditional as "loss"', () => {
    const stakes = clubStakes(scenarios, fixture, 'Home', 'p_champion');
    expect(stakes).toMatchObject({ venue: 'home', opponent: 'Away', win: 0.4, draw: 0.25, loss: 0.2 });
    expect(stakes?.deltas.win).toBeCloseTo((0.4 - 0.3) * 100, 6);
    expect(stakes?.deltas.draw).toBeCloseTo((0.25 - 0.3) * 100, 6);
    expect(stakes?.deltas.loss).toBeCloseTo((0.2 - 0.3) * 100, 6);
  });

  it('reverses the orientation for the away club: "win" is the A conditional, "loss" is H', () => {
    const scenariosAway = minimalScenarios({
      matchday: 6,
      next_matchday_scenarios: {
        matchday: 6,
        baseline: { Home: { p_champion: 0.3, p_top3: 0.8, p_relegation: 0 }, Away: { p_champion: 0, p_top3: 0.1, p_relegation: 0.2 } },
        matches: [
          scenarioMatch('Home', 'Away', 7, { Away: { H: 0.3, D: 0.18, A: 0.05 } }, 'p_relegation'),
        ],
      },
    });
    const awayFixtures = listSupportedFixtures(minimalPrediction({ matchday: 6 }), scenariosAway);
    const stakes = clubStakes(scenariosAway, awayFixtures[0], 'Away', 'p_relegation');
    expect(stakes).toMatchObject({ venue: 'away', opponent: 'Home', win: 0.05, draw: 0.18, loss: 0.3 });
    expect(stakes?.deltas.win).toBeCloseTo((0.05 - 0.2) * 100, 6);
    expect(stakes?.deltas.loss).toBeCloseTo((0.3 - 0.2) * 100, 6);
  });

  it('returns null when the fixture does not involve the club', () => {
    expect(clubStakes(scenarios, fixture, 'Nonexistent FC', 'p_champion')).toBeNull();
  });
});

/* ------------------------------------------------------------- objective */

describe('relevantObjective', () => {
  it('leads with the title when baseline p_champion is at least the 5% threshold', () => {
    expect(relevantObjective({ p_champion: 0.05, p_top3: 0.9, p_relegation: 0 })).toBe('p_champion');
  });

  it('falls back to whichever of relegation and top-three is larger, when title chances are negligible', () => {
    // top-three (0.5) is larger than relegation (0.06) here, so it wins even
    // though relegation is the more dramatic-sounding number.
    expect(relevantObjective({ p_champion: 0.049, p_top3: 0.5, p_relegation: 0.06 })).toBe('p_top3');
  });

  it('picks relegation over top-three when relegation is the larger of the two and clears 1%', () => {
    // Arouca's shape: title negligible, relegation (2.3%) clearly bigger and
    // more relevant than a near-zero top-three chance.
    expect(relevantObjective({ p_champion: 0, p_top3: 0.0003, p_relegation: 0.0229 })).toBe('p_relegation');
  });

  it('falls back to top-three when relegation is absent but top-three clears 1%', () => {
    expect(relevantObjective({ p_champion: 0.001, p_top3: 0.12, p_relegation: 0.001 })).toBe('p_top3');
  });

  it('returns null when neither title, relegation nor top-three clears its threshold', () => {
    expect(relevantObjective({ p_champion: 0.001, p_relegation: 0.001 })).toBeNull();
    expect(relevantObjective({ p_champion: 0.001, p_relegation: 0.001, p_top3: 0.005 })).toBeNull();
    expect(relevantObjective(undefined)).toBeNull();
  });
});

/* --------------------------------------------------------------- labels */

describe('formatObjectiveLabel', () => {
  it('never calls top-three "Europa" or "Europe"', () => {
    expect(formatObjectiveLabel('p_top3', 'pt')).toBe('ficar no top 3');
    expect(formatObjectiveLabel('p_top3', 'en')).toBe('finishing in the top 3');
    expect(formatObjectiveLabel('p_top3', 'pt')).not.toMatch(/europa/i);
    expect(formatObjectiveLabel('p_top3', 'en')).not.toMatch(/europe/i);
  });

  it('labels the title and relegation objectives in both locales', () => {
    expect(formatObjectiveLabel('p_champion', 'pt')).toBe('ser campeão');
    expect(formatObjectiveLabel('p_relegation', 'en')).toBe('being relegated');
  });
});

/* ---------------------------------------------------------------- status */

describe('fixtureStatus', () => {
  const forecastTimestamp = '2026-09-13T21:32:58.412242+00:00';

  it('labels a postponed fixture by its round, in both locales, without a date', () => {
    const fixture: SupportedFixture = {
      index: 0,
      matchday: 2,
      home: 'SC Braga',
      away: 'Gil Vicente',
      kickoffConfirmed: true,
      kickoff: '2026-08-16T19:30:00Z', // stale: must never surface for a postponed fixture
      postponed: true,
      slug: null,
    };
    expect(fixtureStatus(fixture, forecastTimestamp, 'pt')).toEqual({
      kind: 'postponed',
      label: 'Jogo em atraso da jornada 2',
    });
    expect(fixtureStatus(fixture, forecastTimestamp, 'en')).toEqual({
      kind: 'postponed',
      label: 'Postponed round 2 match',
    });
  });

  it('labels a confirmed upcoming fixture with its date, never "hoje" or a countdown', () => {
    const fixture: SupportedFixture = {
      index: 0,
      matchday: 6,
      home: 'SC Braga',
      away: 'Estoril',
      kickoff: '2026-09-12T23:00:00Z',
      kickoffConfirmed: true,
      postponed: false,
      slug: 'braga-estoril',
    };
    const status = fixtureStatus(fixture, forecastTimestamp, 'pt');
    expect(status.kind).toBe('next');
    expect(status.label).not.toMatch(/hoje|esta noite/i);
    expect(status.label).toContain('12 de setembro');
  });

  it('flags an unconfirmed kickoff instead of asserting it', () => {
    const fixture: SupportedFixture = {
      index: 0,
      matchday: 7,
      home: 'Porto',
      away: 'Benfica',
      kickoff: '2026-09-19T23:00:00Z',
      kickoffConfirmed: false,
      postponed: false,
      slug: 'porto-benfica',
    };
    const status = fixtureStatus(fixture, forecastTimestamp, 'en');
    expect(status.kind).toBe('next');
    expect(status.label).toMatch(/unconfirmed/);
  });

  it('ties an unscheduled fixture to the forecast date instead of the current time', () => {
    const fixture: SupportedFixture = {
      index: 0,
      matchday: 7,
      home: 'Nacional',
      away: 'Famalicao',
      kickoffConfirmed: false,
      postponed: false,
      slug: 'nacional-famalicao',
    };
    const status = fixtureStatus(fixture, forecastTimestamp, 'pt');
    expect(status.kind).toBe('unscheduled');
    expect(status.label).toContain('13 de setembro');
    expect(status.label).not.toMatch(/hoje|esta noite/i);
  });
});

/* ------------------------------------------------------------- real data */

describe('real published bundle (public/data/football/liga-2026-27/md06*)', () => {
  it("matches the diagnosis's Sporting CP–Arouca stakes exactly, from the real files", async () => {
    const dir = path.join(process.cwd(), 'public', 'data', 'football', 'liga-2026-27');
    const prediction: LigaPrediction = JSON.parse(await fs.readFile(path.join(dir, 'md06.json'), 'utf8'));
    const scenarios: ScenarioData = JSON.parse(await fs.readFile(path.join(dir, 'md06_scenarios.json'), 'utf8'));
    const gameFixtures: GameFixturesData = JSON.parse(await fs.readFile(path.join(dir, 'game_fixtures.json'), 'utf8'));

    const fixtures = listSupportedFixtures(prediction, scenarios, gameFixtures);
    expect(fixtures).toHaveLength(13);

    const sportingFixture = nextSupportedFixtureFor('Sporting CP', fixtures);
    expect(sportingFixture).not.toBeNull();
    expect(sportingFixture).toMatchObject({ home: 'Sporting CP', away: 'Arouca', matchday: 7, postponed: false });
    expect(sportingFixture?.slug).toBe('sporting-arouca');

    const sportingObjective = relevantObjective(scenarios.next_matchday_scenarios!.baseline['Sporting CP']);
    expect(sportingObjective).toBe('p_champion');

    const sportingStakes = clubStakes(scenarios, sportingFixture!, 'Sporting CP', sportingObjective!);
    expect(sportingStakes?.venue).toBe('home');
    expect(sportingStakes?.baseline).toBeCloseTo(0.4425, 3);
    expect(sportingStakes?.win).toBeCloseTo(0.4636, 3);
    expect(sportingStakes?.draw).toBeCloseTo(0.3510, 3);
    expect(sportingStakes?.loss).toBeCloseTo(0.3119, 3);
    expect(sportingStakes?.deltas.win).toBeCloseTo(2.11, 1);
    expect(sportingStakes?.deltas.draw).toBeCloseTo(-9.15, 1);
    expect(sportingStakes?.deltas.loss).toBeCloseTo(-13.06, 1);

    // Arouca is away in the same fixture, so its own "win" is the A
    // conditional and its "loss" is H — the reverse of Sporting's.
    const aroucaFixture = nextSupportedFixtureFor('Arouca', fixtures);
    expect(aroucaFixture?.index).toBe(sportingFixture?.index);

    // relevantObjective auto-selects relegation for Arouca: title is
    // negligible, and relegation (2.29%) is both larger than its top-three
    // chance (0.03%) and clears the 1% fallback threshold — matching the
    // diagnosis's worked example (§4), with no need to ask for it explicitly.
    const aroucaObjective = relevantObjective(scenarios.next_matchday_scenarios!.baseline['Arouca']);
    expect(aroucaObjective).toBe('p_relegation');

    const aroucaStakes = clubStakes(scenarios, aroucaFixture!, 'Arouca', aroucaObjective!);
    expect(aroucaStakes?.venue).toBe('away');
    expect(aroucaStakes?.baseline).toBeCloseTo(0.0229, 3);
    expect(aroucaStakes?.win).toBeCloseTo(0.0089, 3);
    expect(aroucaStakes?.draw).toBeCloseTo(0.0181, 3);
    expect(aroucaStakes?.loss).toBeCloseTo(0.0245, 3);
  });

  it('marks the matchday-2 leftover as postponed with no resolvable match page, for every club still owing it', async () => {
    const dir = path.join(process.cwd(), 'public', 'data', 'football', 'liga-2026-27');
    const prediction: LigaPrediction = JSON.parse(await fs.readFile(path.join(dir, 'md06.json'), 'utf8'));
    const scenarios: ScenarioData = JSON.parse(await fs.readFile(path.join(dir, 'md06_scenarios.json'), 'utf8'));
    const gameFixtures: GameFixturesData = JSON.parse(await fs.readFile(path.join(dir, 'game_fixtures.json'), 'utf8'));

    const fixtures = listSupportedFixtures(prediction, scenarios, gameFixtures);
    const braga = nextSupportedFixtureFor('SC Braga', fixtures);
    expect(braga).toMatchObject({ matchday: 2, postponed: true, slug: null, away: 'Gil Vicente' });

    const gilVicente = nextSupportedFixtureFor('Gil Vicente', fixtures);
    expect(gilVicente?.index).toBe(braga?.index);

    const status = fixtureStatus(braga!, prediction.timestamp, 'pt');
    expect(status).toEqual({ kind: 'postponed', label: 'Jogo em atraso da jornada 2' });
  });

  it('resolves an ordinary next-round fixture to the same slug the match page uses', async () => {
    const dir = path.join(process.cwd(), 'public', 'data', 'football', 'liga-2026-27');
    const prediction: LigaPrediction = JSON.parse(await fs.readFile(path.join(dir, 'md06.json'), 'utf8'));
    const scenarios: ScenarioData = JSON.parse(await fs.readFile(path.join(dir, 'md06_scenarios.json'), 'utf8'));
    const gameFixtures: GameFixturesData = JSON.parse(await fs.readFile(path.join(dir, 'game_fixtures.json'), 'utf8'));

    const fixtures = listSupportedFixtures(prediction, scenarios, gameFixtures);
    const porto = nextSupportedFixtureFor('Porto', fixtures);
    expect(porto).toMatchObject({ home: 'Porto', away: 'Benfica', matchday: 7, slug: 'porto-benfica' });
    expect(porto?.kickoffConfirmed).toBe(false);
    expect(porto?.kickoff).toBe('2026-09-19T23:00:00Z');
    expect(porto?.matchProbabilities).toBeDefined();
  });
});
