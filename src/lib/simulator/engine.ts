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
  // applyTransfers keeps the parties above PARTY_FLOOR_POINTS, so this is never zero from the
  // form or a link; the floor here only keeps a direct caller from dividing by zero.
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

/** The key for abstention in a transfer: votes that come from, or go to, people who did not vote. */
export const ABSTENTION = 'ABS';

export interface Transfer {
  from: string;
  to: string;
  /** Points of 2025's domestic vote for lists (a fixed base, so transfers add up). */
  points: number;
}

/**
 * The eight parties together always keep at least this many points: below it a scenario has
 * no one to give seats to (every vote sent to abstention or the other lists).
 */
export const PARTY_FLOOR_POINTS = 1;

/**
 * Apply transfers in order. A point is 1% of 2025's domestic vote for the movable lists and
 * the other lists. Abstention is a bottomless source and sink. A transfer larger than what the
 * donor has left moves only what it has, and a move out of the parties stops at
 * PARTY_FLOOR_POINTS for the parties together; the amounts actually moved are returned.
 */
export function applyTransfers(data: SimulatorData, start: NationalVotes, transfers: Transfer[]): { votes: NationalVotes; moved: number[] } {
  const base = baseVotes(data);
  const unit = Object.values(base).reduce((a, b) => a + b, 0) / 100;
  const votes: NationalVotes = { ...start };
  const parties = new Set(data.movable);
  const partyVotes = () => data.movable.reduce((a, p) => a + Math.max(0, votes[p] ?? 0), 0);
  const moved = transfers.map(t => {
    if (t.from === t.to || !(t.points > 0)) return 0;
    const want = t.points * unit;
    let have = t.from === ABSTENTION ? Infinity : Math.max(0, votes[t.from] ?? 0);
    if (parties.has(t.from) && !parties.has(t.to)) have = Math.min(have, Math.max(0, partyVotes() - PARTY_FLOOR_POINTS * unit));
    const amount = Math.min(want, have);
    if (t.from !== ABSTENTION) votes[t.from] = (votes[t.from] ?? 0) - amount;
    if (t.to !== ABSTENTION) votes[t.to] = (votes[t.to] ?? 0) + amount;
    return amount / unit;
  });
  return { votes, moved };
}

/** The largest single move the form and a link accept, in points. */
export const MAX_TRANSFER_POINTS = 30;
/** The most moves a scenario keeps. */
export const MAX_TRANSFERS = 20;

export interface Scenario {
  /** The starting point: '2025', or a past election's national vote on 2025 geography. */
  preset: string;
  transfers: Transfer[];
}

/** The scenario as an address fragment: `#p=2024&t=PS.L.3~ABS.CH.1.5`. */
export function encodeScenario(s: Scenario): string {
  const parts: string[] = [];
  if (s.preset !== '2025') parts.push(`p=${s.preset}`);
  const t = s.transfers.filter(x => x.points > 0).map(x => `${x.from}.${x.to}.${Number(x.points.toFixed(2))}`);
  if (t.length) parts.push(`t=${t.join('~')}`);
  return parts.length ? `#${parts.join('&')}` : '';
}

/** Read a fragment back; anything it does not recognise is dropped, never guessed. */
export function decodeScenario(hash: string, data: SimulatorData): Scenario {
  const known = new Set([...swingLists(data), ABSTENTION]);
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const p = params.get('p');
  const preset = p && data.presets[p] ? p : '2025';
  const transfers: Transfer[] = [];
  for (const item of (params.get('t') ?? '').split('~')) {
    // List keys are upper-case letters today (AD, CH, OUT, ABS); a key with a digit or a
    // lower-case letter would need this pattern widened, or its moves are dropped.
    const m = /^([A-Z]+)\.([A-Z]+)\.(\d+(?:\.\d+)?)$/.exec(item);
    if (!m) continue;
    const [, from, to, pts] = m;
    const points = Math.min(MAX_TRANSFER_POINTS, Number(pts));
    if (known.has(from) && known.has(to) && from !== to && points > 0) transfers.push({ from, to, points });
  }
  return { preset, transfers: transfers.slice(0, MAX_TRANSFERS) };
}

/** A fragment that holds a scenario (`p=`, `t=` or the group moves' `g=`), as opposed to a plain anchor such as `#mover-votos`. */
export function isScenarioHash(hash: string): boolean {
  return /(?:^#?|&)[ptg]=/.test(hash);
}

/**
 * The fragment the address should carry, given the scenario's own (`encodeScenario`, or the
 * group moves'), or null to leave it alone. The scenario's own fragment while anything is
 * moved; with nothing moved, a plain anchor is kept as it is, and a scenario fragment gives way
 * to `anchor` (the section's id), so a reader who goes back to 2025 still has a link to it.
 */
export function nextHash(own: string, current: string, anchor?: string): string | null {
  if (own) return own === current ? null : own;
  if (!isScenarioHash(current)) return null;
  return anchor ? `#${anchor}` : '';
}
