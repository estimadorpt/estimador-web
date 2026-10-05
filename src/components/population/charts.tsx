'use client';

/**
 * Population charts. They draw a response's own cells — the producer's shares
 * and display strings — in each category's natural order. They never sort by
 * value, never draw a remainder, and show suppressed or absent categories as
 * words, never as zero. Bars are on an absolute 0–100% scale, so a bar's length
 * is its share, not its rank among the others.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACCENT, DEEMPHASIS, FURNITURE, SERIES } from '@/components/viz/theme';
import { NOT_PUBLISHED, REASON_COPY, type Locale } from '@/lib/population/labels';
import type { ReadCell } from '@/lib/population/compact';

const muted = (cell: ReadCell, locale: Locale) =>
  cell.state === 'suppressed' ? REASON_COPY.cell_below_minimum[locale] : NOT_PUBLISHED[locale];

/** Horizontal bars, one per category, value at the tip. */
export function ShareBars({ cells, locale, color = ACCENT, labelWidth = 'sm:grid-cols-[minmax(120px,190px)_minmax(0,1fr)_64px]' }: {
  cells: ReadCell[];
  locale: Locale;
  color?: string;
  labelWidth?: string;
}) {
  return (
    <ol className="flex flex-col gap-2.5">
      {cells.map(cell => (
        <li key={cell.values.join('|')} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 ${labelWidth}`}>
          <span className="text-sm text-ink">{cell.labels[cell.labels.length - 1]}</span>
          <span className="order-3 col-span-2 h-2.5 overflow-hidden rounded-r-[4px] sm:order-none sm:col-span-1" style={{ backgroundColor: FURNITURE.track }} aria-hidden="true">
            {cell.share !== null && (
              <span className="block h-full rounded-r-[4px]" style={{ width: `${Math.max(0.8, cell.share * 100)}%`, backgroundColor: color }} />
            )}
          </span>
          <span
            className={`text-right text-sm tabular-nums ${cell.state === 'published' ? 'font-bold text-ink' : 'text-stone-500'}`}
            title={cell.state === 'published' ? undefined : muted(cell, locale)}
          >
            {cell.display}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Nineteen five-year age columns with a pointer readout. */
export function AgeColumns({ cells, locale, height = 200 }: { cells: ReadCell[]; locale: Locale; height?: number }) {
  const [active, setActive] = useState<number | null>(null);
  // Drawn at the container's real pixel width so axis text never scales below 11px.
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(570);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => setWidth(Math.max(260, Math.floor(entries[0].contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const top = useMemo(() => {
    const max = Math.max(0.01, ...cells.map(cell => cell.share ?? 0));
    return Math.ceil(max * 50) / 50; // next 2%
  }, [cells]);
  const left = 34;
  const bottom = 26;
  const plotHeight = height - bottom - 8;
  const band = (width - left) / cells.length;
  const bar = Math.min(18, band * 0.7);
  const ticks = [0, top / 2, top];
  const readout = active === null ? null : cells[active];
  const pct = (value: number) => `${Math.round(value * 100)}%`;
  return (
    <div ref={box}>
      <p className="mb-1 min-h-5 text-sm text-stone-600" aria-live="polite">
        {readout
          ? <><span className="font-semibold text-ink">{readout.labels[0]}</span>{locale === 'pt' ? ' anos: ' : ': '}<span className="font-bold tabular-nums text-ink">{readout.display}</span></>
          : <span className="text-stone-500">{locale === 'pt' ? 'Passe sobre uma coluna para ler o valor.' : 'Point at a column to read its value.'}</span>}
      </p>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label={cells.map(cell => `${cell.labels[0]}: ${cell.display}`).join('; ')} onMouseLeave={() => setActive(null)}>
        {ticks.map(tick => {
          const y = 8 + plotHeight - (tick / top) * plotHeight;
          return (
            <g key={tick}>
              <line x1={left} x2={width} y1={y} y2={y} stroke={FURNITURE.grid} />
              <text x={left - 6} y={y + 4} textAnchor="end" fontSize="11" fill={FURNITURE.axis} fontFamily={FURNITURE.font}>{pct(tick)}</text>
            </g>
          );
        })}
        {cells.map((cell, i) => {
          const x = left + i * band + (band - bar) / 2;
          const h = cell.share === null ? 0 : (cell.share / top) * plotHeight;
          const every = band < 22 ? 3 : band < 34 ? 2 : 1;
          const showLabel = i % every === 0;
          return (
            <g key={cell.values[0]} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} tabIndex={0} aria-label={`${cell.labels[0]}: ${cell.display}`}>
              <rect x={left + i * band} y={0} width={band} height={height - bottom} fill="transparent" />
              {cell.share === null
                ? <line x1={x + 2} x2={x + bar - 2} y1={8 + plotHeight - 3} y2={8 + plotHeight - 3} stroke={DEEMPHASIS} strokeWidth={2} strokeDasharray="2 2" />
                : <rect x={x} y={8 + plotHeight - h} width={bar} height={Math.max(1, h)} rx={3} fill={active === null || active === i ? ACCENT : DEEMPHASIS} />}
              {showLabel && <text x={x + bar / 2} y={height - 8} textAnchor="middle" fontSize="11" fill={FURNITURE.axis} fontFamily={FURNITURE.font}>{cell.labels[0].split('–')[0]}</text>}
            </g>
          );
        })}
        <line x1={left} x2={width} y1={8 + plotHeight} y2={8 + plotHeight} stroke={FURNITURE.axis} />
      </svg>
    </div>
  );
}

/**
 * "If this place were 100 people": one hundred dots split by the response's
 * shares, by largest remainder so they always add to 100. Only for responses
 * with nothing suppressed (see isWhole) and at most four categories.
 */
export function HundredPeople({ cells, locale, unit = 'people' }: { cells: ReadCell[]; locale: Locale; unit?: 'people' | 'households' }) {
  const published = cells.filter(cell => cell.share !== null);
  const counts = useMemo(() => {
    const raw = published.map(cell => (cell.share as number) * 100);
    const floors = raw.map(Math.floor);
    let left = 100 - floors.reduce((a, b) => a + b, 0);
    const order = raw.map((value, i) => [value - floors[i], i] as const).sort((a, b) => b[0] - a[0]);
    for (const [, i] of order) { if (left <= 0) break; floors[i] += 1; left -= 1; }
    return floors;
  }, [published]);
  const dots = counts.flatMap((count, i) => Array.from({ length: count }, () => i));
  const each = unit === 'people'
    ? (locale === 'pt' ? 'Cada ponto, cerca de 1 pessoa em cada 100.' : 'Each dot, about 1 person in 100.')
    : (locale === 'pt' ? 'Cada ponto, cerca de 1 agregado em cada 100.' : 'Each dot, about 1 household in 100.');
  return (
    <div>
      <div className="grid max-w-[220px] grid-cols-10 gap-[5px]" role="img" aria-label={published.map(cell => `${cell.labels.at(-1)} ${cell.display}`).join(', ')}>
        {dots.map((series, i) => <span key={i} className="aspect-square w-full rounded-full" style={{ backgroundColor: SERIES[series] ?? DEEMPHASIS }} />)}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
        {published.map((cell, i) => (
          <li key={cell.values.join('|')} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SERIES[i] ?? DEEMPHASIS }} aria-hidden="true" />
            {cell.labels.at(-1)} <strong className="tabular-nums text-ink">{cell.display}</strong>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-stone-500">{each}</p>
    </div>
  );
}
