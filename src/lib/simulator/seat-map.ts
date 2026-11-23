/**
 * The simulator's seat map (`SeatMap.tsx`): mainland Portugal's 18 districts drawn from the
 * site's own district outlines, grown towards their seats by a partial cartogram so that
 * Lisboa's 48 seats and Porto's 40 have room while the country keeps its shape, with one dot
 * per seat spread evenly inside each district; the islands and the two emigration circles sit
 * in a column on the left. The drawing is `seat-map-layout.json`, written by
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
  /** Seat centres in the order the lists fill them (west to east). */
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

export interface Box { x0: number; y0: number; x1: number; y1: number }

/** A label's box. */
export function labelBox(l: SeatMapLabel): Box {
  const x0 = l.anchor === 'start' ? l.x : l.anchor === 'middle' ? l.x - l.w / 2 : l.x - l.w;
  return { x0, y0: l.y - LABEL_ASCENT, x1: x0 + l.w, y1: l.y + LABEL_DESCENT };
}

/** The box around a circle's label and seats, padded: what a tap on an island or emigration circle hits. */
export function circleBox(c: SeatMapCircle, pad = 3): Box {
  const b = labelBox(c.label);
  for (const [x, y] of c.dots) {
    b.x0 = Math.min(b.x0, x - DOT_R);
    b.y0 = Math.min(b.y0, y - DOT_R);
    b.x1 = Math.max(b.x1, x + DOT_R);
    b.y1 = Math.max(b.y1, y + DOT_R);
  }
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

/**
 * A circle's seats in the order the map fills its dots (the parliament's left-to-right order),
 * each with its list and whether the list holds more seats there than in 2025: those are the
 * seats that changed hands, and the map rings them.
 */
export function circleSeats(won: Record<string, number>, before: Record<string, number>): Array<{ list: string; gained: boolean }> {
  const order = [...SEAT_ORDER, ...Object.keys(won).filter(p => !SEAT_ORDER.includes(p)).sort()];
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
  const rank = (p: string) => (SEAT_ORDER.includes(p) ? SEAT_ORDER.indexOf(p) : SEAT_ORDER.length);
  return Array.from(new Set([...Object.keys(before.won), ...Object.keys(now.won)]))
    .map(list => ({ list, d: (now.won[list] ?? 0) - (before.won[list] ?? 0) }))
    .filter(x => x.d !== 0)
    .sort((a, b) => b.d - a.d || rank(a.list) - rank(b.list));
}
