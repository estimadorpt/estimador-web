/**
 * Server-side summaries of the election archives' simulation files.
 *
 * The archive pages used to hand every simulation to the browser: 8000 runoff
 * trajectories (19 days × 3 outcomes) and 9000 seat draws, several megabytes
 * of page payload for charts that draw a few hundred dots and a table of
 * quantiles. These functions reduce the draws on the server instead. Two rules
 * keep the charts honest:
 *
 * - every quantile, probability and median is computed from ALL the draws;
 * - the dots a chart draws are a fixed, evenly spaced subsample (every k-th
 *   draw), so the picture is the same on every load and its size is stated.
 *
 * Pure functions only: no file access, so they can be tested on small arrays.
 */

/** Draws drawn as dots by the beeswarm and the coalition plot. */
export const DRAWN_SAMPLE_SIZE = 800;

/**
 * Empirical quantile of an ascending array: the value at index ⌊n·p⌋. This is
 * the convention the model exports use for their own intervals (the runoff
 * file's ci_lower is exactly the draw at ⌊8000 × 0.025⌋), so a table built
 * here agrees with the cards built from the exported summaries.
 */
export function quantileSorted(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return NaN;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))];
}

/** Indices of an evenly spaced, deterministic subsample of at most `target` items. */
export function everyKthIndex(length: number, target: number): number[] {
  if (length <= 0 || target <= 0) return [];
  const k = Math.max(1, Math.ceil(length / target));
  const indices: number[] = [];
  for (let i = 0; i < length; i += k) indices.push(i);
  return indices;
}

export interface DrawSummary {
  mean: number;
  p5: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
}

export function summariseDraws(values: readonly number[]): DrawSummary {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = sorted.length ? sorted.reduce((sum, v) => sum + v, 0) / sorted.length : NaN;
  return {
    mean,
    p5: quantileSorted(sorted, 0.05),
    p25: quantileSorted(sorted, 0.25),
    median: quantileSorted(sorted, 0.5),
    p75: quantileSorted(sorted, 0.75),
    p95: quantileSorted(sorted, 0.95),
  };
}

// ---- presidential runoff ---------------------------------------------------

/** The structural shape of second_round_trajectories.json. */
export interface RunoffTrajectoriesInput {
  dates: string[];
  n_samples: number;
  candidates: Record<string, { color: string; trajectories: number[][] }>;
}

export interface RunoffCandidateSimulations {
  name: string;
  color: string;
  /** Election-day share of the valid vote, over every simulation. */
  summary: DrawSummary;
  /** Share of simulations in which the candidate takes more than half the valid vote. */
  winShare: number;
  /** Election-day share of the valid vote in the drawn subsample, same draws for every candidate. */
  sample: number[];
}

export interface RunoffSimulations {
  /** Simulations in the file. */
  total: number;
  /** Simulations drawn as dots. */
  drawn: number;
  /** The day the shares are read on: the last date of the trajectories (election day). */
  date: string | null;
  /** Sorted by median share, highest first. */
  candidates: RunoffCandidateSimulations[];
  /** Share of simulations with a margin under 10 points of the valid vote. */
  closeRace: number;
  /** Share of simulations in which the second candidate passes 40% of the valid vote. */
  runnerUpAbove40: number;
}

export const BLANK_NULL = 'Blank/Null';

/**
 * Election-day valid-vote shares of the two runoff candidates, per draw. The
 * file carries shares of all ballots (blank and null included); a majority is
 * a majority of the valid vote, so each draw is renormalised to the two
 * candidates before anything is compared with 50%.
 */
export function summariseRunoff(input: RunoffTrajectoriesInput, sampleSize = DRAWN_SAMPLE_SIZE): RunoffSimulations | null {
  const names = Object.keys(input.candidates ?? {}).filter(name => name !== BLANK_NULL);
  if (names.length !== 2) return null;
  const finals = names.map(name => input.candidates[name].trajectories.map(t => t[t.length - 1]));
  const n = Math.min(finals[0].length, finals[1].length);
  if (n === 0) return null;
  const valid: number[][] = [[], []];
  for (let i = 0; i < n; i++) {
    const total = finals[0][i] + finals[1][i];
    valid[0].push(total > 0 ? finals[0][i] / total : NaN);
    valid[1].push(total > 0 ? finals[1][i] / total : NaN);
  }
  const indices = everyKthIndex(n, sampleSize);
  const candidates = names.map((name, c) => {
    const shares = valid[c].filter(Number.isFinite);
    return {
      name,
      color: input.candidates[name].color,
      summary: summariseDraws(shares),
      winShare: shares.filter(v => v > 0.5).length / n,
      sample: indices.map(i => round4(valid[c][i])),
    };
  }).sort((a, b) => b.summary.median - a.summary.median);
  const [leader, runnerUp] = [names.indexOf(candidates[0].name), names.indexOf(candidates[1].name)];
  let close = 0;
  let above40 = 0;
  for (let i = 0; i < n; i++) {
    if (Math.abs(valid[leader][i] - valid[runnerUp][i]) < 0.10) close++;
    if (valid[runnerUp][i] > 0.40) above40++;
  }
  return {
    total: n,
    drawn: indices.length,
    date: input.dates?.[input.dates.length - 1] ?? null,
    candidates,
    closeRace: close / n,
    runnerUpAbove40: above40 / n,
  };
}

