/**
 * A parish page's <title> and meta description (SPV-01, SEO3-04), the one
 * implementation the page ships. 6,184 parish URLs are in the sitemap, and a
 * third of the names are unions of two to five parishes, so the full name
 * cannot always fit: the title is the page's question with the "União das
 * freguesias de" prefix dropped and the one site suffix (no section tag, no
 * second separator), and the description names the full union while it fits,
 * then the short name, and adds the INE count only while it stays within 155
 * characters. A name that still does not fit is cut before a whole word, never
 * after "de" or "e", and a parenthesis it cuts into is closed (S-08). The
 * Portuguese preposition agrees with the name ("na União das freguesias do
 * Vade", "no Vade", "em Aguada de Cima"). The h1 keeps the full name.
 */
import { formatCount } from '@/lib/population/format';
import type { Locale } from '@/lib/population/labels';
import { siteTitle } from '@/lib/site-title';

/** The longest bare title (before " | estimador.pt") and description a parish page gets. */
export const TITLE_MAX = 70;
export const DESCRIPTION_MAX = 155;

// "União das freguesias de X, Y e Z" (759 of the 3,092 names) and its
// variants: "União de freguesias de", "… do/da/das/dos".
const UNION_PREFIX = /^União (?:das|de) freguesias (de|da|do|das|dos) /i;
const ARTICLE = { de: '', do: 'o', da: 'a', dos: 'os', das: 'as' } as const;

/** "União das freguesias de Milhazes, Vilar de Figos e Faria" → "Milhazes, Vilar de Figos e Faria". */
export function shortParishName(name: string): string {
  return name.replace(UNION_PREFIX, '').trim() || name;
}

/**
 * The preposition and the name a sentence puts after "Quem vive" or
 * "agregados": a union's full name is feminine ("na União das freguesias do
 * Vade"); with the prefix dropped, the article it ended on still agrees ("no
 * Vade", "na Ribeira do Neiva", "em Milhazes, Vilar de Figos e Faria"); any
 * other name takes "em", as the h1 does (parishQuestion). English: "in".
 */
export function placePhrase(name: string, locale: Locale, { short }: { short: boolean }): { lead: string; place: string } {
  const match = UNION_PREFIX.exec(name);
  const place = short ? shortParishName(name) : name;
  if (locale !== 'pt') return { lead: 'in', place };
  if (!match) return { lead: 'em', place };
  if (!short) return { lead: 'na', place };
  const article = ARTICLE[match[1].toLowerCase() as keyof typeof ARTICLE];
  return { lead: article ? `n${article}` : 'em', place };
}

/**
 * Words a cut name must not end on: "São Brás dos…", "Vilar de…" and
 * "Varziela e…" read as broken. Parish names are Portuguese in both locales;
 * "and" and "of" cover an English frame.
 */
const TRAILING_FUNCTION_WORDS = ['e', 'de', 'da', 'do', 'das', 'dos', 'and', 'of'] as const;
const TRAILING_FUNCTION_WORD = new RegExp(`(?:^|\\s)(?:${TRAILING_FUNCTION_WORDS.join('|')})$`, 'i');
const TRAILING_PUNCTUATION = /[\s,;:(·–-]+$/;

/** Where the first "(" that no later ")" closes sits, or -1. */
function unclosedParenthesis(text: string): number {
  const open: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') open.push(i);
    else if (text[i] === ')') open.pop();
  }
  return open.length > 0 ? open[0] : -1;
}

/** Steps a cut back until it ends on a whole word: no trailing punctuation or function word. */
function tidyEnd(text: string): string {
  let cut = text;
  for (;;) {
    const before = cut;
    cut = cut.replace(TRAILING_PUNCTUATION, '').replace(TRAILING_FUNCTION_WORD, '');
    if (cut === before) return cut;
  }
}

/**
 * Cuts at a word boundary and closes with "…", so the text is at most `max`
 * characters. The cut never ends on a function word ("de", "e"). A cut inside
 * a parenthesis keeps what fits of it and closes it, so the place stays told
 * apart from its município ("Sintra (Santa Maria e São Miguel, São Martinho…)",
 * not "Sintra…", which reads as the município); only when nothing of the
 * parenthesis fits does it go whole.
 */
function fit(text: string, max: number): string {
  if (text.length <= max) return text;
  const wordCut = (room: number) => {
    const cut = text.slice(0, room);
    const space = cut.lastIndexOf(' ');
    // A first word too long to keep whole is cut inside it, as before.
    return tidyEnd(space > max * 0.6 ? cut.slice(0, space) : cut);
  };
  const inside = wordCut(max - 2);
  const open = unclosedParenthesis(inside);
  if (open >= 0 && inside.length > open + 1) return `${inside}…)`;
  let tidy = wordCut(max - 1);
  const stillOpen = unclosedParenthesis(tidy);
  if (stillOpen >= 0) tidy = tidyEnd(tidy.slice(0, stillOpen));
  return `${tidy || text.slice(0, max - 1).replace(TRAILING_PUNCTUATION, '')}…`;
}

/** "Quem vive no Vade? | estimador.pt": the page's question and the one site suffix. */
export function parishTitle(name: string, locale: Locale): string {
  const { lead, place } = placePhrase(name, locale, { short: true });
  const ask = (text: string) => (locale === 'pt' ? `Quem vive ${lead} ${text}?` : `Who lives ${lead} ${text}?`);
  const question = ask(place);
  if (question.length <= TITLE_MAX) return siteTitle(question);
  const room = TITLE_MAX - (question.length - place.length);
  return siteTitle(ask(fit(place, room)));
}

export function parishDescription({ name, municipalityName, censusPopulation, municipalityFigures, locale }: {
  name: string;
  municipalityName: string;
  censusPopulation: number;
  municipalityFigures: boolean;
  locale: Locale;
}): string {
  const pt = locale === 'pt';
  const build = ({ lead, place }: { lead: string; place: string }) => (pt
    ? `Idades, trabalho, escolaridade e agregados ${lead} ${place} (${municipalityName}): população sintética dos Censos 2021.`
    : `Ages, work, education and households ${lead} ${place} (${municipalityName}): a synthetic population from the 2021 Census.`);
  // The município note first: it changes what the numbers are; the INE count is a courtesy.
  const extras = [
    municipalityFigures ? (pt ? ' Valores do concelho.' : ' Municipality figures.') : '',
    pt ? ` ${formatCount(censusPopulation, locale)} residentes (INE).` : ` ${formatCount(censusPopulation, locale)} residents (INE).`,
  ];
  let text = build(placePhrase(name, locale, { short: false }));
  if (text.length > DESCRIPTION_MAX) {
    const short = placePhrase(name, locale, { short: true });
    text = build(short);
    if (text.length > DESCRIPTION_MAX) {
      text = build({ lead: short.lead, place: fit(short.place, short.place.length - (text.length - DESCRIPTION_MAX)) });
    }
  }
  for (const extra of extras) {
    if (extra && text.length + extra.length <= DESCRIPTION_MAX) text += extra;
  }
  return text;
}
