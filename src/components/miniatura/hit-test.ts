import { HOUSEHOLDS, neighbourhoodPosition, type Neighbourhood } from '@/lib/miniatura/population';

/** How many floors a house has and how tall its walls are drawn, in scene units (Scene's <House>). */
export function houseShape(id: number, neighbourhood: Neighbourhood): { floors: number; height: number } {
  const urban = neighbourhood === 'city', stone = neighbourhood === 'hills', coast = neighbourhood === 'town';
  const floors = urban ? 3 + id % 3 : coast ? 1 + id % 2 : 1;
  const height = urban ? 28 + floors * 16 : coast ? 29 + (id % 2) * 14 : stone ? 32 : 24;
  return { floors, height };
}

/**
 * The middle of a house as drawn, in scene units: its walls run from about
 * x−24 to x+31 and from y−height to y+17 around its anchor, so a tall city
 * block is aimed at by its walls, not by the ground under it.
 */
export function houseCentre(id: number, neighbourhood: Neighbourhood): { x: number; y: number } {
  const { x, y } = neighbourhoodPosition(id, neighbourhood);
  return { x: x + 3, y: y - houseShape(id, neighbourhood).height / 2 };
}

/**
 * The house nearest a tap, or null when none is within `maxDistance` (scene
 * units). On a phone the houses are about 29×28px, so a finger is matched to
 * the closest one instead of having to land inside it (audit UXM2V-05); a tap
 * on the sea or an empty field selects nothing.
 */
export function nearestHouse(point: { x: number; y: number }, neighbourhood: Neighbourhood, maxDistance: number): number | null {
  return nearestPoint(point, HOUSEHOLDS.map(house => ({ id: house.id, ...houseCentre(house.id, neighbourhood) })), maxDistance);
}

/** The id of the centre nearest `point`, or null when none is within `maxDistance`; ties keep the first. */
export function nearestPoint(point: { x: number; y: number }, centres: ReadonlyArray<{ id: number; x: number; y: number }>, maxDistance: number): number | null {
  let best: number | null = null;
  let bestDistance = maxDistance;
  for (const centre of centres) {
    const distance = Math.hypot(point.x - centre.x, point.y - centre.y);
    if (distance <= bestDistance && (best === null || distance < bestDistance)) {
      best = centre.id;
      bestDistance = distance;
    }
  }
  return best;
}
