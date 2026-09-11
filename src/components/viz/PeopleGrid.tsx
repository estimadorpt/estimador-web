import { useLocale } from 'next-intl';
import { DEEMPHASIS, SERIES } from './theme';
import { ChartTable } from './ChartTable';

interface Share {
  label: string;
  /** In [0, 1]; shares are rounded to whole dots out of one hundred. */
  value: number;
  color?: string;
}

/**
 * One hundred dots, each one percent: the atlas's way of showing a share of
 * people. Categories fill in order with the series colours; the remainder is
 * the de-emphasis grey. Direct labels and a legend both carry identity.
 */
export function PeopleGrid({ shares, columns = 10, tableCaption, tableColumns, className = '' }: { shares: Share[]; columns?: number; /** Renders the table twin when given. */ tableCaption?: string; tableColumns?: [string, string]; className?: string }) {
  const locale = useLocale();
  const tableCols = tableColumns ?? (locale === 'en' ? ['Group', 'Share'] : ['Grupo', 'Percentagem']);
  const dots: string[] = [];
  shares.forEach((s, i) => { const n = Math.round(s.value * 100); for (let k = 0; k < n && dots.length < 100; k++) dots.push(s.color ?? SERIES[i % SERIES.length]); });
  while (dots.length < 100) dots.push(DEEMPHASIS);
  return (
    <div className={className}>
      <div className="grid gap-[5px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, maxWidth: columns * 16 }} role="img" aria-label={shares.map(s => `${s.label} ${Math.round(s.value * 100)}%`).join(', ')}>
        {dots.map((c, i) => <span key={i} className="aspect-square w-full rounded-full" style={{ backgroundColor: c }} />)}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
        {shares.map((s, i) => (
          <li key={s.label} className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color ?? SERIES[i % SERIES.length] }} aria-hidden="true" />{s.label} <strong className="text-ink">{Math.round(s.value * 100)}%</strong></li>
        ))}
      </ul>
      {tableCaption && <ChartTable caption={tableCaption} columns={tableCols} rows={shares.map(s => [s.label, `${Math.round(s.value * 100)}%`])} />}
    </div>
  );
}
