'use client';

import { useId } from 'react';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { dateOfDay, formatGameDate, type GameStore } from '@/lib/population/game';
import type { Locale } from '@/lib/population/labels';
import { GAME_COPY } from './copy';

/**
 * "Dias anteriores": any earlier day since the epoch, played as practice. On
 * the first day there is none, so the section says when there will be. The
 * day on the board, when it is an earlier one, is the select's value.
 */
export function ArchivePicker({ epoch, today, current, store, locale, onPlay }: {
  epoch: string;
  today: number;
  /** The day on the board. */
  current: number;
  store: GameStore;
  locale: Locale;
  onPlay: (day: number) => void;
}) {
  const t = GAME_COPY[locale];
  const id = useId();
  const earlier = Array.from({ length: today }, (_, i) => today - 1 - i);

  const status = (day: number) => {
    const record = store.records[String(day)];
    if (!record) return t.archiveNew;
    return record.status === 'won' ? t.archiveWon(record.cluesOpened) : t.archivePlaying;
  };

  return (
    <section aria-labelledby={`${id}-title`} className="border-t border-ink pt-3">
      <h2 id={`${id}-title`} className="text-[19px] leading-6 text-ink">{t.archiveTitle}</h2>
      {earlier.length === 0 ? (
        <div className="mt-3 flex items-center gap-4">
          <EmptyStateMark />
          <p className="text-sm text-graphite">{t.archiveEmpty}</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-graphite">{t.archiveLede}</p>
          {/* A long list: a native select that acts on change, with no "play" button
              (the site's grammar). The hint says so before the choice is made. */}
          <div className="mt-4 max-w-md">
            <label htmlFor={`${id}-day`} className="mb-1.5 block text-sm font-semibold text-ink">{t.archiveSelect}</label>
            <select
              id={`${id}-day`}
              value={current < today ? current : -1}
              aria-describedby={`${id}-hint`}
              onChange={event => { const day = Number(event.target.value); if (day >= 0) onPlay(day); }}
              className="h-12 w-full border border-rule bg-paper px-3 text-[16px] text-ink sm:text-[15px]"
            >
              <option value={-1} disabled>{t.archivePlaceholder}</option>
              {earlier.map(day => (
                <option key={day} value={day}>
                  {formatGameDate(dateOfDay(epoch, day), locale)} · {t.dayLabel(day + 1)} · {status(day)}
                </option>
              ))}
            </select>
            <p id={`${id}-hint`} className="mt-1.5 text-[12px] text-graphite">{t.archiveHint}</p>
          </div>
        </>
      )}
    </section>
  );
}
