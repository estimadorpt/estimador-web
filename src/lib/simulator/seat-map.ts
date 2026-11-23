/**
 * The simulator's seat map (`SeatMap.tsx`): mainland Portugal's 18 districts drawn from the
 * site's own district outlines, grown towards their seats by a partial cartogram so that
 * Lisboa's 48 seats and Porto's 40 have room while the country keeps its shape, with one dot
 * per seat spread evenly inside each district; the islands sit in the sea at lower left with
 * their seats on them, and the two emigration circles in one row under the map. The drawing is
 * `seat-map-layout.json`, written by
 * `scripts/build-seat-map.py` (rerun it when the seats per circle change); this module reads
 * it and holds the pure helpers, so they are tested without a DOM.
 */
import layout from './seat-map-layout.json';
import { SEAT_ORDER } from './hemicycle';

export interface SeatMapLabel {
  x: number;
  /** The baseline. */
  y: number;
  anchor: 'start' | 'middle' | 'end';
  /** The label's width in bold, the longer of its two languages', in drawing units. */
  w: number;
}

export interface SeatMapCircle {
  /** Seat centres in the order the lists fill them: in rows, top to bottom, each west to east. */
  dots: Array<[number, number]>;
  label: SeatMapLabel;
  /** The district's outline (the islands' for Açores and Madeira), an SVG path. */
  path?: string;
}

/** The drawing's frame, in its own units. */
export const SEAT_MAP = { width: layout.width, height: layout.height } as const;
export const DOT_R = layout.dotR;
export const LABEL_SIZE = layout.labelSize;
/** A label's box around its baseline: from cap height to the descender. */
export const LABEL_ASCENT = 9;
export const LABEL_DESCENT = 3;

export const SEAT_MAP_CIRCLES = layout.circles as unknown as Record<string, SeatMapCircle>;
/** The mainland's outline (the coast and the border with Spain), open SVG lines drawn darker than the borders between districts. */
export const SEAT_MAP_COAST: string = layout.coast;
/** The emigration row: its heading's baseline and width, and the rule above it. */
export const SEAT_MAP_EMIGRATION = layout.emigration as { x: number; y: number; w: number; rule: number };

export interface Box { x0: number; y0: number; x1: number; y1: number }

/** A label's box. */
export function labelBox(l: SeatMapLabel): Box {
  const x0 = l.anchor === 'start' ? l.x : l.anchor === 'middle' ? l.x - l.w / 2 : l.x - l.w;
  return { x0, y0: l.y - LABEL_ASCENT, x1: x0 + l.w, y1: l.y + LABEL_DESCENT };
}

/** The emigration heading's box. */
export function emigrationBox(): Box {
  const e = SEAT_MAP_EMIGRATION;
  return labelBox({ x: e.x, y: e.y, anchor: 'start', w: e.w });
}

/** The vertices of an SVG path made of "M x y", relative "l" steps and an optional "Z", as the generator writes them. */
export function pathPoints(path: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const sub of path.match(/M[^M]*/g) ?? []) {
    const [start, steps = ''] = sub.slice(1).replace('Z', '').split('l');
    const num = (t: string) => (t.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    let [x, y] = num(start);
    out.push([x, y]);
    const d = num(steps);
    for (let i = 0; i + 1 < d.length; i += 2) {
      x += d[i];
      y += d[i + 1];
      out.push([x, y]);
    }
  }
  return out;
}

/** The box around a circle's label, seats and (for the islands) outline, padded: what a tap on an island or emigration circle hits. */
export function circleBox(c: SeatMapCircle, pad = 3): Box {
  const b = labelBox(c.label);
  const grow = (x0: number, y0: number, x1: number, y1: number) => {
    b.x0 = Math.min(b.x0, x0);
    b.y0 = Math.min(b.y0, y0);
    b.x1 = Math.max(b.x1, x1);
    b.y1 = Math.max(b.y1, y1);
  };
  for (const [x, y] of c.dots) grow(x - DOT_R, y - DOT_R, x + DOT_R, y + DOT_R);
  for (const [x, y] of c.path ? pathPoints(c.path) : []) grow(x, y, x, y);
  return { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad };
}

/**
 * The circle a pointer at (x, y) means when it lands outside every district and box: the
 * circle of the nearest seat within `reach` units, so a tap on the coast still picks one.
 * Null when no seat is that close.
 */
export function nearestSeat(x: number, y: number, circles: Record<string, SeatMapCircle>, reach: number): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const [name, c] of Object.entries(circles)) {
    for (const [sx, sy] of c.dots) {
      const d = Math.hypot(sx - x, sy - y);
      if (d < bestD) { bestD = d; best = name; }
    }
  }
  return bestD <= reach ? best : null;
}

/** A list's place in the parliament's left-to-right order; lists outside it come last. */
const rank = (p: string) => (SEAT_ORDER.includes(p) ? SEAT_ORDER.indexOf(p) : SEAT_ORDER.length);

/**
 * A circle's seats in the order the map fills its dots, like a tally: the list with most seats
 * first (the parliament's left-to-right order between equals), each with its list and whether
 * the list holds more seats there than in 2025: those are the seats that changed hands, and the
 * map rings them.
 */
export function circleSeats(won: Record<string, number>, before: Record<string, number>): Array<{ list: string; gained: boolean }> {
  const order = Object.keys(won).sort((a, b) => won[b] - won[a] || rank(a) - rank(b) || a.localeCompare(b));
  const out: Array<{ list: string; gained: boolean }> = [];
  for (const list of order) {
    const n = won[list] ?? 0;
    const kept = Math.min(n, before[list] ?? 0);
    for (let i = 0; i < n; i++) out.push({ list, gained: i >= kept });
  }
  return out;
}

/** The seats one circle changed against 2025, gains first, then in the parliament's order: "Chega +1, PS −1". */
export function circleChanges(now: { won: Record<string, number> }, before: { won: Record<string, number> }): Array<{ list: string; d: number }> {
  return Array.from(new Set([...Object.keys(before.won), ...Object.keys(now.won)]))
    .map(list => ({ list, d: (now.won[list] ?? 0) - (before.won[list] ?? 0) }))
    .filter(x => x.d !== 0)
    .sort((a, b) => b.d - a.d || rank(a.list) - rank(b.list));
}
