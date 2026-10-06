'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GAME_STORAGE_KEY } from '@/lib/population/game';
import type { Locale } from '@/lib/population/labels';
import { GAME_COPY } from './copy';

/** Fired by the game on every guess; the instructions close on the first one. */
export const GUESS_EVENT = 'misteriosa:guess';

/**
 * "Como se joga?": a disclosure, open for a first-time player (nothing stored
 * on this device yet) and closed for everyone else. It closes itself at the
 * first guess, so on a phone the board moves up to the clues.
 */
export function HowToPlay({ locale, honesty }: { locale: Locale; honesty: string }) {
  const t = GAME_COPY[locale];
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(GAME_STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
    const close = () => setOpen(false);
    window.addEventListener(GUESS_EVENT, close);
    return () => window.removeEventListener(GUESS_EVENT, close);
  }, []);
  return (
    <details
      open={open}
      onToggle={event => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      className="group rounded-2xl border border-line bg-cream"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-base font-bold text-ink [&::-webkit-details-marker]:hidden">
        {t.howTitle}
        <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-stone-500 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="border-t border-line px-5 pb-5 pt-4 text-[15px] leading-relaxed text-stone-600">
        <ol className="flex flex-col gap-2.5">
          {t.howSteps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden="true" className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm">{t.howPool}</p>
        <p className="mt-2 text-sm">{t.howProximity}</p>
        <p className="mt-2 text-sm">{honesty}</p>
        <p className="mt-2 text-sm text-stone-500">{t.howStorage}</p>
      </div>
    </details>
  );
}
