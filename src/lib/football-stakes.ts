import { teamDisplayName, teamWithArticle } from '@/lib/config/football';
import { formatPercent } from '@/lib/football-format';
import type { NextMatchdayScenarioMatch } from '@/types/football';

/** Below this spread (5 pp) a game is "pouco em jogo". */
export const STAKE_MIN_SPREAD = 0.05;

export interface ClubStake {
  team: string;
  metric: 'p_champion' | 'p_relegation';
  /** The club's chance if it wins, draws or loses the game. */
  win: number;
  draw: number;
  lose: number;
  spread: number;
}

/**
 * What a game puts at stake, from the side of the club it moves most: the
 * title or relegation chance of one of the two clubs playing, if it wins,
 * draws or loses. A rival's chance is never the stake: the reader follows
 * the club on the pitch. Null when the game moves neither club's title or
 * relegation chance by STAKE_MIN_SPREAD.
 */
export function clubStake(match: NextMatchdayScenarioMatch | null | undefined): ClubStake | null {
  if (!match?.conditionals) return null;
  const outcome = (o: 'H' | 'D' | 'A') => match.conditionals[o]?.teams ?? {};
  let best: ClubStake | null = null;
  for (const [team, side] of [[match.home_team, 'home'], [match.away_team, 'away']] as const) {
    for (const metric of ['p_champion', 'p_relegation'] as const) {
      const h = outcome('H')[team]?.[metric];
      const d = outcome('D')[team]?.[metric];
      const a = outcome('A')[team]?.[metric];
      if (typeof h !== 'number' || typeof d !== 'number' || typeof a !== 'number') continue;
      const [win, lose] = side === 'home' ? [h, a] : [a, h];
      const spread = Math.max(h, d, a) - Math.min(h, d, a);
      if (!best || spread > best.spread) best = { team, metric, win, draw: d, lose, spread };
    }
  }
  return best && best.spread >= STAKE_MIN_SPREAD ? best : null;
}

/** "Título do Porto: 55% se ganhar, 43% se empatar, 39% se perder." */
export function stakeSentence(stake: ClubStake | null, locale: string): string {
  const pt = locale !== 'en';
  if (!stake) return pt ? 'Pouco em jogo: nenhum dos dois clubes muda 5 pontos percentuais no título ou na descida.' : 'Little at stake: neither club’s title or relegation chance moves by 5 percentage points.';
  const [w, d, l] = [stake.win, stake.draw, stake.lose].map(p => formatPercent(p, locale));
  if (pt) {
    const what = stake.metric === 'p_champion' ? 'Título' : 'Descida';
    return `${what} ${teamWithArticle(stake.team, 'de')}: ${w} se ganhar, ${d} se empatar, ${l} se perder.`;
  }
  const what = stake.metric === 'p_champion' ? 'title chance' : 'relegation chance';
  return `${teamDisplayName(stake.team)}’s ${what}: ${w} with a win, ${d} with a draw, ${l} with a defeat.`;
}
