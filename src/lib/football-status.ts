// The one line that dates a Liga forecast: which matchday it follows, when
// it was published and when the next one comes. "Jornada 7 · 25 de setembro"
// read like a match date (audit CL-M4); this says what the date is.

import { formatDateSpan, formatShortDate } from '@/lib/football-format';

export interface ForecastStatusInput {
  /** The matchday the forecast was run after (prediction.matchday). */
  matchday: number;
  /** prediction.timestamp. */
  timestamp: string;
  /** True when the forecast's matchday still has games to play. */
  inProgress: boolean;
  /** The round whose results trigger the next update; null at season's end. */
  nextRound: number | null;
  /** Kickoffs of that round's games (UTC ISO), for its date span. */
  nextRoundKickoffs: Array<string | null | undefined>;
}

/**
 * "Depois da jornada 7 · atualizado a 25 set. · próxima atualização após a
 * jornada 8 (9–12 out.)" / "After matchday 7 · updated 25 Sept · next update
 * after matchday 8 (9–12 Oct)". Every part comes from the data; the span is
 * dropped when no kickoff is known.
 */
export function forecastStatusLine(input: ForecastStatusInput, locale: string): string {
  const pt = locale !== 'en';
  const parts: string[] = [];
  parts.push(
    input.inProgress
      ? pt ? `Durante a jornada ${input.matchday}` : `During matchday ${input.matchday}`
      : pt ? `Depois da jornada ${input.matchday}` : `After matchday ${input.matchday}`,
  );
  const updated = formatShortDate(input.timestamp, locale);
  if (updated) parts.push(pt ? `atualizado a ${updated}` : `updated ${updated}`);
  if (input.nextRound == null) {
    parts.push(pt ? 'época terminada' : 'season finished');
  } else {
    const span = formatDateSpan(input.nextRoundKickoffs, locale, { short: true });
    const next = pt
      ? `próxima atualização após a jornada ${input.nextRound}`
      : `next update after matchday ${input.nextRound}`;
    parts.push(span ? `${next} (${span})` : next);
  }
  return parts.join(' · ');
}

/* ---------------------------------------------------------- the clock --- */
// The export is built once per forecast, but a reader opens it on any day.
// These helpers say what a page should show at a given instant: before a
// kickoff the forecast as published, after it "Jogo começou", and once the
// round's last game is over, that a new forecast is in preparation (audit
// FRESH-01). Components read the clock only after mount (ClockSwitch), so
// the server render is always the published state.

/** How long after a round's last kickoff it counts as played. */
export const ROUND_SETTLE_MS = 2 * 60 * 60 * 1000;

export interface ClockStep<T> {
  /** UTC ISO instant from which `value` applies. */
  at: string | null | undefined;
  value: T;
}

/** The value of the latest step whose instant has passed, else `initial`. */
export function clockValue<T>(initial: T, steps: Array<ClockStep<T>>, now: number): T {
  let best: { ms: number; value: T } | null = null;
  for (const step of steps) {
    if (!step.at) continue;
    const ms = Date.parse(step.at);
    if (Number.isNaN(ms) || ms > now) continue;
    if (!best || ms >= best.ms) best = { ms, value: step.value };
  }
  return best ? best.value : initial;
}

/** The instant a round counts as played: its last kickoff plus two hours. */
export function roundPlayedAt(kickoffs: Array<string | null | undefined>): string | null {
  const times = kickoffs
    .map(k => (k ? Date.parse(k) : NaN))
    .filter(ms => !Number.isNaN(ms));
  if (times.length === 0) return null;
  return new Date(Math.max(...times) + ROUND_SETTLE_MS).toISOString();
}

/** The earliest of a round's kickoffs (ISO), or null. */
export function roundStartsAt(kickoffs: Array<string | null | undefined>): string | null {
  const times = kickoffs
    .map(k => (k ? Date.parse(k) : NaN))
    .filter(ms => !Number.isNaN(ms));
  if (times.length === 0) return null;
  return new Date(Math.min(...times)).toISOString();
}

/** "Jogo começou · previsão de 25 set." / "Match under way · forecast of 25 Sept". */
export function matchStartedLine(forecastTimestamp: string, locale: string): string {
  const date = formatShortDate(forecastTimestamp, locale);
  return locale === 'en'
    ? `Match under way · forecast of ${date}`
    : `Jogo começou · previsão de ${date}`;
}

/** "Jornada 8 · jogada, nova previsão em preparação". */
export function roundPlayedLine(matchday: number, locale: string): string {
  return locale === 'en'
    ? `Matchday ${matchday} · played, new forecast in preparation`
    : `Jornada ${matchday} · jogada, nova previsão em preparação`;
}

/**
 * The status line once the next round is played: "Depois da jornada 7 ·
 * atualizado a 25 set. · jornada 8 jogada, nova previsão em preparação".
 */
export function forecastStatusLinePlayed(input: ForecastStatusInput, locale: string): string {
  const pt = locale !== 'en';
  const base = forecastStatusLine({ ...input, nextRound: null }, locale).split(' · ').slice(0, -1);
  if (input.nextRound != null) {
    base.push(
      pt
        ? `jornada ${input.nextRound} jogada, nova previsão em preparação`
        : `matchday ${input.nextRound} played, new forecast in preparation`,
    );
  }
  return base.join(' · ');
}
