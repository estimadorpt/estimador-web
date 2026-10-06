'use client';

import { ArrowUp, CircleCheck } from 'lucide-react';
import { ACCENT, FURNITURE } from '@/components/viz/theme';
import { COMPASS, MAX_GUESSES, formatKm, type GuessFeedback } from '@/lib/population/game';
import type { Locale } from '@/lib/population/labels';
import { regionLabel, type Parish } from '@/lib/population/places';
import { GAME_COPY } from './copy';
import { Reveal } from './Reveal';

/**
 * One row per guess: the parish and its município, the distance, an arrow
 * pointing from the guess towards the answer (with the direction in words for
 * screen readers), a proximity bar and the "same município / same region"
 * chips. Empty, dashed slots show how many guesses are left.
 */
export function GuessList({ guesses, feedback, locale, playing }: {
  guesses: Parish[];
  feedback: GuessFeedback[];
  locale: Locale;
  playing: boolean;
}) {
  const t = GAME_COPY[locale];
  const slots = playing ? MAX_GUESSES - guesses.length : 0;
  const pctFormat = new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 0 });
  return (
    <ol className="flex flex-col gap-2" aria-label={t.guessesTitle}>
      {guesses.map((parish, i) => {
        const item = feedback[i];
        if (!item) return null;
        const words = item.compass ? COMPASS[item.compass][locale] : '';
        return (
          <Reveal as="li" key={parish.code}>
            <div className={`rounded-xl border px-3 py-2.5 sm:px-4 ${item.correct ? 'border-ink bg-moss' : 'border-line bg-cream'}`}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-xs font-bold tabular-nums text-stone-600" aria-hidden="true">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug text-ink">{parish.name}</p>
                  <p className="text-xs text-stone-500">{parish.municipalityName} · {regionLabel(parish.region, parish.regionName, locale)}</p>
                  {!item.correct && (item.sameMunicipality || item.sameRegion) && (
                    <p className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.sameMunicipality && <Chip>{t.sameMunicipality}</Chip>}
                      {item.sameRegion && <Chip>{t.sameRegion}</Chip>}
                    </p>
                  )}
                </div>
                {item.correct ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ink">
                    <CircleCheck aria-hidden="true" className="h-5 w-5" />
                    {t.correct}
                  </span>
                ) : (
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-display text-base font-extrabold tabular-nums text-ink">{formatKm(item.distanceKm, locale)}</span>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-parchment" title={t.direction(words)}>
                        <ArrowUp
                          aria-hidden="true"
                          className="h-4 w-4 text-ink"
                          style={{ transform: `rotate(${COMPASS[item.compass ?? 'N'].deg}deg)` }}
                        />
                        <span className="sr-only">{t.direction(words)}</span>
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-2" title={t.proximity}>
                      <span className="sr-only">{t.proximity}:</span>
                      <span className="h-1.5 w-16 overflow-hidden rounded-full sm:w-20" style={{ backgroundColor: FURNITURE.track }} aria-hidden="true">
                        <span className="block h-full rounded-full" style={{ width: `${Math.max(2, item.proximity)}%`, backgroundColor: ACCENT }} />
                      </span>
                      <span className="w-9 text-right text-xs font-semibold tabular-nums text-stone-600">{pctFormat.format(Math.floor(item.proximity))}%</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        );
      })}
      {Array.from({ length: slots }, (_, k) => {
        const n = guesses.length + k + 1;
        return (
          <li key={`slot-${n}`} className="flex min-h-[52px] items-center gap-3 rounded-xl border border-dashed border-line px-3 sm:px-4">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-xs font-bold tabular-nums text-stone-500" aria-hidden="true">{n}</span>
            <span className="text-sm text-stone-500">{t.emptySlot(n)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-md bg-periwinkle-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ink">{children}</span>;
}
