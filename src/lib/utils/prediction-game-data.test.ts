import { describe, expect, it } from 'vitest';
import { loadGameFixtures, loadPredictionGameData, roundsFromGameFixtures } from '@/lib/utils/football-data-loader';
import { roundLockState, scoreSeason } from '@/lib/utils/prediction-game';

/**
 * Integration check against the JSON actually published in public/data.
 *
 * Assertions are deliberately structural — the published feed changes every
 * matchday, so anything asserting a specific fixture or score would rot within
 * a week. What must hold every week is the shape and the invariants.
 */
describe('loadPredictionGameData (real published data)', () => {
  it('assembles rounds from the published matchday files', async () => {
    const data = await loadPredictionGameData();
    expect(data).not.toBeNull();
    expect(data!.season).toMatch(/^\d{4}-\d{2}$/);
    expect(data!.rounds.length).toBeGreaterThan(0);
  });

  it('produces valid, normalised model probabilities for every fixture', async () => {
    const data = (await loadPredictionGameData())!;
    for (const round of data.rounds) {
      expect(round.fixtures.length).toBeGreaterThan(0);
      for (const f of round.fixtures) {
        const total = f.model[0] + f.model[1] + f.model[2];
        expect(total).toBeCloseTo(1, 9);
        expect(Math.min(...f.model)).toBeGreaterThanOrEqual(0);
        expect(f.key).toBe(`${f.home}|${f.away}`);
        expect(f.home).not.toBe(f.away);
      }
    }
  });

  it('keeps rounds ordered and fixture keys unique within a round', async () => {
    const data = (await loadPredictionGameData())!;
    const mds = data.rounds.map(r => r.matchday);
    expect([...mds].sort((a, b) => a - b)).toEqual(mds);
    expect(new Set(mds).size).toBe(mds.length);

    for (const round of data.rounds) {
      const keys = round.fixtures.map(f => f.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('attaches results by ordered team pair, with a coherent outcome', async () => {
    const data = (await loadPredictionGameData())!;
    for (const round of data.rounds) {
      for (const f of round.fixtures) {
        if (!f.result) continue;
        const { homeGoals, awayGoals, outcome } = f.result;
        expect(Number.isInteger(homeGoals)).toBe(true);
        expect(Number.isInteger(awayGoals)).toBe(true);
        const expected = homeGoals > awayGoals ? 'H' : homeGoals === awayGoals ? 'D' : 'A';
        expect(outcome).toBe(expected);
      }
    }
  });

  it('locks every round that already has results, and at most one is open', async () => {
    const data = (await loadPredictionGameData())!;
    const now = Date.now();
    for (const round of data.rounds) {
      if (round.fixtures.some(f => f.result)) {
        expect(roundLockState(round, now).locked).toBe(true);
      }
    }
    // Rounds are published one at a time, so the feed should never offer two
    // open rounds to pick at once.
    const open = data.rounds.filter(r => !roundLockState(r, now).locked);
    expect(open.length).toBeLessThanOrEqual(1);
  });

  it('takes every priced fixture, its lock time and its frozen probabilities from game_fixtures.json', async () => {
    const data = (await loadPredictionGameData())!;
    const manifest = (await loadGameFixtures())!;
    expect(manifest).not.toBeNull();
    const byId = new Map(
      manifest.matchdays.flatMap(md => md.fixtures.map(fx => [fx.id, fx] as const)),
    );
    for (const round of data.rounds) {
      for (const f of round.fixtures) {
        const fx = byId.get(f.id!);
        expect(fx, `${f.id} in the manifest`).toBeDefined();
        expect(f.locksAt).toBe(fx!.locks_at ?? null);
        expect(f.kickoff).toBe(fx!.kickoff);
        const total = (fx!.p_home as number) + (fx!.p_draw as number) + (fx!.p_away as number);
        expect(f.model[0]).toBeCloseTo((fx!.p_home as number) / total, 9);
      }
    }
  });

  it('builds rounds from a manifest: unpriced rounds out, results and locks in', () => {
    const rounds = roundsFromGameFixtures({
      season: '2026-27',
      generated_at: '2026-10-05T19:03:29Z',
      n_matchdays: 34,
      matchdays: [
        { matchday: 7, kickoff_confirmed: true, fixtures: [
          { id: 'md07-porto-vs-benfica', home: 'Porto', away: 'Benfica', kickoff: '2026-09-20T19:30:00Z', kickoff_confirmed: true, locks_at: '2026-09-20T19:30:00Z', p_home: 0.5, p_draw: 0.25, p_away: 0.25, home_goals: 3, away_goals: 1, probs_source: 'md06.json@bf7d5eb' },
        ] },
        { matchday: 8, kickoff_confirmed: true, fixtures: [
          { id: 'md08-sc-braga-vs-sporting-cp', home: 'SC Braga', away: 'Sporting CP', kickoff: '2026-10-09T19:15:00Z', kickoff_confirmed: true, locks_at: '2026-10-09T19:15:00Z', p_home: 0.24, p_draw: 0.24, p_away: 0.52, home_goals: null, away_goals: null },
        ] },
        { matchday: 9, kickoff_confirmed: false, fixtures: [
          { id: 'md09-porto-vs-arouca', home: 'Porto', away: 'Arouca', kickoff: '2026-10-18T23:00:00Z', kickoff_confirmed: false, locks_at: '2026-10-16T23:00:00Z', p_home: null, p_draw: null, p_away: null },
        ] },
      ],
    });
    expect(rounds.map(r => r.matchday)).toEqual([7, 8]);
    expect(rounds[0].fixtures[0]).toMatchObject({
      id: 'md07-porto-vs-benfica',
      probsSource: 'md06.json@bf7d5eb',
      result: { homeGoals: 3, awayGoals: 1, outcome: 'H' },
    });
    expect(roundLockState(rounds[1], Date.parse('2026-10-09T19:14:00Z')).locked).toBe(false);
    expect(roundLockState(rounds[1], Date.parse('2026-10-09T19:15:00Z')).locked).toBe(true);
  });

  it('scores an empty entry over real data without throwing', async () => {
    const data = (await loadPredictionGameData())!;
    const season = scoreSeason(data, {});
    expect(season.matchesScored).toBe(0);
    expect(season.roundsWon).toBe(0);
    expect(season.userMean).toBeNull();
  });
});
