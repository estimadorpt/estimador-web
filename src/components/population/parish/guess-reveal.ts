/**
 * What a guess-first card says once the value is shown: the published share
 * as a sentence in the card's own unit ("Cerca de 39 em cada 100 pessoas…"),
 * and how close the reader's guess came, as a word with its band ("perto: a
 * 10 pontos ou menos"), never as a computed number of points: a difference
 * printed from a cell would be a new statistic (handoff §3, src/lib/population/
 * guess.ts), and the band still gives "longe" a reference (review, October
 * 2026). Every function takes the published value in points (0–100), read
 * from the card's display ("39,4%"), so "17,5%" rounds to 18 as a reader would
 * round it (0.175 × 100 is 17.4999…).
 */
import type { Locale } from '@/lib/population/labels';
import { GUESS_BANDS, guessVerdict } from '@/lib/population/guess';

export type GuessRecipe = 'elders_alone' | 'multigenerational';

/**
 * The published value in points (0–100), read from its display string
 * ("17,5%", "17.5%"); the share × 100 when the display has no number.
 */
export function publishedPoints(display: string, share: number): number {
  const match = /(\d+(?:[.,]\d+)?)\s*%/.exec(display);
  return match ? Number(match[1].replace(',', '.')) : share * 100;
}

/** The published value (in points) as a whole number of the 100, halves up. */
export function roundedOf100(points: number): number {
  return Math.min(100, Math.max(0, Math.floor(points + 0.5 + 1e-9)));
}

/**
 * "Cerca de 39 em cada 100 pessoas com 65 ou mais anos em agregados privados
 * em Arroios vivem sozinhas." A value that rounds to 0 but is not zero reads
 * "Menos de 1"; an exact zero reads "0", with no "cerca de".
 */
export function revealSentence(recipe: GuessRecipe, points: number, where: string, locale: Locale): string {
  const n = roundedOf100(points);
  const exact = points === 0 || points === 100;
  const under = n === 0 && points > 0;
  const one = n <= 1 && !(n === 0 && points === 0);
  if (locale === 'pt') {
    const lead = under ? 'Menos de 1' : exact ? `${n}` : `Cerca de ${n}`;
    return recipe === 'elders_alone'
      ? `${lead} em cada 100 pessoas com 65 ou mais anos em agregados privados ${where} ${one ? 'vive sozinha' : 'vivem sozinhas'}.`
      : `${lead} em cada 100 agregados privados ${where} ${one ? 'junta' : 'juntam'} uma criança e uma pessoa com 65 ou mais anos.`;
  }
  const lead = under ? 'Fewer than 1' : exact ? `${n}` : `About ${n}`;
  return recipe === 'elders_alone'
    ? `${lead} in every 100 people aged 65 or over in private households ${where} ${one ? 'lives' : 'live'} alone.`
    : `${lead} in every 100 private households ${where} ${one ? 'brings' : 'bring'} together a child and someone aged 65 or over.`;
}

/**
 * "O teu palpite, 50, ficou perto, acima do valor publicado: a 10 pontos ou
 * menos." The word and its band come from guessVerdict and GUESS_BANDS; the
 * direction only says on which side the guess fell.
 */
export function distanceSentence(guess: number, points: number, locale: Locale): string {
  const g = Math.round(guess);
  const verdict = guessVerdict(g, points / 100);
  const above = g > points;
  const { veryClose, close } = GUESS_BANDS;
  if (locale === 'pt') {
    const side = above ? 'acima' : 'abaixo';
    if (verdict === 'very_close') return `O teu palpite, ${g}, ficou muito perto do valor publicado: a ${veryClose} pontos ou menos.`;
    if (verdict === 'close') return `O teu palpite, ${g}, ficou perto, ${side} do valor publicado: a ${close} pontos ou menos.`;
    return `O teu palpite, ${g}, ficou longe, ${side} do valor publicado: a mais de ${close} pontos.`;
  }
  const side = above ? 'above' : 'below';
  if (verdict === 'very_close') return `Your guess, ${g}, was very close to the published value: within ${veryClose} points.`;
  if (verdict === 'close') return `Your guess, ${g}, was close, ${side} the published value: within ${close} points.`;
  return `Your guess, ${g}, was far off, ${side} the published value: more than ${close} points away.`;
}
