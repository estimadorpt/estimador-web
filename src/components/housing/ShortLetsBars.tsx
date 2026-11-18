import type { ShortLetsArea } from '@/lib/housing-data';

/**
 * Short-let registrations per 100 homes, one ruled row per parish: the name,
 * an ink bar on one shared scale (what was counted, so no band), the figure.
 * Thin ink ticks mark the câmara's two thresholds on every row. HTML, so it
 * reflows on a phone; the twin table carries the counts behind each ratio.
 */
export function ShortLetsBars({ parishes, municipality, max, thresholds, format, label }: {
  parishes: ShortLetsArea[];
  municipality: ShortLetsArea;
  max: number;
  thresholds: { value: number; label: string }[];
  format: (value: number) => string;
  label: string;
}) {
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const row = (p: ShortLetsArea, strong = false) => (
    <li key={p.code} className={`grid grid-cols-[minmax(0,9.5rem)_1fr_3.25rem] items-center gap-x-3 border-b border-grid py-1.5 sm:grid-cols-[13rem_1fr_4rem] ${strong ? 'border-t border-ink' : ''}`}>
      <span className={`truncate text-[14px] ${strong ? 'font-semibold' : 'name-cut'}`}>{p.name}</span>
      <span className="relative block h-3.5">
        {thresholds.map(t => (
          <span key={t.value} aria-hidden="true" className="absolute top-[-3px] h-[20px] w-px bg-scale" style={{ left: pct(t.value) }} />
        ))}
        <span className="absolute inset-y-0 left-0 block bg-ink" style={{ width: pct(p.per_100_dwellings), minWidth: '2px' }} />
      </span>
      <span className="fig text-right text-[15px] tabular-nums">{format(p.per_100_dwellings)}</span>
    </li>
  );
  return (
    <div className="py-2">
      <div aria-hidden="true" className="grid grid-cols-[minmax(0,9.5rem)_1fr_3.25rem] gap-x-3 pb-1 text-[12px] text-graphite sm:grid-cols-[13rem_1fr_4rem]">
        <span />
        <span className="relative block h-4">
          {thresholds.map(t => (
            <span key={t.value} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: pct(t.value) }}>{t.label}</span>
          ))}
        </span>
        <span />
      </div>
      <ul aria-label={label}>
        {parishes.map(p => row(p))}
        {row(municipality, true)}
      </ul>
    </div>
  );
}
