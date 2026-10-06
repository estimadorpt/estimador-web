'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Locale } from '@/lib/population/labels';
import { GAME_COPY } from './copy';

/** Fired by the game on every pick and every clue opened; the instructions close on the first one. */
export const GUESS_EVENT = 'misteriosa:guess';

/**
 * "Como se joga?": a closed disclosure whose summary already says the rules in
 * one line (four parishes, the clues to one of them, as few clues as you
 * can), so a first visit lands on the first clue and the four choices, not on
 * a page of instructions (UXD2-02, PUB2-07). The full rules open on demand, and close
 * again at the next pick.
 */
export function HowToPlay({ locale, honesty }: { locale: Locale; honesty: string }) {
  const t = GAME_COPY[locale];
  const [open, setOpen] = useState(false);
  useEffect(() => {
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
      {/* The site's disclosure look (UXD2-26): a left chevron that turns, a 44px row; its own element because the page closes it after a guess. */}
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-1.5 px-4 py-2.5 sm:px-5 [&::-webkit-details-marker]:hidden">
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-ink transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
        <span className="min-w-0">
          <span className="text-base font-bold text-ink">{t.howTitle}</span>{' '}
          {/* The hero already says it on a phone; from sm the line stands in for the closed rules. */}
          <span className="hidden text-sm text-stone-600 sm:inline">{t.howSummary}</span>
        </span>
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
        <p className="mt-4 text-sm">{honesty}</p>
        <p className="mt-2 text-sm text-stone-500">{t.howStorage}</p>
      </div>
    </details>
  );
}
