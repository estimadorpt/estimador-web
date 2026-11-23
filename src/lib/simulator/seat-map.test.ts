import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SimulatorData } from './engine';
import { SEAT_MAP, SEAT_MAP_BLOCKS, blockBox, blockDims, blockSeats, circleChanges, nearestBlock } from './seat-map';
import { circleLabel, circleName } from './circle-names';

const data = JSON.parse(
  readFileSync(join(process.cwd(), 'public/data/elections/parliamentary-2025/simulator.json'), 'utf8'),
) as SimulatorData;

const boxes = data.circles.map(c => {
  const at = SEAT_MAP_BLOCKS[c.name];
  const chars = Math.max(circleLabel(c.name, 'pt').length, circleLabel(c.name, 'en').length);
  return { name: c.name, box: blockBox(at.x, at.y, c.seats, chars) };
});

describe('seat map', () => {
  it('places every circle of the data, and nothing else', () => {
    expect(Object.keys(SEAT_MAP_BLOCKS).sort()).toEqual(data.circles.map(c => c.name).sort());
  });

  it('gives each block room for its seats', () => {
    for (const c of data.circles) {
      const { cols, rows } = blockDims(c.seats);
      expect(cols * rows).toBeGreaterThanOrEqual(c.seats);
      expect(cols * (rows - 1)).toBeLessThan(c.seats);
    }
    expect(blockDims(2)).toEqual({ cols: 2, rows: 1 });
    expect(blockDims(48)).toEqual({ cols: 8, rows: 6 });
  });

  it('keeps blocks and labels, in both languages, apart and inside the frame', () => {
    const GAP = 3;
    for (const { name, box } of boxes) {
      expect(box.x0, name).toBeGreaterThanOrEqual(0);
      expect(box.y0, name).toBeGreaterThanOrEqual(0);
      expect(box.x1, name).toBeLessThanOrEqual(SEAT_MAP.width);
      expect(box.y1, name).toBeLessThanOrEqual(SEAT_MAP.height);
    }
    for (const a of boxes) {
      for (const b of boxes) {
        if (a.name >= b.name) continue;
        const apart = a.box.x1 + GAP <= b.box.x0 || b.box.x1 + GAP <= a.box.x0 || a.box.y1 + GAP <= b.box.y0 || b.box.y1 + GAP <= a.box.y0;
        expect(apart, `${a.name} / ${b.name}`).toBe(true);
      }
    }
  });

  it('draws as many seats as the circle has, ringing only the ones that changed hands', () => {
    const lisboa = data.circles.find(c => c.name === 'Lisboa')!;
    const same = blockSeats(lisboa.seats2025, lisboa.seats2025);
    expect(same).toHaveLength(48);
    expect(same.some(s => s.gained)).toBe(false);
    const moved = { ...lisboa.seats2025, PS: lisboa.seats2025.PS - 1, CH: lisboa.seats2025.CH + 1 };
    const seats = blockSeats(moved, lisboa.seats2025);
    expect(seats).toHaveLength(48);
    expect(seats.filter(s => s.gained)).toEqual([{ list: 'CH', gained: true }]);
    // Drawn in the parliament's order, so a list's seats sit together.
    const lists = seats.map(s => s.list);
    expect(lists.indexOf('PS')).toBeLessThan(lists.indexOf('AD'));
    expect(new Set(lists).size).toBe(lists.filter((p, i) => p !== lists[i - 1]).length);
  });

  it('takes a tap between two small blocks to the nearer one, and one far away to none', () => {
    const portalegre = boxes.find(b => b.name === 'Portalegre')!.box;
    expect(nearestBlock(portalegre.x0 + 2, portalegre.y1 - 2, boxes, 10)).toBe('Portalegre');
    expect(nearestBlock(portalegre.x0 + 2, portalegre.y1 + 6, boxes, 10)).toBe('Portalegre');
    expect(nearestBlock(60, 200, boxes, 10)).toBeNull();
  });

  it('lists a circle\'s changes gains first, and none when the seats are 2025\'s', () => {
    expect(circleChanges({ won: { AD: 2, PS: 1 } }, { won: { AD: 2, PS: 1 } })).toEqual([]);
    expect(circleChanges({ won: { AD: 1, CH: 2 } }, { won: { AD: 1, PS: 1, CH: 1 } })).toEqual([
      { list: 'CH', d: 1 },
      { list: 'PS', d: -1 },
    ]);
  });

  it('names the islands and the emigration circles in English, and the districts as they are', () => {
    expect(circleName('Açores', 'en')).toBe('Azores');
    expect(circleName('Fora da Europa', 'en')).toBe('Outside Europe');
    expect(circleName('Açores', 'pt')).toBe('Açores');
    expect(circleName('Setúbal', 'en')).toBe('Setúbal');
    expect(circleLabel('Viana do Castelo', 'en')).toBe('Viana');
  });
});
