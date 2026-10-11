'use client';

import { useEffect, useId, useState } from 'react';
import { Action } from '@/components/brand/Action';
import { EmptyStateMark } from '@/components/brand/EmptyStateMark';
import { dateOfDay, formatGameDate, type GameStore } from '@/lib/population/game';
import type { Locale } from '@/lib/population/labels';
import { GAME_COPY } from './copy';

/**
 * "Dias anteriores": any earlier day since the epoch, played as practice. On
 * the first day there is none, so the section says when there will be.
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
  const [choice, setChoice] = useState(() => (current < today ? current : today - 1));
  useEffect(() => {
    setChoice(current < today ? current : today - 1);
  }, [current, today]);

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
          <form
            className="mt-4 flex flex-wrap items-end gap-3"
            onSubmit={event => { event.preventDefault(); if (choice >= 0) onPlay(choice); }}
          >
            <div className="min-w-0 flex-1 basis-60">
              <label htmlFor={`${id}-day`} className="mb-1.5 block text-sm font-semibold text-ink">{t.archiveSelect}</label>
              <select
                id={`${id}-day`}
                value={choice}
                onChange={event => setChoice(Number(event.target.value))}
                className="h-12 w-full border border-rule bg-paper px-3 text-[16px] text-ink sm:text-[15px]"
              >
                {earlier.map(day => (
                  <option key={day} value={day}>
                    {formatGameDate(dateOfDay(epoch, day), locale)} · {t.dayLabel(day + 1)} · {status(day)}
                  </option>
                ))}
              </select>
            </div>
            <Action type="submit" variant="secondary">{t.archivePlay}</Action>
          </form>
        </>
      )}
    </section>
  );
}
