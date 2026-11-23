/**
 * The seat simulator's engine ("Mover votos", /eleicoes/legislativas): national votes in,
 * seats per circle out, with the last seat of every circle.
 *
 * It starts from the 2025 result (`public/data/elections/parliamentary-2025/simulator.json`,
 * written by estimador-elections `src/simulator_export.py`) and runs in the browser:
 *
 * 1. the reader's national vote for the movable lists (the eight parties and the other lists
 *    together) becomes district shares by blend swing: half proportional swing, half uniform
 *    swing from 2025, each renormalised. This is `blend_swing` in estimador-elections
 *    `src/processing/district_swing.py`, ported line for line and tested against it
 *    (`__fixtures__/blend-swing.json`);
 * 2. JPP keeps its 2025 share in every circle (it stands to win only in Madeira);
 * 3. D'Hondt in each circle among the parties and JPP. The other lists are never given seats:
 *    they are many lists, and none came near a seat in 2025;
 * 4. the two emigration circles keep their 2025 result: blend swing was never fitted there.
 *
 * Pure functions, no DOM: the page's client component and the tests both call them.
 */

export interface SimulatorCircle {
  name: string;
  seats: number;
  /** An emigration circle: kept at its 2025 result. */
  fixed: boolean;
  /** 2025 valid votes per list (movable parties, JPP, OUT). */
  votes: Record<string, number>;
  seats2025: Record<string, number>;
  lastSeat: LastSeat;
}

export interface LastSeat {
  /** The list that took the circle's last seat. */
  list: string;
  /** The next list in line and the extra votes it needed to take that seat, all else equal. */
  runnerUp: { list: string; votes: number } | null;
}

export interface SimulatorData {
  version: number;
  election: string;
  generated: string;
  seatMap: string;
  sources: string[];
  /** The parties a reader can move, in the archive's order. */
  movable: string[];
  /** Lists held at their 2025 share in every circle (JPP). */
  fixed: string[];
  /** The key of every other list together. */
  others: string;
  seats2025: Record<string, number>;
  circles: SimulatorCircle[];
  /** Domestic national shares of the movable lists and the other lists, per past election. */
  presets: Record<string, Record<string, number>>;
}

/** The national vote of the movable lists and the other lists, in votes. */
export type NationalVotes = Record<string, number>;

export interface CircleResult {
  name: string;
  seats: number;
  fixed: boolean;
  /** Votes per list under the scenario (the 2025 total, split by the scenario's shares). */
  votes: Record<string, number>;
  /** Seats per list (lists with none left out). */
  won: Record<string, number>;
  lastSeat: LastSeat;
}

export interface ScenarioResult {
  circles: CircleResult[];
  /** Seats per list over all 230. */
  totals: Record<string, number>;
  /** Domestic national shares of the movable lists and the other lists (sum 1). */
  national: Record<string, number>;
}

const EPS = 1e-6;

/** The lists the national vote is made of: the movable parties, then the other lists. */
export function swingLists(data: SimulatorData): string[] {
  return [...data.movable, data.others];
}

/** The lists that can win seats: the movable parties, then JPP. */
export function competingLists(data: SimulatorData): string[] {
  return [...data.movable, ...data.fixed];
}

/** 2025's domestic national vote for the movable lists and the other lists. */
export function baseVotes(data: SimulatorData): NationalVotes {
  const out: NationalVotes = {};
  for (const p of swingLists(data)) out[p] = 0;
  for (const c of data.circles) {
    if (c.fixed) continue;
    for (const p of swingLists(data)) out[p] += c.votes[p] ?? 0;
  }
  return out;
}

/** A past election's national shares, as votes on 2025's total (the preset's starting point). */
export function presetVotes(data: SimulatorData, preset: string): NationalVotes {
  const base = baseVotes(data);
  if (preset === '2025' || !data.presets[preset]) return base;
  const total = Object.values(base).reduce((a, b) => a + b, 0);
  const shares = data.presets[preset];
  const out: NationalVotes = {};
  for (const p of swingLists(data)) out[p] = (shares[p] ?? 0) * total;
  return out;
}

