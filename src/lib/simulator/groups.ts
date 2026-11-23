/**
 * "Mover votos por grupos": move a share of a group of 2025 voters (or abstainers) to another
 * list or to abstention, and see the seats.
 *
 * The group file (`simulator-groups.json`, written by estimador-elections
 * `src/simulator_groups_export.py` from the survey thread's `group_rates.py`) holds, for each of
 * the 20 domestic circles, how many resident citizens of each group (sex × 7 age bands × 3
 * education levels, Censos 2021) voted for each list, blank or null, or abstained in 2025. The
 * gaps between groups come from the Estudo Eleitoral Português 2024; the levels from each
 * circle's official result, which the cells add up to.
 *
 * A move takes a share of the matching cells' `from` votes in every circle and gives them to
 * `to`. The scenario's votes are the official 2025 votes plus those changes, so with no move
 * the parliament is 2025's seat for seat. No swing model is involved: a group's votes move
 * where that group lives and voted that way. The two emigration circles stay as in 2025.
 */

import { ABSTENTION, dhondt, competingLists, swingLists, type CircleResult, type ScenarioResult, type SimulatorData } from './engine';

export interface GroupData {
  version: number;
  election: string;
  generated: string;
  sources: string[];
  sex: string[];
  age: string[];
  edu: string[];
  /** The lists, then BLANK_NULL and ABS. */
  options: string[];
  /** One row per group (sex, then age, then education), one count per option. */
  circles: Array<{ name: string; cells: number[][] }>;
}

export const BLANK_NULL = 'BLANK_NULL';

/** Who a move applies to. Ages are bands of the file or the two wider bands readers ask for. */
export const SEX_CHOICES = ['all', 'men', 'women'] as const;
export const AGE_CHOICES = ['all', '18-24', '25-34', '18-34', '35-44', '45-54', '55-64', '65-74', '75+', '65+'] as const;
export const EDU_CHOICES = ['all', 'basic', 'secondary', 'tertiary'] as const;
export type SexChoice = (typeof SEX_CHOICES)[number];
export type AgeChoice = (typeof AGE_CHOICES)[number];
export type EduChoice = (typeof EDU_CHOICES)[number];

export interface GroupMove {
  sex: SexChoice;
  age: AgeChoice;
  edu: EduChoice;
  /** A list, BLANK_NULL or ABS. */
  from: string;
  to: string;
  /** Percent of the group's `from` votes, 0 to 100. */
  share: number;
}

export const MAX_GROUP_MOVES = 20;

const WIDE_AGES: Record<string, string[]> = { '18-34': ['18-24', '25-34'], '65+': ['65-74', '75+'] };

/** Whether a row of the file (by its sex, age and education) belongs to the move's group. */
function rowMatcher(groups: GroupData, m: Pick<GroupMove, 'sex' | 'age' | 'edu'>): boolean[] {
  const ages = m.age === 'all' ? null : WIDE_AGES[m.age] ?? [m.age];
  const out: boolean[] = [];
  for (const s of groups.sex) for (const a of groups.age) for (const e of groups.edu) {
    out.push((m.sex === 'all' || m.sex === s) && (ages == null || ages.includes(a)) && (m.edu === 'all' || m.edu === e));
  }
  return out;
}

/**
 * Apply the moves in order to every domestic circle's cells. Returns, per circle, the change in
 * each option's votes, and the votes each move actually moved (all circles together).
 */
export function applyGroupMoves(groups: GroupData, moves: GroupMove[]): { deltas: Array<Record<string, number>>; moved: number[] } {
  const cells = groups.circles.map(c => c.cells.map(row => [...row]));
  const idx = (o: string) => groups.options.indexOf(o);
  const moved = moves.map(m => {
    const f = idx(m.from);
    const t = idx(m.to);
    if (f < 0 || t < 0 || f === t || !(m.share > 0)) return 0;
    const share = Math.min(100, m.share) / 100;
    const match = rowMatcher(groups, m);
    let total = 0;
    for (const circle of cells) {
      circle.forEach((row, r) => {
        if (!match[r]) return;
        const amount = row[f] * share;
        row[f] -= amount;
        row[t] += amount;
        total += amount;
      });
    }
    return total;
  });
  const deltas = groups.circles.map((c, i) => {
    const d: Record<string, number> = {};
    groups.options.forEach((o, j) => {
      d[o] = cells[i].reduce((a, row) => a + row[j], 0) - c.cells.reduce((a, row) => a + row[j], 0);
    });
    return d;
  });
  return { deltas, moved };
}

