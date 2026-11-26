/**
 * The live nowcast's figures, reduced from the files on the server: seats under the
 * emigration patterns the page uses, vote shares that add up, how each pollster compares
 * with the estimate, and what the emigration seats decide. Pure functions; the loader
 * calls them and the pages print what they return. No figure is typed anywhere.
 */
import { quantileSorted, type SeatDraw, type TrendSeries } from '@/lib/election-aggregates';
import { mostSeatsShares, onModelBase, parliamentSeats, type NowcastNationalRow, type NowcastPoll } from '@/lib/legislative-nowcast';

/**
 * The four emigration seats follow one of four past results in the seat draws
 * (`diaspora_scenario_applied`). The page uses the two most recent elections, 2024 and
 * 2025, when Chega already won seats abroad (owner's choice of the 26 Nov 2026 mock;
 * the 2019 and 2022 patterns give Chega none). Change it here and every figure follows.
 */
export const NOWCAST_EMIGRATION_PATTERNS: readonly string[] = ['S_2024', 'S_2025'];

const seatsOf = (draw: SeatDraw, party: string) => {
  const value = draw[party];
  return typeof value === 'number' ? value : 0;
};

/** Whole steps that add up to `total` (largest remainder), so a column of shares sums to 100,0. */
export function roundToTotal(values: readonly number[], total: number, step = 1): number[] {
  const scaled = values.map(v => v / step);
  const floors = scaled.map(Math.floor);
  let left = Math.round(total / step) - floors.reduce((a, b) => a + b, 0);
  const order = scaled.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i]++;
    left--;
  }
  return floors.map(f => f * step);
}

/** Each party's mean vote share in points, one decimal, adding up to 100. */
export function voteShares(national: readonly NowcastNationalRow[]): Record<string, number> {
  const rounded = roundToTotal(national.map(r => r.mean * 100), 100, 0.1);
  return Object.fromEntries(national.map((r, i) => [r.party, Math.round(rounded[i] * 10) / 10]));
}

/** The first place in one draw: the party with the most seats, or 'tie'. */
function leaderOf(draw: SeatDraw, parties: readonly string[]): string {
  let best = -Infinity;
  let leader = 'tie';
  for (const party of parties) {
    const s = seatsOf(draw, party);
    if (s > best) { best = s; leader = party; } else if (s === best) leader = 'tie';
  }
  return leader;
}

/** First place under each emigration pattern: the shares of draws each party leads outright. */
export function firstByPattern(draws: readonly SeatDraw[], parties: readonly string[]): Array<{ pattern: string; year: string; outright: Record<string, number> }> {
  const patterns = [...new Set(draws.map(d => String(d.diaspora_scenario_applied ?? '')))].filter(Boolean).sort().reverse();
  return patterns.map(pattern => ({
    pattern,
    year: pattern.replace(/^S_/, ''),
    outright: mostSeatsShares(draws.filter(d => d.diaspora_scenario_applied === pattern), parties).outright,
  }));
}

/** How often first place changes between two emigration patterns for the same model draw. */
export function leaderChangeShare(draws: readonly SeatDraw[], a: string, b: string, parties: readonly string[]): number {
  const byId = (pattern: string) => new Map(draws.filter(d => d.diaspora_scenario_applied === pattern).map(d => [d.original_sample_id, leaderOf(d, parties)]));
  const left = byId(a);
  const right = byId(b);
  let pairs = 0;
  let changed = 0;
  for (const [id, leader] of left) {
    const other = right.get(id);
    if (other == null) continue;
    pairs++;
    if (other !== leader) changed++;
  }
  return pairs === 0 ? NaN : changed / pairs;
}

export interface SeatSummary {
  /** Draws used (the model draws times the emigration patterns kept). */
  draws: number;
  /** Mean seats filled to 230 by largest remainder, in the order given. */
  seats: Array<{ party: string; seats: number }>;
  /** The central 90% of each party's seats. */
  range: Record<string, { lo: number; hi: number }>;
  /** Share of draws each party has the most seats outright; ties apart. */
  first: Record<string, number>;
  tie: number;
}

export function summariseNowcastSeats(draws: readonly SeatDraw[], parties: readonly string[], house = 230): SeatSummary {
  const seats = parliamentSeats(draws, parties, house);
  const range = Object.fromEntries(parties.map(p => {
    const sorted = draws.map(d => seatsOf(d, p)).sort((a, b) => a - b);
    return [p, { lo: quantileSorted(sorted, 0.05), hi: quantileSorted(sorted, 0.95) }];
  }));
  const { outright, tie } = mostSeatsShares(draws, parties);
  return { draws: draws.length, seats, range, first: outright, tie };
}

/** One pollster's polls since the last election against the estimate of the same week. */
export interface PollsterGap {
  pollster: string;
  /** A rolling tracker: a firm with three or more polls of three weeks' fieldwork or longer, counted apart from its other polls. */
  tracking: boolean;
  polls: number;
  /** Mean of poll minus estimate, in points, per party. */
  gap: Record<string, number>;
  /** How many of the firm's polls sit above the estimate, per party. */
  above: Record<string, number>;
}

const TRACKING_DAYS = 20;
const TRACKING_MIN_POLLS = 3;
const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;

/**
 * Each poll against the trend in the week its fieldwork ended, both on the parties the poll
 * reports among the modelled ones (a party stored as 0 is taken as not reported), grouped
 * by firm. The trend is the estimate without the shared polling error.
 */
