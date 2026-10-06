// Small dependency-free multi-series line chart (inline SVG, server-safe) for
// the data-stories section — same visual language as the dashboard sparklines
// (stone grid, 0-baseline, quiet colors). Series are drawn by index on a shared
// x axis; null values create gaps instead of interpolating across them.

import { COLORS } from '@/lib/utils/economy-format';
import { FURNITURE } from '@/components/viz/theme';
import { withMinus } from '@/lib/typography';

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

/**
 * The plot stretches to the card's width while its text does not: the lines
 * are an SVG drawn edge to edge (preserveAspectRatio="none", strokes that do
 * not scale), and the tick and period labels are HTML at 11px in the chart
 * text colour (FURNITURE.axis, 4.5:1 on cream). A 640px drawing shrunk onto a
 * phone used to print them at about 5 to 10px in a faint grey (A11Y2-09).
 */
function StoryLinePlot({
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
  const H = height;
  const gutter = 38; // px for the tick labels
  const padTop = 10;
  const padBottom = 22; // px for the period labels
  const plotH = H - padTop - padBottom;
  const plotW = 600; // user units; stretched to the available width

  const n = Math.max(...series.map((s) => s.values.length), 0);
  const finite = series.flatMap((s) => s.values.filter(isNum));
  if (n < 2 || finite.length === 0) return null;

  const rawMin = Math.min(0, ...finite);
  const rawMax = Math.max(...finite);
  const span = Math.max(rawMax - rawMin, 0.1);
  const yLo = rawMin - span * 0.05;
  const yHi = rawMax + span * 0.08;

  const xAt = (i: number) => (plotW * i) / Math.max(n - 1, 1);
  const yAt = (v: number) => plotH * (1 - (v - yLo) / (yHi - yLo));

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

  const label = { color: FURNITURE.axis };
  return (
    <div role="img" aria-label={ariaLabel} className="relative w-full text-[11px] leading-none tabular-nums" style={{ height: H }}>
      <div aria-hidden="true">
        {ticks.map((v) => (
          <span
            key={v}
            className="absolute left-0 -translate-y-1/2 pr-1.5 text-right"
            style={{ ...label, top: padTop + yAt(v), width: gutter }}
          >
            {withMinus(yFmt(Math.abs(v) < 1e-9 ? 0 : v))}
          </span>
        ))}
        <svg
          viewBox={`0 0 ${plotW} ${plotH}`}
          preserveAspectRatio="none"
          className="absolute overflow-visible"
          style={{ left: gutter, right: 4, top: padTop, height: plotH, width: `calc(100% - ${gutter + 4}px)` }}
        >
          {ticks.map((v) => (
            <line
              key={v}
              x1={0}
              x2={plotW}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke={Math.abs(v) < 1e-9 ? COLORS.stone : COLORS.grid}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {series.map((s, si) =>
            segmentsOf(s.values).map((pts, gi) => (
              <polyline
                key={`${si}-${gi}`}
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? '4 3' : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))
          )}
        </svg>
        {xStartLabel && (
          <span className="absolute bottom-0" style={{ ...label, left: gutter }}>{xStartLabel}</span>
        )}
        {xEndLabel && (
          <span className="absolute bottom-0 right-1" style={label}>{xEndLabel}</span>
        )}
      </div>
    </div>
  );
}

/** One drawing at every width: the plot stretches, the labels stay at 11px. */
export function StoryLineChart(props: Parameters<typeof StoryLinePlot>[0]) {
  return <StoryLinePlot {...props} />;
}

/** Legend chips shared by the story charts: color swatch + label (+ last value). */
export function StoryChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string; value?: string; dashed?: boolean }>;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-stone-600">
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