// ---- parliamentary seats ---------------------------------------------------

export type SeatDraw = Record<string, number | string | undefined>;

const seatsOf = (draw: SeatDraw, party: string) => {
  const value = draw[party];
  return typeof value === 'number' ? value : 0;
};

export interface PartySeatStats {
  party: string;
  mean: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  max: number;
}

/** Per-party seat distribution over every draw (the seat chart and its table). */
export function summariseSeats(draws: readonly SeatDraw[], parties: readonly string[]): PartySeatStats[] {
  if (draws.length === 0) return [];
  return parties
    .map(party => {
      const sorted = draws.map(d => seatsOf(d, party)).sort((a, b) => a - b);
      return {
        party,
        mean: Math.round(sorted.reduce((sum, v) => sum + v, 0) / sorted.length),
        p10: quantileSorted(sorted, 0.1),
        p25: quantileSorted(sorted, 0.25),
        median: quantileSorted(sorted, 0.5),
        p75: quantileSorted(sorted, 0.75),
        p90: quantileSorted(sorted, 0.9),
        max: sorted[sorted.length - 1],
      };
    })
    .sort((a, b) => b.mean - a.mean);
}

/** Seat draws as the flat {party, seats} rows the seat chart accepts from MDX. */
export function seatRows(draws: readonly SeatDraw[], parties: readonly string[]) {
  return draws.flatMap(d => parties.filter(p => typeof d[p] === 'number').map(party => ({ party, seats: seatsOf(d, party) })));
}

export interface BlocDefinition {
  key: string;
  parties: readonly string[];
}

export interface BlocSeatSummary {
  key: string;
  parties: readonly string[];
  summary: DrawSummary;
  /** Share of draws in which the bloc reaches the majority threshold. */
  majority: number;
  /** Seats in the drawn subsample, same draws for every bloc. */
  sample: number[];
}

export interface BlocSimulations {
  total: number;
  drawn: number;
  threshold: number;
  blocs: BlocSeatSummary[];
}

/** Bloc seat totals over every draw, plus the deterministic subsample the dot plot draws. */
export function summariseBlocs(draws: readonly SeatDraw[], blocs: readonly BlocDefinition[], threshold: number, sampleSize = DRAWN_SAMPLE_SIZE): BlocSimulations {
  const indices = everyKthIndex(draws.length, sampleSize);
  return {
    total: draws.length,
    drawn: indices.length,
    threshold,
    blocs: blocs.map(bloc => {
      const totals = draws.map(d => bloc.parties.reduce((sum, p) => sum + seatsOf(d, p), 0));
      return {
        key: bloc.key,
        parties: bloc.parties,
        summary: summariseDraws(totals),
        majority: totals.length ? totals.filter(s => s >= threshold).length / totals.length : 0,
        sample: indices.map(i => totals[i]),
      };
    }),
  };
}

/** A dot in a stacked dot histogram: its value, its sub-column within the value's column, and its row from the baseline. */
export interface StackedDot {
  value: number;
  col: number;
  row: number;
}

/**
 * Stack equal values into a dot histogram, `perRow` dots side by side within
 * each value's column, rows counted up from the baseline. Unlike a dodge, the
 * tallest column's height is known in advance, so the chart can size its dots
 * to fit the row and no stack runs into the next one or over the axis.
 */
export function stackDots(values: readonly number[], perRow: number): { dots: StackedDot[]; rows: number } {
  const per = Math.max(1, Math.floor(perRow));
  const seen = new Map<number, number>();
  let rows = 0;
  const dots = values.map(value => {
    const k = seen.get(value) ?? 0;
    seen.set(value, k + 1);
    const row = Math.floor(k / per);
    rows = Math.max(rows, row + 1);
    return { value, col: k % per, row };
  });
  return { dots, rows };
}

