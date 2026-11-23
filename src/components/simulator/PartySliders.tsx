'use client';

import { formatElectionNumber, formatElectionPercent } from '@/lib/election-display';
import { formatSignedNumber } from '@/lib/typography';
import { OTHERS_MAX_SHARE, PARTY_MAX_SHARE, type Shares } from '@/lib/simulator/engine';
import { listColor, listName, type Locale } from './copy';
import styles from './Simulator.module.css';

/**
 * "Por partido": one slider per list for its national share. Moving one moves the others in
 * proportion (setShare). Each row carries its own seats, so a reader sees what a slider does
 * without looking away: the reader's value is the hollow square on the rule, 2025's the black
 * one under it.
 */
export function PartySliders({ lists, others, shares, base, seats, seatsBase, onChange, locale }: {
  /** The movable parties, in the archive's order. */
  lists: string[];
  /** The other lists' key (a slider, no seats). */
  others: string;
  shares: Shares;
  /** 2025's shares, for the marker. */
  base: Shares;
  seats: Record<string, number>;
  seatsBase: Record<string, number>;
  onChange: (list: string, share: number) => void;
  locale: Locale;
}) {
  const pt = locale === 'pt';
  const pct = (v: number) => formatElectionPercent(v, locale);
  const num = (v: number) => formatElectionNumber(v, locale);
  return (
    <div>
      <div className="grid grid-cols-[5.75rem_minmax(0,1fr)_3.75rem_3.75rem] items-end gap-x-3 border-b border-ink pb-1 text-[12px] font-semibold text-graphite sm:grid-cols-[7rem_minmax(0,1fr)_4rem_4.5rem]">
        <span>{pt ? 'Lista' : 'List'}</span>
        <span>{pt ? 'Voto nacional' : 'National vote'}</span>
        <span className="text-right">%</span>
        <span className="text-right">{pt ? 'Mandatos' : 'Seats'}</span>
      </div>
      <ul>
        {[...lists, others].map(list => {
          const isOthers = list === others;
          const max = isOthers ? OTHERS_MAX_SHARE : PARTY_MAX_SHARE;
          const value = shares[list] ?? 0;
          const now = seats[list] ?? 0;
          const d = now - (seatsBase[list] ?? 0);
          const id = `share-${list}`;
          return (
            <li key={list} className="grid grid-cols-[5.75rem_minmax(0,1fr)_3.75rem_3.75rem] items-center gap-x-3 border-b border-grid sm:grid-cols-[7rem_minmax(0,1fr)_4rem_4.5rem]">
              <label htmlFor={id} className="flex min-h-11 items-center gap-2 text-[15px] font-medium leading-tight text-ink">
                <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0" style={{ backgroundColor: listColor(list) }} />
                {listName(list, locale)}
              </label>
              <div className={styles.slider}>
                <input
                  id={id}
                  type="range"
                  min={0}
                  max={max * 100}
                  step={0.1}
                  value={Math.min(value, max) * 100}
                  onChange={e => onChange(list, Number(e.target.value) / 100)}
                  aria-valuetext={pct(value)}
                  className={styles.range}
                />
                <span aria-hidden="true" className={styles.marker} style={{ ['--at' as string]: Math.min(1, (base[list] ?? 0) / max) }} />
              </div>
              <span className="text-right text-[15px] font-semibold tabular-nums text-ink">{pct(value)}</span>
              <span className="text-right tabular-nums">
                {isOthers ? (
                  <span className="text-graphite">—</span>
                ) : (
                  <>
                    <span className="text-[17px] font-bold text-ink">{num(now)}</span>
                    {d !== 0 && <span className="ml-1 text-[13px] font-semibold text-ink">{formatSignedNumber(d, locale)}</span>}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
