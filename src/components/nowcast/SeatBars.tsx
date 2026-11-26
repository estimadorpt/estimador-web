import { partyColors } from '@/lib/config/colors';
import { partyName } from '@/lib/nowcast-copy';
import { formatSignedNumber } from '@/lib/typography';
import type { SeatRowData } from './parts';

const colour = (p: string) => partyColors[p as keyof typeof partyColors] ?? '#5e5e5e';

/** The scale's top: the highest range end, rounded up to the next 25 seats. */
const scaleTop = (rows: readonly SeatRowData[]) => Math.max(50, Math.ceil(Math.max(...rows.map(r => Math.max(r.hi, r.before ?? 0))) / 25) * 25);

/**
 * One column per party, after El País's seat chart (Kiko Llaneras, 26 Nov 2026; the owner asked
 * for it): the party's colour up to the low end of its 90% range, the same colour, pale, from
 * there to the high end, an ink line at the central figure, and a black square at its 2025 seats.
 * The one place the margin is drawn in the party's own colour rather than the yellow band: yellow
 * blocks this size drowned the parties' colours.
 * The figure sits on top; the range and the change since 2025 under the name.
 */
export function SeatBars({ rows, locale, label }: { rows: readonly SeatRowData[]; locale: string; label: string }) {
  const pt = locale !== 'en';
  const top = scaleTop(rows);
  const y = (v: number) => `${(Math.min(v, top) / top) * 100}%`;
  const grid = [0, top / 2, top];
  return (
    <figure className="m-0" role="img" aria-label={label}>
      <div className="relative ml-7 h-[210px] sm:h-[240px]" aria-hidden="true">
        {grid.map(g => (
          <div key={g} className="absolute inset-x-0 border-t border-grid" style={{ bottom: y(g) }}>
            <span className="absolute -left-7 -translate-y-1/2 text-[11px] tabular-nums text-graphite">{g}</span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-1 sm:gap-3">
          {rows.map(r => (
            <div key={r.party} className="relative h-full flex-1">
              {/* The party's colour up to the low end of the range. */}
              <span className="absolute inset-x-0 bottom-0" style={{ height: y(r.lo), background: colour(r.party) }} />
              {/* The margin: the same colour, pale, from the low end to the high end. */}
              <span className="absolute inset-x-0" style={{ bottom: y(r.lo), height: `calc(${y(r.hi)} - ${y(r.lo)})`, background: colour(r.party), opacity: 0.32 }} />
              {/* The central figure. */}
              <span className="absolute -inset-x-[3px] h-[2.5px] bg-ink" style={{ bottom: `calc(${y(r.seats)} - 1px)` }} />
              {/* 2025. */}
              {r.before != null && <span className="absolute left-1/2 h-[7px] w-[7px] -translate-x-1/2 translate-y-1/2 bg-ink ring-1 ring-paper" style={{ bottom: y(r.before) }} />}
              <span className="absolute inset-x-[-8px] text-center font-display text-[17px] font-extrabold leading-none tabular-nums text-ink sm:text-[20px]" style={{ bottom: `calc(${y(r.hi)} + 5px)` }}>{r.seats}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ml-7 mt-2 flex gap-1 sm:gap-3" aria-hidden="true">
        {rows.map(r => {
          const change = r.before == null ? null : r.seats - r.before;
          return (
            <div key={r.party} className="min-w-0 flex-1 text-center leading-4">
              <span className="block whitespace-nowrap text-[12px] font-semibold tracking-[-0.01em] text-ink sm:text-[14px]">{partyName(r.party)}</span>
              <span className="block text-[11px] tabular-nums text-graphite sm:text-[12.5px]">{r.lo}–{r.hi}</span>
              <span className="block text-[11px] tabular-nums text-graphite sm:text-[12.5px]">{change == null ? '' : change === 0 ? '=' : formatSignedNumber(change, locale, 0)}</span>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-graphite">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 bg-ink opacity-30" />{pt ? 'parte clara: margem de erro (90%)' : 'pale part: margin of error (90%)'}</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-[2.5px] w-3 bg-ink" />{pt ? 'estimativa' : 'estimate'}</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-2 bg-ink" />2025</span>
        <span>{pt ? 'Por baixo: a margem e a variação desde 2025.' : 'Below: the margin and the change since 2025.'}</span>
      </figcaption>
    </figure>
  );
}
