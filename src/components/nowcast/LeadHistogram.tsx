import { partyColors } from '@/lib/config/colors';
import { partyName } from '@/lib/nowcast-copy';
import type { LeadHistogram as LeadHistogramData } from '@/lib/nowcast-summary';

const colour = (p: string) => (p === 'tie' ? '#b5b5b5' : partyColors[p as keyof typeof partyColors] ?? '#5e5e5e');

/**
 * Every simulation, by one party's lead over another in votes, coloured by who wins most seats
 * (after El País's "¿Quién queda primero?", Kiko Llaneras, 26 Nov 2026): uncertainty you can see.
 */
export function LeadHistogram({ h, first, tie, locale }: { h: LeadHistogramData; first: Record<string, number>; tie: number; locale: string }) {
  const pt = locale !== 'en';
  const outcomes = [...Object.entries(first).filter(([, p]) => p > 0).sort((x, y) => y[1] - x[1]).map(([p]) => p), ...(tie > 0 ? ['tie'] : [])];
  const share = (o: string) => (o === 'tie' ? tie : first[o] ?? 0);
  const pct = (p: number) => (p < 0.01 ? (pt ? 'menos de 1%' : 'under 1%') : `${Math.round(p * 100)}%`);
  const name = (o: string) => (o === 'tie' ? (pt ? 'empate' : 'tie') : pt ? `${partyName(o)} em 1.º` : `${partyName(o)} first`);
  const max = Math.max(...h.bins.map(b => Object.values(b.counts).reduce((s, v) => s + v, 0)));
  const lo = h.bins[0]?.x ?? 0;
  const hi = (h.bins.at(-1)?.x ?? 0) + 1;
  const xPos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const ticks = Array.from({ length: Math.floor(hi / 5) - Math.ceil(lo / 5) + 1 }, (_, i) => (Math.ceil(lo / 5) + i) * 5);
  const sign = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0');
  // Stack order: the two parties first, then the others, then ties on top.
  const stack = [h.a, h.b, ...outcomes.filter(o => o !== h.a && o !== h.b)];
  return (
    <figure className="m-0">
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {outcomes.map(o => (
          <li key={o} className="inline-flex items-baseline gap-1.5">
            <i aria-hidden="true" className="inline-block h-2.5 w-2.5 self-center" style={{ background: colour(o) }} />
            <span className="font-display text-[20px] font-extrabold tabular-nums text-ink">{pct(share(o))}</span>
            <span className="text-[14px] text-ink">{name(o)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between text-[12.5px] text-graphite" aria-hidden="true">
        <span>← {pt ? `${partyName(h.b)} à frente` : `${partyName(h.b)} ahead`}</span>
        <span>{pt ? `${partyName(h.a)} à frente` : `${partyName(h.a)} ahead`} →</span>
      </div>
      <div className="relative mt-1 h-[180px] border-b border-ink sm:h-[220px]" role="img" aria-label={pt
        ? `Cenários conforme a vantagem ${h.a === 'AD' ? 'da' : 'do'} ${partyName(h.a)} sobre ${h.b === 'AD' ? 'a' : 'o'} ${partyName(h.b)} nos votos; a cor diz quem elege mais deputados. ${outcomes.map(o => `${name(o)}: ${pct(share(o))}`).join('; ')}.`
        : `Scenarios by ${partyName(h.a)}'s lead over ${partyName(h.b)} in votes, coloured by who wins most seats. ${outcomes.map(o => `${name(o)}: ${pct(share(o))}`).join('; ')}.`}>
        <div className="absolute inset-0 flex items-end gap-px" aria-hidden="true">
          {h.bins.map(b => (
            <div key={b.x} className="flex h-full flex-1 flex-col-reverse">
              {stack.map(o => (b.counts[o] ? <span key={o} className="block w-full" style={{ height: `${(b.counts[o] / max) * 100}%`, background: colour(o) }} /> : null))}
            </div>
          ))}
        </div>
        <span aria-hidden="true" className="absolute -top-1 bottom-0 border-l-2 border-dashed border-ink" style={{ left: xPos(0) }} />
      </div>
      <div className="relative h-5 text-[12px] tabular-nums text-graphite" aria-hidden="true">
        {ticks.map(t => (
          <span key={t} className="absolute top-1 -translate-x-1/2" style={{ left: xPos(t) }}>{sign(t)}</span>
        ))}
      </div>
      <figcaption className="mt-1 text-[12.5px] text-graphite">
        {pt
          ? `Vantagem ${h.a === 'AD' ? 'da' : 'do'} ${partyName(h.a)} sobre ${h.b === 'AD' ? 'a' : 'o'} ${partyName(h.b)} nos votos, em pontos. A cor mostra quem elege mais deputados.`
          : `${partyName(h.a)}'s lead over ${partyName(h.b)} in votes, in points. The colour shows who wins most seats.`}
      </figcaption>
    </figure>
  );
}
