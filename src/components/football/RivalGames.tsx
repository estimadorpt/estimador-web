import { Link } from '@/i18n/routing';
import { teamDisplayName, teamWithArticle } from '@/lib/config/football';
import { formatKickoffShort, formatPercent, matchLabel } from '@/lib/football-format';
import { kickoffSteps, matchPlayedLine, matchStartedLine } from '@/lib/football-status';
import type { ClubFrame, RivalGame } from '@/lib/football-scenarios';
import { ClockSwitch } from './ClockSwitch';

export interface RivalGameRow extends RivalGame {
  kickoff?: string | null;
  kickoffConfirmed: boolean;
  postponed: boolean;
  href: string | null;
}

/**
 * "Outros jogos que pesam": the games of other clubs, in the published
 * round, whose result moves this club's frame chance by 3 percentage points
 * or more (`rivalGames`), in kickoff order, Lisbon time. One sentence per
 * game, in the club's words: "Despromoção do Casa Pia: 55% se o Rio Ave
 * ganhar, 53% se empatarem, 51% se o Famalicão ganhar." Static: the
 * simulator's result buttons only repeated the hub's figures. A game that
 * has kicked off says so (the reader's clock).
 */
export function RivalGames({
  team,
  frame,
  baseline,
  games,
  locale,
  forecastTimestamp,
}: {
  team: string;
  frame: ClubFrame;
  /** The club's frame chance in the forecast, before any of these games. */
  baseline: number;
  games: RivalGameRow[];
  locale: string;
  forecastTimestamp: string;
}) {
  const pt = locale !== 'en';
  const pct = (p: number) => formatPercent(p, locale);
  const chance = pt
    ? `${frame === 'title' ? 'Título' : 'Despromoção'} ${teamWithArticle(team, 'de')}`
    : `${teamDisplayName(team)}'s ${frame === 'title' ? 'title' : 'relegation'} chance`;

  const inFrame = pt
    ? `${frame === 'title' ? 'no título' : 'na despromoção'} ${teamWithArticle(team, 'de')} (agora ${pct(baseline)})`
    : `${teamDisplayName(team)}'s ${frame === 'title' ? 'title' : 'relegation'} chance (now ${pct(baseline)})`;
  const noise = pt
    ? 'Abaixo de 3 pontos percentuais, a diferença entre resultados confunde-se com o ruído das simulações.'
    : 'Below 3 percentage points, the difference between results blends into the simulations’ noise.';

  if (games.length === 0) {
    return (
      <p className="max-w-3xl text-sm leading-relaxed text-ink">
        {pt
          ? `Nenhum jogo de outros clubes nesta previsão, na jornada publicada ou em atraso, mexe 3 pontos percentuais ou mais ${inFrame}. `
          : `No other clubs' game in this forecast, in the published round or postponed, moves ${inFrame} by 3 percentage points or more. `}
        <span className="text-graphite">{noise}</span>
      </p>
    );
  }

  return (
    <>
    <p className="mb-6 max-w-3xl text-sm text-stone-500">
      {pt
        ? `Jogos de outros clubes, na jornada publicada e em atraso, cujo resultado mexe 3 pontos percentuais ou mais ${inFrame}. ${noise} Por ordem de início, hora de Lisboa.`
        : `Other clubs' games, in the published round and postponed, whose result moves ${inFrame} by 3 percentage points or more. ${noise} In kickoff order, Lisbon time.`}
    </p>
    <ol className="max-w-3xl border-t border-ink">
      {games.map(g => {
        const home = teamDisplayName(g.home);
        const away = teamDisplayName(g.away);
        const when = formatKickoffShort(g.kickoff, locale, { confirmed: g.kickoffConfirmed });
        const sentence = pt
          ? `${chance}: ${pct(g.home_win)} se ${teamWithArticle(g.home, 'o')} ganhar, ${pct(g.draw)} se empatarem, ${pct(g.away_win)} se ${teamWithArticle(g.away, 'o')} ganhar.`
          : `${chance}: ${pct(g.home_win)} if ${home} win, ${pct(g.draw)} with a draw, ${pct(g.away_win)} if ${away} win.`;
        return (
          <li key={g.index} className="border-b border-rule py-3">
            <p className="text-[12px] font-semibold tabular-nums text-graphite">
              <ClockSwitch
                initial={when || (pt ? `Jornada ${g.matchday}` : `Matchday ${g.matchday}`)}
                steps={kickoffSteps(g.kickoff, g.kickoffConfirmed, matchStartedLine(forecastTimestamp, locale), matchPlayedLine(forecastTimestamp, locale))}
              />
              {` · ${pt ? 'jornada' : 'matchday'} ${g.matchday}`}
              {g.postponed && (pt ? ' · jogo em atraso' : ' · postponed')}
            </p>
            <p className="mt-0.5 text-[15px] font-semibold text-ink">
              {g.href ? (
                <Link href={g.href} locale={locale} className="underline underline-offset-4">
                  {matchLabel(home, away)}
                </Link>
              ) : matchLabel(home, away)}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink tabular-nums">{sentence}</p>
          </li>
        );
      })}
    </ol>
    </>
  );
}