/**
 * Blend swing for one set of national shares: `blend_swing` of district_swing.py.
 * national, lastNational: (P); lastDistrict: (D, P). Returns (D, P).
 * As in the Python, a list under 0.1% of the last national vote counts as new (it swings
 * uniformly). One guard the Python lacks: a circle where no list with national votes stood
 * last time has no proportional half, so it takes the uniform half alone.
 */
export function blendSwing(national: number[], lastNational: number[], lastDistrict: number[][], weightProportional = 0.5): number[][] {
  const P = national.length;
  return lastDistrict.map(row => {
    const prop = new Array<number>(P);
    const unif = new Array<number>(P);
    for (let j = 0; j < P; j++) {
      const absent = lastNational[j] < 1e-3;
      const ratio = absent ? 1 : row[j] / Math.max(lastNational[j], EPS);
      prop[j] = national[j] * ratio;
      unif[j] = Math.max(row[j] + (national[j] - lastNational[j]), 0);
    }
    const ps = prop.reduce((a, b) => a + b, 0);
    const us = Math.max(unif.reduce((a, b) => a + b, 0), EPS);
    if (ps <= EPS) return unif.map(v => v / us);
    return prop.map((v, j) => weightProportional * (v / ps) + (1 - weightProportional) * (unif[j] / us));
  });
}

/**
 * D'Hondt among `lists`, with the last seat and the next list in line. Ties go to the list
 * with fewer votes, as the electoral law says (Lei n.º 14/79, art. 16.º, d)), then to the
 * earlier one in `lists`: the exporter's rule. With no list holding a vote, no seat is given.
 */
export function dhondt(votes: Record<string, number>, seats: number, lists: string[]): { won: Record<string, number>; lastSeat: LastSeat } {
  const q: Array<{ q: number; v: number; i: number; list: string; k: number }> = [];
  lists.forEach((list, i) => {
    const v = votes[list] ?? 0;
    if (!(v > 0)) return;
    for (let k = 1; k <= seats; k++) q.push({ q: v / k, v, i, list, k });
  });
  q.sort((a, b) => b.q - a.q || a.v - b.v || a.i - b.i);
  const won: Record<string, number> = {};
  for (const x of q.slice(0, seats)) won[x.list] = (won[x.list] ?? 0) + 1;
  const last = q[Math.min(seats, q.length) - 1];
  if (!last) return { won, lastSeat: { list: '', runnerUp: null } };
  const runner = q.slice(seats).find(x => x.list !== last.list);
  return {
    won,
    lastSeat: { list: last.list, runnerUp: runner ? { list: runner.list, votes: votesToPass(last, runner) } : null },
  };
}

/**
 * The fewest extra votes that give the next list the last seat, all else equal: a larger
 * quotient, or an equal one with fewer votes than the holder (the law's tie rule; with equal
 * votes too the law does not say, so it is not counted as a win). The tolerance absorbs blend
 * swing's rounding, so a whole-vote gap reads as in the exporter, which counts whole votes.
 */
function votesToPass(last: { q: number; v: number }, runner: { q: number; v: number; k: number }): number {
  const gap = (last.q - runner.q) * runner.k;
  const n = Math.round(gap);
  if (Math.abs(gap - n) < 1e-6) return runner.v + n < last.v ? n : n + 1;
  return Math.floor(gap) + 1;
}

