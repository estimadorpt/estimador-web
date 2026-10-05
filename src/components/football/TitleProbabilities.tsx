import { Link } from '@/i18n/routing';
import { ligaTeamColors, ligaTeamSlugs, teamDisplayName } from '@/lib/config/football';
import type { TeamDelta } from '@/types/football';

/** Same dated probability summary at the entrance and on the league page. */
export function TitleProbabilities({ teams, deltas, locale, compact = false }: {
  teams: Array<{ team: string; p_champion: number }>;
  deltas?: Record<string, TeamDelta>;
  locale: string;
  compact?: boolean;
}) {
  const pt = locale === 'pt';
  const format = new Intl.NumberFormat(pt ? 'pt-PT' : 'en-GB', { maximumFractionDigits: 1, signDisplay: 'always' });
  return <ul className={`football-probabilities ${compact ? 'football-probabilities--compact' : ''}`}>
    {teams.slice(0, 3).map(team => {
      const delta = deltas?.[team.team]?.p_champion_delta;
      const slug = ligaTeamSlugs[team.team];
      return <li key={team.team}>
        <span className="football-team-label"><i aria-hidden="true" style={{ backgroundColor: ligaTeamColors[team.team] ?? '#5f7062' }} />{teamDisplayName(team.team)}</span>
        <span className="football-probability">{Math.round(team.p_champion * 100)}<span>%</span></span>
        {delta != null && Math.abs(delta) >= 1 && <span className="football-change">{format.format(delta)} pp <span className="sr-only">{pt ? 'face à previsão anterior' : 'versus the previous forecast'}</span></span>}
        {!compact && slug && <Link href={`/desporto/liga/${slug}`} locale={locale} className="football-team-link">{pt ? 'Explorar equipa' : 'Explore team'} <span aria-hidden="true">↗</span></Link>}
      </li>;
    })}
  </ul>;
}
