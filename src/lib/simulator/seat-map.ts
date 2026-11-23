/**
 * Where each circle's seats sit on the simulator's seat map (`SeatMap.tsx`): pure geometry, so
 * it is tested without a DOM. Every circle is a block of seat dots placed roughly where it is on
 * the map (the mainland from Viana to Faro, the islands and the two emigration circles in a
 * column on the left), so Lisboa's 48 seats read as 48 and Portalegre's as 2, which a shaded
 * district map hides.
 */
import { SEAT_ORDER } from './hemicycle';

/** The drawing's frame, in its own units. */
export const SEAT_MAP = { width: 312, height: 388 } as const;
/** Centre to centre of two seats, the seat's radius, and the label's size and line above a block. */
export const PITCH = 8.5;
export const DOT_R = 3.4;
export const LABEL_SIZE = 11;
export const LABEL_LINE = 13;
/** A label's width per character, generous for IBM Plex Sans at LABEL_SIZE (the tests use it). */
export const LABEL_CHAR = 0.6 * LABEL_SIZE;

/** The top-left corner of each circle's seats (its label sits above), by the data's circle names. */
export const SEAT_MAP_BLOCKS: Record<string, { x: number; y: number }> = {
  'Viana do Castelo': { x: 104, y: 16 },
  Braga: { x: 142, y: 16 },
  'Vila Real': { x: 192, y: 16 },
  Bragança: { x: 258, y: 16 },
  Porto: { x: 104, y: 70 },
  Viseu: { x: 184, y: 70 },
  Guarda: { x: 244, y: 70 },
  Aveiro: { x: 108, y: 132 },
  Coimbra: { x: 160, y: 132 },
  'Castelo Branco': { x: 214, y: 132 },
  Leiria: { x: 108, y: 186 },
  Santarém: { x: 160, y: 186 },
  Portalegre: { x: 222, y: 186 },
  Lisboa: { x: 98, y: 232 },
  Évora: { x: 222, y: 232 },
  Setúbal: { x: 160, y: 302 },
  Beja: { x: 222, y: 302 },
  Faro: { x: 170, y: 356 },
  Europa: { x: 6, y: 16 },
  'Fora da Europa': { x: 6, y: 50 },
  Açores: { x: 6, y: 302 },
  Madeira: { x: 40, y: 356 },
};

/** Columns and rows of a block of `n` seats: about 1.3 times as wide as tall, one row up to 2. */
export function blockDims(n: number): { cols: number; rows: number } {
  if (n <= 2) return { cols: Math.max(1, n), rows: 1 };
  const cols = Math.ceil(Math.sqrt(n * 1.3));
  return { cols, rows: Math.ceil(n / cols) };
}

/** The centre of seat `i` (0-based, row by row) in a block of `n` seats at (x, y). */
export function seatCentre(x: number, y: number, n: number, i: number): { x: number; y: number } {
  const { cols } = blockDims(n);
  return { x: x + (i % cols) * PITCH + PITCH / 2, y: y + Math.floor(i / cols) * PITCH + PITCH / 2 };
}

export interface Box { x0: number; y0: number; x1: number; y1: number }

/** A block's box, its label included (`labelChars`: the longer of its labels). */
export function blockBox(x: number, y: number, n: number, labelChars: number): Box {
  const { cols, rows } = blockDims(n);
  return { x0: x, y0: y - LABEL_LINE, x1: x + Math.max(cols * PITCH, labelChars * LABEL_CHAR), y1: y + rows * PITCH };
}

/**
 * The block a pointer at (x, y) means: the one it is in, else the nearest within `reach` units,
 * so a tap between two small blocks still picks one. Null when none is that close.
 */
export function nearestBlock(x: number, y: number, boxes: Array<{ name: string; box: Box }>, reach: number): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const { name, box } of boxes) {
    const dx = Math.max(box.x0 - x, 0, x - box.x1);
    const dy = Math.max(box.y0 - y, 0, y - box.y1);
    const d = Math.hypot(dx, dy);
    if (d < bestD) { bestD = d; best = name; }
  }
  return bestD <= reach ? best : null;
}

/**
 * A circle's seats in drawing order (the parliament's left-to-right order), each with its list
 * and whether the list holds more seats there than in 2025: those are the seats that changed
 * hands, and the map rings them.
 */
export function blockSeats(won: Record<string, number>, before: Record<string, number>): Array<{ list: string; gained: boolean }> {
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
