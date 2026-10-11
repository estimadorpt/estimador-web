import { afterEach, describe, expect, it } from 'vitest';
import {
  RETIRED_KEYS,
  STORAGE_KEY,
  STORAGE_VERSION,
  awaitingResults,
  clearPicks,
  fixtureKey,
  findOpenRound,
  forgetRetiredKeys,
  loadPicks,
  matchOutcome,
  normalizeProbs,
  parseKickoff,
  parseStoredGame,
  pickedOutcome,
  probsFromPick,
  roundLockState,
  rps,
  savePicks,
  serializeGame,
  tallyRound,
  tallySeason,
  toPercents,
  withPublishedResults,
  type Confidence,
  type GameFixture,
  type GameRound,
  type Outcome,
  type PickMap,
  type PredictionGameData,
  type ProbVector,
  type StoredPick,
} from './prediction-game';

/* ------------------------------------------------------------- fixtures */

function fixture(
  home: string,
  away: string,
  model: ProbVector,
  opts: { goals?: [number, number]; kickoff?: string | null; confirmed?: boolean } = {},
): GameFixture {
  const { goals, kickoff = null, confirmed } = opts;
  return {
    key: fixtureKey(home, away),
    home,
    away,
    model,
    kickoff,
    ...(confirmed !== undefined ? { kickoffConfirmed: confirmed } : {}),
    result: goals
      ? { homeGoals: goals[0], awayGoals: goals[1], outcome: matchOutcome(goals[0], goals[1]) }
      : null,
  };
}

const round = (matchday: number, fixtures: GameFixture[]): GameRound => ({ matchday, fixtures });

