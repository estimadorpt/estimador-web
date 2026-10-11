import { HOUSEHOLDS, PEOPLE, byAge, bySize, type Person, type View } from '@/lib/miniatura/population';

/**
 * Where everything sits in the scene, in its own units. Two drawings of the
 * same 100 people: `wide` (1000×540, six homes to a row) from 640px, and
 * `compact` (400×440, five to a row) on a phone, where the wide drawing would
 * make a house about 20px across. The grouped views are rows of figures, one
 * row per group, like a bar chart made of people.
 */
export type Layout = 'wide' | 'compact';

export const SCENE: Record<Layout, { width: number; height: number }> = {
  wide: { width: 1000, height: 540 },
  compact: { width: 400, height: 440 },
};

/** The viewport width below which the scene uses the compact drawing (miniatura.css uses the same). */
export const COMPACT_QUERY = '(max-width: 639px)';

const VILLAGE = {
  wide: { cols: 6, cellW: 166, cellH: 100, x0: 0, y0: 25, inset: 2, ground: 80, house: 1, figure: 1.25 },
  compact: { cols: 4, cellW: 100, cellH: 53, x0: 0, y0: 8, inset: 2, ground: 44, house: 0.75, figure: 0.9 },
} as const;

/** The house drawing is 56 units wide and rises 52 above its ground line (Scene's <HouseGlyph>). */
export const HOUSE_W = 56;
export const HOUSE_H = 52;

export function columns(layout: Layout): number {
  return VILLAGE[layout].cols;
}

/** A home's ground line: its left end, where the house stands, and the drawing's scale. */
export function housePosition(id: number, layout: Layout): { x: number; y: number; scale: number } {
  const v = VILLAGE[layout];
  const col = id % v.cols, row = Math.floor(id / v.cols);
  return { x: v.x0 + col * v.cellW + v.inset, y: v.y0 + row * v.cellH + v.ground, scale: v.house };
}

/** The home's whole plot (house and the people beside it): the click and focus area. */
export function houseCell(id: number, layout: Layout): { x: number; y: number; width: number; height: number } {
  const v = VILLAGE[layout];
  const col = id % v.cols, row = Math.floor(id / v.cols);
  return { x: v.x0 + col * v.cellW + 2, y: v.y0 + row * v.cellH + 2, width: v.cellW - 4, height: v.cellH - 4 };
}

/** The ground lines under each row of homes. */
export function streets(layout: Layout): Array<{ x1: number; x2: number; y: number }> {
  const v = VILLAGE[layout];
  const rows = Math.ceil(HOUSEHOLDS.length / v.cols);
  return Array.from({ length: rows }, (_, row) => ({ x1: v.x0, x2: v.x0 + v.cols * v.cellW, y: v.y0 + row * v.cellH + v.ground }));
}

export type Spot = { x: number; y: number; scale: number };
export type Arrangement = { spots: Spot[]; labels: Array<{ x: number; y: number; group: number }>; rules: Array<{ x1: number; x2: number; y: number }> };

function homeSpot(person: Person, layout: Layout): Spot {
  const house = housePosition(person.household, layout);
  const v = VILLAGE[layout];
  // In a row beside the house, the oldest first.
  return layout === 'wide'
    ? { x: house.x + 68 + person.member * 14.5, y: house.y, scale: v.figure }
    : { x: house.x + 49 + person.member * 9.5, y: house.y, scale: v.figure };
}

function grouped(groups: Person[][], layout: Layout): Arrangement {
  const spots: Spot[] = Array(PEOPLE.length);
  const labels: Arrangement['labels'] = [];
  const rules: Arrangement['rules'] = [];
  if (layout === 'wide') {
    // One row per group, its name on the left; groups spread over the height.
    const step = SCENE.wide.height / (groups.length + 0.4);
    groups.forEach((members, group) => {
      const ground = Math.round(step * (group + 0.85));
      members.forEach((person, i) => { spots[person.id] = { x: 280 + i * 14.4, y: ground, scale: 1.1 }; });
      labels.push({ x: 0, y: ground, group });
      rules.push({ x1: 270, x2: 996, y: ground });
    });
    return { spots, labels, rules };
  }
  // Compact: the name above, then rows of up to 25 figures.
  const perRow = 25, rowStep = 28, labelToGround = 40;
  const heights = groups.map(m => labelToGround + (Math.ceil(m.length / perRow) - 1) * rowStep + 14);
  const gap = Math.min(40, Math.max(14, (SCENE.compact.height - 24 - heights.reduce((a, b) => a + b, 0)) / (groups.length - 1)));
  let y = 22;
  groups.forEach((members, group) => {
    labels.push({ x: 0, y, group });
    members.forEach((person, i) => {
      spots[person.id] = { x: 8 + (i % perRow) * 15.6, y: y + labelToGround + Math.floor(i / perRow) * rowStep, scale: 1 };
    });
    const rows = Math.ceil(members.length / perRow);
    for (let r = 0; r < rows; r++) rules.push({ x1: 0, x2: 400, y: y + labelToGround + r * rowStep });
    y += heights[group] + gap;
  });
  return { spots, labels, rules };
}

const cache = new Map<string, Arrangement>();

/** Every person's spot in a view, and the view's group labels and base lines. */
export function arrangement(view: View, layout: Layout): Arrangement {
  const key = `${view}:${layout}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const result: Arrangement = view === 'homes'
    ? { spots: PEOPLE.map(p => homeSpot(p, layout)), labels: [], rules: [] }
    : grouped(view === 'age' ? byAge() : bySize(), layout);
  cache.set(key, result);
  return result;
}
