import { HOUSEHOLDS } from '@/lib/miniatura/population';
import { HOUSE_H, HOUSE_W, housePosition, type Layout } from './layout';

/** The middle of a house as drawn, in scene units: half its width along, half its height up from its ground line. */
export function houseCentre(id: number, layout: Layout): { x: number; y: number } {
  const { x, y, scale } = housePosition(id, layout);
  return { x: x + (HOUSE_W / 2) * scale, y: y - (HOUSE_H / 2) * scale };
}

/**
 * The house nearest a tap, or null when none is within `maxDistance` (scene
 * units). On a phone a house is under 40px across, so a finger is matched to
 * the closest one instead of having to land inside it (audit UXM2V-05); a tap
 * far from every house selects nothing.
 */
export function nearestHouse(point: { x: number; y: number }, layout: Layout, maxDistance: number): number | null {
  let best: number | null = null;
  let bestDistance = maxDistance;
  for (const house of HOUSEHOLDS) {
    const centre = houseCentre(house.id, layout);
    const distance = Math.hypot(point.x - centre.x, point.y - centre.y);
    if (distance <= bestDistance) {
      best = house.id;
      bestDistance = distance;
    }
  }
  return best;
}
