import { Link } from '@/i18n/routing';
import { ligaTeamSlugs, teamColorOnPaper, teamDisplayName } from '@/lib/config/football';
import { describePp, formatPercent, formatPp } from '@/lib/football-format';
import type { TeamDelta } from '@/types/football';

/** Same dated probability summary at the entrance and on the league page. */
export function TitleProbabilities({ teams, deltas, locale, compact = false }: {
  teams: Array<{ team: string; p_champion: number }>;
  deltas?: Record<string, TeamDelta>;
  locale: string;
  compact?: boolean;
}) {
  const pt = locale === 'pt';
  return <ul className={`football-probabilities ${compact ? 'football-probabilities--compact' : ''}`}>
    {teams.slice(0, 3).map(team => {
      const delta = deltas?.[team.team]?.p_champion_delta;
      const slug = ligaTeamSlugs[team.team];
      const value = formatPercent(team.p_champion, locale);
      const [number, unit] = value.endsWith('%') ? [value.slice(0, -1), '%'] : [value, ''];
      return <li key={team.team}>
        <span className="football-team-label"><i aria-hidden="true" style={{ backgroundColor: teamColorOnPaper(team.team) }} />{teamDisplayName(team.team)}</span>
        <span className="football-probability">{number}<span>{unit}</span></span>
        {delta != null && Math.abs(delta) >= 1 && (
          <span className="football-change">
            <span aria-hidden="true">{formatPp(delta / 100, locale)}</span>
            <span className="sr-only">{describePp(delta / 100, locale, pt ? 'face à previsão anterior' : 'since the previous forecast')}</span>
          </span>
        )}
        {!compact && slug && <Link href={`/desporto/liga/${slug}`} locale={locale} className="football-team-link">{pt ? `Explorar ${teamDisplayName(team.team)}` : `Explore ${teamDisplayName(team.team)}`} <span aria-hidden="true">→</span></Link>}
      </li>;
    })}
  </ul>;
}
