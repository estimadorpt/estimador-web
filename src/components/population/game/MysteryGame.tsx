'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { History } from 'lucide-react';
import { MarkLoading } from '@/components/brand/MarkLoading';
import { BRAND } from '@/lib/brand';
import { POPULATION_GAME_EPOCH } from '@/lib/config/population';
import { fetchGameChunk, fetchGameIndex, fetchPlaces } from '@/lib/population/client';
import {
  CLUE_COUNT,
  GAME_STORAGE_KEY,
  answerOrder,
  applyPick,
  chunkOf,
  cluesOpen,
  computeStats,
  dateOfDay,
  emptyStore,
  formatGameDate,
  gameChoices,
  msUntilNextLisbonMidnight,
  newRecord,
  openNextClue,
  orderChoices,
  parseStore,
  putRecord,
  recordFor,
  shareMessage,
  todayIndex,
  wrongPicks,
  type GameRecord,
  type GameStore,
} from '@/lib/population/game';
import { indexPlaces, type Parish, type PlaceIndex } from '@/lib/population/places';
import type { Locale } from '@/lib/population/labels';
import type { GameEntry, GameIndex, PopulationMeta } from '@/types/population';
import { ArchivePicker } from './ArchivePicker';
import { Choices } from './Choices';
import { ClueDeck } from './ClueDeck';
import { GAME_COPY } from './copy';
import { EndPanel } from './EndPanel';
import { GUESS_EVENT } from './HowToPlay';
import { Locator } from './Locator';
import { Reveal } from './Reveal';
import { ofMunicipality } from '../parish/place-words';

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
 * chunk that holds the day's parish; draws the day's four from the place list
 * (`gameChoices`, seeded, the same on every device); keeps the player's games
 * in localStorage. Everything date-dependent is computed after mount, so the
 * server render is the same for everyone.
 *
 * The open clue comes first and the four choices directly under it (on a
 * phone too), then "Ver a próxima pista" and the map. A wrong pick or a new
 * clue moves focus to the new clue's heading (ClueDeck); a right pick brings
 * the result into view and gives its heading focus. One polite live region
 * reads each pick and each clue opened.
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
  /** Set when a pick ends the game in this session, so only then the end panel takes focus. */
  const justEnded = useRef(false);
  /**
   * Set when the reader starts or leaves a board with a control that then
   * unmounts ("Jogar outra vez", "Voltar ao resultado", "Voltar ao jogo de
   * hoje", a day from the archive): once the board is drawn, focus goes to the
   * first choice, or to the result's heading, instead of falling to the page (A11Y3-01).
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

  // At midnight in Lisbon a new board arrives; a player on today's board moves with it.
  useEffect(() => {
    if (!index || today === null) return;
    const timer = window.setTimeout(() => {
      const next = todayIndex(EPOCH, now());
      setDay(current => (current === today ? next : current));
      setToday(next);
    }, msUntilNextLisbonMidnight(now()) + 1000);
    return () => window.clearTimeout(timer);
  }, [index, today]);

  // Another tab played: pick it up.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === GAME_STORAGE_KEY) setStore(readStore());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const ready = index && places && entry && today !== null && day !== null;
  const answer = ready ? places.byCode.get(entry.code) ?? null : null;
  /** The day's four, alphabetical; the numbers on the map follow this order. */
  const choices = useMemo(() => {
    if (!places || !entry || day === null || !places.byCode.has(entry.code)) return [];
    const codes = [entry.code, ...gameChoices(day, entry.code, places.parishes)];
    return orderChoices(codes.map(code => places.byCode.get(code)).filter((p): p is Parish => Boolean(p)));
  }, [places, entry, day]);
  const board = useMemo(() => choices.map(p => p.code), [choices]);
  const stored = useMemo(
    () => (day !== null && today !== null ? recordFor(store, day, today) : null),
    [store, day, today],
  );
  const record = replay ?? stored;
  const ruledOut = useMemo(
    () => new Set(record && entry ? record.picks.filter(code => code !== entry.code) : []),
    [record, entry],
  );

  /** Store (or, in a replay, keep in memory) the next state of the board. */
  const commit = useCallback((after: GameRecord) => {
    if (replay) { setReplay(after); return; }
    const next = putRecord(store, after);
    writeStore(next);
    setStore(next);
  }, [replay, store]);

  const onPick = useCallback((parish: Parish) => {
    if (!entry || !record || !answer || record.status !== 'playing' || record.picks.includes(parish.code)) return;
    const after = applyPick(record, parish.code, entry.code, board);
    if (after === record) return;
    window.dispatchEvent(new Event(GUESS_EVENT));
    // "concelho do Porto" in Portuguese; the bare name in English ("Porto municipality").
    const municipality = (place: Parish) => (locale === 'pt' ? ofMunicipality(place.municipalityName) : place.municipalityName);
    if (after.status === 'won') {
      justEnded.current = true;
      setAnnouncement(t.announceWon(after.cluesOpened, wrongPicks(after, entry.code), answer.name, municipality(answer)));
    } else {
      setAnnouncement(t.announceWrong(parish.name, after.cluesOpened > record.cluesOpened ? after.cluesOpened : null));
    }
    commit(after);
  }, [entry, record, answer, board, locale, t, commit]);

  const onNextClue = useCallback(() => {
    if (!record) return;
    const after = openNextClue(record);
    if (after === record) return;
    window.dispatchEvent(new Event(GUESS_EVENT));
    setAnnouncement(t.announceClue(after.cluesOpened));
    commit(after);
  }, [record, t, commit]);

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
  const boardReady = Boolean(ready && record && answer && choices.length > 0);
  useEffect(() => {
    if (!focusBoard.current || !boardReady || !record) return;
    const playingNow = record.status === 'playing';
    const frame = window.requestAnimationFrame(() => {
      focusBoard.current = false;
      const target = playingNow
        ? top.current?.querySelector<HTMLElement>('#misteriosa-choices + p + ol button:not([aria-disabled])')
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

  if (!ready || !record || (answer && choices.length === 0)) {
    // About the board's own height at each width (the clue deck, the four
    // choices and the map), so the footer does not start in view and jump.
    return (
      <div role="status" className="flex min-h-[1760px] flex-col items-center justify-start gap-3 rounded-2xl border border-line bg-cream p-6 pt-24 text-sm text-stone-600 sm:min-h-[1640px] lg:min-h-[1060px]">
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
  const open = cluesOpen(record);
  const date = dateOfDay(EPOCH, day);
  const stats = computeStats(store, today);
  const errors = wrongPicks(record, entry.code);
  const share = shareMessage({ date, day, record, answer: entry.code, locale });

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

      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {t.dayLabel(day + 1)} · {formatGameDate(date, locale)}
        </p>
        {playing && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-stone-600">
              {t.clueProgress(record.cluesOpened, CLUE_COUNT)}{errors > 0 ? ` · ${t.errorsShort(errors)}` : ''}
            </span>
            {/* The clues opened, as pips: what the score will be. */}
            <span className="flex gap-1" aria-hidden="true">
              {Array.from({ length: CLUE_COUNT }, (_, i) => (
                <span key={i} className={`h-2.5 w-5 rounded-full ${i < record.cluesOpened ? 'bg-ink' : 'border border-line bg-cream'}`} />
              ))}
            </span>
          </div>
        )}
      </div>

      {!playing && (
        <div ref={end} className="mb-6">
          <Reveal>
            <EndPanel
              record={record}
              answer={answer}
              choices={choices}
              ruledOut={ruledOut}
              tier={entry.tier}
              errors={errors}
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
        While playing: on a phone the clue, then the four choices directly
        under it, then the map; on a wide screen the clue on the left and the
        choices and the map on the right. Once the game is over the clues stay
        below the result, on their own, for a second look.
      */}
      <div className={playing ? 'grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start' : 'max-w-4xl'}>
        <div className="min-w-0">
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

        {playing && (
          <div className="flex min-w-0 flex-col gap-4">
            <Choices
              choices={choices}
              ruledOut={ruledOut}
              locale={locale}
              canOpenMore={record.cluesOpened < CLUE_COUNT}
              onPick={onPick}
              onNextClue={onNextClue}
            />
            <Locator choices={choices} ruledOut={ruledOut} answer={null} locale={locale} scale={1.4} />
          </div>
        )}
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
