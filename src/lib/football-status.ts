// The one line that dates a Liga forecast: which matchday it follows, when
// it was published and when the next one comes. "Jornada 7 · 25 de setembro"
// read like a match date (audit CL-M4); this says what the date is.

import { formatDateSpan, formatShortDate } from '@/lib/football-format';

export interface ForecastStatusInput {
  /** The matchday the forecast was run after (prediction.matchday). */
  matchday: number;
  /** prediction.timestamp. */
  timestamp: string;
  /** True when the forecast's matchday still had games to play. */
  inProgress: boolean;
  /** How many of that matchday's games the forecast had seen, when it came
   * out mid-round: "com 7 dos 9 jogos da jornada 8 disputados". */
  roundSeen?: { played: number; total: number } | null;
  /** The round whose results trigger the next update; null at season's end. */
  nextRound: number | null;
  /** Kickoffs of that round's games (UTC ISO), for its date span. */
  nextRoundKickoffs: Array<string | null | undefined>;
}

/**
 * What the forecast had seen, in the one vocabulary every Liga page uses:
 * "depois da jornada 7" once a round is complete, "com 7 dos 9 jogos da
 * jornada 8 disputados" when it came out mid-round (the homepage's Liga
 * instrument says it the same way). "Durante a jornada 8" and "depois da
 * jornada 8" named one state on two pages, and "Durante a jornada 8 · …
 * jornada 8 jogada" contradicted itself once the round was over (review,
 * October 2026).
 */
export function forecastCoverage(
  input: Pick<ForecastStatusInput, 'matchday' | 'inProgress' | 'roundSeen'>,
  locale: string,
): string {
  const pt = locale !== 'en';
  const md = input.matchday;
  if (!input.inProgress) return pt ? `depois da jornada ${md}` : `after matchday ${md}`;
  const seen = input.roundSeen;
  if (seen && seen.total > 0) {
    return pt
      ? `com ${seen.played} dos ${seen.total} jogos da jornada ${md} disputados`
      : `with ${seen.played} of matchday ${md}’s ${seen.total} games played`;
  }
  return pt ? `a meio da jornada ${md}` : `partway through matchday ${md}`;
}

/** "Previsão de 11 out., com 7 dos 9 jogos da jornada 8 disputados". */
function forecastHead(input: ForecastStatusInput, locale: string): string {
  const date = formatShortDate(input.timestamp, locale);
  const coverage = forecastCoverage(input, locale);
  if (locale === 'en') return date ? `Forecast of ${date}, ${coverage}` : `Forecast ${coverage}`;
  return date ? `Previsão de ${date}, ${coverage}` : `Previsão ${coverage}`;
}

/**
 * The dated status of a Liga forecast, one line for every hero that shows
 * it (the hub, the club and the match pages): "Previsão de 25 set., depois
 * da jornada 7 · próxima previsão depois da jornada 8 (9–12 out.)" /
 * "Forecast of 25 Sept, after matchday 7 · next forecast after matchday 8
 * (9–12 Oct)". Every part comes from the data; the span is dropped when no
 * kickoff is known. `forecastStatus` adds the line it turns into.
 */
export function forecastStatusLine(input: ForecastStatusInput, locale: string): string {
  const pt = locale !== 'en';
  const parts = [forecastHead(input, locale)];
  if (input.nextRound == null) {
    parts.push(pt ? 'época terminada' : 'season over');
  } else {
    const span = formatDateSpan(input.nextRoundKickoffs, locale, { short: true });
    const next = pt
      ? `próxima previsão depois da jornada ${input.nextRound}`
      : `next forecast after matchday ${input.nextRound}`;
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

/** "Jornada 8 jogada, nova previsão em preparação": the status line's tail
 * once the round is over, said on its own. */
export function roundPlayedLine(matchday: number, locale: string): string {
  return locale === 'en'
    ? `Matchday ${matchday} played, new forecast in preparation`
    : `Jornada ${matchday} jogada, nova previsão em preparação`;
}

/**
 * The status line once the next round is played: "Previsão de 11 out., com
 * 7 dos 9 jogos da jornada 8 disputados · jornada 8 jogada, nova previsão em
 * preparação".
 */
export function forecastStatusLinePlayed(input: ForecastStatusInput, locale: string): string {
  const pt = locale !== 'en';
  const parts = [forecastHead(input, locale)];
  if (input.nextRound == null) parts.push(pt ? 'época terminada' : 'season over');
  else parts.push(roundPlayedLine(input.nextRound, locale).replace(/^./, c => c.toLowerCase()));
  return parts.join(' · ');
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
 * source for the hub, the club pages and the match pages, so
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

/* --------------------------------------------- one status, every hero --- */

/** The fields of a published forecast the status line reads. */
export interface StatusPrediction {
  matchday: number;
  timestamp: string;
  matches_remaining?: unknown[] | null;
  matchday_results?: Array<{ matchday?: number }> | null;
  next_matchday?: { matchday?: number } | null;
}

/**
 * The status line's input, read from the forecast and the games to come:
 * how many of its round's games it had seen (played from `matchday_results`,
 * still to play from `matches_remaining`, as the homepage counts them), the
 * round the next forecast waits for and when that round counts as played.
 */
export function forecastStatusInput<F extends TimedFixture>(
  prediction: StatusPrediction,
  upcoming: F[],
): ForecastStatusInput & { playedAt: string | null } {
  const timing = nextRoundTiming(prediction, upcoming);
  const remaining = prediction.matches_remaining?.length ?? 0;
  const played = (prediction.matchday_results ?? []).filter(r => r.matchday === prediction.matchday).length;
  return {
    matchday: prediction.matchday,
    timestamp: prediction.timestamp,
    inProgress: remaining > 0,
    roundSeen: remaining > 0 ? { played, total: played + remaining } : null,
    nextRound: timing.round,
    nextRoundKickoffs: timing.kickoffs,
    playedAt: timing.playedAt,
  };
}

/**
 * Every Liga hero's status, ready for a ClockSwitch: the line as published,
 * and the line it becomes once the round the next forecast waits for is
 * played. The hub, the club pages and the match pages read it, so they say
 * the same thing in the same words and turn stale at the same instant.
 */
export function forecastStatus<F extends TimedFixture>(
  prediction: StatusPrediction,
  upcoming: F[],
  locale: string,
): { initial: string; steps: Array<ClockStep<string>> } {
  const input = forecastStatusInput(prediction, upcoming);
  return {
    initial: forecastStatusLine(input, locale),
    steps: input.playedAt && input.nextRound != null
      ? [{ at: input.playedAt, value: forecastStatusLinePlayed(input, locale) }]
      : [],
  };
}
