import { useLocale } from 'next-intl';
import { ACCENT, FURNITURE } from './theme';
import { ChartTable } from './ChartTable';

interface Row {
  label: string;
  value: number;
  /** The formatted value shown at the tip. */
  display: string;
  /** The entity's own colour (a club, a party). Defaults to the accent; context rows take the de-emphasis grey. */
  color?: string;
  note?: string;
  muted?: boolean;
}

/**
 * Horizontal ranked bars: name, a proportional bar no thicker than 24px with a
 * rounded data-end, the value at the tip in text ink. Bars are separated by
 * their own row, so no gap trick is needed; colour follows the entity, never
 * its rank. The value is text, so the chart is its own table.
 */
export function RankedBars({ rows, max, tableCaption, tableColumns, className = '' }: { rows: Row[]; max?: number; /** Renders the table twin when given. */ tableCaption?: string; tableColumns?: [string, string]; className?: string }) {
  const locale = useLocale();
  const top = max ?? Math.max(...rows.map(r => r.value), 0.0001);
  const columns = tableColumns ?? (locale === 'en' ? ['Name', 'Value'] : ['Nome', 'Valor']);
  return (
    <div className={className}>
    <ol className="flex flex-col gap-3">
      {rows.map(row => (
        <li key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[140px_minmax(0,1fr)_72px]">
          <span className={`truncate text-sm ${row.muted ? 'text-stone-500' : 'font-semibold text-ink'}`}>{row.label}{row.note && <span className="ml-2 text-xs font-normal text-stone-500">{row.note}</span>}</span>
          <span className="order-3 col-span-2 h-2.5 overflow-hidden rounded-r-[4px] sm:order-none sm:col-span-1" style={{ backgroundColor: FURNITURE.track }} aria-hidden="true">
            <span className="block h-full rounded-r-[4px]" style={{ width: `${Math.max(1.5, (row.value / top) * 100)}%`, backgroundColor: row.muted ? '#c3c8bb' : (row.color ?? ACCENT) }} />
          </span>
          <span className={`text-right text-sm tabular-nums ${row.muted ? 'text-stone-500' : 'font-bold text-ink'}`}>{row.display}</span>
        </li>
      ))}
    </ol>
    {tableCaption && <ChartTable caption={tableCaption} columns={columns} rows={rows.map(r => [r.label, r.display])} />}
    </div>
  );
}
