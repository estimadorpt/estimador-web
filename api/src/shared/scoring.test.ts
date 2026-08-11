import { describe, expect, it } from 'vitest';
import {
  aggregateSeason,
  compareLeaderboard,
  isUsableProbVector,
  normalizeProbs,
  outcomeOf,
  rps,
  scoreModelSlate,
  scoreRound,
  type ProbVector,
  type ScorableFixture,
} from './scoring';

/**
 * The API's scoring must agree with the model repo's `rps_single`
 * (estimador-football/src/liga_predict/model/evaluate.py) to the last bit.
 * Everything below is pinned to values printed by that Python function, not to
 * this implementation, so a drift in either direction fails the build.
 */
describe('rps — mirror of Python rps_single', () => {
  const golden: [ProbVector, 'H' | 'D' | 'A', number][] = [
    // Degenerate bounds.
    [[1.0, 0.0, 0.0], 'H', 0.0],
    [[0.0, 0.0, 1.0], 'H', 1.0],
    // Uniform.
    [[1 / 3, 1 / 3, 1 / 3], 'D', 0.11111111111111112],
    // Ordered penalty: same forecast, three different outcomes.
    [[0.7, 0.2, 0.1], 'H', 0.050000000000000024],
    [[0.7, 0.2, 0.1], 'A', 0.6499999999999999],
    [[0.5, 0.3, 0.2], 'D', 0.145],
    [[0.2, 0.3, 0.5], 'H', 0.44500000000000006],
    // Real published model probabilities from game_fixtures.json (2026-27).
    [[0.7705, 0.1508, 0.0787], 'H', 0.02943197000000001],
    [[0.0933, 0.1643, 0.7425], 'A', 0.037531325],
    [[0.4336, 0.2788, 0.2876], 'D', 0.13536136000000001],
  ];

  it.each(golden)('matches rps_single for %j / %s', (probs, outcome, expected) => {
    expect(rps(probs, outcome)).toBeCloseTo(expected, 12);
  });

  it('is hand-computable: RPS = ½[(cumP₁-cumO₁)² + (cumP₂-cumO₂)²]', () => {
    // [0.5, 0.3, 0.2] on a draw: cumP = (0.5, 0.8), cumO = (0, 1)
    //   ½[(0.5)² + (-0.2)²] = ½[0.25 + 0.04] = 0.145
    expect(rps([0.5, 0.3, 0.2], 'D')).toBeCloseTo(0.5 * (0.25 + 0.04), 15);
    // [0.2, 0.3, 0.5] on a home win: cumP = (0.2, 0.5), cumO = (1, 1)
    //   ½[(-0.8)² + (-0.5)²] = ½[0.64 + 0.25] = 0.445
    expect(rps([0.2, 0.3, 0.5], 'H')).toBeCloseTo(0.5 * (0.64 + 0.25), 15);
  });

  it('is ordered: missing by two categories costs more than by one', () => {
    const p: ProbVector = [0.7, 0.2, 0.1];
    expect(rps(p, 'H')).toBeLessThan(rps(p, 'D'));
    expect(rps(p, 'D')).toBeLessThan(rps(p, 'A'));
  });

  it('punishes overconfidence and rewards it symmetrically', () => {
    const confident: ProbVector = [0.9, 0.07, 0.03];
    const hedged: ProbVector = [0.5, 0.25, 0.25];
    expect(rps(confident, 'A')).toBeGreaterThan(rps(hedged, 'A'));
    expect(rps(confident, 'H')).toBeLessThan(rps(hedged, 'H'));
  });
});

describe('outcomeOf', () => {
  it('reads the score line', () => {
    expect(outcomeOf(2, 0)).toBe('H');
    expect(outcomeOf(1, 1)).toBe('D');
    expect(outcomeOf(0, 3)).toBe('A');
  });
});

