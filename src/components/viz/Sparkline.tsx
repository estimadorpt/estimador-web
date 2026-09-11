import { ACCENT, DEEMPHASIS } from './theme';

/** Twelve-ish points in the de-emphasis hue, the current period marked in the accent. 2px line, 8px end dot. */
export function Sparkline({ points, width = 96, height = 28, color = DEEMPHASIS, endColor = ACCENT, className = '' }: { points: number[]; width?: number; height?: number; color?: string; endColor?: string; className?: string }) {
  if (points.length < 2) return null;
  const min = Math.min(...points), max = Math.max(...points), span = max - min || 1;
  const pad = 4;
  const xy = points.map((v, i) => [pad + (i / (points.length - 1)) * (width - pad * 2), pad + (1 - (v - min) / span) * (height - pad * 2)] as const);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [lx, ly] = xy[xy.length - 1];
  return (
    <svg className={className} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="4" fill={endColor} stroke="#fcfbf5" strokeWidth="2" />
    </svg>
  );
}
