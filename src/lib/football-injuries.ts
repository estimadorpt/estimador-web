// Which published absences are fit to show next to a forecast.
//
// injuries.json is refreshed by its own collector, on its own schedule, so it
// can fall behind the forecasts it is shown with: in October 2026 the match
// pages listed an August list as current squad news, and "Sem baixas
// registadas" read as "full squad available". The rule here:
//
//  - the feed says `stale: true`, or has no snapshot date, or its snapshot is
//    more than INJURY_MAX_AGE_DAYS older than the forecast → show nothing
//    except the fact that there is no recent list;
//  - otherwise drop every entry whose expected return is already past (before
//    the later of the snapshot and the forecast date), and recompute each
//    club's share of squad value from what is left.
//
// Pure and server-safe; the pages and the player profile share it.

import type {
  InjuriesData,
  InjuryPlayer,
  InjuryTeam,
} from '@/components/charts/football/InjuriesPanel';
import { daysBetween } from '@/lib/football-format';

export const INJURY_MAX_AGE_DAYS = 7;

export type AbsencesStatus = 'current' | 'stale' | 'missing';

export interface CurrentAbsences {
  status: AbsencesStatus;
  /** The feed's snapshot date (YYYY-MM-DD), when it has one. */
  snapshotDate: string | null;
  /** Empty unless status is 'current'. */
  players: InjuryPlayer[];
  teams: InjuryTeam[];
}

const dateOnly = (iso: string) => iso.slice(0, 10);

export function currentAbsences(
  injuries: InjuriesData | null | undefined,
  predictionTimestamp: string | null | undefined,
): CurrentAbsences {
  if (!injuries) return { status: 'missing', snapshotDate: null, players: [], teams: [] };

  const snapshotDate = injuries.snapshot_date ?? null;
  const none = (status: AbsencesStatus): CurrentAbsences => ({
    status,
    snapshotDate,
    players: [],
    teams: [],
  });

  if (injuries.stale === true || !snapshotDate) return none('stale');
  if (predictionTimestamp) {
    const age = daysBetween(snapshotDate, predictionTimestamp);
    if (age === null || age > INJURY_MAX_AGE_DAYS) return none('stale');
  }

  // Expected returns are calendar dates; compare them as dates.
  const forecastDay = predictionTimestamp ? dateOnly(predictionTimestamp) : '';
  const cutoff = forecastDay > snapshotDate ? forecastDay : snapshotDate;
  const players = (injuries.players ?? []).filter(
    p => !p.expected_return || dateOnly(p.expected_return) >= cutoff,
  );

  const teams = (injuries.teams ?? [])
    .map(team => {
      const out = players.filter(p => p.team === team.team);
      const valueOut = out.reduce((sum, p) => sum + (p.market_value_eur ?? 0), 0);
      return {
        ...team,
        n_out: out.length,
        value_out_eur: valueOut,
        share_of_squad:
          team.squad_value_eur && team.squad_value_eur > 0 ? valueOut / team.squad_value_eur : null,
      };
    })
    .filter(team => team.n_out > 0);

  return { status: 'current', snapshotDate, players, teams };
}
