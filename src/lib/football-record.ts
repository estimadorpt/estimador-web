/**
 * "O que dissemos e o que aconteceu": the season's games whose 1X2 was
 * published before kickoff (loadPlayedFixtures keeps the probabilities only
 * then), counted against the model's own range. Each count is a sum of
 * independent events with the published probabilities, so its distribution
 * is Poisson-binomial; the range is its 5th to 95th percentile (90%).
 */

export interface RecordGame {
  p_home: number | null;
  p_draw: number | null;
  p_away: number | null;
  played: { home_goals: number; away_goals: number } | null;
}

export interface RecordRow {
  key: string;
  label: string;
  /** Games counted. */
  games: number;
  /** Expected count: the sum of the probabilities. */
  expected: number;
  q05: number;
  q50: number;
  q95: number;
  /** What happened. */
  happened: number;
}

export interface SeasonRecord {
  games: number;
  outcomes: RecordRow[];
  favourites: RecordRow[];
}

/** The distribution of a count of independent events with probabilities ps. */
export function poissonBinomial(ps: number[]): number[] {
  let dist = [1];
  for (const p of ps) {
    const next = new Array(dist.length + 1).fill(0);
    dist.forEach((v, k) => {
      next[k] += v * (1 - p);
      next[k + 1] += v * p;
    });
    dist = next;
  }
  return dist;
}

/** The smallest count whose cumulative probability reaches f. */
export function quantile(dist: number[], f: number): number {
  let cumulative = 0;
  for (let k = 0; k < dist.length; k++) {
    cumulative += dist[k];
    if (cumulative >= f - 1e-12) return k;
  }
  return dist.length - 1;
}

function row(key: string, label: string, ps: number[], happened: number): RecordRow {
  const dist = poissonBinomial(ps);
  return {
    key,
    label,
    games: ps.length,
    expected: ps.reduce((a, b) => a + b, 0),
    q05: quantile(dist, 0.05),
    q50: quantile(dist, 0.5),
    q95: quantile(dist, 0.95),
    happened,
  };
}

const LABELS = {
  pt: {
    home: 'Vitórias da casa', draw: 'Empates', away: 'Vitórias de fora',
    bands: ['Favorito com 70% ou mais', 'Favorito com 55% a 70%', 'Favorito com 40% a 55%', 'Favorito com menos de 40%'],
  },
  en: {
    home: 'Home wins', draw: 'Draws', away: 'Away wins',
    bands: ['Favourite at 70% or more', 'Favourite at 55% to 70%', 'Favourite at 40% to 55%', 'Favourite under 40%'],
  },
} as const;

const BANDS: Array<(p: number) => boolean> = [
  p => p >= 0.7,
  p => p >= 0.55 && p < 0.7,
  p => p >= 0.4 && p < 0.55,
  p => p < 0.4,
];

export function seasonRecord(fixtures: RecordGame[], locale: string): SeasonRecord {
  const L = LABELS[locale === 'en' ? 'en' : 'pt'];
  const games = fixtures
    .filter(f => f.played && f.p_home != null && f.p_draw != null && f.p_away != null)
    .map(f => {
      const p = [f.p_home as number, f.p_draw as number, f.p_away as number];
      const { home_goals: h, away_goals: a } = f.played!;
      const outcome = h > a ? 0 : h === a ? 1 : 2;
      const favourite = p.indexOf(Math.max(...p));
      return { p, outcome, favourite, favP: p[favourite] };
    });
  const outcomes = (['home', 'draw', 'away'] as const).map((key, i) =>
    row(key, L[key], games.map(g => g.p[i]), games.filter(g => g.outcome === i).length));
  const favourites = BANDS.map((test, i) => {
    const inBand = games.filter(g => test(g.favP));
    return row(`fav${i}`, L.bands[i], inBand.map(g => g.favP), inBand.filter(g => g.outcome === g.favourite).length);
  }).filter(r => r.games > 0);
  return { games: games.length, outcomes, favourites };
}
