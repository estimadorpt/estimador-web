/**
 * The methodology drawings' plain rules, kept out of the components so tests
 * can read them: the step anchors the overview links to, and the tier rule
 * the grid draws, derived from the release's own thresholds.
 */

/** The ids of the "### 1." to "### 5." headings, the same in both locales. */
export const STEP_IDS = ['passo-1', 'passo-2', 'passo-3', 'passo-4', 'passo-5'] as const;

export type TierLimits = { max_person_srmse_median: number; max_worst_srmse: number; min_population: number };
export type TierThresholds = { A: TierLimits; B: TierLimits };

/** A parish's tier from its residents and typical error, the worst table set aside (the grid says so in words). */
export function tierFor(residents: number, typicalError: number, t: TierThresholds): 'A' | 'B' | 'C' {
  if (residents >= t.A.min_population && typicalError <= t.A.max_person_srmse_median) return 'A';
  if (residents >= t.B.min_population && typicalError <= t.B.max_person_srmse_median) return 'B';
  return 'C';
}

/**
 * The grid: three residents columns (under B's floor, B's floor to A's, A's
 * floor and up) by three error rows (up to A's limit, up to B's, above B's),
 * each cell the tier of a parish inside it.
 */
export function tierGrid(t: TierThresholds): Array<Array<'A' | 'B' | 'C'>> {
  const residents = [t.B.min_population - 1, t.B.min_population, t.A.min_population];
  // The third row stands for any error above B's limit: the limit plus a millionth is the first such value.
  const errors = [t.A.max_person_srmse_median, t.B.max_person_srmse_median, t.B.max_person_srmse_median + 1e-6];
  return errors.map(e => residents.map(r => tierFor(r, e, t)));
}
