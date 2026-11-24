/**
 * The live legislative nowcast (/eleicoes/proximas-legislativas): the file
 * shapes the daily job writes (estimador-elections `src/export_nowcast_web.py`)
 * and the pure summaries the page draws from them.
 *
 * Every number on the page is read from these files, never typed: the daily
 * job pushes data-only commits, so a test or a sentence that pins a value
 * would break (or lie) on the next run.
 */
import { quantileSorted, type SeatDraw, type TrendSeries } from '@/lib/election-aggregates';

/** Under public/data and data/build-only. */
export const NOWCAST_DIR = 'elections/legislative-nowcast';

/** How far the listed polls may differ from the number the model read (see nowcastProblems). */
export const MAX_POLL_COUNT_GAP = 3;

/** One party's national share: the median and the central 50% and 90% ranges, polling error included. */
export interface NowcastNationalRow {
  party: string;
  median: number;
  mean: number;
  lo90: number;
  hi90: number;
  lo50: number;
  hi50: number;
}

/** A poll since the last election, as published (shares of the poll's own total). */
export interface NowcastPoll {
  pollster: string;
  fieldwork_start: string | null;
  fieldwork_end: string;
  sample_size: number | null;
  shares: Record<string, number>;
  source_url: string | null;
}

export interface NowcastRun {
  id: string;
  code: string | null;
  model: string;
  bias_form: string;
  /** The day the run was made. */
  as_of: string;
  /** The fieldwork end of the newest poll: the day the estimate is for. */
  last_poll: string;
  target: string;
  /** The industry-wide polling error added at the target (log-ratio scale). */
  polling_error_sd: number;
  chains: number;
  draws: number;
  seat_draws: number;
  polls_since_previous: number;
  diagnostics: {
    divergences: number;
    max_rhat: number;
    min_ess_bulk: number;
    min_ess_tail: number;
    n_values: number;
    passes_gate: boolean;
  };
  exported_at: string;
}

export interface NowcastFile {
  schema: 1;
  kind: 'nowcast';
  run: NowcastRun;
  /** The modelled parties, largest median first. */
  parties: string[];
  /** The last election's result, renormalised over the modelled parties. */
  previous: { date: string; shares: Record<string, number> };
  national: NowcastNationalRow[];
  /** The model's poll average, week by week since the last election (no polling error). */
  trend: TrendSeries & { interval: number; includes_polling_error: boolean };
  polls: NowcastPoll[];
}

const seatsOf = (draw: SeatDraw, party: string) => {
  const value = draw[party];
  return typeof value === 'number' ? value : 0;
};

/**
 * Who has the most seats, draw by draw: the share of draws each party leads
 * outright, and the share where the first place is tied (which counts for no
 * one, as in `mostSeats`).
 */
export function mostSeatsShares(draws: readonly SeatDraw[], parties: readonly string[]): { outright: Record<string, number>; tie: number } {
  const outright: Record<string, number> = Object.fromEntries(parties.map(p => [p, 0]));
  if (draws.length === 0) return { outright, tie: NaN };
  let ties = 0;
  for (const draw of draws) {
    let best = -Infinity;
    let leader: string | null = null;
    let tied = false;
    for (const party of parties) {
      const seats = seatsOf(draw, party);
      if (seats > best) {
        best = seats;
        leader = party;
        tied = false;
      } else if (seats === best) {
        tied = true;
      }
    }
    if (tied || leader == null) ties++;
    else outright[leader]++;
  }
  for (const party of parties) outright[party] /= draws.length;
  return { outright, tie: ties / draws.length };
}

/** One party's seats over every draw: the median and the central 90% interval, as the votes table reads its shares. */
export interface SeatRange {
  party: string;
  median: number;
  lo90: number;
  hi90: number;
}

/** Seat ranges for the parties, largest median first (whole seats, rounded). */
export function seatRanges(draws: readonly SeatDraw[], parties: readonly string[]): SeatRange[] {
  if (draws.length === 0) return [];
  return parties
    .map(party => {
      const sorted = draws.map(d => seatsOf(d, party)).sort((a, b) => a - b);
      return {
        party,
        median: Math.round(quantileSorted(sorted, 0.5)),
        lo90: Math.round(quantileSorted(sorted, 0.05)),
        hi90: Math.round(quantileSorted(sorted, 0.95)),
      };
    })
    .sort((a, b) => b.median - a.median || b.hi90 - a.hi90);
}

/** The parties by their chance of most seats, highest first (ties broken by the national median order). */
export function rankedByMostSeats(outright: Record<string, number>, order: readonly string[]): string[] {
  return [...order].sort((a, b) => (outright[b] ?? 0) - (outright[a] ?? 0));
}

/**
 * The date from which the trend is weekly to the end. The job saves the
 * latent path every week for the last 52 weeks and every fourth week before,
 * so the chart's caption says where the spacing changes; null when every
 * step is a week.
 */
export function weeklyFrom(dates: readonly string[]): string | null {
  const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;
  let i = dates.length - 1;
  while (i > 0 && day(dates[i]) - day(dates[i - 1]) <= 7) i--;
  return i === 0 ? null : dates[i];
}

/**
 * What the file must hold for the page to be drawn: the loader refuses a file
 * that fails any of these (the page then says the estimate is unavailable
 * rather than drawing zeros). validate-data runs the same checks at build.
 */
export function nowcastProblems(file: unknown): string[] {
  const problems: string[] = [];
  const f = file as Partial<NowcastFile> | null;
  if (!f || typeof f !== 'object') return ['not an object'];
  if (f.schema !== 1 || f.kind !== 'nowcast') problems.push('schema 1 nowcast expected');
  const run = f.run;
  if (!run) return [...problems, 'no run'];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(run.last_poll ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(run.as_of ?? '')) problems.push('run dates');
  if (run.diagnostics?.passes_gate !== true) problems.push('the run did not pass the convergence gate');
  if (run.bias_form !== 'none') problems.push(`bias form ${run.bias_form} is a scenario`);
  const national = f.national ?? [];
  if (national.length < 2) problems.push('national shares');
  const meanTotal = national.reduce((sum, r) => sum + r.mean, 0);
  if (Math.abs(meanTotal - 1) > 0.005) problems.push(`mean shares add up to ${meanTotal.toFixed(4)}`);
  for (const r of national) {
    if (!(r.lo90 <= r.lo50 && r.lo50 <= r.median && r.median <= r.hi50 && r.hi50 <= r.hi90)) problems.push(`${r.party}: ranges out of order`);
  }
  const trend = f.trend;
  if (!trend || trend.dates.length < 2) problems.push('trend');
  else if (trend.dates.at(-1) !== run.last_poll) problems.push(`trend ends ${trend.dates.at(-1)}, last poll ${run.last_poll}`);
  if (!f.previous?.date || !f.previous.shares) problems.push('previous election');
  // The list is the feed's rows the loader keeps; the model's own count can differ by a poll or
  // two (a poll the Marktest history already held), never by more.
  if (!Array.isArray(f.polls) || f.polls.length === 0 || Math.abs(f.polls.length - run.polls_since_previous) > MAX_POLL_COUNT_GAP) problems.push('polls');
  return problems;
}
