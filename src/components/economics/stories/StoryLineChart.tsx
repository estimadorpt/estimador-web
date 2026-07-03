// Small dependency-free multi-series line chart (inline SVG, server-safe) for
// the data-stories section — same visual language as the dashboard sparklines
// (stone grid, 0-baseline, quiet colors). Series are drawn by index on a shared
// x axis; null values create gaps instead of interpolating across them.

import { COLORS } from '@/lib/utils/economy-format';

export interface StorySeries {
  label: string;
  color: string;
  values: Array<number | null | undefined>;
  /** Render as a dashed line (e.g. a reference series). */
  dashed?: boolean;
}

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function StoryLineChart({
  series,
  xStartLabel,
  xEndLabel,
  ariaLabel,
  yFmt = (v: number) => String(Math.round(v)),
  height = 190,
}: {
  series: StorySeries[];
  xStartLabel?: string;
  xEndLabel?: string;
  ariaLabel: string;
  yFmt?: (v: number) => string;
  height?: number;
}) {
  const W = 640;
  const H = height;
  const padL = 34;
  const padR = 10;
  const padTop = 10;
  const padBottom = 18;
  const plotW = W - padL - padR;
  const plotH = H - padTop - padBottom;

  const n = Math.max(...series.map((s) => s.values.length), 0);
  const finite = series.flatMap((s) => s.values.filter(isNum));
  if (n < 2 || finite.length === 0) return null;

  const rawMin = Math.min(0, ...finite);
  const rawMax = Math.max(...finite);
  const span = Math.max(rawMax - rawMin, 0.1);
  const yLo = rawMin - span * 0.05;
  const yHi = rawMax + span * 0.08;

  const xAt = (i: number) => padL + (plotW * i) / Math.max(n - 1, 1);
  const yAt = (v: number) => padTop + plotH * (1 - (v - yLo) / (yHi - yLo));

  // ~4 horizontal gridlines at "nice" steps.
  const step = (() => {
    const target = (yHi - yLo) / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(target)));
    for (const m of [1, 2, 2.5, 5, 10]) {
      if (m * mag >= target) return m * mag;
    }
    return 10 * mag;
  })();
  const ticks: number[] = [];
  for (let v = Math.ceil(yLo / step) * step; v <= yHi; v += step) ticks.push(v);

  // Split each series into contiguous finite segments (nulls become gaps).
  const segmentsOf = (values: StorySeries['values']): string[] => {
    const segs: string[] = [];
    let current: string[] = [];
    values.forEach((v, i) => {
      if (isNum(v)) {
        current.push(`${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`);
      } else if (current.length > 0) {
        segs.push(current.join(' '));
        current = [];
      }
    });
    if (current.length > 0) segs.push(current.join(' '));
    return segs.filter((s) => s.includes(' '));
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="block w-full h-auto">
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={W - padR}
            y1={yAt(v)}
            y2={yAt(v)}
            stroke={Math.abs(v) < 1e-9 ? COLORS.stone : COLORS.grid}
            strokeWidth={1}
          />
          <text
            x={padL - 5}
            y={yAt(v) + 3}
            textAnchor="end"
            fontSize="9"
            fill={COLORS.stone}
            className="tabular-nums"
          >
            {yFmt(Math.abs(v) < 1e-9 ? 0 : v)}
          </text>
        </g>
      ))}

      {series.map((s, si) =>
        segmentsOf(s.values).map((pts, gi) => (
          <polyline
            key={`${si}-${gi}`}
            points={pts}
            fill="none"
            stroke={s.color}
            strokeWidth={1.8}
            strokeDasharray={s.dashed ? '4 3' : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))
      )}

      {xStartLabel && (
        <text x={padL} y={H - 4} fontSize="9" fill={COLORS.stone}>
          {xStartLabel}
        </text>
      )}
      {xEndLabel && (
        <text x={W - padR} y={H - 4} textAnchor="end" fontSize="9" fill={COLORS.stone}>
          {xEndLabel}
        </text>
      )}
    </svg>
  );
}

/** Legend chips shared by the story charts: color swatch + label (+ last value). */
export function StoryChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string; value?: string; dashed?: boolean }>;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-stone-500">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block w-3.5 h-0.5 rounded"
            style={{
              backgroundColor: it.dashed ? 'transparent' : it.color,
              backgroundImage: it.dashed
                ? `linear-gradient(to right, ${it.color} 60%, transparent 40%)`
                : undefined,
              backgroundSize: it.dashed ? '5px 2px' : undefined,
            }}
          />
          <span>{it.label}</span>
          {it.value && <span className="tabular-nums font-semibold">{it.value}</span>}
        </span>
      ))}
    </div>
  );
}
