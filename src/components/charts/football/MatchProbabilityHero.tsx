import { teamDisplayName, teamLogoSrc } from "@/lib/config/football";
import { readableTextOn } from "@/lib/utils/football-contrast";

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
  locale: string;
  /** Final score, when the fixture has already been played. */
  played?: { home_goals: number; away_goals: number } | null;
}

function pct(p: number): string {
  if (p >= 0.995) return ">99";
  if (p > 0 && p < 0.005) return "<1";
  return String(Math.round(p * 100));
}

function kickoffLabel(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(locale === "en" ? "en-GB" : "pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  locale,
  played,
}: MatchProbabilityHeroProps) {
  const pt = locale !== "en";
  const hasProbs = pHome != null && pDraw != null && pAway != null;
  const when = kickoffLabel(kickoff, locale);

  const labels = {
    matchday: pt ? `Jornada ${matchday}` : `Matchday ${matchday}`,
    homeWin: pt ? "Vitória em casa" : "Home win",
    draw: pt ? "Empate" : "Draw",
    awayWin: pt ? "Vitória fora" : "Away win",
    noProbs: pt
      ? "Probabilidades ainda não publicadas para este jogo."
      : "Probabilities not published for this fixture yet.",
    favourite: pt ? "Resultado mais provável" : "Most likely outcome",
    finalScore: pt ? "Resultado final" : "Final score",
  };

  const outcomes = hasProbs
    ? ([
        { key: "H", p: pHome!, label: labels.homeWin, team: home, color: homeColor },
        { key: "D", p: pDraw!, label: labels.draw, team: null, color: "#d6d3d1" },
        { key: "A", p: pAway!, label: labels.awayWin, team: away, color: awayColor },
      ] as const)
    : [];

  const top = outcomes.length
    ? [...outcomes].sort((a, b) => b.p - a.p)[0]
    : null;

  return (
    <div>
      {/* Fixture line */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          {teamLogoSrc(home) && (
            <img
              src={teamLogoSrc(home)}
              alt=""
              className="w-10 h-10 md:w-14 md:h-14 object-contain"
            />
          )}
          <span className="text-xl md:text-3xl font-black tracking-tight text-stone-900 truncate">
            {teamDisplayName(home)}
          </span>
        </div>
        <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-stone-400 shrink-0">
          vs
        </span>
        <div className="flex items-center gap-3 min-w-0 justify-end">
          <span className="text-xl md:text-3xl font-black tracking-tight text-stone-900 truncate text-right">
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

      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-4">
        {labels.matchday}
        {when ? ` · ${when}` : ""}
      </div>

      {played && (
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            {labels.finalScore}
          </div>
          <div className="text-4xl md:text-5xl font-black tabular-nums text-stone-900">
            {played.home_goals}
            <span className="text-stone-300 mx-2">:</span>
            {played.away_goals}
          </div>
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
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 truncate">
                  {o.team ? teamDisplayName(o.team) : labels.draw}
                </div>
                <div className="text-4xl md:text-6xl font-black tabular-nums text-stone-900 leading-none">
                  {pct(o.p)}
                  <span className="text-lg md:text-2xl font-bold text-stone-400">%</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-1">{o.label}</div>
              </div>
            ))}
          </div>

          {/* Split bar */}
          <div className="flex h-8 w-full overflow-hidden rounded-sm">
            {outcomes.map(o => (
              <div
                key={o.key}
                className="flex items-center justify-center text-[11px] font-bold"
                style={{
                  width: `${o.p * 100}%`,
                  backgroundColor: o.color,
                  color: readableTextOn(o.color),
                }}
              >
                {o.p >= 0.08 ? `${Math.round(o.p * 100)}%` : ""}
              </div>
            ))}
          </div>

          {top && (
            <div className="mt-3 text-sm text-stone-500">
              {labels.favourite}:{" "}
              <strong className="text-stone-800">
                {top.team ? teamDisplayName(top.team) : labels.draw}
              </strong>{" "}
              ({Math.round(top.p * 100)}%)
            </div>
          )}
        </>
      )}
    </div>
  );
}
