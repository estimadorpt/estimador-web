import { Link } from '@/i18n/routing';
import { teamPhoneName } from '@/lib/config/football';
import { byKickoff } from '@/lib/football-fixtures';
import { formatKickoffShort, matchLabel } from '@/lib/football-format';
import { kickoffSteps, matchPlayedLine, matchStartedLine } from '@/lib/football-status';
import { clubStake, stakeSentence } from '@/lib/football-stakes';
import { ClockSwitch } from '@/components/football/ClockSwitch';
import type { NextMatchdayScenarioMatch } from '@/types/football';

export interface CouponFixture {
  home: string;
  away: string;
  matchday: number;
  /** UTC ISO; printed in Lisbon. */
  kickoff: string | null;
  kickoffConfirmed: boolean;
  p_home: number;
  p_draw: number;
  p_away: number;
  /** The fixture's own conditionals (next_matchday_scenarios), for its stakes. */
  scenario: NextMatchdayScenarioMatch | null;
  /** A game left over from an earlier round. */
  postponed?: boolean;
  /** The match page, when one is generated. */
  href?: string;
}

/**
 * The games to come as a coupon: kickoff in Lisbon time, the game, the
 * chances of a home win, a draw and an away win in whole numbers (the
 * likeliest set heavier, nothing boxed or filled), and under each game what
 * it puts at stake from the side of the club it moves most. After kickoff
 * the time line says the game started, then that it was played, against the
 * forecast's date (the reader's clock, ClockSwitch). Long lists split into
 * two tables side by side on wide screens, in kickoff order down each.
 */
export function Coupon({ fixtures, locale, forecastTimestamp, columns = 1 }: {
  fixtures: CouponFixture[];
  locale: string;
  forecastTimestamp: string;
  /** Two tables side by side from `lg`. */
  columns?: 1 | 2;
}) {
  const pt = locale !== 'en';
  const games = byKickoff(fixtures);
  const halves = columns === 2 && games.length > 4
    ? [games.slice(0, Math.ceil(games.length / 2)), games.slice(Math.ceil(games.length / 2))]
    : [games];
  const table = (rows: CouponFixture[], i: number) => (
    <table key={i} className="w-full border-collapse text-[14px]">
      <caption className="sr-only">
        {pt ? 'Probabilidades de vitória da casa, empate e vitória de fora, e o que cada jogo põe em jogo' : 'Chances of a home win, a draw and an away win, and what each game puts at stake'}
      </caption>
      <thead>
        <tr className="border-b border-ink text-[12.5px] text-graphite">
          <th scope="col" className="pb-1 text-left font-medium">{pt ? 'Jogo, hora de Lisboa' : 'Game, Lisbon time'}</th>
          <th scope="col" className="w-[52px] pb-1 text-right font-medium">{pt ? 'Casa' : 'Home'}</th>
          <th scope="col" className="w-[58px] pb-1 text-right font-medium">{pt ? 'Empate' : 'Draw'}</th>
          <th scope="col" className="w-[44px] pb-1 text-right font-medium">{pt ? 'Fora' : 'Away'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(g => {
          const p = [g.p_home, g.p_draw, g.p_away];
          const top = p.indexOf(Math.max(...p));
          const when = formatKickoffShort(g.kickoff, locale, { confirmed: g.kickoffConfirmed });
          const name = matchLabel(teamPhoneName(g.home), teamPhoneName(g.away));
          const key = `${g.matchday}-${g.home}-${g.away}`;
          return [
            <tr key={`${key}-1x2`}>
              <th scope="row" className="pr-2 pt-2 text-left font-normal">
                <span className="block text-[12px] leading-4 text-graphite">
                  <ClockSwitch
                    initial={<>
                      {when || (pt ? `Jornada ${g.matchday}` : `Matchday ${g.matchday}`)}
                      {when && !g.kickoffConfirmed && (pt ? ' · horário por confirmar' : ' · kickoff to be confirmed')}
                    </>}
                    steps={kickoffSteps(g.kickoff, g.kickoffConfirmed, matchStartedLine(forecastTimestamp, locale), matchPlayedLine(forecastTimestamp, locale))}
                  />
                  {g.postponed ? (pt ? ` · jogo em atraso, jornada ${g.matchday}` : ` · postponed, matchday ${g.matchday}`) : ''}
                </span>
                {g.href ? (
                  <Link href={g.href} locale={locale} className="name-cut no-underline hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center">{name}</Link>
                ) : <span className="name-cut">{name}</span>}
              </th>
              {p.map((v, j) => (
                <td key={j} className={`pt-2 text-right align-bottom ${j === top ? 'disp text-[18px]' : 'text-[14.5px]'}`}>
                  {Math.round(v * 100)}
                  <span className="sr-only">%</span>
                </td>
              ))}
            </tr>,
            <tr key={`${key}-stake`} className="border-b border-grid">
              <td colSpan={4} className="pb-2 pt-0.5 text-[12.5px] leading-[17px] text-graphite">{stakeSentence(clubStake(g.scenario), locale)}</td>
            </tr>,
          ];
        })}
      </tbody>
    </table>
  );
  return halves.length === 2
    ? <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">{halves.map(table)}</div>
    : table(halves[0], 0);
}
