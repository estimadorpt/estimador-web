import { teamDisplayName } from '@/lib/config/football';
import { formatPercent, formatShortDate } from '@/lib/football-format';
import type { LigaProbabilityHistory } from '@/types/football';

/**
 * The table twin of the title-race and relegation charts: one row per club
 * (in the order given), one column per published forecast, newest first, so
 * on a phone the latest values sit beside the sticky club column and the
 * reader scrolls right into the past. The charts keep their own oldest-first
 * order; only the table is reversed. A club missing from a forecast's table
 * gets an empty cell, never a zero.
 */
export function probabilityHistoryTable(
  historical: LigaProbabilityHistory,
  teams: readonly string[],
  field: 'p_champion' | 'p_relegation',
  locale: string,
): { columns: string[]; rows: string[][] } {
  const pt = locale !== 'en';
  const newestFirst = [...historical].reverse();
  const columns = [
    pt ? 'Equipa' : 'Team',
    ...newestFirst.map(md => {
      const date = md.timestamp ? formatShortDate(md.timestamp, locale) : '';
      return `${pt ? 'J' : 'MD'}${md.matchday}${date ? ` · ${date}` : ''}`;
    }),
  ];
  const rows = teams.map(team => [
    teamDisplayName(team),
    ...newestFirst.map(md => {
      const row = md.table.find(x => x.team === team);
      return row ? formatPercent(row[field], locale) : '';
    }),
  ]);
  return { columns, rows };
}
