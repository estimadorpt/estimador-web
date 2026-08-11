import { describe, expect, it } from 'vitest';
import {
  STORAGE_VERSION,
  fixtureKey,
  findOpenRound,
  matchOutcome,
  normalizeProbs,
  parseKickoff,
  parseStoredGame,
  probsFromPick,
  roundLockState,
  rps,
  scoreRound,
  scoreSeason,
  serializeGame,
  setSliderValue,
  toPercents,
  type GameFixture,
  type GameRound,
  type PickMap,
  type PredictionGameData,
  type ProbVector,
} from './prediction-game';

/* ------------------------------------------------------------- fixtures */

function fixture(
  home: string,
  away: string,
  model: ProbVector,
  opts: { goals?: [number, number]; kickoff?: string | null } = {},
): GameFixture {
  const { goals, kickoff = null } = opts;
  return {
    key: fixtureKey(home, away),
    home,
    away,
    model,
    kickoff,
    result: goals
      ? { homeGoals: goals[0], awayGoals: goals[1], outcome: matchOutcome(goals[0], goals[1]) }
      : null,
  };
}

const round = (matchday: number, fixtures: GameFixture[]): GameRound => ({ matchday, fixtures });

/* ------------------------------------------------------------------ RPS */

describe('rps', () => {
  // Golden values produced by the model repo's own implementation:
  //   uv run python -c "from liga_predict.model.evaluate import rps_single; ..."
  // This pins the TypeScript mirror to the Python source of truth rather than
  // to itself.
  const golden: [ProbVector, 'H' | 'D' | 'A', number][] = [
    [[1.0, 0.0, 0.0], 'H', 0.0],
    [[0.0, 0.0, 1.0], 'H', 1.0],
    [[1 / 3, 1 / 3, 1 / 3], 'D', 0.11111111111111112],
    [[0.7, 0.2, 0.1], 'A', 0.6499999999999999],
    [[0.7, 0.2, 0.1], 'H', 0.050000000000000024],
    [[0.433, 0.2789, 0.2881], 'D', 0.135245305],
    [[0.0929, 0.1637, 0.7434], 'A', 0.037236985],
    [[0.5, 0.3, 0.2], 'D', 0.145],
    [[0.2, 0.3, 0.5], 'H', 0.44500000000000006],
  ];

  it.each(golden)('matches Python rps_single for %j / %s', (probs, outcome, expected) => {
    expect(rps(probs, outcome)).toBeCloseTo(expected, 12);
  });

  it('is ordered: missing by two categories costs more than by one', () => {
    const p: ProbVector = [0.7, 0.2, 0.1];
    expect(rps(p, 'H')).toBeLessThan(rps(p, 'D'));
    expect(rps(p, 'D')).toBeLessThan(rps(p, 'A'));
  });

  it('punishes overconfidence more than hedging', () => {
    const confident: ProbVector = [0.9, 0.07, 0.03];
    const hedged: ProbVector = [0.5, 0.25, 0.25];
    // Both wrong: the confident forecast is hurt far more.
    expect(rps(confident, 'A')).toBeGreaterThan(rps(hedged, 'A'));
    // Both right: the confident forecast is rewarded.
    expect(rps(confident, 'H')).toBeLessThan(rps(hedged, 'H'));
  });

  it('bounds a perfect and a maximally wrong forecast at 0 and 1', () => {
    expect(rps([0, 1, 0], 'D')).toBe(0);
    expect(rps([1, 0, 0], 'A')).toBe(1);
  });
});

describe('matchOutcome', () => {
  it('reads the score line', () => {
    expect(matchOutcome(2, 0)).toBe('H');
    expect(matchOutcome(1, 1)).toBe('D');
    expect(matchOutcome(0, 1)).toBe('A');
  });
});

/* ------------------------------------------------- probability handling */

