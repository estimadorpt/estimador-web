'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { History } from 'lucide-react';
import { MarkLoading } from '@/components/brand/MarkLoading';
import { BRAND } from '@/lib/brand';
import { fetchGameChunk, fetchGameIndex, fetchPlaces } from '@/lib/population/client';
import {
  GAME_STORAGE_KEY,
  MAX_GUESSES,
  answerOrder,
  applyGuess,
  chunkOf,
  cluesOpen,
  computeStats,
  dateOfDay,
  emptyStore,
  formatGameDate,
  guessFeedback,
  maxPairDistanceKm,
  msUntilNextLisbonMidnight,
  parseStore,
  putRecord,
  recordFor,
  shareText,
  todayIndex,
  type GamePlace,
  type GameStore,
} from '@/lib/population/game';
import { indexPlaces, type Parish, type PlaceIndex } from '@/lib/population/places';
import type { Locale } from '@/lib/population/labels';
import type { GameEntry, GameIndex, PopulationMeta } from '@/types/population';
import { ParishSearch } from '../ParishSearch';
import { ArchivePicker } from './ArchivePicker';
import { ClueDeck } from './ClueDeck';
import { GAME_COPY } from './copy';
import { EndPanel } from './EndPanel';
import { GuessList } from './GuessList';
import { Locator } from './Locator';
import { Reveal } from './Reveal';

const asGamePlace = (parish: Parish): GamePlace => ({
  code: parish.code,
  lat: parish.lat,
  lon: parish.lon,
  municipality: parish.municipality,
  region: parish.region,
});

function readStore(): GameStore {
  try {
    return parseStore(window.localStorage.getItem(GAME_STORAGE_KEY));
  } catch {
    return emptyStore();
  }
}

function writeStore(store: GameStore) {
  try {
    window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Private mode or full storage: the game still plays, it just is not remembered.
  }
}

/** "Now", with a development-only override (#hoje=YYYY-MM-DD) to rehearse later days. */
function now(): Date {
  if (process.env.NODE_ENV !== 'production') {
    const match = /hoje=(\d{4}-\d{2}-\d{2})/.exec(window.location.hash);
    if (match) return new Date(`${match[1]}T12:00:00Z`);
  }
  return new Date();
}

/** A day asked for in the address (#dia-N, N counted from 1), if it has already happened. */
function dayFromHash(today: number): number | null {
  const match = /dia-(\d+)/.exec(window.location.hash);
  if (!match) return null;
  const day = Number(match[1]) - 1;
  return day >= 0 && day <= today ? day : null;
}

/**
 * Freguesia misteriosa. Loads the game index, the place list and only the
 * chunk that holds the day's parish; keeps the player's games in
 * localStorage. Everything date-dependent is computed after mount, so the
 * server render is the same for everyone.
 */
