"use client";

import { ligaTeamColors, teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import type { MatchdayResult, RemainingMatch, MatchPrediction, TeamDelta } from "@/types/football";

interface MatchdayLiveProps {
  matchday: number;
  results: MatchdayResult[];
  remaining: RemainingMatch[];
  nextMatchdayMatches?: MatchPrediction[];
  deltas?: Record<string, TeamDelta>;
  labels: {
    matchdayLive: string;
    matchesPlayed: string;
    playedLabel: string;
    remainingLabel: string;
    impact: string;
    championDelta: string;
    relegationDelta: string;
    home: string;
    draw: string;
    away: string;
  };
}

function DeltaBadge({ value, label }: { value: number; label: string }) {
  if (Math.abs(value) < 1) return null;
  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center text-[11px] tabular-nums ${
        isPositive ? "text-emerald-700" : "text-red-600"
      }`}
    >
      {isPositive ? "+" : ""}
      {Math.round(value)}pp {label}
    </span>
  );
}

function TeamName({ team, bold }: { team: string; bold?: boolean }) {
  const color = ligaTeamColors[team] || "#78716c";
  const logo = teamLogoSrc(team);
  return (
    <>
      {logo ? (
        <img src={logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
      ) : (
        <div className="w-1 h-4 flex-shrink-0" style={{ backgroundColor: color }} />
      )}
      <span className={`text-sm truncate ${bold ? "font-medium text-stone-900" : "text-stone-700"}`}>
        {teamDisplayName(team)}
      </span>
    </>
  );
}

function ProbBar({ home, draw, away }: { home: number; draw: number; away: number }) {
  const hPct = Math.round(home * 100);
  const dPct = Math.round(draw * 100);
  const aPct = Math.round(away * 100);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] tabular-nums text-stone-500 w-7 text-right">{hPct}%</span>
      <div className="flex h-1.5 flex-1 min-w-[60px] max-w-[100px] overflow-hidden bg-stone-100">
        <div className="bg-stone-700" style={{ width: `${hPct}%` }} />
        <div className="bg-stone-300" style={{ width: `${dPct}%` }} />
        <div className="bg-stone-400" style={{ width: `${aPct}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-stone-500 w-7">{aPct}%</span>
    </div>
  );
}

export function MatchdayLive({
  matchday,
  results,
  remaining,
  nextMatchdayMatches,
  deltas,
  labels,
}: MatchdayLiveProps) {
  if (results.length === 0 && remaining.length === 0) return null;

  const totalMatches = results.length + remaining.length;
  const allPlayed = remaining.length === 0;

  // Build lookup for next matchday predictions (for remaining matches)
  const predLookup = new Map<string, MatchPrediction>();
  if (nextMatchdayMatches) {
    for (const m of nextMatchdayMatches) {
      predLookup.set(`${m.home}-${m.away}`, m);
    }
  }

  // Impact movers
  const movers = deltas
    ? Object.entries(deltas)
        .filter(([, d]) => Math.abs(d.p_champion_delta) >= 2)
        .sort((a, b) => Math.abs(b[1].p_champion_delta) - Math.abs(a[1].p_champion_delta))
        .slice(0, 4)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Results */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-base font-bold text-stone-900">
            {labels.matchdayLive}
          </h3>
          <span className="text-xs text-stone-400 tabular-nums">
            {labels.matchesPlayed}
          </span>
        </div>

        {results.length > 0 && (
          <div className="space-y-0">
            {results.map((r) => {
              const homeWin = r.home_goals > r.away_goals;
              const awayWin = r.away_goals > r.home_goals;
              return (
                <div
                  key={`${r.home}-${r.away}`}
                  className="flex items-center py-2 border-b border-stone-100 last:border-0"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className={`text-sm text-right truncate ${homeWin ? "font-semibold text-stone-900" : "text-stone-500"}`}>
                      {teamDisplayName(r.home)}
                    </span>
                    {teamLogoSrc(r.home) ? (
                      <img src={teamLogoSrc(r.home)} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-1 h-4 flex-shrink-0" style={{ backgroundColor: ligaTeamColors[r.home] || "#78716c" }} />
                    )}
                  </div>

                  <div className="flex items-center justify-center w-14 shrink-0">
                    <span className={`text-sm font-bold tabular-nums ${homeWin ? "text-stone-900" : "text-stone-400"}`}>{r.home_goals}</span>
                    <span className="text-stone-300 mx-0.5">:</span>
                    <span className={`text-sm font-bold tabular-nums ${awayWin ? "text-stone-900" : "text-stone-400"}`}>{r.away_goals}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {teamLogoSrc(r.away) ? (
                      <img src={teamLogoSrc(r.away)} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-1 h-4 flex-shrink-0" style={{ backgroundColor: ligaTeamColors[r.away] || "#78716c" }} />
                    )}
                    <span className={`text-sm truncate ${awayWin ? "font-semibold text-stone-900" : "text-stone-500"}`}>
                      {teamDisplayName(r.away)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Impact */}
        {movers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {labels.impact}
            </span>
            {movers.map(([team, d]) => (
              <div key={team} className="flex items-center gap-1">
                {teamLogoSrc(team) && (
                  <img src={teamLogoSrc(team)} alt="" className="w-3.5 h-3.5 object-contain" />
                )}
                <DeltaBadge value={d.p_champion_delta} label={labels.championDelta} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Remaining or empty state */}
      {remaining.length > 0 ? (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {labels.remainingLabel}
            </span>
          </div>
          <div className="space-y-0">
            {remaining.map((m) => {
              const pred = predLookup.get(`${m.home}-${m.away}`);

              let kickoffStr = "";
              if (m.kickoff) {
                try {
                  const dt = new Date(m.kickoff);
                  kickoffStr = dt.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });
                } catch {}
              }

              return (
                <div
                  key={`${m.home}-${m.away}`}
                  className="flex items-center py-2 border-b border-stone-100 last:border-0"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="text-sm text-stone-700 text-right truncate">
                      {teamDisplayName(m.home)}
                    </span>
                    {teamLogoSrc(m.home) ? (
                      <img src={teamLogoSrc(m.home)} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-1 h-4 flex-shrink-0" style={{ backgroundColor: ligaTeamColors[m.home] || "#78716c" }} />
                    )}
                  </div>

                  <div className="w-14 shrink-0 text-center text-xs text-stone-400 tabular-nums">
                    {kickoffStr || "vs"}
                  </div>

                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {teamLogoSrc(m.away) ? (
                      <img src={teamLogoSrc(m.away)} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-1 h-4 flex-shrink-0" style={{ backgroundColor: ligaTeamColors[m.away] || "#78716c" }} />
                    )}
                    <span className="text-sm text-stone-700 truncate">
                      {teamDisplayName(m.away)}
                    </span>
                  </div>

                  {pred && (
                    <div className="hidden sm:block ml-3 shrink-0">
                      <ProbBar home={pred.p_home} draw={pred.p_draw} away={pred.p_away} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : allPlayed ? (
        <div className="flex items-center justify-center">
          <div className="text-center py-6">
            <div className="text-2xl mb-1">&#9989;</div>
            <p className="text-sm text-stone-500">
              {totalMatches}/{totalMatches}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