/** Seats per circle and in total for a national vote of the movable lists and the other lists. */
export function runScenario(data: SimulatorData, nationalVotes: NationalVotes): ScenarioResult {
  const swing = swingLists(data);
  const competing = competingLists(data);
  const domestic = data.circles.filter(c => !c.fixed);
  const base = baseVotes(data);
  const baseTotal = swing.reduce((a, p) => a + base[p], 0);
  const lastNational = swing.map(p => base[p] / baseTotal);
  const lastDistrict = domestic.map(c => {
    const s = swing.reduce((a, p) => a + (c.votes[p] ?? 0), 0);
    return swing.map(p => (c.votes[p] ?? 0) / s);
  });
  // setShare and decodeShares keep the parties at half the vote or more, so this is never zero
  // from the sliders or a link; the floor here only keeps a direct caller from dividing by zero.
  const natTotal = Math.max(swing.reduce((a, p) => a + Math.max(0, nationalVotes[p] ?? 0), 0), EPS);
  const national = swing.map(p => Math.max(0, nationalVotes[p] ?? 0) / natTotal);
  const core = blendSwing(national, lastNational, lastDistrict);

  const totals: Record<string, number> = {};
  const add = (won: Record<string, number>) => {
    for (const [p, n] of Object.entries(won)) totals[p] = (totals[p] ?? 0) + n;
  };
  let d = 0;
  const circles = data.circles.map((c): CircleResult => {
    if (c.fixed) {
      add(c.seats2025);
      return { name: c.name, seats: c.seats, fixed: true, votes: { ...c.votes }, won: { ...c.seats2025 }, lastSeat: c.lastSeat };
    }
    const all = Object.values(c.votes).reduce((a, b) => a + b, 0);
    const fixedVotes = data.fixed.reduce((a, p) => a + (c.votes[p] ?? 0), 0);
    const rest = all - fixedVotes;
    const votes: Record<string, number> = {};
    swing.forEach((p, j) => { votes[p] = core[d][j] * rest; });
    for (const p of data.fixed) votes[p] = c.votes[p] ?? 0;
    d += 1;
    const { won, lastSeat } = dhondt(votes, c.seats, competing);
    add(won);
    return { name: c.name, seats: c.seats, fixed: false, votes, won, lastSeat };
  });
  return { circles, totals, national: Object.fromEntries(swing.map((p, j) => [p, national[j]])) };
}

/** The key for abstention, in the group moves: votes that come from, or go to, people who did not vote. */
export const ABSTENTION = 'ABS';

/** National shares of the movable lists and the other lists, summing to 1: the reader's scenario. */
export type Shares = Record<string, number>;

/** The most the other lists may hold: above it the parties would have no one to seat. */
export const OTHERS_MAX_SHARE = 0.5;
/** A party's slider runs from 0 to this; a share pushed above it by the others' moves is kept. */
export const PARTY_MAX_SHARE = 0.6;

/** A starting point's shares: 2025's domestic vote, or a past election's national shares. */
export function presetShares(data: SimulatorData, preset: string): Shares {
  const votes = presetVotes(data, preset);
  const swing = swingLists(data);
  const total = swing.reduce((a, p) => a + Math.max(0, votes[p] ?? 0), 0) || 1;
  return Object.fromEntries(swing.map(p => [p, Math.max(0, votes[p] ?? 0) / total]));
}

/**
 * Set one list's share and let every other list absorb the difference in proportion to its
 * own share (the usual swingometer rule: a party's gain is everyone else's loss, pro rata).
 * The value is clamped to the list's range. The other lists never pass OTHERS_MAX_SHARE: what
 * they would hold above it goes back to the parties, in proportion, so a scenario always has
 * parties to seat.
 */
export function setShare(data: SimulatorData, shares: Shares, list: string, value: number): Shares {
  const swing = swingLists(data);
  if (!swing.includes(list) || !Number.isFinite(value)) return shares;
  const cap = list === data.others ? OTHERS_MAX_SHARE : PARTY_MAX_SHARE;
  const v = Math.min(cap, Math.max(0, value));
  const rest = swing.filter(p => p !== list);
  const restNow = rest.reduce((a, p) => a + Math.max(0, shares[p] ?? 0), 0);
  const out: Shares = { [list]: v };
  for (const p of rest) out[p] = restNow > EPS ? (Math.max(0, shares[p] ?? 0) / restNow) * (1 - v) : (1 - v) / rest.length;
  const others = out[data.others] ?? 0;
  if (others > OTHERS_MAX_SHARE) {
    const parties = data.movable.reduce((a, p) => a + out[p], 0);
    out[data.others] = OTHERS_MAX_SHARE;
    for (const p of data.movable) {
      out[p] = parties > EPS ? (out[p] / parties) * (1 - OTHERS_MAX_SHARE) : (1 - OTHERS_MAX_SHARE) / data.movable.length;
    }
  }
  return out;
}

