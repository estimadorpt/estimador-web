import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OTHERS_MAX_SHARE, baseVotes, blendSwing, decodeShares, dhondt, encodeShares, isScenarioHash, nextHash, presetShares, presetVotes,
  runScenario, sameShares, setShare, sharesToVotes, swingLists, type SimulatorData,
} from './engine';

const data = JSON.parse(readFileSync(path.join(process.cwd(), 'public/data/elections/parliamentary-2025/simulator.json'), 'utf8')) as SimulatorData;
const fixture = JSON.parse(readFileSync(path.join(import.meta.dirname, '__fixtures__/blend-swing.json'), 'utf8')) as {
  circles: string[];
  cases: Array<{ national: Record<string, number>; shares: Array<Record<string, number>>; seats: Array<Record<string, number>> }>;
};

const OFFICIAL_2025 = { AD: 91, PS: 58, CH: 60, IL: 9, L: 6, CDU: 3, BE: 1, PAN: 1, JPP: 1 };

describe('simulator data', () => {
  it('has the 2025 seat map: 22 circles, 230 seats, Setúbal 19 and Viana do Castelo 5', () => {
    expect(data.circles).toHaveLength(22);
    expect(data.circles.reduce((a, c) => a + c.seats, 0)).toBe(230);
    expect(data.circles.find(c => c.name === 'Setúbal')?.seats).toBe(19);
    expect(data.circles.find(c => c.name === 'Viana do Castelo')?.seats).toBe(5);
    expect(data.circles.filter(c => c.fixed).map(c => c.name)).toEqual(['Europa', 'Fora da Europa']);
  });

  it('states the official 2025 parliament', () => {
    expect(data.seats2025).toEqual(OFFICIAL_2025);
  });
});

describe('runScenario', () => {
  it('reproduces the 2025 parliament seat for seat when no vote moves', () => {
    const r = runScenario(data, baseVotes(data));
    expect(r.totals).toEqual(OFFICIAL_2025);
    r.circles.forEach((c, i) => {
      expect(c.won).toEqual(data.circles[i].seats2025);
      expect(c.lastSeat).toEqual(data.circles[i].lastSeat);
    });
  });

  it('matches district_swing.py (blend swing and D\'Hondt) on the fixture scenarios', () => {
    const swing = swingLists(data);
    for (const kase of fixture.cases) {
      const total = 1e7;
      const votes = Object.fromEntries(swing.map(p => [p, kase.national[p] * total]));
      const r = runScenario(data, votes);
      const domestic = r.circles.filter(c => !c.fixed);
      expect(domestic.map(c => c.name)).toEqual(fixture.circles);
      domestic.forEach((c, d) => {
        const all = Object.values(c.votes).reduce((a, b) => a + b, 0);
        for (const [p, s] of Object.entries(kase.shares[d])) expect(c.votes[p] / all).toBeCloseTo(s, 10);
        expect(c.won).toEqual(kase.seats[d]);
      });
    }
  });

  it('gives seats to every one of 230 places whatever the scenario', () => {
    let shares = setShare(data, presetShares(data, '2025'), 'CH', 0.35);
    shares = setShare(data, shares, 'PS', 0.15);
    const r = runScenario(data, sharesToVotes(data, shares));
    expect(Object.values(r.totals).reduce((a, b) => a + b, 0)).toBe(230);
    expect(r.totals.CH).toBeGreaterThan(OFFICIAL_2025.CH);
  });

  it('survives every party set to zero: the other lists stop at their limit and the parties keep the rest', () => {
    let shares = presetShares(data, '2025');
    for (const p of data.movable) shares = setShare(data, shares, p, 0);
    expect(shares[data.others]).toBeCloseTo(OTHERS_MAX_SHARE, 10);
    expect(Object.values(shares).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    const r = runScenario(data, sharesToVotes(data, shares));
    expect(Object.values(r.totals).reduce((a, b) => a + b, 0)).toBe(230);
    for (const c of r.circles) for (const v of Object.values(c.votes)) expect(Number.isFinite(v)).toBe(true);
  });

  it('never gives the other lists a seat, even with a large vote', () => {
    const shares = setShare(data, presetShares(data, '2025'), data.others, 0.4);
    expect(runScenario(data, sharesToVotes(data, shares)).totals[data.others]).toBeUndefined();
  });
});

describe('last seats', () => {
  // Whether adding `extra` votes to the next list gives it the circle's last seat.
  const flips = (c: (typeof data.circles)[number], extra: number) => {
    const lists = [...data.movable, ...data.fixed];
    const runner = c.lastSeat.runnerUp!.list;
    const after = dhondt({ ...c.votes, [runner]: (c.votes[runner] ?? 0) + extra }, c.seats, lists).won;
    return (after[runner] ?? 0) > (c.seats2025[runner] ?? 0);
  };

  it('names, in every 2025 circle, exactly the votes the next list needed', () => {
    for (const c of data.circles) {
      if (!c.lastSeat.runnerUp) continue;
      const { list, votes } = c.lastSeat.runnerUp;
      expect(flips(c, votes), c.name).toBe(true);
      // One vote fewer must not do it, except where it would leave the two lists level on
      // votes as well as on quotients (Portalegre: PS 16 125, AD 15 458 + 667). The law does
      // not settle that tie, so the margin counts the vote that wins it for sure.
      if ((c.votes[list] ?? 0) + votes - 1 === c.votes[c.lastSeat.list]) continue;
      expect(flips(c, votes - 1), c.name).toBe(false);
    }
  });
});

describe('blendSwing', () => {
  it('returns the last result when the national vote does not move', () => {
    const ln = [0.5, 0.3, 0.2];
    const ld = [[0.6, 0.3, 0.1], [0.4, 0.3, 0.3]];
    blendSwing(ln, ln, ld).forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(ld[i][j], 12)));
  });
});

