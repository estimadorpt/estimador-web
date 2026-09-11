// Pure, dependency-free calendar helpers for the economy dashboard's staleness
// guard. No React, no I/O — usable from server and client components alike.
//
// Design note: the site is a static export, so anything computed on the server
// is frozen at BUILD time. The staleness banner therefore re-computes these on
// the CLIENT after mount (see StalenessBanner) — a stale payload can never
// claim to be current just because the build was fresh.

/** Parse an ISO date or datetime string into a Date, or null if invalid. */
export function parseIso(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Business days (Mon–Fri) strictly after `from` up to and including `now`,
 * counted on calendar dates. Same-day → 0. Invalid input → null.
 */
export function businessDaysSince(fromIso?: string | null, now: Date = new Date()): number | null {
  const from = parseIso(fromIso);
  if (!from) return null;
  // Normalize both to local midnight so we count calendar days.
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (end <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count += 1;
  }
  return count;
}

export type QuarterPosition = 'M1' | 'M2' | 'M3' | 'ended' | 'upcoming';

export interface QuarterNow {
  /** Position of `now` relative to the given target quarter. */
  position: QuarterPosition;
  /** The quarter `now` actually falls in, e.g. '2026Q3'. */
  currentQuarter: string;
}

/** Parse 'YYYYQn' → { year, q } or null. */
export function parseQuarter(q?: string | null): { year: number; q: number } | null {
  const m = /^(\d{4})Q([1-4])$/.exec((q ?? '').trim());
  if (!m) return null;
  return { year: Number(m[1]), q: Number(m[2]) };
}

/** Quarter string for a date, e.g. '2026Q3'. */
export function quarterOf(d: Date): string {
  return `${d.getFullYear()}Q${Math.floor(d.getMonth() / 3) + 1}`;
}

/**
 * Where does `now` sit relative to a payload's target quarter?
 * - inside the quarter → M1/M2/M3 by month;
 * - after the quarter's last day → 'ended' (awaiting the INE flash);
 * - before it starts → 'upcoming'.
 * Derived from the CURRENT date, never from the payload — so a stale payload
 * can never claim "mid-quarter" after the quarter has ended.
 */
export function positionForDate(targetQuarter?: string | null, now: Date = new Date()): QuarterNow | null {
  const tq = parseQuarter(targetQuarter);
  if (!tq) return null;
  const currentQuarter = quarterOf(now);
  const startMonth = (tq.q - 1) * 3; // 0-based
  const start = new Date(tq.year, startMonth, 1);
  const endExclusive = new Date(tq.year, startMonth + 3, 1);
  if (now < start) return { position: 'upcoming', currentQuarter };
  if (now >= endExclusive) return { position: 'ended', currentQuarter };
  const monthInQuarter = now.getMonth() - startMonth; // 0, 1, 2
  const position = (['M1', 'M2', 'M3'] as const)[monthInQuarter];
  return { position, currentQuarter };
}
