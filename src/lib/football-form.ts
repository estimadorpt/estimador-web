// Recent form for a club, from every published matchday file.
// Pure and server-safe; used by the match pages.

import type { FormEntry } from '@/components/charts/football/MatchTeamCompare';
import type { LigaHistorical, LigaPrediction } from '@/types/football';

export function formFor(
  team: string,
  historical: LigaHistorical,
  latest: LigaPrediction | null,
  limit = 5,
): FormEntry[] {
  const sources: LigaPrediction[] = [...(historical ?? [])];
  if (latest) sources.push(latest);

  // A result is keyed by its ordered pair (each pair is played once per
  // season), so a backfill that lands in a later md file, or the same file
  // read twice, counts once. It is ordered by the round it belongs to
  // (`r.matchday`), not by the file it was published in: md07 carries the
  // postponed md02 game and md02's late results.
  const byPair = new Map<string, FormEntry>();
  for (const md of sources) {
    if (!md) continue;
    for (const r of md.matchday_results ?? []) {
      if (r.home !== team && r.away !== team) continue;
      const isHome = r.home === team;
      const gf = isHome ? r.home_goals : r.away_goals;
      const ga = isHome ? r.away_goals : r.home_goals;
      if (typeof gf !== 'number' || typeof ga !== 'number') continue;
      byPair.set(`${r.home}|${r.away}`, {
        matchday: r.matchday ?? md.matchday,
        opponent: isHome ? r.away : r.home,
        venue: isHome ? 'H' : 'A',
        gf,
        ga,
        result: gf > ga ? 'W' : gf === ga ? 'D' : 'L',
      });
    }
  }
  const entries = [...byPair.values()].sort((a, b) => a.matchday - b.matchday);
  return entries.slice(-limit).reverse();
}

