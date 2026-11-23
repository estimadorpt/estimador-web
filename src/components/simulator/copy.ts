import { partyColors } from '@/lib/config/colors';
import { ABSTENTION } from '@/lib/simulator/engine';

/**
 * The seat simulator's words in both languages, and the lists' short names and swatches.
 * Kept beside the components (not in messages/*.json) like the other election charts'
 * inline copy, so the client component needs no client message keys.
 */

export type Locale = 'pt' | 'en';

const SHORT: Record<string, { pt: string; en: string }> = {
  AD: { pt: 'AD', en: 'AD' },
  PS: { pt: 'PS', en: 'PS' },
  CH: { pt: 'Chega', en: 'Chega' },
  IL: { pt: 'IL', en: 'IL' },
  L: { pt: 'Livre', en: 'Livre' },
  CDU: { pt: 'CDU', en: 'CDU' },
  BE: { pt: 'BE', en: 'BE' },
  PAN: { pt: 'PAN', en: 'PAN' },
  JPP: { pt: 'JPP', en: 'JPP' },
  OUT: { pt: 'Outras listas', en: 'Other lists' },
  BLANK_NULL: { pt: 'Brancos e nulos', en: 'Blank and spoilt' },
  [ABSTENTION]: { pt: 'Abstenção', en: 'Abstention' },
};

/** A list's short name: "Chega", "Livre", "Outras listas", "Abstenção". */
export function listName(list: string, locale: Locale): string {
  return SHORT[list]?.[locale] ?? list;
}

/** A list's swatch colour (data colour, never text). JPP and the other lists are grey. */
export function listColor(list: string): string {
  return (partyColors as Record<string, string>)[list] ?? '#8a8a8a';
}

/** Feminine lists in Portuguese ("a AD", "a IL", "a CDU"); the rest take "o". */
const FEMININE = new Set(['AD', 'IL', 'CDU']);

/** "o PS", "a AD": a list with its article, for Portuguese sentences. */
export function withArticle(list: string): string {
  return `${FEMININE.has(list) ? 'a' : 'o'} ${listName(list, 'pt')}`;
}

/** "ao PS", "à AD": a list after "a" (to take from, to give to). */
export function toList(list: string): string {
  return `${FEMININE.has(list) ? 'à' : 'ao'} ${listName(list, 'pt')}`;
}

/** "no PS", "na AD", "nas outras listas": where a vote goes, for "votaram …" / "passam a votar …". */
export function inList(list: string): string {
  if (list === 'OUT') return 'nas outras listas';
  return `${FEMININE.has(list) ? 'na' : 'no'} ${listName(list, 'pt')}`;
}
