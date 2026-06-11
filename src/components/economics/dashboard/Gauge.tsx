// Dependency-free semicircular gauge, shared by the health score (0–100) and the
// recession dials (0–1). Pure SVG server component, brand teal + stone palette.
// Geometry helpers live in economy-format so every dial on the page matches.

import { polarToXY, gaugeArcPath, fracToAngle, COLORS } from '@/lib/utils/economy-format';

interface GaugeProps {
  value: number | null | undefined;
  min?: number;
  max?: number;
  color?: string;
  trackColor?: string;
  /** Pre-formatted centre text (e.g. "50", "8.6%"). Falls back to the value. */
  display?: string;
  /** Small caption under the centre number (e.g. the verdict word). */
  sublabel?: string;
  sublabelColor?: string;
  minLabel?: string;
  maxLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Localized accessible label. Falls back to the (already localized) value + sublabel. */
  ariaLabel?: string;
}

const SIZES = {
  sm: { w: 180, thickness: 11, value: 28, sub: 11 },
  md: { w: 240, thickness: 15, value: 40, sub: 13 },
  lg: { w: 300, thickness: 19, value: 56, sub: 16 },
} as const;

export function Gauge({
  value,
  min = 0,
  max = 100,
  color = COLORS.teal,
  trackColor = COLORS.stoneFaint,
  display,
  sublabel,
  sublabelColor,
  minLabel,
  maxLabel,
  size = 'md',
  ariaLabel,
}: GaugeProps) {
  const S = SIZES[size];
  const W = S.w;
  const pad = S.thickness / 2 + 4;
  const r = (W - pad * 2) / 2;
  const cx = W / 2;
  const cy = pad + r;
  const H = cy + 26; // room for centre number + end labels below the baseline

  const hasValue = typeof value === 'number' && Number.isFinite(value);
  const frac = hasValue
    ? Math.max(0, Math.min(1, (value - min) / (max - min)))
    : 0;
  const tip = polarToXY(cx, cy, r, fracToAngle(frac));
  const centre = display ?? (hasValue ? String(Math.round(value)) : '—');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel ?? `${centre}${sublabel ? ', ' + sublabel : ''}`}
      className="block w-full h-auto max-w-[320px] mx-auto"
    >
      {/* track */}
      <path
        d={gaugeArcPath(cx, cy, r, 0, 1)}
        fill="none"
        stroke={trackColor}
        strokeWidth={S.thickness}
        strokeLinecap="round"
      />
      {/* value arc */}
      {hasValue && frac > 0 && (
        <path
          d={gaugeArcPath(cx, cy, r, 0, frac)}
          fill="none"
          stroke={color}
          strokeWidth={S.thickness}
          strokeLinecap="round"
        />
      )}
      {/* value tip marker */}
      {hasValue && (
        <circle cx={tip.x} cy={tip.y} r={S.thickness / 2 + 1.5} fill={color} />
      )}

      {/* centre number */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fontSize={S.value}
        fontWeight={800}
        fill={hasValue ? color : COLORS.stone}
        className="tabular-nums"
      >
        {centre}
      </text>
      {sublabel && (
        <text
          x={cx}
          y={cy + S.sub + 2}
          textAnchor="middle"
          fontSize={S.sub}
          fontWeight={600}
          fill={sublabelColor ?? COLORS.stoneDark}
        >
          {sublabel}
        </text>
      )}

      {/* end labels */}
      {minLabel && (
        <text x={pad} y={cy + 18} textAnchor="middle" fontSize={10} fill={COLORS.stone}>
          {minLabel}
        </text>
      )}
      {maxLabel && (
        <text
          x={W - pad}
          y={cy + 18}
          textAnchor="middle"
          fontSize={10}
          fill={COLORS.stone}
        >
          {maxLabel}
        </text>
      )}
    </svg>
  );
}
