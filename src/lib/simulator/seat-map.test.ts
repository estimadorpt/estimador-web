import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SimulatorData } from './engine';
import {
  DOT_R, LABEL_SIZE, SEAT_MAP, SEAT_MAP_CIRCLES, circleBox, circleChanges, circleSeats, labelBox, nearestSeat,
} from './seat-map';
import { circleLabel, circleName } from './circle-names';

const data = JSON.parse(
  readFileSync(join(process.cwd(), 'public/data/elections/parliamentary-2025/simulator.json'), 'utf8'),
) as SimulatorData;

const ISLANDS_AND_ABROAD = ['Açores', 'Madeira', 'Europa', 'Fora da Europa'];

/** The closed rings of an SVG path made of "M x y", relative "l" steps and "Z". */
function rings(path: string): Array<Array<[number, number]>> {
  return path.split('Z').filter(Boolean).map(sub => {
    const [start, steps = ''] = sub.slice(1).split('l');
    const num = (s: string) => (s.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    const [x0, y0] = num(start);
    const d = num(steps);
    const pts: Array<[number, number]> = [[x0, y0]];
    for (let i = 0; i + 1 < d.length; i += 2) {
      const [px, py] = pts[pts.length - 1];
      pts.push([px + d[i], py + d[i + 1]]);
    }
    return pts;
  });
}

/** Even-odd rule over every ring, so holes count. */
function inside(x: number, y: number, rs: Array<Array<[number, number]>>): boolean {
  let hit = false;
  for (const r of rs) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i];
      const [xj, yj] = r[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
  }
  return hit;
}

const seats = Object.entries(SEAT_MAP_CIRCLES).flatMap(([name, c]) => c.dots.map(([x, y]) => ({ name, x, y })));

describe('seat map', () => {
  it('draws every circle of the data with one dot per seat, and nothing else', () => {
    expect(Object.keys(SEAT_MAP_CIRCLES).sort()).toEqual(data.circles.map(c => c.name).sort());
    for (const c of data.circles) expect(SEAT_MAP_CIRCLES[c.name].dots, c.name).toHaveLength(c.seats);
    expect(seats).toHaveLength(230);
  });

  it('puts each mainland seat inside its own district', () => {
    for (const [name, c] of Object.entries(SEAT_MAP_CIRCLES)) {
      if (ISLANDS_AND_ABROAD.includes(name)) continue;
      const rs = rings(c.path!);
      for (const [x, y] of c.dots) expect(inside(x, y, rs), `${name} ${x},${y}`).toBe(true);
    }
  });

  it('keeps seats inside the frame and apart, so a ring never touches a neighbour', () => {
    for (const s of seats) {
      expect(s.x - DOT_R, s.name).toBeGreaterThanOrEqual(0);
      expect(s.y - DOT_R, s.name).toBeGreaterThanOrEqual(0);
      expect(s.x + DOT_R, s.name).toBeLessThanOrEqual(SEAT_MAP.width);
      expect(s.y + DOT_R, s.name).toBeLessThanOrEqual(SEAT_MAP.height);
    }
    let closest = Infinity;
    for (let i = 0; i < seats.length; i++) {
      for (let j = i + 1; j < seats.length; j++) closest = Math.min(closest, Math.hypot(seats[i].x - seats[j].x, seats[i].y - seats[j].y));
    }
    // The ring around a seat that changed hands reaches 3.8 units out (SeatMap.tsx).
    expect(closest).toBeGreaterThanOrEqual(2 * 3.8);
  });

  it('keeps labels, in both languages, inside the frame, off every seat and apart', () => {
    const boxes = Object.entries(SEAT_MAP_CIRCLES).map(([name, c]) => ({ name, box: labelBox(c.label) }));
    for (const [name, c] of Object.entries(SEAT_MAP_CIRCLES)) {
      // The stored width is the bold label measured in IBM Plex Sans; a label longer than it
      // was measured for (a renamed circle) would spill.
      const chars = Math.max(circleLabel(name, 'pt').length, circleLabel(name, 'en').length);
      expect(c.label.w, name).toBeGreaterThanOrEqual(chars * 0.4 * LABEL_SIZE);
    }
    for (const { name, box } of boxes) {
      expect(box.x0, name).toBeGreaterThanOrEqual(0);
      expect(box.y0, name).toBeGreaterThanOrEqual(0);
      expect(box.x1, name).toBeLessThanOrEqual(SEAT_MAP.width);
      expect(box.y1, name).toBeLessThanOrEqual(SEAT_MAP.height);
      for (const s of seats) {
        const dx = Math.max(box.x0 - s.x, 0, s.x - box.x1);
        const dy = Math.max(box.y0 - s.y, 0, s.y - box.y1);
        expect(Math.hypot(dx, dy) > DOT_R, `${name} / a seat of ${s.name}`).toBe(true);
      }
    }
    for (const a of boxes) {
      for (const b of boxes) {
        if (a.name >= b.name) continue;
        const apart = a.box.x1 + 2 <= b.box.x0 || b.box.x1 + 2 <= a.box.x0 || a.box.y1 + 1 <= b.box.y0 || b.box.y1 + 1 <= a.box.y0;
        expect(apart, `${a.name} / ${b.name}`).toBe(true);
      }
    }
  });

  it('gives the islands and the emigration circles tap boxes that do not overlap', () => {
    const boxes = ISLANDS_AND_ABROAD.map(n => ({ n, b: circleBox(SEAT_MAP_CIRCLES[n]) }));
    for (const a of boxes) {
      for (const b of boxes) {
        if (a.n >= b.n) continue;
        expect(a.b.x1 <= b.b.x0 || b.b.x1 <= a.b.x0 || a.b.y1 <= b.b.y0 || b.b.y1 <= a.b.y0, `${a.n} / ${b.n}`).toBe(true);
      }
    }
  });

  it('fills a circle\'s seats in the parliament\'s order, ringing only the ones that changed hands', () => {
    const lisboa = data.circles.find(c => c.name === 'Lisboa')!;
    const same = circleSeats(lisboa.seats2025, lisboa.seats2025);
    expect(same).toHaveLength(48);
    expect(same.some(s => s.gained)).toBe(false);
    const moved = { ...lisboa.seats2025, PS: lisboa.seats2025.PS - 1, CH: lisboa.seats2025.CH + 1 };
    const out = circleSeats(moved, lisboa.seats2025);
    expect(out).toHaveLength(48);
    expect(out.filter(s => s.gained)).toEqual([{ list: 'CH', gained: true }]);
    const lists = out.map(s => s.list);
    expect(lists.indexOf('PS')).toBeLessThan(lists.indexOf('AD'));
    expect(new Set(lists).size).toBe(lists.filter((p, i) => p !== lists[i - 1]).length);
    // The dots run west to east, so the left's seats sit on the west of the district.
    const xs = SEAT_MAP_CIRCLES.Lisboa.dots.map(d => d[0]);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  it('takes a tap near a seat to its circle, and one out at sea to none', () => {
    const [x, y] = SEAT_MAP_CIRCLES.Portalegre.dots[0];
    expect(nearestSeat(x + 4, y - 3, SEAT_MAP_CIRCLES, 12)).toBe('Portalegre');
    expect(nearestSeat(2, SEAT_MAP.height - 2, SEAT_MAP_CIRCLES, 12)).toBeNull();
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
