import { POPULATION_RELEASE } from '@/lib/config/population';
import type { Locale } from './labels';

/**
 * The versioned link to one published response: /populacao/v/{release}/q/{id}
 * (the producer's canonical_path), with /en in front for an English reader.
 * The host rewrites it to the consultation page, which opens the card on its
 * parish page. Ids are written in lower case, as the contract defines them.
 */
export function responsePermalink(origin: string, locale: Locale, id: string, release = POPULATION_RELEASE): string {
  return `${origin}${locale === 'en' ? '/en' : ''}/populacao/v/${release}/q/${id.toLowerCase()}`;
}
