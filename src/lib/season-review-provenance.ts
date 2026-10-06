// Which of an archived season's forecasts were published at the time and
// which were generated afterwards in one batch (audit F-H3).
//
// The 2025-26 archive holds 19 forecast files. md23–md31 carry staggered
// timestamps from March to April 2026, each written after its matchday; md04–
// md22 were all written within one minute on 4 March 2026 and were never
// published at the time. The review page must not call those "published as
// they stood": it splits the two, read from the files' own timestamps, so a
// future archive is classified the same way without a hand-kept list.

export interface ForecastStamp {
  matchday: number;
  /** ISO timestamp the file was generated at. */
  timestamp: string | null;
  model?: string | null;
}

export interface ForecastProvenance {
  /** Matchdays whose forecast was generated on its own, at the time. */
  published: number[];
  /** Matchdays generated together, in one batch, after the fact. */
  reconstructed: number[];
  /** Calendar date (UTC, YYYY-MM-DD) of the batch; null without one. */
  reconstructedOn: string | null;
  /** Distinct `model` values across the files, in matchday order. */
  models: string[];
}

/**
 * A file belongs to a batch when at least `minBatch` files (itself included)
 * were generated within `windowMinutes` of one another. Real matchday
 * publications are days apart; a backfill writes them seconds apart.
 */
export function forecastProvenance(
  stamps: readonly ForecastStamp[],
  { windowMinutes = 10, minBatch = 3 }: { windowMinutes?: number; minBatch?: number } = {},
): ForecastProvenance {
  const sorted = [...stamps].sort((a, b) => a.matchday - b.matchday);
  const times = sorted.map((s) => (s.timestamp ? Date.parse(s.timestamp) : NaN));
  const windowMs = windowMinutes * 60_000;
  const reconstructed: number[] = [];
  const published: number[] = [];
  let batchStart: number | null = null;

  sorted.forEach((s, i) => {
    const t = times[i];
    const neighbours = Number.isFinite(t)
      ? times.filter((u) => Number.isFinite(u) && Math.abs(u - t) <= windowMs).length
      : 0;
    if (neighbours >= minBatch) {
      reconstructed.push(s.matchday);
      if (batchStart === null || t < batchStart) batchStart = t;
    } else {
      published.push(s.matchday);
    }
  });

  const models: string[] = [];
  for (const s of sorted) if (s.model && !models.includes(s.model)) models.push(s.model);

  return {
    published,
    reconstructed,
    reconstructedOn: batchStart === null ? null : new Date(batchStart).toISOString().slice(0, 10),
    models,
  };
}
