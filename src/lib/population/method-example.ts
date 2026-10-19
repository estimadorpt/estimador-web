/**
 * The methodology's worked example: one invented parish, followed through the
 * five steps in the page's diagrams. The candidate households and the two
 * tables they must match are written by hand; the weights and the choice are
 * computed from them here, with the same kind of method the release uses (a
 * minimum-distortion reweighting, then whole households), so the drawings
 * show what the steps do rather than a picture of it. Nothing here comes from
 * the published population or from anyone real; never import release records
 * into this file.
 */
import { AGE_BANDS, ageBand } from '@/lib/miniatura/population';

export { AGE_BANDS, ageBand };

/** Household-size bins as INE's table groups them; the last is "5 or more". */
export const SIZE_LABELS = {
  pt: ['1 pessoa', '2 pessoas', '3 pessoas', '4 pessoas', '5 ou mais'],
  en: ['1 person', '2 people', '3 people', '4 people', '5 or more'],
} as const;

export function sizeBin(size: number): number {
  return Math.min(size, 5) - 1;
}

/** The invented parish's two tables, standing in for INE's: households by size, people by age group. */
export const TARGET: { readonly sizes: readonly number[]; readonly ages: readonly number[] } = {
  sizes: [3, 3, 2, 2, 0],
  ages: [4, 2, 9, 8],
};

export const TARGET_HOUSEHOLDS = TARGET.sizes.reduce((a, b) => a + b, 0);
export const TARGET_PEOPLE = TARGET.ages.reduce((a, b) => a + b, 0);

/** What the generator invented for the parish: 24 households, each its people's ages, oldest first. */
export const CANDIDATES: number[][] = [
  [34], [81], [72], [27],
  [70, 68], [31, 29], [77, 74], [45, 19],
  [38, 36, 4], [52, 49, 17], [79, 54, 50], [33, 30, 2],
  [44, 42, 12, 9], [40, 37, 7, 3], [48, 46, 20, 16], [66, 64, 38, 10],
  [39, 36, 11, 8, 5], [71, 45, 43, 15, 13], [35, 33, 6, 4, 1],
  [26], [36, 34, 1], [41, 39, 13, 10], [85], [58, 57],
];

/**
 * Each candidate's people's sex, in the same order as CANDIDATES: H homem, M
 * mulher (the release's own codes). Invented like the ages; no table of the
 * example counts it, so it only appears in the published rows of the drawings.
 */
export const CANDIDATE_SEX: Array<Array<'H' | 'M'>> = [
  ['M'], ['M'], ['H'], ['H'],
  ['M', 'H'], ['M', 'H'], ['H', 'M'], ['M', 'M'],
  ['M', 'H', 'H'], ['M', 'H', 'M'], ['M', 'M', 'H'], ['H', 'M', 'M'],
  ['M', 'H', 'H', 'M'], ['H', 'M', 'M', 'H'], ['M', 'H', 'M', 'H'], ['H', 'M', 'H', 'M'],
  ['M', 'H', 'M', 'H', 'M'], ['M', 'H', 'M', 'H', 'M'], ['H', 'M', 'M', 'H', 'H'],
  ['H'], ['M', 'H', 'M'], ['H', 'M', 'H', 'M'], ['M'], ['H', 'M'],
];

/** The candidate the drawings write token by token in step 1 (38, 36 and 4), so it can be followed to the end. */
export const WRITTEN = 8;

export type Counts = { sizes: number[]; ages: number[] };

/**
 * A candidate is ruled out when it would put anyone in a cell the parish's
 * tables publish as zero (here, households of five or more).
 */
export function isMasked(ages: number[]): boolean {
  if (TARGET.sizes[sizeBin(ages.length)] === 0) return true;
  return ages.some(age => TARGET.ages[ageBand(age)] === 0);
}

export const KEPT = CANDIDATES.map((ages, id) => ({ id, ages })).filter(c => !isMasked(c.ages));

/** The table counts of a set of households, each counted `weights[i]` times (once by default). */
export function countsOf(households: number[][], weights?: number[]): Counts {
  const sizes = TARGET.sizes.map(() => 0);
  const ages = TARGET.ages.map(() => 0);
  households.forEach((h, i) => {
    const w = weights ? weights[i] : 1;
    sizes[sizeBin(h.length)] += w;
    for (const age of h) ages[ageBand(age)] += w;
  });
  return { sizes, ages };
}

/** One household's contribution to every table cell, sizes then ages. */
function features(ages: number[]): number[] {
  const c = countsOf([ages]);
  return [...c.sizes, ...c.ages];
}

