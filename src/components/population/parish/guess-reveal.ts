/**
 * What a guess-first card says once the value is shown: the published share
 * as a sentence in the card's own unit ("Cerca de 39 em cada 100 pessoas…"),
 * and how far the reader's guess was from it, in whole points.
 *
 * Both work from the published value as printed on the card ("39,4%"),
 * rounded to a whole number of the 100, the figure the sentence states, so
 * the distance is the reader's own arithmetic on two numbers in front of them
 * (their guess and "cerca de 39"), not a new statistic about the parish:
 * nothing is computed from the cells beyond rounding the one published value.
 * Every function takes that value in points (0–100), not as a share, so
 * "17,5%" rounds to 18 as a reader would round it (0.175 × 100 is 17.4999…).
 */
import type { Locale } from '@/lib/population/labels';

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

/** The reader's guess minus the rounded published value, in whole points. */
export function guessDistance(guess: number, points: number): number {
  return Math.round(guess) - roundedOf100(points);
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

/** "O teu palpite, 50, ficou 11 pontos acima." */
export function distanceSentence(guess: number, points: number, locale: Locale): string {
  const g = Math.round(guess);
  const d = guessDistance(g, points);
  const size = Math.abs(d);
  if (locale === 'pt') {
    if (d === 0) return `O teu palpite, ${g}, é o valor publicado arredondado.`;
    return `O teu palpite, ${g}, ficou ${size} ${size === 1 ? 'ponto' : 'pontos'} ${d > 0 ? 'acima' : 'abaixo'}.`;
  }
  if (d === 0) return `Your guess, ${g}, is the published value rounded.`;
  return `Your guess, ${g}, was ${size} ${size === 1 ? 'point' : 'points'} too ${d > 0 ? 'high' : 'low'}.`;
}
