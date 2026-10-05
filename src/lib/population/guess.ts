/**
 * "Adivinha antes de ver": the reader guesses a share before the card shows
 * the published one.
 *
 * The comparison is the reader's own guess against one published cell, and it
 * comes back as a word, never as a number: printing "you were 4.3 points off"
 * would be a new statistic computed from a cell (handoff §3), and with a single
 * model run it would claim a precision the release does not have.
 */
import type { CompactResponse, PopulationRecipe, PortraitRecipe } from '@/types/population';
import { headlineCell } from './compact';
import { RECIPE_COPY, type Locale } from './labels';

/** The two cards that offer a guess: one people question, one homes question. */
export const GUESS_RECIPES: readonly PortraitRecipe[] = ['elders_alone', 'multigenerational'];

export type GuessVerdict = 'very_close' | 'close' | 'far';

/** Distances, in percentage points, below which a guess is "very close" or "close" (inclusive). */
export const GUESS_BANDS = { veryClose: 3, close: 10 } as const;

/** The slider's starting point: the middle, so it suggests no answer. */
export const GUESS_START = 50;

/** A slider value as a whole percentage between 0 and 100. */
export function clampGuess(value: number): number {
  if (!Number.isFinite(value)) return GUESS_START;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * How close a guess (0–100) is to a published share (0–1). The distance is
 * only used to pick a word; it is never shown.
 */
export function guessVerdict(guessPercent: number, publishedShare: number): GuessVerdict {
  const distance = Math.abs(clampGuess(guessPercent) - publishedShare * 100);
  // A hair of tolerance so 20% against a share of 0.17 is not "close" by float noise.
  if (distance <= GUESS_BANDS.veryClose + 1e-9) return 'very_close';
  if (distance <= GUESS_BANDS.close + 1e-9) return 'close';
  return 'far';
}

export const VERDICT_COPY: Record<GuessVerdict, Record<Locale, string>> = {
  very_close: { pt: 'Muito perto do valor publicado.', en: 'Very close to the published value.' },
  close: { pt: 'Perto do valor publicado.', en: 'Close to the published value.' },
  far: { pt: 'Longe do valor publicado.', en: 'Far from the published value.' },
};

/** "30%", the way the reader set it. */
export function formatGuess(guessPercent: number): string {
  return `${clampGuess(guessPercent)}%`;
}

/**
 * The published share a guess is measured against: the card's headline cell
 * (e.g. "vivem sozinhas"). Null — no guess offered — when the response was
 * refused, the recipe names no headline, or that cell is suppressed or absent.
 */
export function guessTarget(
  recipeName: PortraitRecipe,
  record: CompactResponse,
  recipe: PopulationRecipe,
): { share: number; display: string } | null {
  if (!GUESS_RECIPES.includes(recipeName)) return null;
  if (record.decision === 'refuse') return null;
  return headlineCell(record, recipe, RECIPE_COPY[recipeName].headline);
}
