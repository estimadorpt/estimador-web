import { teamDisplayName, teamWithArticle } from '@/lib/config/football';

/**
 * The finding as words people repeat: a title share stated as a share of the
 * simulated seasons ("em metade das épocas simuladas"), never as an adjective.
 * Tenths, with "pouco mais/menos de" when the share sits 2 points or more
 * from the tenth it is named after; the extremes have their own words.
 */
const PT_TENTHS = ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const EN_TENTHS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

export function seasonShareWords(p: number, locale: string): string {
  const pt = locale !== 'en';
  if (p >= 0.995) return pt ? 'em quase todas as épocas simuladas' : 'in almost every simulated season';
  if (p >= 0.95) return pt ? 'em mais de nove de cada dez épocas simuladas' : 'in more than nine in ten simulated seasons';
  if (p < 0.05) return pt ? 'em menos de uma de cada vinte épocas simuladas' : 'in fewer than one in twenty simulated seasons';
  const k = Math.min(9, Math.max(1, Math.round(p * 10)));
  const diff = p - k / 10;
  const qualifier = Math.abs(diff) < 0.02 ? '' : diff > 0 ? (pt ? 'pouco mais de ' : 'just over ') : (pt ? 'pouco menos de ' : 'just under ');
  if (k === 5) return pt ? `em ${qualifier}metade das épocas simuladas` : `in ${qualifier}half of the simulated seasons`;
  return pt
    ? `em ${qualifier}${PT_TENTHS[k]} de cada dez épocas simuladas`
    : `in ${qualifier}${EN_TENTHS[k]} in ten simulated seasons`;
}

/** "O Porto ganha a Liga em metade das épocas simuladas." without the full stop. */
export function titleFinding(team: string, pChampion: number, locale: string): string {
  if (locale === 'en') return `${teamDisplayName(team)} win the league ${seasonShareWords(pChampion, locale)}`;
  const name = teamWithArticle(team);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ganha a Liga ${seasonShareWords(pChampion, locale)}`;
}

/**
 * The exact count of simulated seasons a club wins the title in: the
 * scenarios file's own count when it publishes one (victory_paths n_target),
 * else the share times the simulations, rounded.
 */
export function titleSeasons(team: string, pChampion: number, nSims: number, victoryPaths?: Record<string, { target?: string; n_target?: number; n_sims?: number }> | null): number {
  const path = victoryPaths?.[team];
  if (path && path.target === 'champion' && typeof path.n_target === 'number' && path.n_sims === nSims) return path.n_target;
  return Math.round(pChampion * nSims);
}
