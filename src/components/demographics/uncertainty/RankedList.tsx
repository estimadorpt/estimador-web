'use client';

// A ranked ("most X first") list that obeys the comparative-significance guard
// (G4/G12/G16). It runs `significanceGuard` to sort + annotate ties, renders the
// rows editorially (dividers, tabular-nums, a ConfidenceChip per value), marks
// statistically-tied rows with `uncertainty.tied`, and — crucially — will NOT
// assert a "#1 / o maior" superlative unless `claimIsSupported(top, runnerUp)`
// is true. When the top two bands overlap (or we only have point estimates) it
// shows the caller-supplied hedge instead. Honest degradation is automatic:
// point-regime items are never distinguishable, so the superlative always hedges
// until real replicate intervals land.

import { useTranslations } from 'next-intl';
import { significanceGuard, claimIsSupported } from '@/lib/populacao/uncertainty';
import { UncertainNumber } from './UncertainNumber';

const ACCENT = '#9A4A2E';

export interface RankedListItem {
  label: string;
  value: number;
  lo?: number;
  hi?: number;
  /** >=2 makes the [lo,hi] band "real"; omit for a point estimate. */
  n_replicates?: number;
}

export function RankedList({
  items,
  locale = 'pt',
  unit,
  /** Localized superlative strings; the component picks supported vs hedged.
   *  Use `{label}` as a placeholder for the leading item's label. */
  superlative,
  className = '',
}: {
  items: RankedListItem[];
  locale?: 'pt' | 'en';
  unit?: string;
  superlative?: { supported: string; hedged: string };
  className?: string;
}) {
  const t = useTranslations('populacao');
  const ranked = significanceGuard(items);
  const top = ranked[0];
  const runnerUp = ranked[1];
  const supported = !!(top && runnerUp && claimIsSupported(top, runnerUp));

  return (
    <div className={className}>
      {superlative && top && runnerUp ? (
        <div
          className="mb-4 border-l-2 pl-3"
          style={{ borderColor: supported ? ACCENT : '#d6d3d1' /* stone-300 */ }}
        >
          <p className={supported ? 'text-stone-900 font-semibold' : 'text-stone-600'}>
            {(supported ? superlative.supported : superlative.hedged).replace(
              '{label}',
              top.label,
            )}
          </p>
        </div>
      ) : null}

      <ol className="border-t border-stone-200">
        {ranked.map((it) => {
          const tied = it.tiedWith.length > 0;
          return (
            <li
              key={it._index}
              className="flex items-baseline justify-between gap-4 border-b border-stone-200 py-2.5"
            >
              <span className="flex items-baseline gap-3 min-w-0">
                <span className="tabular-nums text-[13px] text-stone-400 w-5 shrink-0">
                  {it.rank}
                </span>
                <span className="truncate text-stone-800">{it.label}</span>
                {tied ? (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    {t('uncertainty.tied')}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-right">
                <UncertainNumber
                  value={{ value: it.value, lo: it.lo, hi: it.hi, n_replicates: it.n_replicates }}
                  unit={unit}
                  locale={locale}
                />
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
