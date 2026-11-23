/**
 * The circles' names in the reader's language. The data names them in Portuguese; in English
 * the Azores and the two emigration circles take their English names (as `regionLabel` does
 * for the Azores), and the mainland districts keep theirs.
 */
type Locale = 'pt' | 'en';

const EN: Record<string, string> = {
  Açores: 'Azores',
  Europa: 'Europe',
  'Fora da Europa': 'Outside Europe',
};

/** Shorter names where the seat map has no room for the whole one. */
const SHORT: Record<string, string> = {
  'Viana do Castelo': 'Viana',
  'Castelo Branco': 'C. Branco',
};

/** A circle's name: "Lisboa", "Azores" in English. */
export function circleName(name: string, locale: Locale): string {
  return locale === 'en' ? EN[name] ?? name : name;
}

/** A circle's label on the seat map: its name, shortened where it would not fit. */
export function circleLabel(name: string, locale: Locale): string {
  return SHORT[name] ?? circleName(name, locale);
}
