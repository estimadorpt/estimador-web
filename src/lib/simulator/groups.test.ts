import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ABSTENTION, type SimulatorData } from './engine';
import { BLANK_NULL, MAX_GROUP_MOVES, applyGroupMoves, decodeGroupMoves, encodeGroupMoves, groupSize, runGroupScenario, type GroupData, type GroupMove } from './groups';

const dir = path.join(process.cwd(), 'public/data/elections/parliamentary-2025');
const data = JSON.parse(readFileSync(path.join(dir, 'simulator.json'), 'utf8')) as SimulatorData;
const groups = JSON.parse(readFileSync(path.join(dir, 'simulator-groups.json'), 'utf8')) as GroupData;

const OFFICIAL_2025 = { AD: 91, PS: 58, CH: 60, IL: 9, L: 6, CDU: 3, BE: 1, PAN: 1, JPP: 1 };
const everyone = { sex: 'all', age: 'all', edu: 'all' } as const;

describe('group file', () => {
  it('holds the 20 domestic circles, 42 groups each, adding up to the official 2025 votes', () => {
    expect(groups.circles).toHaveLength(20);
    const lists = [...data.movable, ...data.fixed, data.others];
    for (const g of groups.circles) {
      expect(g.cells).toHaveLength(groups.sex.length * groups.age.length * groups.edu.length);
      const c = data.circles.find(x => x.name === g.name)!;
      expect(c.fixed).toBe(false);
      for (const p of lists) {
        const j = groups.options.indexOf(p);
        // Rounded to whole people per cell: within half a vote per group.
        expect(Math.abs(g.cells.reduce((a, row) => a + row[j], 0) - c.votes[p])).toBeLessThanOrEqual(21);
      }
    }
  });
});

describe('runGroupScenario', () => {
  it('reproduces the 2025 parliament seat for seat with no move', () => {
    const r = runGroupScenario(data, groups, []);
    expect(r.totals).toEqual(OFFICIAL_2025);
    r.circles.forEach((c, i) => expect(c.lastSeat).toEqual(data.circles[i].lastSeat));
  });

  it('moves exactly the share of the group asked for, and the group lives where it lives', () => {
    const move: GroupMove = { sex: 'all', age: '18-34', edu: 'all', from: ABSTENTION, to: 'CH', share: 25 };
    const size = groupSize(groups, move);
    const { deltas, moved } = applyGroupMoves(groups, [move]);
    expect(moved[0]).toBeCloseTo(size * 0.25, 6);
    const ch = deltas.reduce((a, d) => a + d.CH, 0);
    expect(ch).toBeCloseTo(size * 0.25, 6);
    // Lisboa and Porto hold more young abstainers than Portalegre.
    const at = (name: string) => deltas[groups.circles.findIndex(c => c.name === name)].CH;
    expect(at('Lisboa')).toBeGreaterThan(at('Portalegre') * 10);
    const r = runGroupScenario(data, groups, [move]);
    expect(Object.values(r.totals).reduce((a, b) => a + b, 0)).toBe(230);
    expect(r.totals.CH).toBeGreaterThan(OFFICIAL_2025.CH);
  });

  it('takes a list to zero at home when all its voters leave, keeping its emigration seats', () => {
    const r = runGroupScenario(data, groups, [{ ...everyone, from: 'CH', to: ABSTENTION, share: 100 }]);
    expect(r.totals.CH).toBe(2);
    expect(Object.values(r.totals).reduce((a, b) => a + b, 0)).toBe(230);
  });

  it('applies moves in order: a second move works on what the first left', () => {
    const a: GroupMove = { ...everyone, from: 'PS', to: 'L', share: 50 };
    const { moved } = applyGroupMoves(groups, [a, a]);
    expect(moved[1]).toBeCloseTo(moved[0] / 2, 6);
  });
});

describe('group links', () => {
  it('round-trips moves through the address and drops what it does not know', () => {
    const moves: GroupMove[] = [
      { sex: 'all', age: '18-34', edu: 'all', from: ABSTENTION, to: 'CH', share: 25 },
      { sex: 'women', age: '65+', edu: 'tertiary', from: 'AD', to: BLANK_NULL, share: 12.5 },
    ];
    const value = encodeGroupMoves(moves);
    expect(value).toBe('x.18a34.x.ABS.CH.25~m.65m.t.AD.BN.12.5');
    expect(decodeGroupMoves(value, groups.options)).toEqual(moves);
    expect(decodeGroupMoves('x.18a34.x.ABS.XX.25~q.x.x.PS.L.5~x.x.x.PS.PS.5~x.x.x.PS.L.500', groups.options))
      .toEqual([{ ...everyone, from: 'PS', to: 'L', share: 100 }]);
    // Unknown age or education codes are dropped, and a link keeps at most MAX_GROUP_MOVES moves.
    expect(decodeGroupMoves('x.17.x.PS.L.5~x.x.z.PS.L.5', groups.options)).toEqual([]);
    expect(decodeGroupMoves(Array.from({ length: MAX_GROUP_MOVES + 5 }, () => 'x.x.x.PS.L.1').join('~'), groups.options)).toHaveLength(MAX_GROUP_MOVES);
  });

  it('lets a later move draw on what an earlier one added to the same cells', () => {
    const there: GroupMove = { ...everyone, age: '18-34', from: ABSTENTION, to: 'CH', share: 25 };
    const back: GroupMove = { ...everyone, age: '18-34', from: 'CH', to: ABSTENTION, share: 100 };
    const { moved } = applyGroupMoves(groups, [there, back]);
    // All of CH's 18-34 votes go back, the ones the first move added included.
    expect(moved[1]).toBeCloseTo(groupSize(groups, { ...back }) + moved[0], 3);
  });
});
