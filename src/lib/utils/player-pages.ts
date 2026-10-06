import { formatLongDate } from '@/lib/football-format';

// The player pages, /jogadores and the methodology say how far the player
// data goes. The player model is refitted less often than the forecast, so a
// page in October can show numbers that stop in May; every metric that comes
// from that fit carries its cut-off next to it (audit F-H6, FR-01).

const PT_MONTHS = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "16 mai. 2026" / "16 May 2026" from a bare ISO date; null when unreadable. */
export function formatShortDate(iso: string | null | undefined, locale: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return null;
  const month = Number(m[2]) - 1;
  if (month < 0 || month > 11) return null;
  const day = Number(m[3]);
  return locale === 'en'
    ? `${day} ${EN_MONTHS[month]} ${m[1]}`
    : `${day} ${PT_MONTHS[month]} ${m[1]}`;
}

/** The last season a player fit covers, from its season list. */
function lastSeason(seasons: readonly string[] | null | undefined): string | null {
  return seasons && seasons.length ? seasons[seasons.length - 1] : null;
}

/**
 * "Dados até 16 mai. 2026 (fim da época 2025-26)" — the label that sits next
 * to every number from the player fit. Null without a cut-off date.
 */
export function playerDataCutoffLabel(
  through: string | null | undefined,
  seasons: readonly string[] | null | undefined,
  locale: string,
): string | null {
  const date = formatShortDate(through, locale);
  if (!date) return null;
  const season = lastSeason(seasons);
  if (locale === 'en') return `Data to ${date}${season ? ` (end of the ${season} season)` : ''}`;
  return `Dados até ${date}${season ? ` (fim da época ${season})` : ''}`;
}

/**
 * The full sentence for the methodology and the player pages: the date, the
 * season it closes, and that the current season is not in the fit yet.
 */
export function playerDataCutoffSentence(
  through: string | null | undefined,
  seasons: readonly string[] | null | undefined,
  locale: string,
): string | null {
  const date = through ? formatLongDate(through, locale) : '';
  if (!date) return null;
  const season = lastSeason(seasons);
  const next = season ? nextSeason(season) : null;
  if (locale === 'en') {
    return `The finishing and contribution data runs to ${date}${season ? `, the end of the ${season} season` : ''}. Those models have not been refitted with ${next ? `${next} matches` : 'this season’s matches'} yet, so minutes, goals and recent appearances stop there; contested possession, goalkeepers and defenders use the seasons their own files list.`;
  }
  // Only finishing and contribution stop there; duels, goalkeepers and
  // defenders already include the season in course (audit MR2-05).
  return `Os dados de finalização e de contribuição vão até ${date}${season ? `, o fim da época ${season}` : ''}. Esses modelos ainda não foram reajustados com os jogos de ${next ?? 'esta época'}, por isso minutos, golos e últimas partidas param aí; a posse disputada, os guarda-redes e as defesas usam as épocas que os seus ficheiros indicam.`;
}

/** "2025-26" → "2026-27". */
export function nextSeason(season: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(season);
  if (!m) return null;
  const start = Number(m[1]) + 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

export interface AppearanceLike {
  season: string;
  matchday: number;
  date: string | null;
}

/**
 * Appearances newest first, across seasons. The feed lists each season's
 * matches newest first but the seasons themselves in no fixed order, so a
 * player with one minute last August read as if that were his latest game
 * (audit FR-01, Tiago Gouveia). Dated rows sort by date; undated ones by
 * season, then matchday.
 */
export function sortAppearancesNewestFirst<T extends AppearanceLike>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.season !== b.season) return a.season < b.season ? 1 : -1;
    return b.matchday - a.matchday;
  });
}
