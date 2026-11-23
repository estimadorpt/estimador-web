import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ABSTENTION, applyTransfers, baseVotes, blendSwing, decodeScenario, dhondt, encodeScenario,
  presetVotes, runScenario, swingLists, type SimulatorData,
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
    const start = baseVotes(data);
    const { votes } = applyTransfers(data, start, [{ from: 'AD', to: 'CH', points: 12 }, { from: 'PS', to: ABSTENTION, points: 5 }]);
    const r = runScenario(data, votes);
    expect(Object.values(r.totals).reduce((a, b) => a + b, 0)).toBe(230);
    expect(r.totals.CH).toBeGreaterThan(OFFICIAL_2025.CH);
  });

  it('never gives the other lists a seat, even with a large vote', () => {
    const { votes } = applyTransfers(data, baseVotes(data), [{ from: 'AD', to: data.others, points: 20 }]);
    expect(runScenario(data, votes).totals[data.others]).toBeUndefined();
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

describe('applyTransfers', () => {
  const unit = Object.values(baseVotes(data)).reduce((a, b) => a + b, 0) / 100;

  it('moves points of the 2025 vote and keeps the total unless abstention is involved', () => {
    const start = baseVotes(data);
    const { votes } = applyTransfers(data, start, [{ from: 'PS', to: 'L', points: 3 }]);
    expect(votes.PS).toBeCloseTo(start.PS - 3 * unit, 6);
    expect(votes.L).toBeCloseTo(start.L + 3 * unit, 6);
    const sum = (v: Record<string, number>) => Object.values(v).reduce((a, b) => a + b, 0);
    expect(sum(votes)).toBeCloseTo(sum(start), 6);
    const fromAbs = applyTransfers(data, start, [{ from: ABSTENTION, to: 'CH', points: 2 }]).votes;
    expect(sum(fromAbs)).toBeCloseTo(sum(start) + 2 * unit, 6);
  });

  it('moves no more than the donor has', () => {
    const start = baseVotes(data);
    const { votes, moved } = applyTransfers(data, start, [{ from: 'PAN', to: 'L', points: 10 }]);
    expect(votes.PAN).toBe(0);
    expect(moved[0]).toBeCloseTo(start.PAN / unit, 6);
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
  it('round-trips a scenario through the address', () => {
    const s = { preset: '2024', transfers: [{ from: 'PS', to: 'L', points: 3 }, { from: ABSTENTION, to: 'CH', points: 1.5 }] };
    const hash = encodeScenario(s);
    expect(hash).toBe('#p=2024&t=PS.L.3~ABS.CH.1.5');
    expect(decodeScenario(hash, data)).toEqual(s);
  });

  it('drops what it does not recognise', () => {
    expect(decodeScenario('#p=1999&t=PS.XX.3~AD.AD.2~CH.IL.-1~L.BE.abc~IL.AD.4', data)).toEqual({
      preset: '2025', transfers: [{ from: 'IL', to: 'AD', points: 4 }],
    });
    expect(encodeScenario({ preset: '2025', transfers: [] })).toBe('');
  });
});
