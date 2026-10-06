import { useLocale } from 'next-intl';
import { Disclosure } from './Disclosure';

/**
 * The accessibility twin of a chart: the same numbers as a table, behind a
 * disclosure. The summary carries the caption for screen readers, so two
 * twins on one page are distinguishable; the scroll area is a named,
 * focusable region, so a long table scrolls from the keyboard too.
 *
 * On a phone a wide twin scrolls sideways inside its card (audit UXM2-04):
 * the first column (the row's label: a date, a club, a party) stays put, so
 * every value keeps its label, and a soft shadow at the right edge
 * (`.scroll-cue` in globals.css, pure CSS) says there is more to the right
 * until the end is reached. The header row stays put when it scrolls down.
 */
export function ChartTable({ caption, columns, rows, summaryLabel, className = '' }: { caption: string; columns: string[]; rows: Array<Array<string | number>>; summaryLabel?: string; className?: string }) {
  const locale = useLocale();
  const label = summaryLabel ?? (locale === 'en' ? 'View as table' : 'Ver como tabela');
  // The label column: sticky, opaque, a hairline on its right, and allowed to
  // wrap so a long name does not take the whole phone width.
  const labelCell = 'sticky left-0 border-r border-line bg-cream';
  return (
    <Disclosure summary={label} srSuffix={caption} className={`mt-3 ${className}`}>
      <div className="scroll-cue mt-2 max-h-[32rem] overflow-auto" tabIndex={0} role="region" aria-label={caption}>
        <table className="min-w-full border-separate border-spacing-0 text-sm tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c, j) => (
                <th key={c} scope="col" className={`sticky top-0 border-b-2 border-ink bg-cream px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-stone-600 ${j === 0 ? `${labelCell} z-20` : 'z-10'}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => j === 0 ? (
                  <th key={j} scope="row" className={`${labelCell} z-[5] min-w-[5.5rem] max-w-[11rem] border-b px-3 py-2 text-left font-medium text-ink`}>{v}</th>
                ) : (
                  <td key={j} className="whitespace-nowrap border-b border-line px-3 py-2 text-ink">{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Disclosure>
  );
}
