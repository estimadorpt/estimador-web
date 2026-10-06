import status from './economy-status.json';
import { economyPaused } from '@/lib/utils/economy-time';

/**
 * The one editorial switch for the economy section.
 *
 * `published: false` (src/lib/config/economy-status.json) means the section is
 * in preparation: /economia stays online as an explainer with no numbers, is
 * noindexed and left out of the sitemap, has no share card of its own, and is
 * labelled "em preparação" in the header, footer, homepage and /sobre. Setting
 * it to `true` is the launch: indexing, the sitemap entry, the share card and
 * the plain nav label come back together. Fresh data alone never does that.
 * It is a JSON file so scripts/generate-og-images.mjs reads the same value,
 * and a plain import so the client-side Header can read it too.
 *
 * Not to be confused with `sections.ts` `isActive`, which marks archives.
 */
export const ECONOMY_PUBLISHED: boolean = status.published === true;

/**
 * What the economy surfaces may show:
 * - `preparing`: the flag is off. No numbers, no date, no promise of a return.
 * - `paused`: the flag is on but the last run is older than the staleness
 *   guard in economy-time.ts allows. No numbers; the last reading's date.
 * - `live`: the flag is on and the data is current.
 */
export type EconomyState = 'preparing' | 'paused' | 'live';

export function economyState(
  asOf: string | null | undefined,
  published: boolean = ECONOMY_PUBLISHED,
  now: Date = new Date(),
): EconomyState {
  if (!published) return 'preparing';
  return economyPaused(asOf ?? null, now) ? 'paused' : 'live';
}
