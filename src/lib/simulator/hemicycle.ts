/**
 * Where the seats sit in the simulator's parliament (`Hemicycle.tsx`): pure geometry, so it is
 * tested without a DOM.
 */

/** Left to right as the lists sit in the Assembleia, roughly: the order the seats are drawn in. */
export const SEAT_ORDER = ['CDU', 'BE', 'L', 'PS', 'PAN', 'JPP', 'AD', 'IL', 'CH'];

const W = 400;
const ROWS = 8;
const R_OUT = 190;
const R_IN = 92;
const CX = W / 2;
const CY = 196;

/** The drawing's frame, for the component. */
export const HEMICYCLE = { width: W, cx: CX, cy: CY, rIn: R_IN, rOut: R_OUT } as const;

export interface SeatPoint {
  x: number;
  y: number;
  /** Angle from the left end (π) to the right end (0). */
  angle: number;
}

/**
 * Seat positions for a half circle of `total` seats in ROWS rows, each row's count in
 * proportion to its radius, sorted from the left end to the right so that consecutive seats
 * belong to the same list. The middle of the order is the top of the arc.
 */
export function hemicycleLayout(total: number): SeatPoint[] {
  const radii = Array.from({ length: ROWS }, (_, i) => R_IN + (i * (R_OUT - R_IN)) / (ROWS - 1));
  const sum = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map(r => Math.round((total * r) / sum));
  counts[ROWS - 1] += total - counts.reduce((a, b) => a + b, 0);
  const points: SeatPoint[] = [];
  radii.forEach((r, i) => {
    const n = counts[i];
    for (let k = 0; k < n; k++) {
      const angle = n === 1 ? Math.PI / 2 : Math.PI * (1 - k / (n - 1));
      points.push({ x: CX + r * Math.cos(angle), y: CY - r * Math.sin(angle), angle });
    }
  });
  // Left to right; at the same angle, the inner row first.
  return points.sort((a, b) => b.angle - a.angle || b.y - a.y);
}

