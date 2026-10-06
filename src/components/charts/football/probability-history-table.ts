import { teamDisplayName } from '@/lib/config/football';
import { formatPercent, formatShortDate } from '@/lib/football-format';
import type { LigaProbabilityHistory } from '@/types/football';

type Publication = Pick<LigaProbabilityHistory[number], 'matchday' | 'timestamp' | 'model'>;

/**
 * The matchdays whose forecast came from a model other than the newest one
 * (the 2026-27 pre-season point, md00, was `joint_sot`; every later one is
 * `bivcross`). Part of the first move on each line is the change of model,
 * so the charts mark those points (audit VFA-M4). A history without model
 * names marks nothing.
 */
export function previousModelMatchdays(history: readonly Publication[]): number[] {
  const latest = history[history.length - 1]?.model;
  if (!latest) return [];
  return history.filter(md => md.model && md.model !== latest).map(md => md.matchday);
}

/**
 * One publication's label, the same in the table twin and in the tip:
 * "J7 · 25 set.", and "J0 · 10 ago. · modelo anterior" for a point the
 * previous model published (audit FA2-03, FA3-05, VFA-M4).
 */
export function publicationLabel(md: Publication, locale: string, previousModel = false): string {
  const pt = locale !== 'en';
  const date = md.timestamp ? formatShortDate(md.timestamp, locale) : '';
  return [
    `${pt ? 'J' : 'MD'}${md.matchday}`,
    date,
    previousModel ? (pt ? 'modelo anterior' : 'previous model') : '',
  ].filter(Boolean).join(' · ');
}

/**
 * The tip of a trend chart, on three short lines so it fits a 286px plot on
 * a 360px phone (audit UXM3-01: one line ran 171px off the card and cut the
 * club and the date, the only place the date is drawn): the club, the
 * publication, the figure.
 */
export function trendTipTitle(
  team: string,
  md: Publication,
  value: number,
  locale: string,
  previousModel = false,
): string {
  const pt = locale !== 'en';
  const date = md.timestamp ? formatShortDate(md.timestamp, locale) : '';
  const when = [
    `${pt ? 'J' : 'MD'}${md.matchday}`,
    date ? `${pt ? 'previsão de' : 'forecast of'} ${date}` : '',
    previousModel ? (pt ? 'modelo anterior' : 'previous model') : '',
  ].filter(Boolean).join(' · ');
  return `${team}\n${when}\n${formatPercent(value, locale)}`;
}

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
  const previous = new Set(previousModelMatchdays(historical));
  const newestFirst = [...historical].reverse();
  const columns = [
    pt ? 'Equipa' : 'Team',
    ...newestFirst.map(md => publicationLabel(md, locale, previous.has(md.matchday))),
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
