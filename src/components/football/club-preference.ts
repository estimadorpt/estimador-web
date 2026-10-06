// Remembering a visitor's chosen club across visits (diagnosis §4/§12,
// "Club continuity"): a small, progressive localStorage preference that a
// shared `?club=` link always overrides, so a recipient sees the intended
// scenario rather than the sender's own stored pick.

export const CLUB_PREFERENCE_KEY = 'estimador.club';

/**
 * Pure precedence rule: an explicit `?club=` query value wins when it names
 * a real club; otherwise a stored preference is used, also only when valid;
 * otherwise there is no initial selection and the general outlook shows.
 */
export function resolveInitialClub(
  querySlug: string | null | undefined,
  storedSlug: string | null | undefined,
  validSlugs: readonly string[],
): string | null {
  if (querySlug && validSlugs.includes(querySlug)) return querySlug;
  if (storedSlug && validSlugs.includes(storedSlug)) return storedSlug;
  return null;
}

/** Reads the stored preference. Never throws (private browsing, blocked
 * storage, SSR) — absence is a normal outcome, not an error. */
export function readStoredClub(): string | null {
  try {
    return window.localStorage.getItem(CLUB_PREFERENCE_KEY);
  } catch {
    return null;
  }
}

/** Writes or clears the stored preference (pass null to clear/"forget"). */
export function writeStoredClub(slug: string | null): void {
  try {
    if (slug) window.localStorage.setItem(CLUB_PREFERENCE_KEY, slug);
    else window.localStorage.removeItem(CLUB_PREFERENCE_KEY);
  } catch {
    // Storage unavailable: the selection still works for this visit, it
    // just won't be remembered on the next one.
  }
}
