'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { History } from 'lucide-react';
import { MarkLoading } from '@/components/brand/MarkLoading';
import { BRAND } from '@/lib/brand';
import { POPULATION_GAME_EPOCH } from '@/lib/config/population';
import { fetchGameChunk, fetchGameIndex, fetchPlaces } from '@/lib/population/client';
import {
  COMPASS,
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
  formatKm,
  guessFeedback,
  msUntilNextLisbonMidnight,
  newRecord,
  parseStore,
  proximityScale,
  putRecord,
  recordFor,
  shareMessage,
  todayIndex,
  type GamePlace,
  type GameRecord,
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
import { GUESS_EVENT } from './HowToPlay';
import { Locator } from './Locator';
import { Reveal } from './Reveal';
import { ofMunicipality } from '../parish/place-words';

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

/** Day 0 (N.º 1): the launch day. game/index.json carries the same date (tested). */
const EPOCH = POPULATION_GAME_EPOCH;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Freguesia misteriosa. Loads the game index, the place list and only the
 * chunk that holds the day's parish; keeps the player's games in
 * localStorage. Everything date-dependent is computed after mount, so the
 * server render is the same for everyone.
 *
 * On a phone the guess box comes before the clues (it is the thing to do),
 * with the last guess's result beside it; at the end the result panel is
 * brought into view and takes focus. One polite live region reads each guess
 * and then the outcome.
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
  /** A finished day played again as practice: kept in memory only, never stored or counted. */
  const [replay, setReplay] = useState<GameRecord | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const top = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  /** Set when a guess ends the game in this session, so only then the end panel takes focus. */
  const justEnded = useRef(false);
  /**
   * Set when the reader starts or leaves a board with a control that then
   * unmounts ("Jogar outra vez", "Voltar ao resultado", "Voltar à freguesia de
   * hoje", a day from the archive): once the board is drawn, focus goes to the
   * guess box, or to the result's heading, instead of falling to the page (A11Y3-01).
   */
  const focusBoard = useRef(false);

  // Load the index and the places; read the player's games.
  useEffect(() => {
    let live = true;
    setFailed(false);
    setStore(readStore());
    Promise.all([fetchGameIndex(), fetchPlaces()])
      .then(([gameIndex, placeData]) => {
        if (!live) return;
        const current = todayIndex(EPOCH, now());
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
    setReplay(null);
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
      const next = todayIndex(EPOCH, now());
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

  const scale = useMemo(() => (places ? proximityScale(places.parishes) : { all: 0, mainland: 0 }), [places]);

  const ready = index && places && entry && today !== null && day !== null;
  const answer = ready ? places.byCode.get(entry.code) ?? null : null;
  const stored = useMemo(
    () => (day !== null && today !== null ? recordFor(store, day, today) : null),
    [store, day, today],
  );
  const record = replay ?? stored;
  const guesses = useMemo(
    () => (record && places ? record.guesses.map(code => places.byCode.get(code)).filter((p): p is Parish => Boolean(p)) : []),
    [record, places],
  );
  const feedback = useMemo(
    () => (answer ? guesses.map(guess => guessFeedback(asGamePlace(guess), asGamePlace(answer), scale)) : []),
    [guesses, answer, scale],
  );
  const exclude = useMemo(() => new Set(record?.guesses ?? []), [record]);

  const describe = useCallback((parish: Parish, after: GameRecord, answerParish: Parish): string => {
    const n = after.guesses.length;
    const item = guessFeedback(asGamePlace(parish), asGamePlace(answerParish), scale);
    // "concelho do Funchal" in Portuguese; the bare name in English ("Funchal municipality").
    const municipality = (place: Parish) => (locale === 'pt' ? ofMunicipality(place.municipalityName) : place.municipalityName);
    if (after.status === 'won') return t.announceWon(n, answerParish.name, municipality(answerParish));
    const miss = t.announceMiss(n, parish.name, municipality(parish), formatKm(item.distanceKm, locale), item.compass ? COMPASS[item.compass][locale] : '', Math.floor(item.proximity));
    if (after.status === 'lost') return `${miss} ${t.announceLost(answerParish.name, municipality(answerParish))}`;
    return `${miss} ${t.announceClue(Math.min(n + 1, MAX_GUESSES))}`;
  }, [scale, t, locale]);

  const onGuess = useCallback((parish: Parish) => {
    if (!entry || today === null || day === null || !answer) return;
    window.dispatchEvent(new Event(GUESS_EVENT));
    if (replay) {
      const after = applyGuess(replay, parish.code, entry.code);
      if (after === replay) return;
      if (after.status !== 'playing') justEnded.current = true;
      setReplay(after);
      setAnnouncement(describe(parish, after, answer));
      return;
    }
    const before = recordFor(store, day, today);
    const after = applyGuess(before, parish.code, entry.code);
    if (after === before) return;
    if (after.status !== 'playing') justEnded.current = true;
    const next = putRecord(store, after);
    writeStore(next);
    setStore(next);
    setAnnouncement(describe(parish, after, answer));
  }, [entry, today, day, answer, replay, store, describe]);

  // The game just ended: bring the result into view and put focus on its heading.
  const finished = record ? record.status !== 'playing' : false;
  useEffect(() => {
    if (!finished || !justEnded.current) return;
    justEnded.current = false;
    const frame = window.requestAnimationFrame(() => {
      end.current?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
      end.current?.querySelector<HTMLElement>('#misteriosa-end')?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [finished]);

  // The board for a new game (or the result of a finished one) is drawn: put focus on it.
  const boardReady = Boolean(ready && record && answer);
  useEffect(() => {
    if (!focusBoard.current || !boardReady || !record) return;
    const playingNow = record.status === 'playing';
    const frame = window.requestAnimationFrame(() => {
      focusBoard.current = false;
      const target = playingNow
        ? top.current?.querySelector<HTMLElement>('input[role="combobox"]')
        : top.current?.querySelector<HTMLElement>('#misteriosa-end');
      target?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [boardReady, record]);

  const play = useCallback((target: number) => {
    if (today === null) return;
    focusBoard.current = true;
    setDay(target);
    setReplay(null);
    try {
      const hash = target === today ? '' : `#dia-${target + 1}`;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    } catch {
      // Ignore: the address is a convenience.
    }
    top.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }, [today]);

  const playAgain = useCallback(() => {
    if (day === null) return;
    focusBoard.current = true;
    setReplay(newRecord(day, false));
    setAnnouncement(t.replayStarted);
    top.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }, [day, t]);

  const stopReplay = () => {
    focusBoard.current = true;
    setReplay(null);
  };

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
    // The board's own height at each width (the guess box, the clue deck and
    // the six guess slots), so the footer does not start in view and jump.
    return (
      <div role="status" className="flex min-h-[1180px] flex-col items-center justify-start gap-3 rounded-2xl border border-line bg-cream p-6 pt-24 text-sm text-stone-600 sm:min-h-[1080px] lg:min-h-[760px]">
        <MarkLoading height={28} color={BRAND.ink} ground={BRAND.cream} />
        {t.loading}
      </div>
    );
  }

  if (!answer) {
    return <div className="rounded-2xl border border-line bg-cream p-6 text-[15px] text-stone-600">{t.loadError}</div>;
  }

  const playing = record.status === 'playing';
  const practice = day !== today || replay !== null;
  const open = cluesOpen(record, entry.code);
  const date = dateOfDay(EPOCH, day);
  const stats = computeStats(store, today);
  const share = shareMessage({ date, day, record, feedback, locale });
  const used = record.guesses.length;
  const last = feedback.length > 0 ? feedback[feedback.length - 1] : null;
  const lastParish = guesses.length > 0 ? guesses[guesses.length - 1] : null;

  return (
    <div ref={top}>
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>

      {practice && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-parchment px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-stone-600">
            <History aria-hidden="true" className="h-4 w-4 shrink-0 text-ink" />
            {replay ? t.replayBanner : t.practiceBanner}
          </p>
          {day !== today ? (
            <button type="button" onClick={() => play(today)} className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4">
              {t.backToToday}
            </button>
          ) : (
            <button type="button" onClick={stopReplay} className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4">
              {t.replayStop}
            </button>
          )}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {t.dayLabel(day + 1)} · {formatGameDate(date, locale)}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-stone-600">
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
        <div ref={end} className="mb-6">
          <Reveal>
            <EndPanel
              record={record}
              answer={answer}
              tier={entry.tier}
              stats={stats}
              share={share}
              index={index}
              locale={locale}
              practice={practice}
              onReplay={replay ? null : playAgain}
            />
          </Reveal>
        </div>
      )}

      {/*
        One grid, three pieces. On a phone they stack in source order: the
        guess box first (the thing to do), then the clues, then the guesses.
        On a wide screen the clues take the left column and the guess box and
        the guesses share the right one.
      */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr] lg:items-start">
        {playing && (
          <div className="rounded-2xl border border-line bg-cream p-4 lg:col-start-2 lg:row-start-1">
            <ParishSearch
              key={`${day}-${replay ? 'replay' : 'live'}`}
              locale={locale}
              onSelect={onGuess}
              exclude={exclude}
              label={t.guessLabel}
              placeholder={t.guessPlaceholder}
            />
            {last && lastParish && !last.correct && (
              // The result of the last miss, beside the box, so a phone does not have to scroll to the list for it.
              <p className="mt-3 rounded-xl bg-parchment px-3 py-2 text-sm text-stone-600 lg:hidden">
                {t.lastGuess(lastParish.name, formatKm(last.distanceKm, locale), last.compass ? COMPASS[last.compass][locale] : '')}
              </p>
            )}
          </div>
        )}

        <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <ClueDeck
            // A replay of the same day starts a fresh deck (its first clue, nothing selected from the finished game).
            key={`${day}-${replay ? 'replay' : 'live'}`}
            entry={entry}
            meta={meta}
            locale={locale}
            open={open}
            revealed={playing ? null : { name: answer.name, municipalityName: answer.municipalityName }}
          />
        </div>

        <div className={`flex flex-col gap-4 lg:col-start-2 ${playing ? 'lg:row-start-2' : 'lg:row-start-1'}`}>
          <section aria-label={t.guessesTitle}>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">{t.guessesTitle}</h2>
            <GuessList guesses={guesses} feedback={feedback} locale={locale} playing={playing} />
          </section>
          <Locator guesses={guesses} answer={playing ? null : answer} locale={locale} />
        </div>
      </div>

      <div className="mt-10">
        <ArchivePicker
          epoch={EPOCH}
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
