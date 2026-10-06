import { OUTCOME_TONES, teamColorOnPaper, teamDisplayName } from "@/lib/config/football";
import { Link } from "@/i18n/routing";
import type { NextMatchdayScenarioMatch } from "@/types/football";
import {
  byKickoff,
  combinedSwing,
  fixtureSwings,
  STAKES_BADGE_THRESHOLD,
  type FixtureSwings,
} from "@/lib/football-fixtures";
import { formatKickoffShort, formatPercent, matchLabel } from "@/lib/football-format";
import { kickoffSteps, matchPlayedLine, matchStartedLine } from "@/lib/football-status";
import { ClockSwitch } from "@/components/football/ClockSwitch";

/** One fixture card: the 1X2, its kickoff and what it can change. */
export interface MatchdayFixture {
  home: string;
  away: string;
  matchday: number;
  /** UTC ISO; printed in Lisbon. */
  kickoff: string | null;
  kickoffConfirmed: boolean;
  p_home: number;
  p_draw: number;
  p_away: number;
  /** This fixture's own conditionals (next_matchday_scenarios), for its stakes. */
  scenario: NextMatchdayScenarioMatch | null;
  /** A game left over from an earlier round (audit UXD3-02, CL3-01). */
  postponed?: boolean;
  /** Match page, when one is generated. */
  href?: string;
}

interface MatchdayPredictionsProps {
  fixtures: MatchdayFixture[];
  locale: string;
  /** The forecast's timestamp, for "Jogo começou · previsão de 25 set." once a game kicks off. */
  forecastTimestamp: string;
}

// Three clearly different values, all drawn without text inside the bar
// (the numbers sit under it in ink), so nothing depends on telling two
// greys apart: home dark, draw pale, away mid.
const BAR = OUTCOME_TONES;

function Stakes({ swings, pt }: { swings: FixtureSwings; pt: boolean }) {
  const items: string[] = [];
  if (swings.title && swings.title.swing >= STAKES_BADGE_THRESHOLD) {
    items.push(`${pt ? "Título" : "Title"} · ${teamDisplayName(swings.title.team)} ${Math.round(swings.title.swing * 100)} pp`);
  }
  if (swings.relegation && swings.relegation.swing >= STAKES_BADGE_THRESHOLD) {
    items.push(`${pt ? "Despromoção" : "Relegation"} · ${teamDisplayName(swings.relegation.team)} ${Math.round(swings.relegation.swing * 100)} pp`);
  }
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label={pt ? "O que este jogo pode mudar" : "What this match can change"}>
      {items.map(item => (
        <li key={item} className="rounded-md bg-parchment px-2 py-0.5 text-[11px] font-bold text-stone-600">
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The next round, in kickoff order (Lisbon time on every card). Each card's
 * stakes come from its own published conditionals: for the title and for
 * relegation, the club whose chances spread most between the three results.
 * "Jogo da jornada" marks the biggest combined spread, as a badge only; it
 * never reorders the list.
 */
export function MatchdayPredictions({ fixtures, locale, forecastTimestamp }: MatchdayPredictionsProps) {
  if (!fixtures || fixtures.length === 0) return null;
  const pt = locale !== "en";

  const withSwings = byKickoff(fixtures).map(f => ({ fixture: f, swings: fixtureSwings(f.scenario) }));
  // "Jogo da jornada" is a game of the round: a leftover from an earlier one
  // carries its own badge instead.
  const top = withSwings.filter(x => !x.fixture.postponed).reduce<(typeof withSwings)[number] | null>(
    (best, x) => (!best || combinedSwing(x.swings) > combinedSwing(best.swings) ? x : best),
    null,
  );
  const matchOfTheWeek = top && combinedSwing(top.swings) >= STAKES_BADGE_THRESHOLD ? top.fixture : null;

  return (
    <div>
      <p className="mb-4 flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-wider text-stone-500" aria-hidden="true">
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BAR.home }} />{pt ? "Vitória da casa" : "Home win"}</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm border border-line" style={{ backgroundColor: BAR.draw }} />{pt ? "Empate" : "Draw"}</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BAR.away }} />{pt ? "Vitória de fora" : "Away win"}</span>
      </p>
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {withSwings.map(({ fixture: f, swings }) => {
          const home = teamDisplayName(f.home);
          const away = teamDisplayName(f.away);
          const when = formatKickoffShort(f.kickoff, locale, { confirmed: f.kickoffConfirmed });
          const isTop = matchOfTheWeek === f;
          const body = (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold tabular-nums text-stone-500">
                  {/* After kickoff the card stops reading as a preview: the
                      1X2 is what the model gave, dated (audit FRESH-01). */}
                  <ClockSwitch
                    initial={<>
                      {when || (pt ? `Jornada ${f.matchday}` : `Matchday ${f.matchday}`)}
                      {when && !f.kickoffConfirmed && (pt ? " · horário por confirmar" : " · kickoff to be confirmed")}
                    </>}
                    steps={kickoffSteps(f.kickoff, f.kickoffConfirmed, matchStartedLine(forecastTimestamp, locale), matchPlayedLine(forecastTimestamp, locale))}
                  />
                </span>
                {isTop && (
                  <span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-paper">
                    {pt ? "Jogo da jornada" : "Match of the round"}
                  </span>
                )}
                {/* The simulator's own label for a leftover (UXD3-02). */}
                {f.postponed && (
                  <span className="rounded-md bg-parchment px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    {pt ? `Jogo em atraso · jornada ${f.matchday}` : `Postponed · matchday ${f.matchday}`}
                  </span>
                )}
              </div>
              <h3 className="flex items-center gap-2 text-base font-bold text-ink">
                <i aria-hidden="true" className="h-4 w-1 shrink-0 rounded-full" style={{ backgroundColor: teamColorOnPaper(f.home) }} />
                <span className="min-w-0">{matchLabel(home, away)}</span>
                <i aria-hidden="true" className="h-4 w-1 shrink-0 rounded-full" style={{ backgroundColor: teamColorOnPaper(f.away) }} />
              </h3>
              <div aria-hidden="true" className="mt-2 flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px]">
                <span style={{ width: `${f.p_home * 100}%`, backgroundColor: BAR.home }} />
                <span style={{ width: `${f.p_draw * 100}%`, backgroundColor: BAR.draw }} />
                <span style={{ width: `${f.p_away * 100}%`, backgroundColor: BAR.away }} />
              </div>
              <p className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-xs text-stone-600 tabular-nums">
                <span>{home}<span className="sr-only">{pt ? " ganha" : " win"}</span> <strong className="text-ink">{formatPercent(f.p_home, locale)}</strong></span>
                <span>{pt ? "Empate" : "Draw"} <strong className="text-ink">{formatPercent(f.p_draw, locale)}</strong></span>
                <span>{away}<span className="sr-only">{pt ? " ganha" : " win"}</span> <strong className="text-ink">{formatPercent(f.p_away, locale)}</strong></span>
              </p>
              <Stakes swings={swings} pt={pt} />
              {f.href && (
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ink underline underline-offset-4">
                  {pt ? "Análise do jogo" : "Match preview"} <span aria-hidden="true">→</span>
                </span>
              )}
            </>
          );
          return (
            <li key={`${f.matchday}-${f.home}-${f.away}`} className="min-w-0">
              {f.href ? (
                <Link
                  href={f.href}
                  locale={locale}
                  className="block h-full rounded-2xl border border-line bg-cream p-4 transition-colors duration-150 hover:bg-parchment"
                >
                  {body}
                </Link>
              ) : (
                <div className="h-full rounded-2xl border border-line bg-cream p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
