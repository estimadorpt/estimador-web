import { teamColorOnPaper, teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import { formatKickoff, formatLongDate, formatPercent } from "@/lib/football-format";

interface MatchProbabilityHeroProps {
  home: string;
  away: string;
  homeColor: string;
  awayColor: string;
  pHome: number | null;
  pDraw: number | null;
  pAway: number | null;
  matchday: number;
  kickoff: string | null;
  /** False while the kickoff is a placeholder: the day is shown, not the hour. */
  kickoffConfirmed?: boolean;
  locale: string;
  /** Final score, when the fixture has already been played. */
  played?: { home_goals: number; away_goals: number } | null;
  /** For a played fixture: when the 1X2 shown was frozen, before kickoff. */
  probsPublishedAt?: string | null;
}

/** The number part of the one football percentage rule ("44", "8,4", ">99"). */
function pct(p: number, locale: string): string {
  return formatPercent(p, locale).replace(/%$/, "");
}

/** Kickoff in Lisbon time; a placeholder kickoff shows its day only. */
function kickoffLabel(iso: string | null, confirmed: boolean, locale: string): string | null {
  if (!iso) return null;
  if (!confirmed) {
    const day = formatLongDate(iso, locale, { year: false });
    if (!day) return null;
    return locale === "en" ? `${day} (kickoff to be confirmed)` : `${day} (horário por confirmar)`;
  }
  return formatKickoff(iso, locale) || null;
}

export function MatchProbabilityHero({
  home,
  away,
  homeColor,
  awayColor,
  pHome,
  pDraw,
  pAway,
  matchday,
  kickoff,
  kickoffConfirmed = true,
  locale,
  played,
  probsPublishedAt,
}: MatchProbabilityHeroProps) {
  const pt = locale !== "en";
  const hasProbs = pHome != null && pDraw != null && pAway != null;
  const when = kickoffLabel(kickoff, kickoffConfirmed, locale);

  const labels = {
    matchday: pt ? `Jornada ${matchday}` : `Matchday ${matchday}`,
    // "Vitória em casa" read as a club name beside Vitória SC; name the
    // winner instead.
    homeWin: pt ? `Ganha o ${teamDisplayName(home)}` : `${teamDisplayName(home)} win`,
    draw: pt ? "Empate" : "Draw",
    awayWin: pt ? `Ganha o ${teamDisplayName(away)}` : `${teamDisplayName(away)} win`,
    venueHome: pt ? "em casa" : "at home",
    venueAway: pt ? "fora" : "away",
    noProbs: pt
      ? "Probabilidades ainda não publicadas para este jogo."
      : "Probabilities not published for this fixture yet.",
    favourite: pt ? "Resultado mais provável" : "Most likely outcome",
    finalScore: pt ? "Resultado final" : "Final score",
    notMajority: (name: string, pct: string) =>
      pt
        ? `Favorito entre três resultados — não é o mesmo que ser mais provável do que todas as alternativas juntas: ${name} vence em ${pct}% dos cenários, mas não vence em ${100 - Number(pct)}%.`
        : `Favourite among three outcomes — not the same as being more likely than all alternatives combined: ${name} wins in ${pct}% of scenarios, but doesn't in ${100 - Number(pct)}%.`,
  };

  const outcomes = hasProbs
    ? ([
        { key: "H", p: pHome!, label: labels.homeWin, venue: labels.venueHome, team: home, color: teamColorOnPaper(home) || homeColor },
        { key: "D", p: pDraw!, label: labels.draw, venue: "", team: null, color: "#c3c8bb" },
        { key: "A", p: pAway!, label: labels.awayWin, venue: labels.venueAway, team: away, color: teamColorOnPaper(away) || awayColor },
      ] as const)
    : [];

  const top = outcomes.length
    ? [...outcomes].sort((a, b) => b.p - a.p)[0]
    : null;

  return (
    <div>
      {/* Fixture line with the crests. The page's h1 is in its PageHero. */}
      <div className="flex items-center justify-between gap-3 mb-5 text-base font-normal tracking-normal">
        <div className="flex items-center gap-3 min-w-0">
          {teamLogoSrc(home) && (
            <img
              src={teamLogoSrc(home)}
              alt=""
              className="w-10 h-10 md:w-14 md:h-14 object-contain"
            />
          )}
          <span className="text-xl md:text-3xl font-display font-extrabold tracking-tight text-stone-900 truncate">
            {teamDisplayName(home)}
          </span>
        </div>
        {" "}
        <span aria-hidden="true" className="text-xl md:text-3xl font-bold text-stone-500 shrink-0">
          –
        </span>
        {" "}
        <div className="flex items-center gap-3 min-w-0 justify-end">
          <span className="text-xl md:text-3xl font-display font-extrabold tracking-tight text-stone-900 truncate text-right">
            {teamDisplayName(away)}
          </span>
          {teamLogoSrc(away) && (
            <img
              src={teamLogoSrc(away)}
              alt=""
              className="w-10 h-10 md:w-14 md:h-14 object-contain"
            />
          )}
        </div>
      </div>

      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-4">
        {labels.matchday}
        {when ? ` · ${when}` : ""}
      </div>

      {played && (
        <div className="mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
            {labels.finalScore}
          </div>
          <div className="text-4xl md:text-5xl font-display font-extrabold tabular-nums text-stone-900">
            {played.home_goals}
            <span aria-hidden="true" className="text-stone-500 mx-2">–</span>
            <span className="sr-only">{pt ? " a " : " to "}</span>
            {played.away_goals}
          </div>
          {hasProbs && (
            <p className="mt-2 text-sm text-stone-600">
              {pt
                ? `Antes do jogo, o modelo dava estas probabilidades${probsPublishedAt ? ` (publicadas a ${formatLongDate(probsPublishedAt, locale)})` : ""}:`
                : `Before the match, the model gave these probabilities${probsPublishedAt ? ` (published ${formatLongDate(probsPublishedAt, locale)})` : ""}:`}
            </p>
          )}
        </div>
      )}

      {!hasProbs && !played && (
        <p className="text-sm text-stone-500 border-l-2 border-stone-200 pl-3">
          {labels.noProbs}
        </p>
      )}

      {hasProbs && (
        <>
          {/* Three big numbers */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3">
            {outcomes.map(o => (
              <div key={o.key} className="border-t-4 pt-3" style={{ borderColor: o.color }}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 break-words">
                  {o.label}
                </div>
                <div className="text-3xl md:text-6xl font-display font-extrabold tabular-nums text-stone-900 leading-none">
                  {pct(o.p, locale)}
                  <span className="text-lg md:text-2xl font-bold text-stone-500">%</span>
                </div>
                {o.venue && <div className="text-[11px] text-stone-500 mt-1">{o.venue}</div>}
              </div>
            ))}
          </div>

          {/* Split bar */}
          {/* The bar repeats the three numbers above; it carries no text, so
              no number ever sits in white on a club colour (audit S-H6). */}
          <div aria-hidden="true" className="flex h-4 w-full gap-[2px] overflow-hidden rounded-[4px]">
            {outcomes.map(o => (
              <div key={o.key} style={{ width: `${o.p * 100}%`, backgroundColor: o.color }} />
            ))}
          </div>

          {top && (
            <div className="mt-3 text-sm text-stone-500">
              {labels.favourite}:{" "}
              <strong className="text-stone-800">
                {top.team ? teamDisplayName(top.team) : labels.draw}
              </strong>{" "}
              ({formatPercent(top.p, locale)})
            </div>
          )}

          {/* "Porto 42% is a favourite among three outcomes, not more likely
              to win than not" (diagnosis §5/12 "Match page"). Only needed
              when the top outcome is a plurality, not an outright majority. */}
          {top && top.p < 0.5 && (
            <p className="mt-1.5 text-xs text-stone-500 leading-relaxed max-w-xl">
              {labels.notMajority(top.team ? teamDisplayName(top.team) : labels.draw, String(Math.round(top.p * 100)))}
            </p>
          )}
        </>
      )}
    </div>
  );
}
