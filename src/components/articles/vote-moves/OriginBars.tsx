import { Disclosure } from '@/components/viz/Disclosure';

export interface OriginSegment {
  key: string; label: string; value: number; color: string;
  /** The range across methods, printed in the table twin beside the central figure. */
  lo?: number; hi?: number;
}
export interface OriginBar { label: string; segments: OriginSegment[] }

interface OriginBarsProps { bars: OriginBar[]; locale: 'pt' | 'en'; title: string }

/**
 * Where a party's vote came from, one stacked bar per election (shares of that
 * vote, summing to 100). Colours are the data's own (party colours, grey for
 * abstainers); every label is ink text in the legend and the table twin, which
 * also prints the range across methods in brackets.
 */
export function OriginBars({ bars, locale, title }: OriginBarsProps) {
  const nf = new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 0 });
  const keys = bars[0]?.segments.map((s) => s) ?? [];
  return (
    <div className="font-sans text-sm">
      <div role="img" aria-label={title} className="space-y-3">
        {bars.map((b) => (
          <div key={b.label} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
            <span className="tabular-nums text-ink">{b.label}</span>
            <span className="flex h-6 w-full border border-ink">
              {b.segments.map((s) => (
                <span key={s.key} style={{ width: `${s.value}%`, background: s.color }} className="h-full border-r border-paper last:border-r-0" />
              ))}
            </span>
          </div>
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-graphite">
        {keys.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5"><span aria-hidden className="inline-block h-3 w-3 border border-ink" style={{ background: s.color }} />{s.label}</li>
        ))}
      </ul>
      <Disclosure summary={locale === 'pt' ? 'Ver como tabela' : 'Show as a table'} srSuffix={title} className="mt-3">
        <div tabIndex={0} role="region" aria-label={title} className="scroll-cue overflow-x-auto">
          <table className="min-w-full border-collapse tabular-nums">
            <thead>
              <tr>
                <th scope="col" className="border-b border-ink px-3 py-2 text-left text-[12px] font-semibold text-graphite">{locale === 'pt' ? 'Eleição' : 'Election'}</th>
                {keys.map((s) => <th key={s.key} scope="col" className="border-b border-ink px-3 py-2 text-right text-[12px] font-semibold text-graphite">{s.label} (%)</th>)}
              </tr>
            </thead>
            <tbody>
              {bars.map((b) => (
                <tr key={b.label}>
                  <th scope="row" className="border-b border-grid px-3 py-2 text-left font-normal text-ink">{b.label}</th>
                  {b.segments.map((s) => (
                    <td key={s.key} className="border-b border-grid px-3 py-2 text-right text-ink">
                      {nf.format(s.value)}
                      {s.lo != null && s.hi != null && Math.round(s.lo) !== Math.round(s.hi) && <span className="text-graphite"> ({nf.format(s.lo)}–{nf.format(s.hi)})</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>
    </div>
  );
}
