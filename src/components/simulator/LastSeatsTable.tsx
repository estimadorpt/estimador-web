import { formatElectionNumber } from '@/lib/election-display';
import { Disclosure } from '@/components/viz/Disclosure';
import { listColor, listName, type Locale } from './copy';

export interface LastSeatRow {
  circle: string;
  seats: number;
  /** The list that took the circle's last seat. */
  list: string;
  /** The next list in line and the extra votes it needed (null: no other list in line). */
  runnerUp: { list: string; votes: number } | null;
  /** Kept at its 2025 result in a scenario (the emigration circles). */
  fixed?: boolean;
  /** The last seat changed hands against 2025. */
  changed?: boolean;
}

/** Rows sorted by how few votes the last seat hung on, the circles with no runner-up last. */
export function byMargin(rows: LastSeatRow[]): LastSeatRow[] {
  return [...rows].sort((a, b) => (a.runnerUp?.votes ?? Infinity) - (b.runnerUp?.votes ?? Infinity) || a.circle.localeCompare(b.circle, 'pt'));
}

function Party({ list, locale }: { list: string; locale: Locale }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0" style={{ backgroundColor: listColor(list) }} />
      {listName(list, locale)}
    </span>
  );
}

/**
 * Every circle's last seat: who took it, who was next in line and how many more votes that
 * list needed, everything else equal. The first `shown` rows (the closest) are open; the rest
 * sit behind a disclosure. A table of figures is its own twin: no chart repeats it.
 */
export function LastSeatsTable({ rows, locale, shown = 8, caption, votesHeading, restLabel, fixedNote }: {
  rows: LastSeatRow[];
  locale: Locale;
  shown?: number;
  caption: string;
  /** The margin column's heading: "Votos que faltavam" (2025) or "Votos que faltariam" (a scenario). */
  votesHeading: string;
  /** The disclosure's summary for the other rows. */
  restLabel: string;
  /** Shown beside a circle kept at 2025 in a scenario. */
  fixedNote?: string;
}) {
  const pt = locale === 'pt';
  const sorted = byMargin(rows);
  const head = (
    <thead>
      <tr className="border-b-2 border-ink text-[12px] font-semibold text-graphite">
        <th scope="col" className="py-2 pr-3 text-left">{pt ? 'Círculo' : 'Circle'}</th>
        <th scope="col" className="px-3 py-2 text-right">{pt ? 'Mandatos' : 'Seats'}</th>
        <th scope="col" className="px-3 py-2 text-left">{pt ? 'Último mandato' : 'Last seat'}</th>
        <th scope="col" className="px-3 py-2 text-left">{pt ? 'A seguir' : 'Next in line'}</th>
        <th scope="col" className="py-2 pl-3 text-right">{votesHeading}</th>
      </tr>
    </thead>
  );
  const body = (list: LastSeatRow[]) => (
    <tbody>
      {list.map(r => (
        <tr key={r.circle} className="border-b border-grid">
          <th scope="row" className="py-2 pr-3 text-left font-medium text-ink">
            {r.circle}
            {r.fixed && fixedNote && <span className="block text-[12px] font-normal text-graphite">{fixedNote}</span>}
          </th>
          <td className="px-3 py-2 text-right">{formatElectionNumber(r.seats, locale)}</td>
          <td className="px-3 py-2">
            <Party list={r.list} locale={locale} />
            {r.changed && <span className="ml-2 text-[12px] font-semibold text-ink">{pt ? 'mudou' : 'changed'}</span>}
          </td>
          <td className="px-3 py-2">{r.runnerUp ? <Party list={r.runnerUp.list} locale={locale} /> : '—'}</td>
          <td className="py-2 pl-3 text-right font-semibold">{r.runnerUp ? formatElectionNumber(r.runnerUp.votes, locale) : '—'}</td>
        </tr>
      ))}
    </tbody>
  );
  const table = (list: LastSeatRow[], label: string) => (
    <div className="scroll-cue overflow-x-auto" tabIndex={0} role="region" aria-label={label}>
      <table className="min-w-full border-collapse text-sm tabular-nums">
        <caption className="sr-only">{label}</caption>
        {head}
        {body(list)}
      </table>
    </div>
  );
  const rest = sorted.slice(shown);
  return (
    <div>
      {table(sorted.slice(0, shown), caption)}
      {rest.length > 0 && (
        <Disclosure summary={restLabel} srSuffix={caption} className="mt-2">
          <div className="mt-2">{table(rest, `${caption} (${pt ? 'continuação' : 'continued'})`)}</div>
        </Disclosure>
      )}
    </div>
  );
}
