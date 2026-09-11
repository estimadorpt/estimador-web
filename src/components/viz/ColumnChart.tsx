'use client';

import { useEffect, useRef, useState } from 'react';
import { ChartTable } from './ChartTable';
import { ACCENT, DEEMPHASIS, FURNITURE } from './theme';

export interface Column { label: string; value: number; /** The one column the story is about. */ highlight?: boolean; color?: string }

interface ColumnChartProps {
  data: Column[];
  format?: (v: number) => string;
  yLabel?: string;
  height?: number;
  /** Emphasis mode: highlighted columns take the accent, the rest the de-emphasis grey. Off, every column is the accent. */
  emphasis?: boolean;
  tableCaption?: string;
  /** Header of the table twin's first column; defaults to "Categoria"/"Category". */
  xLabel?: string;
  tableLabel?: string;
  locale?: 'pt' | 'en';
  className?: string;
}

/**
 * Magnitude by category: columns no wider than 24px with a rounded cap, a
 * value on each cap only when there are few columns, a hairline grid, and a
 * per-mark tooltip. One hue; emphasis is the honest way to say "this one".
 */
export function ColumnChart({ data, format = v => String(v), yLabel, xLabel, height = 260, emphasis = false, tableCaption = 'Dados do gráfico', tableLabel, locale = 'pt', className = '' }: ColumnChartProps) {
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
      const rows = data.map(d => ({ ...d, fill: d.color ?? (emphasis ? (d.highlight ? ACCENT : DEEMPHASIS) : ACCENT) }));
      const labelAll = rows.length <= 8;
      const plot = Plot.plot({
        width, height, marginLeft: 44, marginRight: 12, marginBottom: 36, marginTop: 20,
        style: { fontFamily: FURNITURE.font, fontSize: '12px', color: FURNITURE.axis, background: 'transparent', overflow: 'visible' },
        x: { label: null, padding: 0.35 },
        y: { label: yLabel ?? null, tickFormat: (d: number) => format(d), grid: false },
        marks: [
          Plot.gridY({ stroke: FURNITURE.grid, strokeOpacity: 1 }),
          Plot.barY(rows, { x: 'label', y: 'value', fill: 'fill', rx: 4, insetLeft: 0, insetRight: 0, title: d => `${d.label}: ${format(d.value)}` }),
          Plot.ruleY([0], { stroke: FURNITURE.axis }),
          ...(labelAll ? [Plot.text(rows, { x: 'label', y: 'value', text: d => format(d.value), dy: -8, fill: FURNITURE.text, fontWeight: 700, fontSize: 12 })] : []),
          Plot.tip(rows, Plot.pointerX({ x: 'label', y: 'value', title: d => `${d.label}: ${format(d.value)}` })),
        ],
      });
      // Columns are capped at 24px wide: the band's leftover is air, never fill.
      plot.querySelectorAll('rect').forEach(r => { const w = Number(r.getAttribute('width')); if (w > 24) { const x = Number(r.getAttribute('x')); r.setAttribute('x', String(x + (w - 24) / 2)); r.setAttribute('width', '24'); } });
      el.replaceChildren(plot);
    })();
    return () => { disposed = true; };
  }, [data, width, height, format, yLabel, emphasis]);
  return (
    <div className={className}>
      <div ref={ref} className="w-full" />
      <ChartTable caption={tableCaption} columns={[xLabel ?? (locale === 'pt' ? 'Categoria' : 'Category'), yLabel ?? (locale === 'pt' ? 'Valor' : 'Value')]} rows={data.map(d => [d.label, format(d.value)])} summaryLabel={tableLabel ?? (locale === 'pt' ? 'Ver como tabela' : 'View as table')} />
    </div>
  );
}
