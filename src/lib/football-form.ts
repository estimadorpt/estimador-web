// Recent form for a club, from every published matchday file.
// Pure and server-safe; used by the match pages.

import type { FormEntry } from '@/components/charts/football/MatchTeamCompare';
import type { GameFixturesData } from '@/lib/football-fixtures';
import { ligaTeamSlugs } from '@/lib/config/football';
import type { LigaHistorical, LigaPrediction } from '@/types/football';

/** The join key for a pairing (each is played once per season), by team
 * slug, so "Sporting CP" in one file and "Sporting" in another still meet. */
function pairKey(home: string, away: string): string {
  return `${ligaTeamSlugs[home] ?? home}|${ligaTeamSlugs[away] ?? away}`;
}

/** Every fixture's kickoff (UTC ms), by pairing, from game_fixtures.json. */
export function kickoffsByPair(manifest: GameFixturesData | null | undefined): Map<string, number> {
  const out = new Map<string, number>();
  for (const md of manifest?.matchdays ?? []) {
    for (const fx of md.fixtures ?? []) {
      const ms = fx.kickoff ? Date.parse(fx.kickoff) : NaN;
      if (!Number.isNaN(ms)) out.set(pairKey(fx.home, fx.away), ms);
    }
  }
  return out;
}

/**
 * A club's last `limit` results, most recent first, by the date they were
 * played (audit FA3-01): Moreirense–Benfica (jornada 3) was played on 9
 * September, after Marítimo–Benfica (jornada 5, 5 September), and ordering
 * by round put it out of place; from 19 October, sorting by round would also
 * drop the postponed Braga–Gil Vicente (jornada 2) from the last five. The
 * kickoff comes from the game manifest; a result without one falls back to
 * its round, after every dated result of an earlier round.
 */
export function formFor(
  team: string,
  historical: LigaHistorical,
  latest: LigaPrediction | null,
  limit = 5,
  kickoffs: Map<string, number> = new Map(),
): FormEntry[] {
  const sources: LigaPrediction[] = [...(historical ?? [])];
  if (latest) sources.push(latest);

  // A result is keyed by its ordered pair (each pair is played once per
  // season), so a backfill that lands in a later md file, or the same file
  // read twice, counts once. Its round is the one it belongs to
  // (`r.matchday`), not the file it was published in: md07 carries the
  // postponed md02 game and md02's late results.
  const byPair = new Map<string, { entry: FormEntry; playedAt: number | null }>();
  for (const md of sources) {
    if (!md) continue;
    for (const r of md.matchday_results ?? []) {
      if (r.home !== team && r.away !== team) continue;
      const isHome = r.home === team;
      const gf = isHome ? r.home_goals : r.away_goals;
      const ga = isHome ? r.away_goals : r.home_goals;
      if (typeof gf !== 'number' || typeof ga !== 'number') continue;
      byPair.set(`${r.home}|${r.away}`, {
        entry: {
          matchday: r.matchday ?? md.matchday,
          opponent: isHome ? r.away : r.home,
          venue: isHome ? 'H' : 'A',
          gf,
          ga,
          result: gf > ga ? 'W' : gf === ga ? 'D' : 'L',
        },
        playedAt: kickoffs.get(pairKey(r.home, r.away)) ?? null,
      });
    }
  }
  const entries = [...byPair.values()].sort((a, b) => {
    if (a.playedAt != null && b.playedAt != null) return a.playedAt - b.playedAt;
    return a.entry.matchday - b.entry.matchday || (a.playedAt ?? 0) - (b.playedAt ?? 0);
  });
  return entries.slice(-limit).reverse().map(e => e.entry);
}