describe('normalizeProbs', () => {
  it('rescales to sum 1 while preserving ratios', () => {
    expect(normalizeProbs([2, 1, 1])).toEqual([0.5, 0.25, 0.25]);
  });

  it('falls back to uniform for degenerate input', () => {
    expect(normalizeProbs([0, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(normalizeProbs(null)).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(normalizeProbs([NaN, -1, 'x' as unknown as number])).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it('drops negatives rather than trusting them', () => {
    expect(normalizeProbs([1, -1, 1])).toEqual([0.5, 0, 0.5]);
  });
});

describe('isUsableProbVector', () => {
  it('accepts three finite non-negative numbers with positive mass', () => {
    expect(isUsableProbVector([0.5, 0.3, 0.2])).toBe(true);
    expect(isUsableProbVector([50, 30, 20])).toBe(true); // caller normalises
  });

  it('rejects anything else', () => {
    expect(isUsableProbVector([0, 0, 0])).toBe(false);
    expect(isUsableProbVector([0.5, 0.5])).toBe(false);
    expect(isUsableProbVector([0.5, 0.3, -0.2])).toBe(false);
    expect(isUsableProbVector(['0.5', 0.3, 0.2])).toBe(false);
    expect(isUsableProbVector(null)).toBe(false);
    expect(isUsableProbVector({ 0: 0.5, 1: 0.3, 2: 0.2 })).toBe(false);
  });
});

/* ------------------------------------------------------------ round scoring */

const fixture = (
  id: string,
  model: ProbVector | null,
  outcome: 'H' | 'D' | 'A' | null,
): ScorableFixture => ({ id, model, outcome });

describe('scoreRound', () => {
  it('scores the model on exactly the subset the player picked', () => {
    const fixtures = [
      fixture('a', [0.5, 0.3, 0.2], 'H'),
      fixture('b', [0.5, 0.3, 0.2], 'A'),
    ];
    // Player picked only 'a'; 'b' must not enter either total.
    const score = scoreRound(fixtures, { a: [0.6, 0.25, 0.15] });
    expect(score.matches).toBe(1);
    expect(score.userTotal).toBeCloseTo(rps([0.6, 0.25, 0.15], 'H'), 15);
    expect(score.modelTotal).toBeCloseTo(rps([0.5, 0.3, 0.2], 'H'), 15);
  });

  it('normalises a client vector before scoring it', () => {
    const fixtures = [fixture('a', [0.5, 0.3, 0.2], 'H')];
    const asPercent = scoreRound(fixtures, { a: [60, 25, 15] });
    const asProbs = scoreRound(fixtures, { a: [0.6, 0.25, 0.15] });
    expect(asPercent.userTotal).toBeCloseTo(asProbs.userTotal, 15);
  });

  it('skips fixtures with no result and fixtures the model never priced', () => {
    const fixtures = [
      fixture('played', [0.5, 0.3, 0.2], 'H'),
      fixture('pending', [0.5, 0.3, 0.2], null),
      fixture('unpriced', null, 'H'),
    ];
    const score = scoreRound(fixtures, {
      played: [0.6, 0.25, 0.15],
      pending: [0.6, 0.25, 0.15],
      unpriced: [0.6, 0.25, 0.15],
    });
    expect(score.matches).toBe(1);
  });

  it('gives the tiebreak to the model', () => {
    const fixtures = [fixture('a', [0.5, 0.3, 0.2], 'H')];
    const tie = scoreRound(fixtures, { a: [0.5, 0.3, 0.2] });
    expect(tie.beatModel).toBe(false);

    const better = scoreRound(fixtures, { a: [0.9, 0.05, 0.05] });
    expect(better.beatModel).toBe(true);
  });

  it('returns a zeroed round when nothing was picked', () => {
    const score = scoreRound([fixture('a', [0.5, 0.3, 0.2], 'H')], {});
    expect(score).toEqual({ matches: 0, userTotal: 0, modelTotal: 0, beatModel: false });
  });

  it('ignores picks for fixtures that are not in the matchday', () => {
    const score = scoreRound([fixture('a', [0.5, 0.3, 0.2], 'H')], {
      'not-a-fixture': [1, 0, 0],
    });
    expect(score.matches).toBe(0);
  });
});

describe('scoreModelSlate', () => {
  it('scores every decided, priced fixture of the round', () => {
    const fixtures = [
      fixture('a', [0.5, 0.3, 0.2], 'H'),
      fixture('b', [0.2, 0.3, 0.5], 'A'),
      fixture('c', [0.2, 0.3, 0.5], null),
      fixture('d', null, 'H'),
    ];
    const slate = scoreModelSlate(fixtures);
    expect(slate.matches).toBe(2);
    expect(slate.total).toBeCloseTo(rps([0.5, 0.3, 0.2], 'H') + rps([0.2, 0.3, 0.5], 'A'), 15);
  });
});

/* -------------------------------------------------------- season aggregate */

describe('aggregateSeason', () => {
  const rows = [
    { matchday: 1, matches: 9, userTotal: 1.8, modelTotal: 1.9, beatModel: true },
    { matchday: 2, matches: 5, userTotal: 1.2, modelTotal: 1.0, beatModel: false },
    { matchday: 3, matches: 0, userTotal: 0, modelTotal: 0, beatModel: false },
  ];

  it('sums only the matchdays that actually scored something', () => {
    const agg = aggregateSeason(rows);
    expect(agg.matches).toBe(14);
    expect(agg.matchdays).toBe(2);
    expect(agg.roundsCounted).toBe(2);
    expect(agg.roundsWon).toBe(1);
    expect(agg.userTotal).toBeCloseTo(3.0, 12);
    expect(agg.modelTotal).toBeCloseTo(2.9, 12);
    expect(agg.userMean).toBeCloseTo(3.0 / 14, 12);
    expect(agg.edge).toBeCloseTo(-0.1, 12);
  });

  it('reports nulls rather than NaN for a player who never scored', () => {
    const agg = aggregateSeason([]);
    expect(agg.userMean).toBeNull();
    expect(agg.modelMean).toBeNull();
    expect(agg.matches).toBe(0);
  });
});

describe('compareLeaderboard', () => {
  const row = (displayName: string, userMean: number | null, matchdays: number) => ({
    displayName,
    userMean,
    matchdays,
  });

  it('puts the lowest mean RPS first', () => {
    const sorted = [row('b', 0.21, 3), row('a', 0.19, 1)].sort(compareLeaderboard);
    expect(sorted.map(r => r.displayName)).toEqual(['a', 'b']);
  });

  it('breaks ties towards whoever played more matchdays', () => {
    const sorted = [row('a', 0.2, 1), row('b', 0.2, 5)].sort(compareLeaderboard);
    expect(sorted.map(r => r.displayName)).toEqual(['b', 'a']);
  });

  it('sinks unscored players to the bottom instead of ranking them first', () => {
    const sorted = [row('a', null, 0), row('b', 0.9, 1)].sort(compareLeaderboard);
    expect(sorted.map(r => r.displayName)).toEqual(['b', 'a']);
  });
});
