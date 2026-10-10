/**
 * Where the parish village's houses stand and how much of the 1000 × 600
 * scenery the drawing shows (Village.tsx). Pure, so the room left for an open
 * house's lifted roof is tested over every street size (layout.test.ts).
 */
import { houseShape } from '@/components/miniatura/hit-test';
import { neighbourhoodPosition, type Neighbourhood } from '@/lib/miniatura/population';

/** A full street: three of them, never repeating a household, when the parish has 72 or more. */
export const STREET = 24;

/**
 * How far above a house's walls an open house reaches, in scene units: the
 * roof's ridge (17 above the walls), the lifted roof (35) and the lifted house
 * (8 at the drawing's scale).
 */
export const OPEN_REACH = 17 + 35 + 8;
/** A city block's aerial stands 8 above its roof. */
const AERIAL = 8;
/** The top of house `h`'s lifted roof, in scene units. */
export function openTop(house: PlacedHouse, kind: Neighbourhood) {
  return house.y - house.height - OPEN_REACH - (kind === 'city' ? AERIAL : 0);
}
/**
 * How far right of its anchor an open house's queue of people reaches: up to
 * six figures 10.5 apart from x 25 (about 8 wide), then the "+N" chip, whose
 * size grows on a phone to stay readable (Village's `moreFont`).
 */
export function queueReach(people: number, compact: boolean) {
  if (people > 6) return 88 + 1.9 * (compact ? 20 : 12) + 4;
  return 25 + (Math.max(people, 1) - 1) * 10.5 + 8 + 4;
}
/** Air between the highest lifted roof and the drawing's top edge. */
const ROOF_AIR = 10;
/** The seaside sand starts at y 35; the drawing never shows the blank above it. */
const COAST_TOP = 36;
/**
 * The seaside street sits lower than the explainer's, so the back row's lifted
 * roof fits under the top of the sand without a blank band above it.
 */
const COAST_DROP = 26;

/** Where house i stands, in the 1000 × 600 scenery. */
export function slot(i: number, kind: Neighbourhood, compact: boolean) {
  // The explainer's city packs its blocks tight; a street of 24 to open one by one needs air.
  if (!compact && kind === 'city') {
    const col = i % 6, row = Math.floor(i / 6);
    return { x: 255 + col * 104 - row * 26, y: 150 + row * 84 + col * 14 };
  }
  if (!compact) {
    const at = neighbourhoodPosition(i, kind);
    return kind === 'town' ? { x: at.x, y: at.y + COAST_DROP } : at;
  }
  const col = i % 4, row = Math.floor(i / 4);
  const base = kind === 'town' ? 395 : 255;
  return {
    x: base + col * 118 + (row % 2) * 26 - (kind === 'city' ? row * 12 : 0),
    y: 135 + row * 76 + (kind === 'hills' ? Math.sin(col * 0.9) * 12 : 0) + (kind === 'town' ? COAST_DROP : 0),
  };
}

/** Which drawing house i gets; it changes with the sample, so a new street looks new. */
export function houseArt(i: number, kind: Neighbourhood, sampleIndex: number) {
  // City blocks all get three floors (multiples of 3), so a tall tower never hides the street behind it.
  return kind === 'city' ? ((i + sampleIndex * 4) % 10) * 3 : (i * 7 + sampleIndex * 5) % 30;
}

export interface PlacedHouse { x: number; y: number; height: number; people?: number }

export function placeHouses(count: number, kind: Neighbourhood, compact: boolean, sampleIndex: number) {
  return Array.from({ length: count }, (_, i) => {
    const art = houseArt(i, kind, sampleIndex);
    return { i, art, ...slot(i, kind, compact), height: houseShape(art, kind).height };
  });
}

/**
 * The part of the scenery the drawing shows: the houses, with room above the
 * tallest for its lifted roof (the box always grows to fit it), room on the
 * right for an open house's people, and at the seaside the water when the
 * street is short.
 */
export function sceneBox(houses: ReadonlyArray<PlacedHouse>, kind: Neighbourhood, compact: boolean) {
  if (houses.length === 0) return { x: 0, y: 0, w: 1000, h: 600 };
  const minX = Math.min(...houses.map(h => h.x));
  // The village keeps its windmill whole rather than a sliver of it at the edge; a short seaside street reaches the water.
  const margin = kind === 'village' && !compact ? 150 : kind === 'town' && houses.length < STREET ? (compact ? 150 : 220) : 60;
  const left = Math.max(0, minX - margin);
  // Room on the right for the queue of people an open house sends out.
  const right = Math.min(1000, Math.max(...houses.map(h => h.x + Math.max(70, queueReach(h.people ?? 1, compact)))));
  const roofs = Math.min(...houses.map(h => openTop(h, kind))) - ROOF_AIR;
  // Without a blank band above the landscape's edge (the city's plaza sits on the scene's own ground,
  // so a tall tower may reach a little higher), unless a lifted roof needs it.
  const floor = kind === 'town' ? COAST_TOP : kind === 'city' ? -24 : 0;
  const top = Math.min(Math.max(floor, roofs), roofs + ROOF_AIR);
  const bottom = Math.min(600, Math.max(...houses.map(h => h.y)) + 52);
  return { x: left, y: top, w: right - left, h: bottom - top };
}