function solve(matrix: number[][], rhs: number[]): number[] {
  const n = rhs.length;
  const a = matrix.map((row, i) => [...row, rhs[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let r = 0; r < n; r++) {
      if (r === col || a[col][col] === 0) continue;
      const f = a[r][col] / a[col][col];
      for (let k = col; k <= n; k++) a[r][k] -= f * a[col][k];
    }
  }
  return a.map((row, i) => (row[i] === 0 ? 0 : row[n] / row[i]));
}

/**
 * The reweighting of step 2: every kept candidate starts with the same weight
 * (the parish's households shared out evenly), and the weights move as little
 * as possible, in the sense of relative entropy, until the weighted counts
 * equal both tables. Damped Newton steps on the convex dual.
 */
export function tiltWeights(): { before: number[]; after: number[] } {
  const prior = TARGET_HOUSEHOLDS / KEPT.length;
  const feats = KEPT.map(c => features(c.ages));
  const target = [...TARGET.sizes, ...TARGET.ages];
  const m = target.length;
  let lambda = new Array(m).fill(0);
  const weightsFor = (l: number[]) => feats.map(f => prior * Math.exp(f.reduce((s, v, k) => s + v * l[k], 0)));
  for (let iter = 0; ; iter++) {
    const w = weightsFor(lambda);
    const grad = target.map((t, k) => feats.reduce((s, f, i) => s + w[i] * f[k], 0) - t);
    if (Math.max(...grad.map(Math.abs)) < 1e-10) break;
    // An edit to TARGET or CANDIDATES that no positive weights can meet fails here, not as a drawing that misses its tables.
    if (iter >= 200) throw new Error('method example: the reweighting did not reach the tables');
    // The household totals repeat in both tables, so the Hessian is singular: a small ridge keeps the step defined.
    const hess = target.map((_, j) => target.map((__, k) => feats.reduce((s, f, i) => s + w[i] * f[j] * f[k], 0) + (j === k ? 1e-9 : 0)));
    const step = solve(hess, grad);
    lambda = lambda.map((l, k) => l - step[k]);
  }
  return { before: KEPT.map(() => prior), after: weightsFor(lambda) };
}

/** How far a set of counts sits from the tables: households off in the size table plus people off in the age table. */
export function distance(c: Counts): number {
  const off = (a: readonly number[], b: readonly number[]) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);
  return Math.round(off(c.sizes, TARGET.sizes) + off(c.ages, TARGET.ages));
}

/**
 * Step 3: whole households only, each either in or out; nobody is split. A
 * parish this small is solved exactly, as the release does under 500 people:
 * every set of ten is tried, the closest to the tables wins, and among equally
 * close sets the one the reweighting favoured most (the largest product of
 * weights).
 */
export function chooseWhole(weights: number[]): number[] {
  const n = KEPT.length;
  const feats = KEPT.map(c => countsOf([c.ages]));
  const logw = weights.map(Math.log);
  let best: { d: number; w: number; set: number[] } = { d: Infinity, w: -Infinity, set: [] };
  const set: number[] = [];
  const walk = (from: number) => {
    if (set.length === TARGET_HOUSEHOLDS) {
      const c = countsOf(set.map(i => KEPT[i].ages));
      const d = distance(c);
      const w = set.reduce((s, i) => s + logw[i], 0);
      if (d < best.d || (d === best.d && w > best.w + 1e-12)) best = { d, w, set: [...set] };
      return;
    }
    for (let i = from; i <= n - (TARGET_HOUSEHOLDS - set.length); i++) {
      // Once an exact set is known, a set that overfills a size bin cannot tie it: skip those branches.
      const bin = feats[i].sizes.findIndex(v => v > 0);
      if (set.filter(j => feats[j].sizes[bin] > 0).length >= TARGET.sizes[bin] && best.d === 0) continue;
      set.push(i);
      walk(i + 1);
      set.pop();
    }
  };
  walk(0);
  return best.set;
}

/**
 * The weights a share `t` of the way along the reweighting: the same tilt with
 * its multipliers scaled by t, w(t) = prior · exp(t · λᵀφ), so t = 0 is the
 * even start and t = 1 the solution. The animated drawing moves along it.
 */
export function weightsAt(before: number[], after: number[], t: number): number[] {
  return before.map((b, i) => b * Math.exp(t * Math.log(after[i] / b)));
}

/** Everything the diagrams draw, computed once. */
export function methodExample() {
  const { before, after } = tiltWeights();
  const chosen = chooseWhole(after);
  const kept = KEPT.map(c => c.ages);
  return {
    kept,
    before,
    after,
    chosen,
    countsBefore: countsOf(kept, before),
    countsAfter: countsOf(kept, after),
    countsChosen: countsOf(chosen.map(i => kept[i])),
  };
}

