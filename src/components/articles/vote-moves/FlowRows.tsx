import { IntervalBand } from '@/components/instrument';
import { onScale } from '@/components/instrument/scale';

export interface FlowRow {
  /** The flow in words: "Abstencionistas de 2022 que votaram Chega em 2024". */
  label: string;
  /** Central estimate, % of the earlier group. */
  central: number;
  /** The central estimate's own 90% interval (the survey's sampling margin), when it has one. */
  lo?: number;
  hi?: number;
  /** Other methods' estimates of the same flow, drawn as thin ticks (never yellow). */
  others?: number[];
}

interface FlowRowsProps {
  rows: FlowRow[];
  /** The scale's top, in % (the band column runs 0 to max). */
  max: number;
  locale: 'pt' | 'en';
  /** Names the table for assistive technology. */
  title: string;
}

const T = {
  pt: { flow: 'Fluxo', central: 'Estimativa central', interval: 'Intervalo de 90%', others: 'Outros métodos', scale: (m: string) => `Escala de 0 a ${m}%` },
  en: { flow: 'Flow', central: 'Central estimate', interval: '90% interval', others: 'Other methods', scale: (m: string) => `Scale 0 to ${m}%` },
};

/**
 * Vote transfers as an instrument table: the central estimate printed and drawn
 * as a band (its own 90% interval, the only yellow), the other methods' figures
 * as thin graphite ticks on the same scale and printed as a range, so the table
 * is its own twin.
 */
export function FlowRows({ rows, max, locale, title }: FlowRowsProps) {
  const t = T[locale];
  const nf = new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 0 });
  const f = (v: number) => nf.format(v);
  const range = (vs: number[]) => {
    const lo = Math.min(...vs), hi = Math.max(...vs);
    return Math.round(lo) === Math.round(hi) ? f(lo) : `${f(lo)}–${f(hi)}`;
  };
  return (
    <div tabIndex={0} role="region" aria-label={title} className="scroll-cue overflow-x-auto [--scroll-cue-ground:var(--color-paper)]">
      <table className="min-w-full border-collapse font-sans text-sm tabular-nums">
        <thead>
          <tr>
            <th scope="col" className="border-b border-ink px-3 py-2 text-left text-[12px] font-semibold text-graphite">{t.flow}</th>
            <th scope="col" className="border-b border-ink px-3 py-2 text-right text-[12px] font-semibold text-graphite">{t.central} (%)</th>
            <th scope="col" className="border-b border-ink px-3 py-2 text-right text-[12px] font-semibold text-graphite">{t.interval}</th>
            <th scope="col" className="w-[34%] min-w-[160px] border-b border-ink px-3 py-2 text-left text-[12px] font-semibold text-graphite">{t.scale(f(max))}</th>
            <th scope="col" className="border-b border-ink px-3 py-2 text-right text-[12px] font-semibold text-graphite">{t.others} (%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const lo = r.lo ?? r.central, hi = r.hi ?? r.central;
            return (
              <tr key={r.label}>
                <th scope="row" className="border-b border-grid px-3 py-2 text-left font-normal text-ink">{r.label}</th>
                <td className="border-b border-grid px-3 py-2 text-right font-semibold text-ink">{f(r.central)}</td>
                <td className="border-b border-grid px-3 py-2 text-right text-graphite">{r.lo != null && r.hi != null ? `${f(lo)}–${f(hi)}` : '—'}</td>
                <td className="border-b border-grid px-3 py-2">
                  <span className="relative block">
                    <IntervalBand lo={lo} md={r.central} hi={hi} min={0} max={max} />
                    {(r.others ?? []).map((v, i) => (
                      <span key={i} aria-hidden className="absolute top-[1px] h-[18px] w-px bg-graphite" style={{ left: onScale(v, 0, max) }} />
                    ))}
                  </span>
                </td>
                <td className="border-b border-grid px-3 py-2 text-right text-graphite">{r.others?.length ? range(r.others) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