/** A pick as the page stores it: one outcome at one certainty step. */
const pick = (o: Outcome, conf: Confidence = 'media'): StoredPick => ({ p: probsFromPick(o, conf), pick: o, conf });

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

  it('gives the draw at least the unpicked side when a side is picked (F19)', () => {
    for (const conf of ['leve', 'media', 'alta'] as const) {
      const away = probsFromPick('A', conf);
      expect(away[1]).toBeGreaterThanOrEqual(away[0]);
      const home = probsFromPick('H', conf);
      expect(home[1]).toBeGreaterThanOrEqual(home[2]);
    }
    const v = probsFromPick('A', 'leve');
    expect(v[1]).toBeCloseTo(0.6 * 0.55, 9);
    expect(v[0]).toBeCloseTo(0.6 * 0.45, 9);
  });

  it('splits a draw pick between the sides by the base rates', () => {
    const v = probsFromPick('D', 'media');
    expect(v[0]).toBeGreaterThan(v[2]);
    expect(v[0] + v[2]).toBeCloseTo(0.45, 9);
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

  it("prefers the manifest's lock time over the kickoff", () => {
    // An unconfirmed midnight placeholder locks at the earliest plausible
    // slot of its round, which is earlier than the placeholder itself.
    const r = round(9, [
      {
        ...fixture('Porto', 'Benfica', [0.5, 0.25, 0.25], { kickoff: '2026-10-18T23:00:00Z' }),
        locksAt: '2026-10-16T23:00:00Z',
        kickoffConfirmed: false,
      },
    ]);
    const lockMs = Date.parse('2026-10-16T23:00:00Z');
    expect(roundLockState(r, lockMs - 1).locked).toBe(false);
    expect(roundLockState(r, lockMs)).toMatchObject({ locked: true, reason: 'kickoff', lockAt: lockMs });
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

describe('tallyRound: closer than the model, game by game', () => {
  // Matchday 8, three games played and one still to play.
  const r = round(8, [
    fixture('Porto', 'Alverca', [0.77, 0.15, 0.08], { goals: [2, 0] }), // H, as the model said
    fixture('Estoril', 'Famalicao', [0.37, 0.27, 0.36], { goals: [1, 1] }), // D
    fixture('Rio Ave', 'Porto', [0.11, 0.2, 0.69], { goals: [2, 1] }), // H, an upset
    fixture('Santa Clara', 'Nacional', [0.47, 0.28, 0.25], { kickoff: '2026-10-12T19:15:00Z' }),
  ]);
  const picks: PickMap = {
    'Porto|Alverca': pick('H', 'alta'), // 70% on the win: the model's 77% was closer
    'Estoril|Famalicao': pick('D'), // 55% on the draw: closer
    'Rio Ave|Porto': pick('H', 'leve'), // 40% on the upset: closer
    'Santa Clara|Nacional': pick('H'),
  };

  it('counts the games where the reader was closer, out of the games picked and played', () => {
    const t = tallyRound(r, picks);
    expect(t.picked).toBe(4);
    expect(t.scored).toBe(3);
    expect(t.closer).toBe(2);
    expect(t.modelCloser).toBe(1);
    expect(t.level).toBe(0);
    expect(t.games.map(g => g.status)).toEqual(['model', 'closer', 'closer', 'unplayed']);
    expect(t.outcome).toBe('won');
  });

  it('decides each game by RPS, the rule the game always had: lower is closer', () => {
    const t = tallyRound(r, picks);
    for (const g of t.games.filter(x => x.fixture.result)) {
      expect(g.userRps).toBeCloseTo(rps(g.user!, g.fixture.result!.outcome), 12);
      expect(g.modelRps).toBeCloseTo(rps(g.fixture.model, g.fixture.result!.outcome), 12);
      expect(g.status).toBe(g.userRps! < g.modelRps! ? 'closer' : 'model');
    }
  });

  it('says which games of a partly played round are still to come', () => {
    const t = tallyRound(r, picks);
    expect(t.complete).toBe(false);
    expect(t.remaining.map(f => f.key)).toEqual(['Santa Clara|Nacional']);
  });

  it('leaves the games the reader did not pick out of the count', () => {
    const t = tallyRound(r, { 'Rio Ave|Porto': pick('H', 'leve') });
    expect(t.scored).toBe(1);
    expect(t.closer).toBe(1);
    expect(t.games.map(g => g.status)).toEqual(['unpicked', 'unpicked', 'closer', 'unplayed']);
    expect(t.games[0].pick).toBeNull();
    expect(t.games[2].pick).toBe('H');
  });

  it('has no outcome while nothing the reader picked has been played', () => {
    const t = tallyRound(r, { 'Santa Clara|Nacional': pick('A') });
    expect(t.picked).toBe(1);
    expect(t.scored).toBe(0);
    expect(t.outcome).toBeNull();
  });

  it('calls a game level when both forecasts are the same, and a round level when the counts are', () => {
    const t = tallyRound(r, {
      'Porto|Alverca': { p: [0.77, 0.15, 0.08] },
      'Estoril|Famalicao': pick('D'),
      'Rio Ave|Porto': { p: [0.02, 0.08, 0.9] }, // all but certain of the away win
    });
    expect(t.games.map(g => g.status).slice(0, 3)).toEqual(['level', 'closer', 'model']);
    expect(t.level).toBe(1);
    expect(t.outcome).toBe('level');
  });

  it('normalises a stored vector that drifted off 1', () => {
    const t = tallyRound(r, { 'Porto|Alverca': { p: [0.8, 0.1, 0.1] } });
    const user = t.games[0].user!;
    expect(user[0] + user[1] + user[2]).toBeCloseTo(1, 12);
  });

  it('marks a round complete only when every game has a result', () => {
    const full = round(1, [
      fixture('Estoril', 'Famalicao', [0.37, 0.27, 0.36], { goals: [1, 1] }),
      fixture('Porto', 'Alverca', [0.77, 0.15, 0.08], { goals: [2, 0] }),
    ]);
    const t = tallyRound(full, { 'Porto|Alverca': pick('H') });
    expect(t.complete).toBe(true);
    expect(t.remaining).toEqual([]);
  });
});

describe('tallySeason: completed rounds only', () => {
  const data: PredictionGameData = {
    season: '2026-27',
    generatedAt: '2026-10-11T19:04:45Z',
    rounds: [
      // complete: the reader closer in 2 of 2
      round(1, [
        fixture('Estoril', 'Famalicao', [0.37, 0.27, 0.36], { goals: [1, 1] }),
        fixture('Rio Ave', 'Porto', [0.11, 0.2, 0.69], { goals: [2, 1] }),
      ]),
      // complete: the model closer
      round(2, [fixture('Porto', 'Alverca', [0.77, 0.15, 0.08], { goals: [2, 0] })]),
      // a postponed game still to play: closer so far, but not counted yet
      round(3, [
        fixture('Arouca', 'Moreirense', [0.43, 0.28, 0.29], { goals: [0, 0] }),
        fixture('SC Braga', 'Gil Vicente', [0.59, 0.23, 0.18], { kickoff: '2026-10-19T19:15:00Z' }),
      ]),
      // never picked
      round(4, [fixture('Benfica', 'Casa Pia', [0.8, 0.12, 0.08], { goals: [3, 0] })]),
    ],
  };
  const picks: PickMap = {
    'Estoril|Famalicao': pick('D'),
    'Rio Ave|Porto': pick('H', 'leve'),
    'Porto|Alverca': pick('A'),
    'Arouca|Moreirense': pick('D', 'alta'),
    'SC Braga|Gil Vicente': pick('H'),
  };

  it('counts the rounds won out of the completed rounds the reader played', () => {
    const s = tallySeason(data, picks);
    expect(s.completed).toBe(2);
    expect(s.won).toBe(1);
    expect(s.level).toBe(0);
  });

  it('keeps a partly played round, and rounds never picked, out of the count', () => {
    const s = tallySeason(data, picks);
    expect(s.rounds.map(r => r.matchday)).toEqual([1, 2, 3]);
    const r3 = s.rounds.find(r => r.matchday === 3)!;
    expect(r3.complete).toBe(false);
    expect(r3.outcome).toBe('won'); // so far
    expect(r3.remaining.map(f => f.key)).toEqual(['SC Braga|Gil Vicente']);
  });

  it('counts the partly played round once its last game is in', () => {
    const later = withPublishedResults(data, {
      season: '2026-27',
      matchdays: [{ matchday: 3, fixtures: [{ home: 'SC Braga', away: 'Gil Vicente', home_goals: 2, away_goals: 0 }] }],
    });
    const s = tallySeason(later, picks);
    expect(s.completed).toBe(3);
    expect(s.rounds.find(r => r.matchday === 3)!.complete).toBe(true);
  });

  it('is empty and safe with no picks at all', () => {
    const s = tallySeason(data, {});
    expect(s.rounds).toEqual([]);
    expect(s.completed).toBe(0);
    expect(s.won).toBe(0);
  });
});

describe('pickedOutcome', () => {
  it('reads the outcome the reader chose', () => {
    expect(pickedOutcome(pick('D', 'leve'))).toBe('D');
  });

  it('falls back to the outcome an older free split favours', () => {
    expect(pickedOutcome({ p: [0.2, 0.3, 0.5] })).toBe('A');
  });
});

/* ------------------------------------------------ results since the build */

describe('awaitingResults', () => {
  const data: PredictionGameData = {
    season: '2026-27',
    generatedAt: '2026-10-11T19:04:45Z',
    rounds: [
      round(8, [
        fixture('Arouca', 'Estrela Amadora', [0.45, 0.28, 0.27], { kickoff: '2026-10-11T19:30:00Z', confirmed: true }),
        fixture('Famalicao', 'Alverca', [0.5, 0.27, 0.23], { kickoff: '2026-10-12T19:15:00Z', confirmed: false }),
      ]),
    ],
  };
  const picks: PickMap = { 'Arouca|Estrela Amadora': pick('H'), 'Famalicao|Alverca': pick('H') };

  it('waits two hours after kickoff before looking for a result', () => {
    expect(awaitingResults(data, picks, Date.parse('2026-10-11T21:29:00Z'))).toBe(false);
    expect(awaitingResults(data, picks, Date.parse('2026-10-11T21:30:00Z'))).toBe(true);
  });

  it('only looks for games the reader picked, with a confirmed kickoff', () => {
    expect(awaitingResults(data, { 'Famalicao|Alverca': pick('H') }, Date.parse('2026-10-20T00:00:00Z'))).toBe(false);
    expect(awaitingResults(data, {}, Date.parse('2026-10-20T00:00:00Z'))).toBe(false);
  });
});

describe('withPublishedResults', () => {
  const data: PredictionGameData = {
    season: '2026-27',
    generatedAt: '2026-10-11T19:04:45Z',
    rounds: [
      round(2, [fixture('SC Braga', 'Gil Vicente', [0.59, 0.23, 0.18])]),
      round(8, [
        fixture('Benfica', 'Vitoria SC', [0.6, 0.22, 0.18], { goals: [2, 0] }),
        fixture('Arouca', 'Estrela Amadora', [0.45, 0.28, 0.27]),
      ]),
    ],
  };

  it('fills in a result published after the page was built, by matchday and ordered pair', () => {
    const fresh = withPublishedResults(data, {
      season: '2026-27',
      matchdays: [
        { matchday: 8, fixtures: [{ home: 'Arouca', away: 'Estrela Amadora', home_goals: 1, away_goals: 2 }] },
        // The reverse pairing, or the same pair in another round, is another game.
        { matchday: 9, fixtures: [{ home: 'SC Braga', away: 'Gil Vicente', home_goals: 5, away_goals: 0 }] },
        { matchday: 2, fixtures: [{ home: 'Gil Vicente', away: 'SC Braga', home_goals: 1, away_goals: 0 }] },
      ],
    });
    expect(fresh.rounds[1].fixtures[1].result).toEqual({ homeGoals: 1, awayGoals: 2, outcome: 'A' });
    expect(fresh.rounds[0].fixtures[0].result).toBeNull();
    // The model's frozen forecast is never taken from the newer file.
    expect(fresh.rounds[1].fixtures[1].model).toEqual([0.45, 0.28, 0.27]);
  });

  it('changes nothing for another season, a missing file or unusable scores', () => {
    const other = withPublishedResults(data, {
      season: '2027-28',
      matchdays: [{ matchday: 8, fixtures: [{ home: 'Arouca', away: 'Estrela Amadora', home_goals: 1, away_goals: 2 }] }],
    });
    expect(other).toBe(data);
    expect(withPublishedResults(data, null)).toBe(data);
    expect(withPublishedResults(data, {} as never)).toBe(data);
    const junk = withPublishedResults(data, {
      season: '2026-27',
      matchdays: [
        { matchday: 8, fixtures: [
          { home: 'Arouca', away: 'Estrela Amadora', home_goals: null, away_goals: null },
          { home: 'Arouca', away: 'Estrela Amadora', home_goals: -1, away_goals: 2 },
          { home: 'Arouca', away: 'Estrela Amadora', home_goals: 1.5, away_goals: 2 },
          null as never,
        ] },
      ],
    });
    expect(junk).toBe(data);
  });

  it('returns the same object when the newer file has nothing new', () => {
    const same = withPublishedResults(data, {
      season: '2026-27',
      matchdays: [{ matchday: 8, fixtures: [{ home: 'Benfica', away: 'Vitoria SC', home_goals: 2, away_goals: 0 }] }],
    });
    expect(same).toBe(data);
  });
});

/* ---------------------------------------------------------- persistence */

describe('the storage key', () => {
  it('is the one versioned key the privacy page lists', () => {
    expect(STORAGE_KEY).toBe('estimador:contra-o-modelo:v1');
    expect(RETIRED_KEYS).toEqual(['estimador:contra-o-modelo:player:v1']);
  });
});

describe('parseStoredGame', () => {
  const season = '2026-27';
  const good = serializeGame(season, {
    'Porto|Alverca': { p: [0.5, 0.3, 0.2], pick: 'H', conf: 'media' },
  });

  it('round-trips a valid store', () => {
    const parsed = parseStoredGame(good, season);
    expect(parsed?.picks['Porto|Alverca'].p[0]).toBeCloseTo(0.5, 12);
    expect(parsed?.picks['Porto|Alverca'].pick).toBe('H');
    expect(parsed?.picks['Porto|Alverca'].conf).toBe('media');
  });

  it('reads what the earlier game stored under the same key', () => {
    // The season server's version kept a fine-tune flag beside each pick.
    const earlier = JSON.stringify({
      version: 1,
      season,
      picks: { 'Porto|Alverca': { p: [0.62, 0.23, 0.15], pick: 'H', conf: 'alta', mode: 'fine' } },
    });
    const parsed = parseStoredGame(earlier, season);
    expect(parsed?.picks['Porto|Alverca']).toEqual({ p: [0.62, 0.23, 0.15], pick: 'H', conf: 'alta' });
  });

  it('discards absent, unparseable or non-object payloads', () => {
    for (const raw of [null, '', '{not json', '42', 'null', 'true', '"text"', '[]', '[{"version":1}]']) {
      expect(parseStoredGame(raw, season)).toBeNull();
    }
  });

  it('discards a store written by another schema version', () => {
    const stale = JSON.stringify({ version: STORAGE_VERSION + 1, season, picks: {} });
    expect(parseStoredGame(stale, season)).toBeNull();
    expect(parseStoredGame(JSON.stringify({ season, picks: {} }), season)).toBeNull();
    expect(parseStoredGame(JSON.stringify({ version: '1', season, picks: {} }), season)).toBeNull();
  });

  it('discards a store from a different season', () => {
    expect(parseStoredGame(good, '2027-28')).toBeNull();
  });

  it('discards a store whose picks are not a map', () => {
    for (const picks of [null, [], 'H', 3]) {
      expect(parseStoredGame(JSON.stringify({ version: STORAGE_VERSION, season, picks }), season)).toBeNull();
    }
  });

  it('drops individual malformed picks without losing the good ones', () => {
    const mixed = `{"version":${STORAGE_VERSION},"season":"${season}","picks":{
      "Porto|Alverca": {"p":[0.5,0.3,0.2]},
      "Bad|Sum": {"p":[0.9,0.9,0.9]},
      "Bad|Length": {"p":[0.5,0.5]},
      "Bad|Type": {"p":["a","b","c"]},
      "Bad|Negative": {"p":[1.2,-0.1,-0.1]},
      "Bad|Huge": {"p":[1e308,1e308,1e308]},
      "Bad|Shape": 7,
      "Bad|Null": null,
      "Bad|Missing": {},
      "NoSeparator": {"p":[0.5,0.3,0.2]},
      "__proto__": {"p":[0.5,0.3,0.2]}
    }}`;
    const parsed = parseStoredGame(mixed, season);
    expect(Object.keys(parsed!.picks)).toEqual(['Porto|Alverca']);
    expect(({} as Record<string, unknown>).p).toBeUndefined();
  });

  it('ignores unrecognised hints rather than rejecting the pick', () => {
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

describe('loadPicks / savePicks / clearPicks in the browser', () => {
  const g = globalThis as unknown as { window?: unknown };

  /** A localStorage stand-in; `fail` makes every call throw, as a blocked store does. */
  function fakeWindow(initial: Record<string, string> = {}, fail = false) {
    const store = new Map(Object.entries(initial));
    const guard = () => {
      if (fail) throw new DOMException('blocked', 'SecurityError');
    };
    g.window = {
      localStorage: {
        getItem: (k: string) => (guard(), store.get(k) ?? null),
        setItem: (k: string, v: string) => (guard(), void store.set(k, v)),
        removeItem: (k: string) => (guard(), void store.delete(k)),
      },
    };
    return store;
  }

  afterEach(() => {
    delete g.window;
  });

  it('round-trips the picks under the one key', () => {
    const store = fakeWindow();
    expect(savePicks('2026-27', { 'Porto|Alverca': pick('H') })).toBe(true);
    expect([...store.keys()]).toEqual([STORAGE_KEY]);
    expect(loadPicks('2026-27')['Porto|Alverca'].pick).toBe('H');
  });

  it('starts empty on corrupt data instead of failing', () => {
    fakeWindow({ [STORAGE_KEY]: '{"version":1,"season":"2026-27","picks":' });
    expect(loadPicks('2026-27')).toEqual({});
    fakeWindow({ [STORAGE_KEY]: 'undefined' });
    expect(loadPicks('2026-27')).toEqual({});
  });

  it('never throws when the browser blocks storage', () => {
    fakeWindow({}, true);
    expect(loadPicks('2026-27')).toEqual({});
    expect(savePicks('2026-27', { 'Porto|Alverca': pick('H') })).toBe(false);
    expect(() => clearPicks()).not.toThrow();
    expect(() => forgetRetiredKeys()).not.toThrow();
  });

  it('clears the game, and removes the retired season-server key', () => {
    const store = fakeWindow({
      [STORAGE_KEY]: serializeGame('2026-27', { 'Porto|Alverca': pick('H') }),
      'estimador:contra-o-modelo:player:v1': '{"playerId":"a3f1","secret":"x"}',
      'estimador.club': 'Porto',
    });
    forgetRetiredKeys();
    expect(store.has('estimador:contra-o-modelo:player:v1')).toBe(false);
    expect(store.has(STORAGE_KEY)).toBe(true);
    clearPicks();
    expect(store.has(STORAGE_KEY)).toBe(false);
    expect(store.get('estimador.club')).toBe('Porto');
  });

  it('does nothing outside a browser', () => {
    expect(loadPicks('2026-27')).toEqual({});
    expect(savePicks('2026-27', {})).toBe(false);
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
