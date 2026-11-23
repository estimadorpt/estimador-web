import { BRAND, FONT_STACK } from '@/lib/brand';
import { HEMICYCLE, SEAT_ORDER, hemicycleLayout } from '@/lib/simulator/hemicycle';
import { listColor } from './copy';
import styles from './Simulator.module.css';

export { SEAT_ORDER };

const { width: W, cx: CX, cy: CY, rIn: R_IN, rOut: R_OUT } = HEMICYCLE;

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
    <svg viewBox={`0 0 ${W} ${CY + 14}`} className={`block h-auto w-full ${styles.inkMarks}`} aria-hidden="true" focusable="false">
      {LAYOUT.map((p, i) => (
        <circle
          key={i}
          className={fills[i] ? styles.dot : undefined}
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
