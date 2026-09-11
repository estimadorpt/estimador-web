'use client';

import { useEffect, useRef, useState } from 'react';
import type { Markish } from '@observablehq/plot';
import { ChartTable } from './ChartTable';
import { Legend } from './Legend';
import { FURNITURE, seriesColor } from './theme';

export interface TrendPoint { x: Date | number; y: number; lo?: number; hi?: number; projected?: boolean }
export interface TrendSeries { name: string; points: TrendPoint[]; color?: string }

interface TrendChartProps {
  series: TrendSeries[];
  /** Formats a value for axis, labels and the table. */
  format?: (v: number) => string;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  /** Where the y axis starts; omit to fit the data. */
  yMin?: number;
  yMax?: number;
  /** A horizontal reference, such as 50% or a target. */
  reference?: { value: number; label: string };
  tableCaption?: string;
  tableLabel?: string;
  locale?: 'pt' | 'en';
  className?: string;
}

/**
 * Change over time: 2px lines, a 10% wash for the uncertainty band, a dashed
 * stroke where values are projected, an 8px end marker with a surface ring,
 * the last value labelled directly, and a crosshair tooltip that reads every
 * series at the pointer's x. Recessive hairline grid, one axis, and a table
 * twin behind a disclosure.
 */
export function TrendChart({ series, format = v => String(v), xLabel, yLabel, height = 280, yMin, yMax, reference, tableCaption = 'Dados do gráfico', tableLabel, locale = 'pt', className = '' }: TrendChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(entries => setWidth(Math.floor(entries[0].contentRect.width)));
    ro.observe(el); setWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current; if (!el || !width) return;
    let disposed = false;
    (async () => {
      const Plot = await import('@observablehq/plot');
      if (disposed) return;
      const rows = series.flatMap((s, i) => s.points.map(p => ({ ...p, series: s.name, color: s.color ?? seriesColor(i) })));
      const last = series.map((s, i) => ({ ...s.points[s.points.length - 1], series: s.name, color: s.color ?? seriesColor(i) }));
      const isDate = rows[0]?.x instanceof Date;
      const marks: Markish[] = [
        Plot.gridY({ stroke: FURNITURE.grid, strokeOpacity: 1 }),
        Plot.ruleY([yMin ?? 0], { stroke: FURNITURE.grid }),
      ];
      if (reference) marks.push(Plot.ruleY([reference.value], { stroke: FURNITURE.axis, strokeDasharray: '2 4' }), Plot.text([reference], { x: rows[0].x, y: 'value', text: 'label', dy: -6, textAnchor: 'start', fill: FURNITURE.textMuted, fontSize: 11 }));
      for (const s of series) {
        const name = s.name;
        marks.push(Plot.areaY(rows.filter(r => r.series === name && r.lo != null && r.hi != null), { x: 'x', y1: 'lo', y2: 'hi', fill: 'color', fillOpacity: 0.12 }));
        marks.push(Plot.lineY(rows.filter(r => r.series === name && !r.projected), { x: 'x', y: 'y', stroke: 'color', strokeWidth: 2, curve: 'monotone-x' }));
        const projected = rows.filter(r => r.series === name && r.projected);
        if (projected.length) {
          const firstProjected = rows.filter(r => r.series === name).findIndex(r => r.projected);
          const withAnchor = rows.filter(r => r.series === name).slice(Math.max(0, firstProjected - 1));
          marks.push(Plot.lineY(withAnchor, { x: 'x', y: 'y', stroke: 'color', strokeWidth: 2, strokeDasharray: '4 4', curve: 'monotone-x' }));
        }
      }
      marks.push(Plot.dot(last, { x: 'x', y: 'y', r: 4.5, fill: 'color', stroke: FURNITURE.surface, strokeWidth: 2 }));
      marks.push(Plot.text(last, { x: 'x', y: 'y', text: d => format(d.y), dx: 10, textAnchor: 'start', fill: FURNITURE.text, fontWeight: 700, fontSize: 12 }));
      marks.push(Plot.tip(rows, Plot.pointerX({ x: 'x', y: 'y', stroke: 'color', title: d => `${d.series}: ${format(d.y)}${d.lo != null ? ` (${format(d.lo)} a ${format(d.hi as number)})` : ''}` })));
      marks.push(Plot.crosshairX(rows, { x: 'x', y: 'y', stroke: FURNITURE.axis, textFill: FURNITURE.text, textStroke: FURNITURE.surface }));
      // Date ticks in the page's language: monthly steps from the first month,
      // the year on January and on the first tick; yearly steps sit on January
      // and show the year alone.
      const dateTicks = (() => {
        if (!isDate) return undefined;
        const times = rows.map(r => +r.x);
        const min = new Date(Math.min(...times)), max = new Date(Math.max(...times));
        const span = (max.getUTCFullYear() - min.getUTCFullYear()) * 12 + (max.getUTCMonth() - min.getUTCMonth());
        const step = [1, 2, 3, 4, 6, 12, 24, 60, 120].find(st => span / st <= 6) ?? 120;
        const out: Date[] = [];
        if (step >= 12) { for (let y = min.getUTCFullYear() + (min.getUTCMonth() ? 1 : 0); y <= max.getUTCFullYear(); y += step / 12) out.push(new Date(Date.UTC(y, 0, 1))); }
        else for (let m = 0; m <= span; m += step) out.push(new Date(Date.UTC(min.getUTCFullYear(), min.getUTCMonth() + m, 1)));
        return { ticks: out, yearly: step >= 12 };
      })();
      const monthName = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { month: 'short', timeZone: 'UTC' });
      const tickDate = (d: Date) => dateTicks?.yearly
        ? String(d.getUTCFullYear())
        : `${monthName.format(d).replace('.', '')}${d.getUTCMonth() === 0 || +d === +(dateTicks?.ticks[0] ?? 0) ? `\n${d.getUTCFullYear()}` : ''}`;
      const plot = Plot.plot({
        width, height, marginLeft: 48, marginRight: 64, marginBottom: 36, marginTop: 12,
        style: { fontFamily: FURNITURE.font, fontSize: '12px', color: FURNITURE.axis, background: 'transparent', overflow: 'visible' },
        x: { label: xLabel ?? null, type: isDate ? 'utc' : 'linear', tickFormat: isDate ? tickDate : (d: number) => String(d), ticks: dateTicks?.ticks ?? 6 },
        y: { label: yLabel ?? null, domain: yMin != null || yMax != null ? [yMin ?? 0, yMax ?? Math.max(...rows.map(r => r.hi ?? r.y))] : undefined, tickFormat: (d: number) => format(d), grid: false },
        marks,
      });
      el.replaceChildren(plot);
    })();
    return () => { disposed = true; };
  }, [series, width, height, format, xLabel, yLabel, yMin, yMax, reference, locale]);

  const fmtX = (x: Date | number) => x instanceof Date ? x.toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-GB', { month: 'short', year: 'numeric' }) : String(x);
  const xs = Array.from(new Set(series.flatMap(s => s.points.map(p => +p.x)))).sort((a, b) => a - b);
  const banded = series.map(s => s.points.some(p => p.lo != null && p.hi != null));
  const projectedNote = locale === 'pt' ? 'projeção' : 'projected';
  const rowsTable = xs.map(xv => [fmtX(series[0].points.find(p => +p.x === xv)?.x ?? xv), ...series.flatMap((s, i) => { const p = s.points.find(q => +q.x === xv); const value = p ? `${format(p.y)}${p.projected ? ` (${projectedNote})` : ''}` : ''; return banded[i] ? [value, p && p.lo != null && p.hi != null ? `${format(p.lo)}–${format(p.hi)}` : ''] : [value]; })]);
  const tableColumns = [xLabel ?? (locale === 'pt' ? 'Data' : 'Date'), ...series.flatMap((s, i) => banded[i] ? [s.name, `${s.name} · ${locale === 'pt' ? 'banda' : 'band'}`] : [s.name])];
  return (
    <div className={className}>
      <Legend items={series.map((s, i) => ({ label: s.name, color: s.color ?? seriesColor(i) }))} className="mb-2" />
      <div ref={ref} className="w-full" />
      <ChartTable caption={tableCaption} columns={tableColumns} rows={rowsTable} summaryLabel={tableLabel ?? (locale === 'pt' ? 'Ver como tabela' : 'View as table')} />
    </div>
  );
}
