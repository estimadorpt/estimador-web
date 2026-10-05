import { ChartTable } from '@/components/viz/ChartTable';
import { ACCENT, FURNITURE } from '@/components/viz/theme';

export interface FitRow {
  key: string;
  label: string;
  /** A second line under the label, e.g. how many parishes the row covers. */
  note?: string;
  value: number;
  display: string;
}

/**
 * Horizontal bars for a fit statistic, in the order given (the natural order
 * of the bands or of the scorecard's tables, never sorted by value). The value
 * is printed at the end of every bar, so the reading needs no hover; the table
 * twin carries the same rows with the note in its own column.
 */
export function FitBars({ rows, caption, columns, noteColumn }: {
  rows: FitRow[];
  caption: string;
  /** Table twin headers: label, value. */
  columns: [string, string];
  /** Header of the note column in the table twin, when rows carry notes. */
  noteColumn?: string;
}) {
  const top = Math.max(...rows.map(row => row.value), 0.0001);
  const tableColumns = noteColumn ? [columns[0], noteColumn, columns[1]] : columns;
  const tableRows = rows.map(row => (noteColumn ? [row.label, row.note ?? '', row.display] : [row.label, row.display]));
  return (
    <div>
      <ol className="flex flex-col gap-3">
        {rows.map(row => (
          <li key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[220px_minmax(0,1fr)_64px]">
            <span className="min-w-0 text-sm font-semibold text-ink">
              {row.label}
              {row.note && <span className="block text-xs font-normal text-stone-500">{row.note}</span>}
            </span>
            <span className="order-3 col-span-2 h-2.5 overflow-hidden rounded-r-[4px] sm:order-none sm:col-span-1" style={{ backgroundColor: FURNITURE.track }} aria-hidden="true">
              <span className="block h-full rounded-r-[4px]" style={{ width: `${Math.max(1.5, (row.value / top) * 100)}%`, backgroundColor: ACCENT }} />
            </span>
            <span className="text-right text-sm font-bold tabular-nums text-ink">{row.display}</span>
          </li>
        ))}
      </ol>
      <ChartTable caption={caption} columns={tableColumns} rows={tableRows} />
    </div>
  );
}
