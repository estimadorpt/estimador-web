import { useLocale } from 'next-intl';
import { Disclosure } from './Disclosure';

/**
 * The accessibility twin of a chart: the same numbers as a table, behind a
 * disclosure. The summary carries the caption for screen readers, so two
 * twins on one page are distinguishable; the scroll area is a named,
 * focusable region, so a long table scrolls from the keyboard too.
 */
export function ChartTable({ caption, columns, rows, summaryLabel, className = '' }: { caption: string; columns: string[]; rows: Array<Array<string | number>>; summaryLabel?: string; className?: string }) {
  const locale = useLocale();
  const label = summaryLabel ?? (locale === 'en' ? 'View as table' : 'Ver como tabela');
  return (
    <Disclosure summary={label} srSuffix={caption} className={`mt-3 ${className}`}>
      <div className="mt-2 max-h-[32rem] overflow-auto" tabIndex={0} role="region" aria-label={caption}>
        <table className="min-w-full border-collapse text-sm tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead><tr>{columns.map(c => <th key={c} scope="col" className="sticky top-0 border-b-2 border-ink bg-cream px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-stone-600">{c}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className="whitespace-nowrap border-b border-line px-3 py-2 text-ink">{v}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </Disclosure>
  );
}
