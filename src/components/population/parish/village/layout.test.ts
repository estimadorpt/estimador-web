import { describe, expect, it } from 'vitest';
import { NEIGHBOURHOODS } from '@/lib/miniatura/population';
import { STREET, openTop, placeHouses, queueReach, sceneBox } from './layout';

describe('the parish village layout', () => {
  it('always leaves room for an open house’s lifted roof, and the drawing stays inside the scenery', () => {
    for (const kind of NEIGHBOURHOODS) {
      for (const compact of [false, true]) {
        for (let count = 1; count <= STREET; count++) {
          for (let sampleIndex = 0; sampleIndex < 3; sampleIndex++) {
            // Every house as full as a household gets (15 people: six figures and "+9").
            const houses = placeHouses(count, kind, compact, sampleIndex).map(house => ({ ...house, people: 15 }));
            const box = sceneBox(houses, kind, compact);
            const where = `${kind} ${compact ? 'compact' : 'wide'} ${count} houses, sample ${sampleIndex}`;
            for (const house of houses) {
              expect(openTop(house, kind), where).toBeGreaterThanOrEqual(box.y);
              expect(house.x + queueReach(house.people, compact), where).toBeLessThanOrEqual(box.x + box.w);
            }
            expect(box.y + box.h, where).toBeLessThanOrEqual(600);
            expect(box.x, where).toBeGreaterThanOrEqual(0);
            expect(box.x + box.w, where).toBeLessThanOrEqual(1000);
            // The seaside never shows the blank above its sand (it starts at y 35).
            if (kind === 'town') expect(box.y, where).toBeGreaterThanOrEqual(35);
          }
        }
      }
    }
  });

  it('shows the water beside a short seaside street', () => {
    const houses = placeHouses(11, 'town', false, 0);
    expect(sceneBox(houses, 'town', false).x).toBeLessThan(200);
  });
});