export function MysteryGame({ locale, meta }: { locale: Locale; meta: PopulationMeta }) {
  const t = GAME_COPY[locale];
  const [index, setIndex] = useState<GameIndex | null>(null);
  const [places, setPlaces] = useState<PlaceIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [today, setToday] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [entry, setEntry] = useState<GameEntry | null>(null);
  const [store, setStore] = useState<GameStore>(emptyStore);
  const top = useRef<HTMLDivElement>(null);

  // Load the index and the places; read the player's games.
  useEffect(() => {
    let live = true;
    setFailed(false);
    setStore(readStore());
    Promise.all([fetchGameIndex(), fetchPlaces()])
      .then(([gameIndex, placeData]) => {
        if (!live) return;
        const current = todayIndex(gameIndex.epoch, now());
        setIndex(gameIndex);
        setPlaces(indexPlaces(placeData));
        setToday(current);
        setDay(dayFromHash(current) ?? current);
      })
      .catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [attempt]);

  // Fetch only the chunk that holds the day's parish.
  useEffect(() => {
    if (!index || day === null) return;
    let live = true;
    setEntry(null);
    const order = answerOrder(day, index.candidates);
    fetchGameChunk(chunkOf(order, index.chunk_size))
      .then(entries => {
        if (!live) return;
        const found = entries.find(item => item.order === order);
        if (found) setEntry(found);
        else setFailed(true);
      })
      .catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [index, day]);

  // At midnight in Lisbon a new parish arrives; a player on today's board moves with it.
  useEffect(() => {
    if (!index || today === null) return;
    const timer = window.setTimeout(() => {
      const next = todayIndex(index.epoch, now());
      setDay(current => (current === today ? next : current));
      setToday(next);
    }, msUntilNextLisbonMidnight(now()) + 1000);
    return () => window.clearTimeout(timer);
  }, [index, today]);

  // Another tab finished a game: pick it up.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === GAME_STORAGE_KEY) setStore(readStore());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const maxDistance = useMemo(() => (places ? maxPairDistanceKm(places.parishes) : 0), [places]);

  const ready = index && places && entry && today !== null && day !== null;
  const answer = ready ? places.byCode.get(entry.code) ?? null : null;
  const record = useMemo(
    () => (day !== null && today !== null ? recordFor(store, day, today) : null),
    [store, day, today],
  );
  const guesses = useMemo(
    () => (record && places ? record.guesses.map(code => places.byCode.get(code)).filter((p): p is Parish => Boolean(p)) : []),
    [record, places],
  );
  const feedback = useMemo(
    () => (answer ? guesses.map(guess => guessFeedback(asGamePlace(guess), asGamePlace(answer), maxDistance)) : []),
    [guesses, answer, maxDistance],
  );
  const exclude = useMemo(() => new Set(record?.guesses ?? []), [record]);

  const onGuess = useCallback((parish: Parish) => {
    if (!entry || today === null || day === null) return;
    setStore(current => {
      const before = recordFor(current, day, today);
      const after = applyGuess(before, parish.code, entry.code);
      if (after === before) return current;
      const next = putRecord(current, after);
      writeStore(next);
      return next;
    });
  }, [entry, today, day]);

  const play = useCallback((target: number) => {
    if (today === null) return;
    setDay(target);
    try {
      const hash = target === today ? '' : `#dia-${target + 1}`;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    } catch {
      // Ignore: the address is a convenience.
    }
    top.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }, [today]);

  if (failed) {
    return (
      <div className="rounded-2xl border border-line bg-cream p-6 text-center">
        <p className="text-[15px] text-stone-600">{t.loadError}</p>
        <button
          type="button"
          onClick={() => { setFailed(false); setAttempt(n => n + 1); }}
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-cream px-5 text-[15px] font-semibold text-ink hover:bg-parchment"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  if (!ready || !record) {
    return (
      <div role="status" className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-cream p-6 text-sm text-stone-600">
        <MarkLoading height={28} color={BRAND.ink} ground={BRAND.cream} />
        {t.loading}
      </div>
    );
  }

  if (!answer) {
    return <div className="rounded-2xl border border-line bg-cream p-6 text-[15px] text-stone-600">{t.loadError}</div>;
  }

  const playing = record.status === 'playing';
  const practice = day !== today;
  const open = cluesOpen(record, entry.code);
  const date = dateOfDay(index.epoch, day);
  const stats = computeStats(store, today);
  const share = playing ? '' : shareText({ date, record, feedback, locale });
  const used = record.guesses.length;

  return (
    <div ref={top} className="scroll-mt-20">
      {practice && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-parchment px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-stone-600">
            <History aria-hidden="true" className="h-4 w-4 shrink-0 text-ink" />
            {t.practiceBanner}
          </p>
          <button type="button" onClick={() => play(today)} className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4">
            {t.backToToday}
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {t.dayLabel(day + 1)} · {formatGameDate(date, locale)}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-stone-600" aria-live="polite">
            {playing ? t.attempt(Math.min(used + 1, MAX_GUESSES), MAX_GUESSES) : t.attemptsUsed(used, MAX_GUESSES)}
          </span>
          <span className="flex gap-1" aria-hidden="true">
            {Array.from({ length: MAX_GUESSES }, (_, i) => {
              const code = record.guesses[i];
              const tone = !code ? 'border border-line bg-cream' : code === entry.code ? 'bg-ink' : 'bg-coral';
              return <span key={i} className={`h-2.5 w-5 rounded-full ${tone}`} />;
            })}
          </span>
        </div>
      </div>

      {!playing && (
        <Reveal className="mb-6">
          <EndPanel
            record={record}
            answer={answer}
            tier={entry.tier}
            stats={stats}
            share={share}
            index={index}
            locale={locale}
            practice={practice}
          />
        </Reveal>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <ClueDeck
          entry={entry}
          meta={meta}
          locale={locale}
          open={open}
          revealed={playing ? null : { name: answer.name, municipalityName: answer.municipalityName }}
        />

        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          {playing && (
            <div className="rounded-2xl border border-line bg-cream p-4">
              <ParishSearch
                key={day}
                locale={locale}
                onSelect={onGuess}
                exclude={exclude}
                label={t.guessLabel}
                placeholder={t.guessPlaceholder}
              />
            </div>
          )}
          <section aria-label={t.guessesTitle}>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{t.guessesTitle}</h2>
            <GuessList guesses={guesses} feedback={feedback} locale={locale} playing={playing} />
          </section>
          <Locator guesses={guesses} answer={playing ? null : answer} locale={locale} />
        </div>
      </div>

      <div className="mt-10">
        <ArchivePicker
          epoch={index.epoch}
          today={today}
          current={day}
          store={store}
          locale={locale}
          onPlay={play}
        />
      </div>
    </div>
  );
}

