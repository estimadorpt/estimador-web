/**
 * A parish page's <title> and meta description (SPV-01). 6,184 parish URLs
 * are in the sitemap, and a third of the names are unions of two to five
 * parishes, so the full name cannot always fit: the title drops the "União das
 * freguesias de" prefix and the section tag when long, and the description
 * adds the INE count only while it stays within 155 characters. A name that
 * still does not fit is cut before a whole word, never after "de" or "e" and
 * never inside an open "(" (S-08). The h1 keeps the full name.
 */
import { formatCount } from '@/lib/population/format';
import type { Locale } from '@/lib/population/labels';
import { siteTitle } from '@/lib/site-title';

/** The longest bare title (before " | estimador.pt") and description a parish page gets. */
export const TITLE_MAX = 70;
export const DESCRIPTION_MAX = 155;

const UNION_PREFIX = /^União (?:das|de) freguesias (?:de|da|do|das|dos) /i;

/** "União das freguesias de Milhazes, Vilar de Figos e Faria" → "Milhazes, Vilar de Figos e Faria". */
export function shortParishName(name: string): string {
  return name.replace(UNION_PREFIX, '').trim() || name;
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

/**
 * Steps a cut back until it ends cleanly: no trailing punctuation, no
 * function word, no "(" left open (the parenthesis goes whole).
 */
function tidyCut(text: string): string {
  let cut = text;
  for (;;) {
    const before = cut;
    cut = cut.replace(TRAILING_PUNCTUATION, '').replace(TRAILING_FUNCTION_WORD, '');
    const open = unclosedParenthesis(cut);
    if (open >= 0) cut = cut.slice(0, open);
    if (cut === before) return cut;
  }
}

/**
 * Cuts at a word boundary and closes with "…", so the text is at most `max`
 * characters. The cut never ends on a function word ("de", "e") or inside an
 * unclosed "(": it steps back a word at a time, and out of the parenthesis,
 * until it does not ("Sintra (Santa Maria e São Miguel, São Martinho e São…"
 * becomes "Sintra…").
 */
function fit(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  // A first word too long to keep whole is cut inside it, as before.
  const tidy = tidyCut(space > max * 0.6 ? cut.slice(0, space) : cut);
  return `${tidy || cut.replace(TRAILING_PUNCTUATION, '')}…`;
}

export function parishTitle(name: string, locale: Locale): string {
  const short = shortParishName(name);
  const tag = locale === 'pt' ? ' · População sintética' : ' · Synthetic population';
  const question = locale === 'pt' ? `Quem vive em ${short}?` : `Who lives in ${short}?`;
  if (question.length + tag.length <= 60) return siteTitle(`${question}${tag}`);
  if (question.length <= TITLE_MAX) return siteTitle(question);
  const room = TITLE_MAX - (question.length - short.length);
  const fitted = fit(short, room);
  return siteTitle(locale === 'pt' ? `Quem vive em ${fitted}?` : `Who lives in ${fitted}?`);
}

export function parishDescription({ name, municipalityName, censusPopulation, municipalityFigures, locale }: {
  name: string;
  municipalityName: string;
  censusPopulation: number;
  municipalityFigures: boolean;
  locale: Locale;
}): string {
  const pt = locale === 'pt';
  const build = (place: string) => (pt
    ? `Idades, trabalho, escolaridade e agregados em ${place} (${municipalityName}): população sintética dos Censos 2021.`
    : `Ages, work, education and households in ${place} (${municipalityName}): a synthetic population from the 2021 Census.`);
  // The município note first: it changes what the numbers are; the INE count is a courtesy.
  const extras = [
    municipalityFigures ? (pt ? ' Valores do concelho.' : ' Municipality figures.') : '',
    pt ? ` ${formatCount(censusPopulation, locale)} residentes (INE).` : ` ${formatCount(censusPopulation, locale)} residents (INE).`,
  ];
  let text = build(name);
  if (text.length > DESCRIPTION_MAX) text = build(shortParishName(name));
  if (text.length > DESCRIPTION_MAX) {
    const short = shortParishName(name);
    text = build(fit(short, short.length - (text.length - DESCRIPTION_MAX)));
  }
  for (const extra of extras) {
    if (extra && text.length + extra.length <= DESCRIPTION_MAX) text += extra;
  }
  return text;
}
