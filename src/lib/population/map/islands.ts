/**
 * Small places on the map (UXM3V-01). Framed whole on a phone, the Azores are
 * 600 km of sea with islands of 2 to 19 px, so the region view offers its
 * three island groups as a framing of their own, and a tap that lands in the
 * sea next to a small shape takes the nearest shape within reach. Geometry
 * only: nothing here reads a statistic.
 */
import { toScreen, type Camera, type Viewport } from './camera';
import { unionBounds, type Bounds, type Point } from './geometry';

/** The Azores' three island groups, by the first two digits of the DICOFRE código (one per island). */
export const AZORES_GROUPS = [
  { id: 'ocidental', islands: ['48', '49'], label: { pt: 'Ocidental', en: 'Western' } },
  { id: 'central', islands: ['43', '44', '45', '46', '47'], label: { pt: 'Central', en: 'Central' } },
  { id: 'oriental', islands: ['41', '42'], label: { pt: 'Oriental', en: 'Eastern' } },
] as const;

export type AzoresGroup = (typeof AZORES_GROUPS)[number]['id'];

/** The group a município of the Azores belongs to (null outside the Azores). */
export function azoresGroupOf(code: string): AzoresGroup | null {
  const island = code.slice(0, 2);
  return AZORES_GROUPS.find(group => (group.islands as readonly string[]).includes(island))?.id ?? null;
}

/** The extent of one group's municípios, for the camera to frame. */
export function azoresGroupBounds(shapes: Array<{ code: string; fit: Bounds }>, group: AzoresGroup): Bounds | null {
  return unionBounds(shapes.filter(shape => azoresGroupOf(shape.code) === group).map(shape => shape.fit));
}

/** Half of the 44px tap target: a tap this close to a shape's drawn box counts as a tap on it. */
export const TAP_REACH_PX = 22;

/**
 * The shape whose drawn box (on screen, under `camera`) is nearest to a tap
 * at `at`, if it is within `reach` pixels; a tap inside a box is at distance
 * 0, and between boxes that both hold it the nearer label point wins.
 */
export function nearestShape<T extends { bounds: Bounds; label: Point }>(shapes: T[], at: Point, camera: Camera, viewport: Viewport, reach = TAP_REACH_PX): T | null {
  let best: T | null = null;
  let bestBox = Infinity;
  let bestLabel = Infinity;
  for (const shape of shapes) {
    const [x0, y0] = toScreen(shape.bounds[0], camera, viewport);
    const [x1, y1] = toScreen(shape.bounds[1], camera, viewport);
    const box = Math.hypot(Math.max(0, x0 - at[0], at[0] - x1), Math.max(0, y0 - at[1], at[1] - y1));
    const [lx, ly] = toScreen(shape.label, camera, viewport);
    const label = Math.hypot(lx - at[0], ly - at[1]);
    if (box < bestBox || (box === bestBox && label < bestLabel)) { best = shape; bestBox = box; bestLabel = label; }
  }
  return bestBox <= reach ? best : null;
}