describe('normalizeProbs / toPercents', () => {
  it('rescales to sum 1', () => {
    const v = normalizeProbs([2, 1, 1]);
    expect(v[0]).toBeCloseTo(0.5, 12);
    expect(v[0] + v[1] + v[2]).toBeCloseTo(1, 12);
  });

  it('falls back to uniform for degenerate input', () => {
    expect(normalizeProbs([0, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(normalizeProbs([NaN, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it('always yields integer percentages summing to 100', () => {
    for (const v of [
      [1 / 3, 1 / 3, 1 / 3],
      [0.005, 0.005, 0.99],
      [0.333, 0.333, 0.334],
      [0.4335, 0.2789, 0.2876],
    ] as ProbVector[]) {
      const pct = toPercents(normalizeProbs(v));
      expect(pct[0] + pct[1] + pct[2]).toBe(100);
    }
  });
});

describe('probsFromPick', () => {
  it('gives the picked outcome the confidence weight', () => {
    expect(probsFromPick('H', 'alta')[0]).toBeCloseTo(0.7, 9);
    expect(probsFromPick('D', 'media')[1]).toBeCloseTo(0.55, 9);
    expect(probsFromPick('A', 'leve')[2]).toBeCloseTo(0.4, 9);
  });

  it('always returns a normalised vector', () => {
    for (const pick of ['H', 'D', 'A'] as const) {
      for (const conf of ['leve', 'media', 'alta'] as const) {
        const v = probsFromPick(pick, conf);
        expect(v[0] + v[1] + v[2]).toBeCloseTo(1, 12);
        expect(Math.min(...v)).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the picked outcome on top', () => {
    const v = probsFromPick('A', 'leve');
    expect(v[2]).toBeGreaterThan(v[0]);
    expect(v[2]).toBeGreaterThan(v[1]);
  });
});

describe('setSliderValue', () => {
  it('keeps the vector summing to 1', () => {
    const out = setSliderValue([0.4, 0.3, 0.3], 0, 0.8);
    expect(out[0]).toBeCloseTo(0.8, 12);
    expect(out[0] + out[1] + out[2]).toBeCloseTo(1, 12);
  });

  it('preserves the ratio between the two untouched outcomes', () => {
    const out = setSliderValue([0.5, 0.3, 0.2], 0, 0.2);
    // draw:away was 3:2 and must stay 3:2 across the new 0.8 of mass
    expect(out[1] / out[2]).toBeCloseTo(1.5, 9);
    expect(out[1]).toBeCloseTo(0.48, 9);
    expect(out[2]).toBeCloseTo(0.32, 9);
  });

  it('splits evenly when the untouched pair has collapsed to zero', () => {
    const out = setSliderValue([1, 0, 0], 0, 0.5);
    expect(out[1]).toBeCloseTo(0.25, 12);
    expect(out[2]).toBeCloseTo(0.25, 12);
  });

  it('clamps out-of-range input', () => {
    expect(setSliderValue([0.4, 0.3, 0.3], 1, 5)[1]).toBeCloseTo(1, 12);
    expect(setSliderValue([0.4, 0.3, 0.3], 1, -2)[1]).toBeCloseTo(0, 12);
  });
});

/* -------------------------------------------------------------- locking */

describe('parseKickoff', () => {
  it('reads a naive stamp as Portuguese summer time (UTC+01:00)', () => {
    expect(parseKickoff('2026-08-10T19:15:00')).toBe(Date.parse('2026-08-10T18:15:00Z'));
  });

  it('respects an explicit offset when one is published', () => {
    expect(parseKickoff('2026-08-10T19:15:00Z')).toBe(Date.parse('2026-08-10T19:15:00Z'));
    expect(parseKickoff('2026-08-10T19:15:00+02:00')).toBe(Date.parse('2026-08-10T17:15:00Z'));
  });

  it('treats missing or unusable stamps as absent', () => {
    expect(parseKickoff(null)).toBeNull();
    expect(parseKickoff(undefined)).toBeNull();
    expect(parseKickoff('')).toBeNull();
    // The model writes "" when the date is NaN; anything else unparseable too.
    expect(parseKickoff('not a date')).toBeNull();
  });
});

describe('roundLockState', () => {
  const kickoff = '2026-08-10T19:15:00';
  const kickoffMs = Date.parse('2026-08-10T18:15:00Z');

  it('is open with neither results nor kickoffs (a next matchday)', () => {
    const r = round(2, [fixture('Arouca', 'Moreirense', [0.43, 0.28, 0.29])]);
    const lock = roundLockState(r, Date.now());
    expect(lock.locked).toBe(false);
    expect(lock.reason).toBe('open');
    expect(lock.lockAt).toBeNull();
  });

  it('locks at the earliest kickoff', () => {
    const r = round(2, [
      fixture('Arouca', 'Moreirense', [0.43, 0.28, 0.29], { kickoff: '2026-08-11T20:00:00' }),
      fixture('Rio Ave', 'Porto', [0.11, 0.2, 0.69], { kickoff }),
    ]);
    expect(roundLockState(r, kickoffMs - 1).locked).toBe(false);
    expect(roundLockState(r, kickoffMs).locked).toBe(true);
    expect(roundLockState(r, kickoffMs).reason).toBe('kickoff');
    expect(roundLockState(r, kickoffMs).lockAt).toBe(kickoffMs);
  });

  it('locks the whole round as soon as any result is published', () => {
    const r = round(1, [
      fixture('Estoril', 'Famalicao', [0.37, 0.27, 0.36], { goals: [1, 1] }),
      // still to be played, and its kickoff is in the far future
      fixture('Santa Clara', 'Nacional', [0.47, 0.28, 0.25], { kickoff: '2099-01-01T12:00:00' }),
    ]);
    const lock = roundLockState(r, Date.parse('2026-08-10T12:00:00Z'));
    expect(lock.locked).toBe(true);
    expect(lock.reason).toBe('results');
  });

  it('never unlocks a started round just because the clock is early', () => {
    const r = round(1, [fixture('Estoril', 'Famalicao', [0.37, 0.27, 0.36], { goals: [1, 1] })]);
    expect(roundLockState(r, 0).locked).toBe(true);
  });
});

describe('findOpenRound', () => {
  it('returns the first round still open, skipping played ones', () => {
    const data: PredictionGameData = {
      season: '2026-27',
      generatedAt: '2026-08-10T21:33:52Z',
      rounds: [
        round(1, [fixture('Estoril', 'Famalicao', [0.37, 0.27, 0.36], { goals: [1, 1] })]),
        round(2, [fixture('Arouca', 'Moreirense', [0.43, 0.28, 0.29])]),
      ],
    };
    expect(findOpenRound(data, Date.now())?.matchday).toBe(2);
  });

  it('returns null when everything is locked', () => {
    const data: PredictionGameData = {
      season: '2026-27',
      generatedAt: '2026-08-10T21:33:52Z',
      rounds: [round(1, [fixture('Estoril', 'Famalicao', [0.37, 0.27, 0.36], { goals: [1, 1] })])],
    };
    expect(findOpenRound(data, Date.now())).toBeNull();
  });
});

/* -------------------------------------------------------------- scoring */

describe('scoreRound', () => {
  const r = round(1, [
    fixture('Estoril', 'Famalicao', [0.37, 0.27, 0.36], { goals: [1, 1] }), // D
    fixture('Porto', 'Alverca', [0.77, 0.15, 0.08], { goals: [2, 0] }), // H
    fixture('Santa Clara', 'Nacional', [0.47, 0.28, 0.25]), // not played
  ]);

  it('scores only fixtures that were both picked and played', () => {
    const picks: PickMap = {
      'Estoril|Famalicao': { p: [0.3, 0.4, 0.3] },
      'Santa Clara|Nacional': { p: [0.5, 0.3, 0.2] },
    };
    const s = scoreRound(r, picks);
    expect(s.scored.map(f => f.key)).toEqual(['Estoril|Famalicao']);
    expect(s.pending).toBe(1); // Santa Clara picked, no result yet
    expect(s.missed).toBe(1); // Porto played, never picked
    expect(s.complete).toBe(false);
  });

  it('compares user and model over the identical subset', () => {
    const picks: PickMap = { 'Porto|Alverca': { p: [0.9, 0.07, 0.03] } };
    const s = scoreRound(r, picks);
    expect(s.scored).toHaveLength(1);
    expect(s.userTotal).toBeCloseTo(rps([0.9, 0.07, 0.03], 'H'), 12);
    expect(s.modelTotal).toBeCloseTo(rps([0.77, 0.15, 0.08], 'H'), 12);
    // Backing the favourite harder than the model beats it when it comes in.
    expect(s.beatModel).toBe(true);
    expect(s.scored[0].edge).toBeGreaterThan(0);
  });

  it('reports beatModel false when the model was closer', () => {
    const picks: PickMap = { 'Porto|Alverca': { p: [0.2, 0.3, 0.5] } };
    expect(scoreRound(r, picks).beatModel).toBe(false);
  });

  it('returns null verdict and null means when nothing is scoreable', () => {
    const s = scoreRound(r, {});
    expect(s.beatModel).toBeNull();
    expect(s.userMean).toBeNull();
    expect(s.modelMean).toBeNull();
    expect(s.scored).toHaveLength(0);
  });

  it('normalises a stored vector that drifted off 1', () => {
    const picks: PickMap = { 'Porto|Alverca': { p: [0.8, 0.1, 0.1] } };
    const s = scoreRound(r, picks);
    expect(s.scored[0].user[0] + s.scored[0].user[1] + s.scored[0].user[2]).toBeCloseTo(1, 12);
  });

  it('marks a round complete only when every fixture has a result', () => {
    const full = round(1, [
      fixture('Estoril', 'Famalicao', [0.37, 0.27, 0.36], { goals: [1, 1] }),
      fixture('Porto', 'Alverca', [0.77, 0.15, 0.08], { goals: [2, 0] }),
    ]);
    expect(scoreRound(full, { 'Porto|Alverca': { p: [0.5, 0.3, 0.2] } }).complete).toBe(true);
  });
});

describe('scoreSeason', () => {
  const data: PredictionGameData = {
    season: '2026-27',
    generatedAt: '2026-08-10T21:33:52Z',
    rounds: [
      // complete round, user beats the model
      round(1, [fixture('Porto', 'Alverca', [0.77, 0.15, 0.08], { goals: [2, 0] })]),
      // complete round, model beats the user
      round(2, [fixture('Rio Ave', 'Porto', [0.11, 0.2, 0.69], { goals: [0, 2] })]),
      // still in progress: one played, one not
      round(3, [
        fixture('Arouca', 'Moreirense', [0.43, 0.28, 0.29], { goals: [1, 0] }),
        fixture('SC Braga', 'Gil Vicente', [0.59, 0.23, 0.18]),
      ]),
    ],
  };

  const picks: PickMap = {
    'Porto|Alverca': { p: [0.9, 0.07, 0.03] }, // right, confident → beats model
    'Rio Ave|Porto': { p: [0.6, 0.25, 0.15] }, // badly wrong → loses
    'Arouca|Moreirense': { p: [0.5, 0.3, 0.2] },
    'SC Braga|Gil Vicente': { p: [0.6, 0.25, 0.15] },
  };

  it('counts only completed rounds in the N-of-M line', () => {
    const s = scoreSeason(data, picks);
    expect(s.roundsCounted).toBe(2); // round 3 is still in progress
    expect(s.roundsWon).toBe(1);
  });

  it('still scores the in-progress round provisionally', () => {
    const s = scoreSeason(data, picks);
    expect(s.matchesScored).toBe(3); // 1 + 1 + 1 played of round 3
    const r3 = s.rounds.find(r => r.matchday === 3)!;
    expect(r3.complete).toBe(false);
    expect(r3.scored).toHaveLength(1);
    expect(r3.pending).toBe(1);
  });

  it('aggregates means over every scored match', () => {
    const s = scoreSeason(data, picks);
    expect(s.userMean).toBeCloseTo(s.userTotal / 3, 12);
    expect(s.modelMean).toBeCloseTo(s.modelTotal / 3, 12);
  });

  it('is empty and safe with no picks at all', () => {
    const s = scoreSeason(data, {});
    expect(s.matchesScored).toBe(0);
    expect(s.roundsCounted).toBe(0);
    expect(s.roundsWon).toBe(0);
    expect(s.userMean).toBeNull();
    expect(s.skill).toBeNull();
  });
});

/* ---------------------------------------------------------- persistence */

describe('parseStoredGame', () => {
  const season = '2026-27';
  const good = serializeGame(season, {
    'Porto|Alverca': { p: [0.5, 0.3, 0.2], pick: 'H', conf: 'media', mode: 'quick' },
  });

  it('round-trips a valid store', () => {
    const parsed = parseStoredGame(good, season);
    expect(parsed?.picks['Porto|Alverca'].p[0]).toBeCloseTo(0.5, 12);
    expect(parsed?.picks['Porto|Alverca'].pick).toBe('H');
    expect(parsed?.picks['Porto|Alverca'].conf).toBe('media');
  });

  it('discards absent, unparseable or non-object payloads', () => {
    expect(parseStoredGame(null, season)).toBeNull();
    expect(parseStoredGame('', season)).toBeNull();
    expect(parseStoredGame('{not json', season)).toBeNull();
    expect(parseStoredGame('42', season)).toBeNull();
    expect(parseStoredGame('null', season)).toBeNull();
  });

  it('discards a store written by another schema version', () => {
    const stale = JSON.stringify({ version: STORAGE_VERSION + 1, season, picks: {} });
    expect(parseStoredGame(stale, season)).toBeNull();
    const ancient = JSON.stringify({ season, picks: {} });
    expect(parseStoredGame(ancient, season)).toBeNull();
  });

  it('discards a store from a different season', () => {
    expect(parseStoredGame(good, '2027-28')).toBeNull();
  });

  it('drops individual malformed picks without losing the good ones', () => {
    const mixed = JSON.stringify({
      version: STORAGE_VERSION,
      season,
      picks: {
        'Porto|Alverca': { p: [0.5, 0.3, 0.2] },
        'Bad|Sum': { p: [0.9, 0.9, 0.9] },
        'Bad|Length': { p: [0.5, 0.5] },
        'Bad|Type': { p: ['a', 'b', 'c'] },
        'Bad|Shape': 7,
        'Bad|Missing': {},
      },
    });
    const parsed = parseStoredGame(mixed, season);
    expect(Object.keys(parsed!.picks)).toEqual(['Porto|Alverca']);
  });

  it('ignores unrecognised UI hints rather than rejecting the pick', () => {
    const odd = JSON.stringify({
      version: STORAGE_VERSION,
      season,
      picks: { 'Porto|Alverca': { p: [0.5, 0.3, 0.2], pick: 'X', conf: 'nope', mode: 'weird' } },
    });
    const parsed = parseStoredGame(odd, season);
    expect(parsed!.picks['Porto|Alverca'].p[0]).toBeCloseTo(0.5, 12);
    expect(parsed!.picks['Porto|Alverca'].pick).toBeUndefined();
    expect(parsed!.picks['Porto|Alverca'].conf).toBeUndefined();
  });
});

describe('fixtureKey', () => {
  it('is direction sensitive so both legs stay distinct', () => {
    expect(fixtureKey('Porto', 'Benfica')).not.toBe(fixtureKey('Benfica', 'Porto'));
  });

  it('uses raw data names, not display names', () => {
    expect(fixtureKey('Famalicao', 'Vitoria SC')).toBe('Famalicao|Vitoria SC');
  });
});
