'use client';

import { Eye, X } from 'lucide-react';
import type { Locale } from '@/lib/population/labels';
import type { Parish } from '@/lib/population/places';
import { GAME_COPY } from './copy';

/**
 * "Qual destas é?": the four parishes as a list of buttons, one action per
 * click (not a radio group: a pick is final). Each is numbered as on the map
 * and names the parish and its município; nothing else is said about them. A
 * wrong pick stays in the list, crossed out and marked with an icon and a
 * word, and keeps its place in the tab order with aria-disabled, so focus is
 * never dropped. Under the list, "Ver a próxima pista" (secondary).
 */
export function Choices({ choices, ruledOut, locale, canOpenMore, onPick, onNextClue }: {
  /** The four, in alphabetical order. */
  choices: Parish[];
  ruledOut: ReadonlySet<string>;
  locale: Locale;
  /** False once all six clues are open. */
  canOpenMore: boolean;
  onPick: (parish: Parish) => void;
  onNextClue: () => void;
}) {
  const t = GAME_COPY[locale];
  return (
    <section aria-labelledby="misteriosa-choices" className="rounded-2xl border border-line bg-cream p-4 sm:p-5">
      <h2 id="misteriosa-choices" className="text-xl text-ink">{t.choicesTitle}</h2>
      {/* On a phone the heading says it; the line would push the four further from the clue. */}
      <p className="mt-0.5 hidden text-sm text-stone-600 sm:block">{t.choicesLede}</p>
      <ol className="mt-3 flex flex-col gap-2">
        {choices.map((parish, i) => {
          const out = ruledOut.has(parish.code);
          return (
            <li key={parish.code}>
              <button
                type="button"
                aria-label={out ? t.ruledOutName(parish.name, parish.municipalityName) : t.choose(parish.name, parish.municipalityName)}
                aria-disabled={out || undefined}
                onClick={() => { if (!out) onPick(parish); }}
                className={`group flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors duration-150 motion-reduce:transition-none ${
                  out
                    ? 'cursor-not-allowed border-dashed border-line bg-parchment'
                    : 'border-line bg-paper hover:border-ink hover:bg-parchment active:bg-parchment'
                }`}
              >
                <span aria-hidden="true" className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold tabular-nums ${out ? 'border-line text-stone-500' : 'border-ink text-ink'}`}>{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] font-semibold leading-snug ${out ? 'text-stone-500 line-through decoration-1' : 'text-ink'}`}>{parish.name}</span>
                  <span className="block text-xs text-stone-500">{parish.municipalityName}</span>
                </span>
                {out && (
                  <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-ink">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-coral">
                      <X className="h-3.5 w-3.5" />
                    </span>
                    {t.ruledOut}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      {canOpenMore ? (
        <button
          type="button"
          onClick={onNextClue}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-line bg-cream px-5 text-[15px] font-semibold text-ink transition-colors duration-150 hover:bg-parchment sm:w-auto"
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
          {t.nextClue}
        </button>
      ) : (
        <p className="mt-3 rounded-xl bg-parchment px-3 py-2.5 text-sm text-stone-600">{t.allClues}</p>
      )}
    </section>
  );
}