export function pollsterGaps(polls: readonly NowcastPoll[], trend: TrendSeries, parties: readonly string[], measured: readonly string[]): PollsterGap[] {
  const dates = trend.dates.map(day);
  const long = (poll: NowcastPoll) => poll.fieldwork_start != null && day(poll.fieldwork_end) - day(poll.fieldwork_start) >= TRACKING_DAYS;
  const longPolls = new Map<string, number>();
  for (const poll of polls) if (long(poll)) longPolls.set(poll.pollster, (longPolls.get(poll.pollster) ?? 0) + 1);
  const groups = new Map<string, { pollster: string; tracking: boolean; rows: Array<Record<string, number>> }>();
  for (const poll of polls) {
    const reported = parties.filter(p => (poll.shares[p] ?? 0) > 0);
    const share = onModelBase(poll.shares, reported);
    const end = day(poll.fieldwork_end);
    let k = 0;
    for (let i = 1; i < dates.length; i++) if (Math.abs(dates[i] - end) < Math.abs(dates[k] - end)) k = i;
    const level = Object.fromEntries(reported.map(p => [p, trend.parties[p]?.mean[k] ?? 0]));
    const levelTotal = reported.reduce((s, p) => s + level[p], 0);
    if (!(levelTotal > 0)) continue;
    const row: Record<string, number> = {};
    for (const p of measured) if (share[p] != null) row[p] = 100 * (share[p] - level[p] / levelTotal);
    const tracking = long(poll) && (longPolls.get(poll.pollster) ?? 0) >= TRACKING_MIN_POLLS;
    const key = `${poll.pollster}|${tracking}`;
    if (!groups.has(key)) groups.set(key, { pollster: poll.pollster, tracking, rows: [] });
    groups.get(key)!.rows.push(row);
  }
  return [...groups.values()]
    .map(g => ({
      pollster: g.pollster,
      tracking: g.tracking,
      polls: g.rows.length,
      gap: Object.fromEntries(measured.map(p => {
        const values = g.rows.map(r => r[p]).filter((v): v is number => v != null);
        return [p, values.length ? values.reduce((a, b) => a + b, 0) / values.length : NaN];
      })),
      above: Object.fromEntries(measured.map(p => [p, g.rows.filter(r => (r[p] ?? 0) > 0).length])),
    }))
    .sort((a, b) => b.polls - a.polls);
}

/** Mean seats of a group of parties, from the rounded seats (so the printed sums add up). */
export function seatTotal(seats: ReadonlyArray<{ party: string; seats: number }>, parties: readonly string[]): number {
  return parties.reduce((sum, p) => sum + (seats.find(s => s.party === p)?.seats ?? 0), 0);
}

/** Simulations laid out by one party's lead over another in votes, and who wins most seats in each. */
export interface LeadHistogram {
  a: string;
  b: string;
  /** One bar per whole point of lead (a − b, in points), from the lowest to the highest. */
  bins: Array<{ x: number; counts: Record<string, number> }>;
  /**
   * The smallest whole lead from which the party ahead in votes is first in at least 80% of
   * the simulations at every lead beyond it, on both sides; null when there is none up to 5.
   */
  settled: number | null;
  draws: number;
}

/**
 * The draws by `a`'s lead over `b` in national votes (each seat draw carries its votes as `vote`),
 * one bar per point, the tails folded into the end bars (the outer half per cent each side).
 * Each draw counts for the party with most seats, or 'tie'.
 */
export function leadHistogram(draws: readonly SeatDraw[], a: string, b: string, parties: readonly string[]): LeadHistogram | null {
  const rows = draws
    .map(d => ({ d, vote: d.vote as unknown as Record<string, number> | undefined }))
    .filter((r): r is { d: SeatDraw; vote: Record<string, number> } => r.vote != null && r.vote[a] != null && r.vote[b] != null);
  if (rows.length < 100) return null;
  const leads = rows.map(r => 100 * (r.vote[a] - r.vote[b]));
  const sorted = [...leads].sort((x, y) => x - y);
  const lo = Math.floor(quantileSorted(sorted, 0.005));
  const hi = Math.floor(quantileSorted(sorted, 0.995));
  const bins = new Map<number, Record<string, number>>();
  for (let x = lo; x <= hi; x++) bins.set(x, {});
  rows.forEach((r, i) => {
    const x = Math.min(hi, Math.max(lo, Math.floor(leads[i])));
    const who = leaderOf(r.d, parties);
    const c = bins.get(x)!;
    c[who] = (c[who] ?? 0) + 1;
  });
  const list = [...bins.entries()].map(([x, counts]) => ({ x, counts }));
  const firstShare = (bin: { x: number; counts: Record<string, number> }) => {
    const n = Object.values(bin.counts).reduce((s, v) => s + v, 0);
    const ahead = bin.x >= 0 ? a : b;
    return n < 20 ? null : (bin.counts[ahead] ?? 0) / n;
  };
  let settled: number | null = null;
  for (let k = 1; k <= 5; k++) {
    // Bars entirely beyond k points either way: [k, k+1) and up, and up to [-k-1, -k).
    const beyond = list.filter(bin => bin.x >= k || bin.x + 1 <= -k);
    if (beyond.every(bin => { const s = firstShare(bin); return s == null || s >= 0.8; })) { settled = k; break; }
  }
  return { a, b, bins: list, settled, draws: rows.length };
}