/** The votes a set of shares stands for, on 2025's domestic total (what runScenario takes). */
export function sharesToVotes(data: SimulatorData, shares: Shares): NationalVotes {
  const base = baseVotes(data);
  const total = Object.values(base).reduce((a, b) => a + b, 0);
  return Object.fromEntries(swingLists(data).map(p => [p, Math.max(0, shares[p] ?? 0) * total]));
}

/** Whether two sets of shares are the same to within a rounding of the address (0.001 points). */
export function sameShares(a: Shares, b: Shares): boolean {
  return Object.keys({ ...a, ...b }).every(p => Math.abs((a[p] ?? 0) - (b[p] ?? 0)) < 5e-6);
}

/**
 * The shares as an address fragment, `#s=AD.30.512~PS.26~…` (percent, three decimals: a
 * rounding of at most about 30 votes nationally, well inside the closest last seat), or ''
 * when they are 2025's.
 */
export function encodeShares(data: SimulatorData, shares: Shares): string {
  if (sameShares(shares, presetShares(data, '2025'))) return '';
  const items = swingLists(data).map(p => `${p}.${Number(((shares[p] ?? 0) * 100).toFixed(3))}`);
  return `#s=${items.join('~')}`;
}

/**
 * Read the shares back from a fragment, or null when it holds none. Lists it does not know are
 * dropped; a known list left out keeps its 2025 share; the result is rescaled to sum to 1 and
 * held to the same limits as the sliders.
 */
export function decodeShares(hash: string, data: SimulatorData): Shares | null {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get('s');
  if (value == null) return null;
  const swing = swingLists(data);
  const out: Shares = { ...presetShares(data, '2025') };
  let any = false;
  for (const item of value.split('~')) {
    // List keys are upper-case letters today (AD, CH, OUT); a key with a digit or a lower-case
    // letter would need this pattern widened, or its share is dropped.
    const m = /^([A-Z]+)\.(\d+(?:\.\d+)?)$/.exec(item);
    if (!m || !swing.includes(m[1])) continue;
    out[m[1]] = Math.min(100, Number(m[2])) / 100;
    any = true;
  }
  if (!any) return null;
  const total = swing.reduce((a, p) => a + out[p], 0);
  if (!(total > EPS)) return null;
  for (const p of swing) out[p] /= total;
  // Hold the other lists to their limit the way the slider does.
  return out[data.others] > OTHERS_MAX_SHARE ? setShare(data, out, data.others, OTHERS_MAX_SHARE) : out;
}

/** A fragment that holds a scenario (the shares' `s=` or the group moves' `g=`), as opposed to a plain anchor such as `#mover-votos`. */
export function isScenarioHash(hash: string): boolean {
  return /(?:^#?|&)[sg]=/.test(hash);
}

/**
 * The fragment the address should carry, given the scenario's own (`encodeShares`, or the
 * group moves'), or null to leave it alone. The scenario's own fragment while anything is
 * moved; with nothing moved, a plain anchor is kept as it is, and a scenario fragment gives way
 * to `anchor` (the section's id), so a reader who goes back to 2025 still has a link to it.
 */
export function nextHash(own: string, current: string, anchor?: string): string | null {
  if (own) return own === current ? null : own;
  if (!isScenarioHash(current)) return null;
  return anchor ? `#${anchor}` : '';
}
