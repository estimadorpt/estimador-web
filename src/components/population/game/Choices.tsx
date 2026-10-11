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
    <section aria-labelledby="misteriosa-choices" className="border-t border-ink pt-3">
      <h2 id="misteriosa-choices" className="text-[19px] leading-6 text-ink">{t.choicesTitle}</h2>
      {/* On a phone the heading says it; the line would push the four further from the clue. */}
      <p className="mt-0.5 hidden text-sm text-graphite sm:block">{t.choicesLede}</p>
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
                className={`group flex min-h-14 w-full items-center gap-3 border px-3 py-2 text-left transition-colors duration-150 motion-reduce:transition-none ${
                  out
                    ? 'cursor-not-allowed border-dashed border-rule bg-paper'
                    : 'border-rule bg-paper hover:border-ink hover:bg-field active:bg-field'
                }`}
              >
                <span aria-hidden="true" className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold tabular-nums ${out ? 'border-dashed border-scale text-ink' : 'border-ink text-ink'}`}>{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] font-semibold leading-snug ${out ? 'text-graphite line-through decoration-1' : 'text-ink'}`}>{parish.name}</span>
                  <span className="block text-[12px] text-graphite">{parish.municipalityName}</span>
                </span>
                {out && (
                  <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-ink">
                    {/* The ruled-out cross: the game's one mark in the terracotta red. */}
                    <X className="h-4 w-4 text-terracotta" strokeWidth={2.5} />
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
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 border border-rule bg-paper px-5 text-[15px] font-semibold text-ink transition-colors duration-150 hover:bg-field sm:w-auto"
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
          {t.nextClue}
        </button>
      ) : (
        <p className="mt-3 border-t border-grid pt-2 text-sm text-graphite">{t.allClues}</p>
      )}
    </section>
  );
}
