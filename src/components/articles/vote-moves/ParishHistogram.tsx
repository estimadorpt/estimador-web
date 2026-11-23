import { Disclosure } from '@/components/viz/Disclosure';
import { onScale } from '@/components/instrument/scale';

export interface HistBin { lo: number; hi: number; count: number }
interface ParishHistogramProps {
  bins: HistBin[];
  /** The average step, marked on the axis. */
  mean: number;
  locale: 'pt' | 'en';
  title: string;
  /** Axis label, e.g. "Subida do Chega, pontos do recenseamento". */
  axis: string;
}

/** A count of parishes by how much a figure changed, in ink bars (what happened), with the average marked. */
export function ParishHistogram({ bins, mean, locale, title, axis }: ParishHistogramProps) {
  const nf = new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 0, useGrouping: true });
  const min = bins[0].lo, max = bins[bins.length - 1].hi, top = Math.max(...bins.map((b) => b.count));
  return (
    <div className="font-sans text-sm">
      <div role="img" aria-label={title} className="relative mt-6 h-40 border-b border-ink">
        {bins.map((b) => (
          <span key={b.lo} className="absolute bottom-0 bg-ink" style={{ left: onScale(b.lo, min, max), width: `calc(${onScale(b.hi, min, max)} - ${onScale(b.lo, min, max)} - 1px)`, height: `${(b.count / top) * 100}%` }} />
        ))}
        <span aria-hidden className="absolute -bottom-2 -top-5 border-l border-dashed border-ink" style={{ left: onScale(mean, min, max) }} />
        <span aria-hidden className="absolute -top-5 ml-1.5 bg-paper px-0.5 text-[12px] leading-4 text-ink tabular-nums" style={{ left: onScale(mean, min, max) }}>
          {locale === 'pt' ? 'média' : 'average'} {new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(mean)}
        </span>
      </div>
      <div className="relative mt-1 h-5 text-[12px] text-graphite tabular-nums">
        {[min, (min + max) / 2, max].map((v) => <span key={v} className="absolute -translate-x-1/2" style={{ left: onScale(v, min, max) }}>{nf.format(v)}</span>)}
      </div>
      <p className="mt-1 text-[12px] text-graphite">{axis}</p>
      <Disclosure summary={locale === 'pt' ? 'Ver como tabela' : 'Show as a table'} srSuffix={title} className="mt-2">
        <table className="min-w-full border-collapse tabular-nums">
          <thead><tr>
            <th scope="col" className="border-b border-ink px-3 py-2 text-left text-[12px] font-semibold text-graphite">{axis}</th>
            <th scope="col" className="border-b border-ink px-3 py-2 text-right text-[12px] font-semibold text-graphite">{locale === 'pt' ? 'Freguesias' : 'Parishes'}</th>
          </tr></thead>
          <tbody>
            {bins.map((b) => (
              <tr key={b.lo}>
                <th scope="row" className="border-b border-grid px-3 py-2 text-left font-normal text-ink">{nf.format(b.lo)} – {nf.format(b.hi)}</th>
                <td className="border-b border-grid px-3 py-2 text-right text-ink">{nf.format(b.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Disclosure>
    </div>
  );
}