/**
 * The story's opening: the invented parish as its census saw it, 23 people in
 * 10 homes whose counts are TARGET. The story uses it to show what the tables
 * keep (the counts) and what they lose (who lives with whom), and at the end
 * to set the generated answer beside the one it stands in for. Ages and sexes
 * are written for the example, like everything else here.
 */
export const RESIDENTS: Array<{ age: number; sex: 'H' | 'M' }> = [
  { age: 84, sex: 'H' }, { age: 79, sex: 'M' }, { age: 58, sex: 'M' },
  { age: 77, sex: 'H' }, { age: 74, sex: 'M' }, { age: 72, sex: 'H' }, { age: 70, sex: 'M' }, { age: 30, sex: 'H' }, { age: 28, sex: 'M' },
  { age: 36, sex: 'M' }, { age: 34, sex: 'H' }, { age: 2, sex: 'M' }, { age: 68, sex: 'H' }, { age: 66, sex: 'M' }, { age: 19, sex: 'H' },
  { age: 45, sex: 'H' }, { age: 43, sex: 'M' }, { age: 12, sex: 'M' }, { age: 9, sex: 'H' },
  { age: 41, sex: 'M' }, { age: 39, sex: 'H' }, { age: 16, sex: 'M' }, { age: 6, sex: 'H' },
];

/** The ten homes' sizes, in the order the drawing places them: the same homes in every arrangement below. */
export const HOME_SIZES = [1, 2, 4, 1, 3, 2, 1, 4, 2, 3];

/**
 * Three ways the same 23 people can live in the same ten homes (indices into
 * RESIDENTS, one list per home in HOME_SIZES order). All three give exactly
 * the parish's two tables; they differ in how many people of 65 or over live
 * alone: 2 in the parish as it is, none and 3 in the other two.
 */
export const ARRANGEMENTS: Record<'real' | 'none' | 'three', number[][]> = {
  real: [[0], [3, 4], [15, 16, 17, 18], [1], [9, 10, 11], [5, 6], [2], [19, 20, 21, 22], [7, 8], [12, 13, 14]],
  none: [[7], [3, 4], [15, 16, 17, 18], [8], [9, 10, 11], [5, 6], [2], [19, 20, 21, 22], [0, 1], [12, 13, 14]],
  three: [[0], [3, 4], [15, 16, 17, 18], [1], [9, 10, 11], [5, 6], [13], [19, 20, 21, 22], [7, 8], [12, 2, 14]],
};

export const agesOf = (homes: number[][]): number[][] => homes.map(home => home.map(i => RESIDENTS[i].age));

/** People of 65 or over who live alone, in a set of households given by their ages: the question the story asks. */
export function eldersAlone(homes: number[][]): number {
  return homes.filter(ages => ages.length === 1 && ageBand(ages[0]) === 3).length;
}

/** What the two tables allow that answer to be: no more than the one-person households or the people of 65 or over. */
export const ELDERS_ALONE_RANGE = {
  lo: Math.max(0, TARGET.sizes[0] - (TARGET_PEOPLE - TARGET.ages[3])),
  hi: Math.min(TARGET.sizes[0], TARGET.ages[3]),
};

/**
 * The public sample as the story draws it: households from anywhere in the
 * country, with no parish. Invented like the rest, never the real sample's
 * records (INE's terms do not allow redistributing them).
 */
export const SAMPLE: number[][] = [
  [81], [34, 31, 5], [67, 65], [29], [52, 49, 17], [38, 36, 7, 4], [76], [44, 42, 15, 11, 8], [88, 61], [23, 22],
  [70, 69], [41, 13], [33], [58, 55, 26], [79, 77], [36, 35, 3], [64], [72, 70, 44], [27, 25, 1], [55, 53],
  [85], [40, 38, 12, 9], [47, 45, 20], [91], [31, 30], [62, 60, 33, 6], [74], [50, 18], [39, 37, 10, 8, 2], [68, 66],
];

/**
 * Step 4's collective quarters: the invented parish has a care home for which
 * INE counts five residents by sex and age. They join as partial records.
 */
export const CARE_HOME: Array<{ sex: 'H' | 'M'; age: number }> = [
  { sex: 'M', age: 93 }, { sex: 'M', age: 88 }, { sex: 'M', age: 86 }, { sex: 'H', age: 84 }, { sex: 'M', age: 79 },
];