describe('dhondt', () => {
  it('gives a tie to the list with fewer votes (Lei n.º 14/79, art. 16.º)', () => {
    // A 60, B 30, 2 seats: A's second quotient (30) ties B's first.
    const r = dhondt({ A: 60, B: 30 }, 2, ['A', 'B']);
    expect(r.won).toEqual({ A: 1, B: 1 });
    expect(r.lastSeat.list).toBe('B');
  });

  it('gives no seat when no list has a vote, instead of failing', () => {
    expect(dhondt({ A: 0 }, 3, ['A'])).toEqual({ won: {}, lastSeat: { list: '', runnerUp: null } });
  });

  it('allocates by the highest averages and names the next list in line', () => {
    // 100 000, 80 000, 30 000 for 7 seats: quotients 100k 80k 50k 40k 33.3k 30k 26.7k
    const r = dhondt({ A: 100000, B: 80000, C: 30000 }, 7, ['A', 'B', 'C']);
    expect(r.won).toEqual({ A: 3, B: 3, C: 1 });
    // The 7th seat is B's third (26 667); next in line A's fourth (25 000):
    // A needs (26 666.7 − 25 000) × 4 = 6 667 more votes, plus one to pass.
    expect(r.lastSeat.list).toBe('B');
    expect(r.lastSeat.runnerUp).toEqual({ list: 'A', votes: 6667 });
  });
});

describe('setShare', () => {
  it('sets one share and takes the difference from every other list in proportion', () => {
    const start = presetShares(data, '2025');
    const next = setShare(data, start, 'L', start.L + 0.03);
    expect(next.L).toBeCloseTo(start.L + 0.03, 12);
    expect(Object.values(next).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    // Every other list keeps its proportion to the others.
    expect(next.AD / next.PS).toBeCloseTo(start.AD / start.PS, 12);
    expect(next[data.others] / next.CH).toBeCloseTo(start[data.others] / start.CH, 12);
  });

  it('clamps a share to its range and ignores unknown lists and bad values', () => {
    const start = presetShares(data, '2025');
    expect(setShare(data, start, 'CH', 0.9).CH).toBeCloseTo(0.6, 12);
    expect(setShare(data, start, 'CH', -1).CH).toBe(0);
    expect(setShare(data, start, 'JPP', 0.2)).toBe(start);
    expect(setShare(data, start, 'CH', Number.NaN)).toBe(start);
  });
});

describe('presets', () => {
  it('starts 2024 and 2022 from those elections\' national shares', () => {
    for (const year of ['2022', '2024']) {
      const v = presetVotes(data, year);
      const total = Object.values(v).reduce((a, b) => a + b, 0);
      for (const p of swingLists(data)) expect(v[p] / total).toBeCloseTo(data.presets[year][p], 10);
    }
  });
});

describe('scenario links', () => {
  it('writes nothing for 2025 and round-trips a scenario through the address', () => {
    expect(encodeShares(data, presetShares(data, '2025'))).toBe('');
    const shares = setShare(data, presetShares(data, '2024'), 'L', 0.07);
    const hash = encodeShares(data, shares);
    expect(hash).toMatch(/^#s=AD\.[\d.]+~PS\./);
    const back = decodeShares(hash, data)!;
    for (const p of swingLists(data)) expect(back[p]).toBeCloseTo(shares[p], 5);
    // The rounding never moves a seat.
    expect(runScenario(data, sharesToVotes(data, back)).totals).toEqual(runScenario(data, sharesToVotes(data, shares)).totals);
  });

  it('drops what it does not recognise and rescales what it keeps', () => {
    expect(decodeShares('#mover-votos', data)).toBeNull();
    expect(decodeShares('#s=XX.5~CH.abc', data)).toBeNull();
    const back = decodeShares('#s=CH.40~XX.10', data)!;
    expect(Object.values(back).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(back.CH).toBeGreaterThan(0.3);
    // A link cannot give the other lists more than the sliders allow.
    expect(decodeShares('#s=OUT.100~AD.0~PS.0', data)![data.others]).toBeCloseTo(OTHERS_MAX_SHARE, 10);
  });

  it('keeps a plain anchor while nothing is moved, and writes only what changed', () => {
    const none = encodeShares(data, presetShares(data, '2025'));
    const moved = encodeShares(data, setShare(data, presetShares(data, '2025'), 'L', 0.07));
    // A direct load of the section's anchor: nothing to write.
    expect(nextHash(none, '#mover-votos', 'mover-votos')).toBeNull();
    expect(nextHash(none, '', 'mover-votos')).toBeNull();
    // A shared scenario, read back: already in the address.
    expect(nextHash(moved, moved, 'mover-votos')).toBeNull();
    // A move: the scenario replaces the anchor.
    expect(nextHash(moved, '#mover-votos', 'mover-votos')).toBe(moved);
    // Back to 2025, or a link that held no valid share: the section's anchor again.
    expect(nextHash(none, moved, 'mover-votos')).toBe('#mover-votos');
    expect(nextHash(none, '#s=garbage', 'mover-votos')).toBe('#mover-votos');
    expect(isScenarioHash('#g=x.x.x.PS.L.5')).toBe(true);
    expect(isScenarioHash('#mover-votos')).toBe(false);
    expect(sameShares(presetShares(data, '2025'), presetShares(data, '2025'))).toBe(true);
  });
});
