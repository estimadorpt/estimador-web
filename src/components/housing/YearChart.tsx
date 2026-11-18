import { BRAND, FONT_STACK } from '@/lib/brand';

/**
 * A year-by-year chart of recorded values: each value a black square (what
 * already happened, the reading rule's first mark) on a thin line, the series
 * named at its end. Server-rendered SVG, drawn twice (a wide and a phone
 * frame, swapped by CSS) so chart text never drops below 11px. Nothing here is
 * modelled, so there is no band. Its table twin carries every value.
 */

export interface YearPoint {
  year: number;
  value: number;
  /** Drawn smaller and greyer: a partial year or an estimate. Say why in the note under the chart. */
  soft?: boolean;
}

export interface YearSeries {
  key: string;
  label: string;
  tone: 'ink' | 'graphite';
  points: YearPoint[];
}

export interface YearChartProps {
  label: string;
  series: YearSeries[];
  yMax: number;
  yTicks: { value: number; label: string }[];
  /** Horizontal reference lines on the scale ("2 anos"). */
  references?: { value: number; label: string }[];
  /** Dated vertical markers, at a fractional year ("Simplex, 4 mar. 2024"). */
  markers?: { at: number; label: string }[];
  /** Year labels on the axis; every other year if omitted. */
  xTicks?: number[];
  phoneXTicks?: number[];
}

const TONE = { ink: BRAND.ink, graphite: BRAND.muted } as const;

function Frame({ props, width, height, compact }: { props: YearChartProps; width: number; height: number; compact: boolean }) {
  const { series, yMax, yTicks, references = [], markers = [] } = props;
  const years = series.flatMap(s => s.points.map(p => p.year));
  const x0 = Math.min(...years);
  const x1 = Math.max(...years);
  const labelRoom = compact ? 0 : 150;
  const left = compact ? 38 : 52;
  const right = width - 12 - labelRoom;
  const top = compact ? 34 : 18;
  const bottom = height - 28;
  const x = (yr: number) => left + ((yr - x0) / Math.max(1, x1 - x0)) * (right - left);
  const y = (v: number) => bottom - (v / yMax) * (bottom - top);
  const xTicks = (compact ? props.phoneXTicks : props.xTicks)
    ?? years.filter((yr, i, a) => a.indexOf(yr) === i && (yr - x0) % (compact ? 4 : 2) === 0);
  const sq = compact ? 6 : 7;
  const font = { fontFamily: FONT_STACK, fontSize: 12 };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={props.label} style={{ maxWidth: width }}>
      {yTicks.map(t => (
        <g key={t.value}>
          <line x1={left} x2={right} y1={y(t.value)} y2={y(t.value)} stroke={BRAND.grid} />
          <text x={left - 6} y={y(t.value) + 4} textAnchor="end" fill={BRAND.muted} {...font}>{t.label}</text>
        </g>
      ))}
      {references.map(r => (
        <g key={`ref-${r.value}`}>
          <line x1={left} x2={right} y1={y(r.value)} y2={y(r.value)} stroke={BRAND.ink} strokeDasharray="2 3" />
          <text x={left + 4} y={y(r.value) - 5} fill={BRAND.ink} {...font}>{r.label}</text>
        </g>
      ))}
      {markers.map(m => (
        <g key={`m-${m.at}`}>
          <line x1={x(m.at)} x2={x(m.at)} y1={top - (compact ? 22 : 6)} y2={bottom} stroke={BRAND.faint} />
          <text x={x(m.at) - 4} y={top - (compact ? 12 : -8)} textAnchor="end" fill={BRAND.muted} {...font}>{m.label}</text>
        </g>
      ))}
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke={BRAND.ink} />
      {xTicks.map(yr => (
        <g key={`x-${yr}`}>
          <line x1={x(yr)} x2={x(yr)} y1={bottom} y2={bottom + 4} stroke={BRAND.ink} />
          <text x={x(yr)} y={bottom + 18} textAnchor="middle" fill={BRAND.muted} {...font}>{yr}</text>
        </g>
      ))}
      {series.map(s => {
        const colour = TONE[s.tone];
        const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.year).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
        const last = s.points[s.points.length - 1];
        return (
          <g key={s.key}>
            <path d={d} fill="none" stroke={colour} strokeWidth={s.tone === 'ink' ? 1.5 : 1} />
            {s.points.map(p => {
              const size = p.soft ? sq - 2 : sq;
              return (
                <rect
                  key={p.year}
                  x={x(p.year) - size / 2}
                  y={y(p.value) - size / 2}
                  width={size}
                  height={size}
                  fill={p.soft ? BRAND.faint : colour}
                />
              );
            })}
            {!compact && last && (
              <text x={right + 10} y={y(last.value) + 4} fill={colour} {...font} fontWeight={s.tone === 'ink' ? 600 : 400}>{s.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function YearChart(props: YearChartProps) {
  return (
    <div className="py-2">
      <div className="hidden sm:block"><Frame props={props} width={760} height={320} compact={false} /></div>
      <div className="sm:hidden">
        <Frame props={props} width={360} height={280} compact />
        <ul className="mt-2 grid gap-1 text-[13px]" aria-hidden="true">
          {props.series.map(s => (
            <li key={s.key} className="flex items-center gap-2">
              <span className="inline-block h-2 w-5" style={{ background: TONE[s.tone] }} />
              <span className={s.tone === 'ink' ? 'font-semibold text-ink' : 'text-graphite'}>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