/** How many people of the group voted `from` in 2025 (all domestic circles), before any move. */
export function groupSize(groups: GroupData, m: Pick<GroupMove, 'sex' | 'age' | 'edu' | 'from'>): number {
  const f = groups.options.indexOf(m.from);
  if (f < 0) return 0;
  const match = rowMatcher(groups, m);
  return groups.circles.reduce((a, c) => a + c.cells.reduce((b, row, r) => b + (match[r] ? row[f] : 0), 0), 0);
}

/** Seats per circle and in total after the group moves (the result shape of runScenario). */
export function runGroupScenario(data: SimulatorData, groups: GroupData, moves: GroupMove[]): ScenarioResult & { moved: number[] } {
  const { deltas, moved } = applyGroupMoves(groups, moves);
  const byName = new Map(groups.circles.map((c, i) => [c.name, deltas[i]]));
  const competing = competingLists(data);
  const swing = swingLists(data);
  const totals: Record<string, number> = {};
  const national: Record<string, number> = Object.fromEntries(swing.map(p => [p, 0]));
  const circles = data.circles.map((c): CircleResult => {
    const delta = c.fixed ? undefined : byName.get(c.name);
    if (!delta) {
      if (!c.fixed) throw new Error(`no group cells for ${c.name}`);
      for (const [p, n] of Object.entries(c.seats2025)) totals[p] = (totals[p] ?? 0) + n;
      return { name: c.name, seats: c.seats, fixed: true, votes: { ...c.votes }, won: { ...c.seats2025 }, lastSeat: c.lastSeat };
    }
    const votes: Record<string, number> = {};
    for (const p of Object.keys(c.votes)) votes[p] = Math.max(0, c.votes[p] + (delta[p] ?? 0));
    for (const p of swing) national[p] += votes[p] ?? 0;
    const { won, lastSeat } = dhondt(votes, c.seats, competing);
    for (const [p, n] of Object.entries(won)) totals[p] = (totals[p] ?? 0) + n;
    return { name: c.name, seats: c.seats, fixed: false, votes, won, lastSeat };
  });
  const sum = Object.values(national).reduce((a, b) => a + b, 0) || 1;
  for (const p of swing) national[p] /= sum;
  return { circles, totals, national, moved };
}

const SEX_CODE: Record<SexChoice, string> = { all: 'x', men: 'h', women: 'm' };
const EDU_CODE: Record<EduChoice, string> = { all: 'x', basic: 'b', secondary: 's', tertiary: 't' };
const AGE_CODE: Record<AgeChoice, string> = {
  all: 'x', '18-24': '18', '25-34': '25', '18-34': '18a34', '35-44': '35', '45-54': '45', '55-64': '55', '65-74': '65', '75+': '75', '65+': '65m',
};
const invert = <K extends string>(m: Record<K, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<string, K>;
const SEX_FROM = invert(SEX_CODE);
const EDU_FROM = invert(EDU_CODE);
const AGE_FROM = invert(AGE_CODE);
/** Short keys in the address for blank and null, which the list keys never use. */
const OPTION_CODE: Record<string, string> = { [BLANK_NULL]: 'BN' };
const OPTION_FROM: Record<string, string> = { BN: BLANK_NULL };

/** The moves as an address parameter: `g=x.18a34.x.ABS.CH.25~x.x.t.AD.IL.20`. */
export function encodeGroupMoves(moves: GroupMove[]): string {
  return moves
    .filter(m => m.share > 0)
    .map(m => [SEX_CODE[m.sex], AGE_CODE[m.age], EDU_CODE[m.edu], OPTION_CODE[m.from] ?? m.from, OPTION_CODE[m.to] ?? m.to, Number(m.share.toFixed(1))].join('.'))
    .join('~');
}

/** Read the parameter back; anything it does not recognise is dropped, never guessed. */
export function decodeGroupMoves(value: string, options: string[]): GroupMove[] {
  const known = new Set([...options, ABSTENTION]);
  const out: GroupMove[] = [];
  for (const item of value.split('~')) {
    const m = /^([a-z]+)\.([0-9a-z]+)\.([a-z]+)\.([A-Z_]+)\.([A-Z_]+)\.(\d+(?:\.\d+)?)$/.exec(item);
    if (!m) continue;
    const [, s, a, e, f, t, pct] = m;
    const sex = SEX_FROM[s];
    const age = AGE_FROM[a];
    const edu = EDU_FROM[e];
    const from = OPTION_FROM[f] ?? f;
    const to = OPTION_FROM[t] ?? t;
    const share = Math.min(100, Number(pct));
    if (sex && age && edu && known.has(from) && known.has(to) && from !== to && share > 0) out.push({ sex, age, edu, from, to, share });
  }
  return out.slice(0, MAX_GROUP_MOVES);
}
