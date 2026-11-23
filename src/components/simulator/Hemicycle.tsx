import { BRAND, FONT_STACK } from '@/lib/brand';
import { listColor } from './copy';

/** Left to right as the lists sit in the Assembleia, roughly: the order the seats are drawn in. */
export const SEAT_ORDER = ['CDU', 'BE', 'L', 'PS', 'PAN', 'JPP', 'AD', 'IL', 'CH'];

const W = 400;
const ROWS = 8;
const R_OUT = 190;
const R_IN = 92;
const CX = W / 2;
const CY = 196;

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

const LAYOUT = hemicycleLayout(230);

/**
 * The scenario's parliament: 230 seats as dots, coloured by list, with the 116-seat line at the
 * top of the arc. Drawn from seat totals alone; the readout beside it says the same in words,
 * so the drawing is hidden from screen readers.
 */
export function Hemicycle({ seats, majority = 116, caption }: { seats: Record<string, number>; majority?: number; caption: string }) {
  const fills: string[] = [];
  for (const list of SEAT_ORDER) for (let i = 0; i < (seats[list] ?? 0); i++) fills.push(listColor(list));
  return (
    <svg viewBox={`0 0 ${W} ${CY + 14}`} className="block h-auto w-full" aria-hidden="true" focusable="false">
      {LAYOUT.map((p, i) => (
        <circle
          key={i}
          cx={p.x.toFixed(2)}
          cy={p.y.toFixed(2)}
          r={5.6}
          fill={fills[i] ?? BRAND.paper}
          stroke={fills[i] ? 'none' : BRAND.faint}
          strokeWidth={fills[i] ? 0 : 1}
        />
      ))}
      <line x1={CX} x2={CX} y1={CY - R_OUT - 12} y2={CY - R_IN + 10} stroke={BRAND.ink} strokeWidth={1.5} />
      <text x={CX} y={CY - 30} textAnchor="middle" fontFamily={FONT_STACK} fontSize={26} fontWeight={700} fill={BRAND.ink}>
        {majority}
      </text>
      <text x={CX} y={CY - 10} textAnchor="middle" fontFamily={FONT_STACK} fontSize={12} fill={BRAND.muted}>
        {caption}
      </text>
    </svg>
  );
}
