import { describe, expect, it } from 'vitest';
import { HOUSEHOLDS, PEOPLE, VIEWS } from '@/lib/miniatura/population';
import { houseCentre, nearestHouse } from './hit-test';
import { SCENE, arrangement, houseCell, type Layout } from './layout';

const LAYOUTS: Layout[] = ['wide', 'compact'];

describe('nearestHouse', () => {
  it('finds every house from its own centre, in both drawings', () => {
    for (const layout of LAYOUTS) {
      for (const house of HOUSEHOLDS) {
        expect(nearestHouse(houseCentre(house.id, layout), layout, 60)).toBe(house.id);
      }
    }
  });

  it('matches a tap that misses the house by a few units', () => {
    const centre = houseCentre(7, 'compact');
    expect(nearestHouse({ x: centre.x + 12, y: centre.y - 10 }, 'compact', 44)).toBe(7);
  });

  it('selects nothing far from every house', () => {
    for (const layout of LAYOUTS) expect(nearestHouse({ x: -500, y: -500 }, layout, 60)).toBeNull();
  });

  it('respects the distance limit', () => {
    const centre = houseCentre(0, 'wide');
    expect(nearestHouse({ x: centre.x, y: centre.y - 40 }, 'wide', 30)).toBeNull();
  });
});

describe('the scene layout', () => {
  it('keeps every person inside the drawing, with no two on the same spot', () => {
    for (const layout of LAYOUTS) {
      const { width, height } = SCENE[layout];
      for (const view of VIEWS) {
        const { spots } = arrangement(view, layout);
        expect(spots.filter(Boolean)).toHaveLength(PEOPLE.length);
        expect(new Set(spots.map(s => `${s.x},${s.y}`)).size).toBe(PEOPLE.length);
        for (const s of spots) {
          expect(s.x).toBeGreaterThan(4);
          expect(s.x).toBeLessThan(width - 4);
          expect(s.y - 24 * s.scale).toBeGreaterThan(0);
          expect(s.y).toBeLessThan(height);
        }
      }
    }
  });

  it('stands each person on their own home plot in the homes view', () => {
    for (const layout of LAYOUTS) {
      const { spots } = arrangement('homes', layout);
      for (const person of PEOPLE) {
        const cell = houseCell(person.household, layout);
        const spot = spots[person.id];
        expect(spot.x).toBeGreaterThan(cell.x);
        expect(spot.x).toBeLessThan(cell.x + cell.width);
        expect(spot.y).toBeGreaterThan(cell.y);
        expect(spot.y).toBeLessThanOrEqual(cell.y + cell.height);
      }
    }
  });

  it('keeps the home plots apart and inside the drawing', () => {
    for (const layout of LAYOUTS) {
      const cells = HOUSEHOLDS.map(h => houseCell(h.id, layout));
      for (const [i, a] of cells.entries()) {
        expect(a.x + a.width).toBeLessThanOrEqual(SCENE[layout].width);
        expect(a.y + a.height).toBeLessThanOrEqual(SCENE[layout].height);
        for (const b of cells.slice(i + 1)) {
          const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
          expect(apart).toBe(true);
        }
      }
    }
  });
});
