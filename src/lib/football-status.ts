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

/* ------------------------------------------------- one game, one round --- */

/** The instant one game counts as played: its kickoff plus two hours (the
 * same settle time as a round). Null without a usable kickoff. */
export function matchPlayedAt(kickoff: string | null | undefined): string | null {
  return roundPlayedAt([kickoff]);
}

/** "Jogo disputado · previsão de 25 set." / "Played · forecast of 25 Sept"
 * (audit FR3-04): "Jogo começou" read as live days after the final whistle. */
export function matchPlayedLine(forecastTimestamp: string, locale: string): string {
  const date = formatShortDate(forecastTimestamp, locale);
  return locale === 'en'
    ? `Played · forecast of ${date}`
    : `Jogo disputado · previsão de ${date}`;
}

/**
 * The two steps a game's status takes after its kickoff: "Jogo começou" at
 * the kickoff, "Jogo disputado" two hours later. Empty without a confirmed
 * kickoff (a placeholder date is not an instant).
 */
export function kickoffSteps<T>(
  kickoff: string | null | undefined,
  confirmed: boolean,
  started: T,
  played: T,
): Array<ClockStep<T>> {
  if (!kickoff || !confirmed) return [];
  return [
    { at: kickoff, value: started },
    { at: matchPlayedAt(kickoff), value: played },
  ];
}

/**
 * What "agora" becomes once the forecast is out of date, the round it waits
 * for having been played: "na previsão de 25 set." / "in the 25 Sept
 * forecast" (audit FR3-01). `capital` starts it with a capital letter.
 */
export function forecastAsOf(
  forecastTimestamp: string,
  locale: string,
  { capital = false }: { capital?: boolean } = {},
): string {
  const date = formatShortDate(forecastTimestamp, locale);
  if (locale === 'en') return `${capital ? 'In' : 'in'} the ${date} forecast`;
  return `${capital ? 'Na' : 'na'} previsão de ${date}`;
}

/** The fields of an upcoming fixture the round timing reads. */
export interface TimedFixture {
  matchday: number;
  kickoff: string | null;
  postponed?: boolean;
}

export interface NextRoundTiming {
  /** The round whose results trigger the next update; null at season's end. */
  round: number | null;
  /** Kickoffs of that round's games, for its date span. */
  kickoffs: Array<string | null>;
  /** The round's first kickoff (ISO), or null. */
  startsAt: string | null;
  /** The instant the round counts as played (ISO), or null. After it, every
   * "agora" in the published forecast is out of date. */
  playedAt: string | null;
  /** Games left over from earlier rounds that the forecast also prices. */
  postponed: TimedFixture[];
}

/**
 * When the round the next forecast waits for starts and ends: the round in
 * progress when the forecast came out mid-round, else the next one. One
 * source for the hub, the club pages, the simulator and the match pages, so
 * they all turn stale at the same instant (audit FR3-01, FR3-02).
 */
export function nextRoundTiming<F extends TimedFixture>(
  prediction: {
    matchday: number;
    matches_remaining?: unknown[] | null;
    next_matchday?: { matchday?: number } | null;
  },
  upcoming: F[],
): NextRoundTiming & { postponed: F[] } {
  const complete = !prediction.matches_remaining?.length;
  const round = complete ? (prediction.next_matchday?.matchday ?? null) : prediction.matchday;
  const kickoffs = upcoming.filter(f => f.matchday === round).map(f => f.kickoff);
  return {
    round,
    kickoffs,
    startsAt: roundStartsAt(kickoffs),
    playedAt: roundPlayedAt(kickoffs),
    postponed: round == null ? [] : upcoming.filter(f => f.matchday < round),
  };
}
