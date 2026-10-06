import { describe, expect, it } from 'vitest';
import { HOUSEHOLDS, NEIGHBOURHOODS } from '@/lib/miniatura/population';
import { houseCentre, houseShape, nearestHouse } from './hit-test';

describe('nearestHouse', () => {
  it('finds every house from its own centre, in every landscape', () => {
    for (const neighbourhood of NEIGHBOURHOODS) {
      for (const house of HOUSEHOLDS) {
        expect(nearestHouse(houseCentre(house.id, neighbourhood), neighbourhood, 60)).toBe(house.id);
      }
    }
  });

  it('matches a tap that misses the house by a few pixels', () => {
    const centre = houseCentre(7, 'town');
    expect(nearestHouse({ x: centre.x + 12, y: centre.y - 10 }, 'town', 60)).toBe(7);
  });

  it('selects nothing far from every house', () => {
    for (const neighbourhood of NEIGHBOURHOODS) {
      expect(nearestHouse({ x: -500, y: -500 }, neighbourhood, 60)).toBeNull();
    }
  });

  it('respects the distance limit', () => {
    const centre = houseCentre(0, 'village');
    expect(nearestHouse({ x: centre.x, y: centre.y - 40 }, 'village', 30)).toBeNull();
  });
});

describe('houseShape', () => {
  it('draws city blocks taller than country houses', () => {
    expect(houseShape(2, 'city').height).toBeGreaterThan(houseShape(2, 'village').height);
    expect(houseShape(2, 'city').floors).toBe(5);
  });
});
