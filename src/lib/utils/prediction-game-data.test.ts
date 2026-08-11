import { describe, expect, it } from 'vitest';
import { loadPredictionGameData } from '@/lib/utils/football-data-loader';
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

  it('scores an empty entry over real data without throwing', async () => {
    const data = (await loadPredictionGameData())!;
    const season = scoreSeason(data, {});
    expect(season.matchesScored).toBe(0);
    expect(season.roundsWon).toBe(0);
    expect(season.userMean).toBeNull();
  });
});