/**
 * How many dots to set side by side in each value's column so the tallest
 * column fits `heightPx`, given `unitPx` pixels per value. Dots are square on
 * a pitch of unitPx / perRow; the smallest perRow that fits keeps them as
 * large as possible. Returns the cap when even that does not fit.
 */
export function dotsPerRowToFit(maxCount: number, unitPx: number, heightPx: number, cap = 8): number {
  for (let per = 1; per <= cap; per++) {
    if (Math.ceil(maxCount / per) * (unitPx / per) <= heightPx) return per;
  }
  return cap;
}

// ---- trends ----------------------------------------------------------------

/**
 * Trend rows from the two years before the latest date. The archive charts and
 * their tables show this window; older rows (back to 2009) were never drawn.
 */
export function recentTrendRows<T extends { date: string }>(rows: readonly T[], years = 2): T[] {
  if (rows.length === 0) return [];
  const latest = rows.reduce((max, r) => (r.date > max ? r.date : max), rows[0].date);
  const cutoff = new Date(`${latest}T00:00:00Z`);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
  const from = cutoff.toISOString().slice(0, 10);
  return rows.filter(r => r.date >= from);
}

/** One party's estimate and band on each date of a {@link TrendSeries}; null where the file has no row. */
export interface TrendSeriesParty {
  mean: (number | null)[];
  low: (number | null)[];
  high: (number | null)[];
}

/**
 * The trend chart's window in columns: the dates once, then per party three
 * arrays aligned with them. The long rows ({date, party, metric, value}, three
 * per party and date) repeat every key and date string, which made the
 * legislativas page carry ~350 KB of inline props; this shape carries the same
 * numbers, every one the chart and its table draw, in about a tenth.
 */
export interface TrendSeries {
  dates: string[];
  parties: Record<string, TrendSeriesParty>;
}

const TREND_METRICS = { vote_share_mean: 'mean', vote_share_low: 'low', vote_share_high: 'high' } as const;

export function compactTrendSeries(rows: readonly { date: string; party: string; metric: string; value: number }[]): TrendSeries {
  const dates = Array.from(new Set(rows.map(r => r.date))).sort();
  const index = new Map(dates.map((d, i) => [d, i]));
  const parties: Record<string, TrendSeriesParty> = {};
  for (const row of rows) {
    const key = TREND_METRICS[row.metric as keyof typeof TREND_METRICS];
    if (!key || !Number.isFinite(row.value)) continue;
    const party = (parties[row.party] ??= { mean: dates.map(() => null), low: dates.map(() => null), high: dates.map(() => null) });
    party[key][index.get(row.date)!] = round4(row.value);
  }
  return { dates, parties };
}

/**
 * Share of draws in which no listed bloc reaches the threshold: the
 * "parlamento sem maioria" figure the methodology promises, for the blocs the
 * page shows.
 */
export function noBlocMajorityShare(draws: readonly SeatDraw[], blocs: readonly (readonly string[])[], threshold: number): number {
  if (draws.length === 0) return NaN;
  let none = 0;
  for (const d of draws) {
    if (blocs.every(parties => parties.reduce((sum, p) => sum + seatsOf(d, p), 0) < threshold)) none++;
  }
  return none / draws.length;
}

/** Seat-sum arithmetic for one grouping over every draw: its median and how often it reaches the threshold. */
export function seatSumArithmetic(draws: readonly SeatDraw[], parties: readonly string[], threshold: number): { median: number; reach: number } {
  if (draws.length === 0) return { median: NaN, reach: NaN };
  const totals = draws.map(d => parties.reduce((sum, p) => sum + seatsOf(d, p), 0)).sort((a, b) => a - b);
  return { median: quantileSorted(totals, 0.5), reach: totals.filter(v => v >= threshold).length / totals.length };
}

export interface CloseLead {
  district: string;
  first: { party: string; share: number };
  second: { party: string; share: number };
}

/**
 * Districts whose two leading parties are within `margin` of each other in
 * predicted vote share (default 1 percentage point). The map and the
 * "party ahead" count colour such a district as a win for the leader; the
 * pages name these so a near-tie is not read as a clear lead.
 */
export function closeLeads(districts: readonly { district_name: string; probs: Record<string, number> }[], margin = 0.01): CloseLead[] {
  const out: CloseLead[] = [];
  for (const d of districts) {
    const [first, second] = Object.entries(d.probs).sort(([, a], [, b]) => b - a);
    if (!first || !second || first[1] - second[1] >= margin) continue;
    out.push({ district: d.district_name, first: { party: first[0], share: first[1] }, second: { party: second[0], share: second[1] } });
  }
  return out;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
