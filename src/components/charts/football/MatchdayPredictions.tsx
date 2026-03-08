"use client";

import { ligaTeamColors, teamDisplayName } from "@/lib/config/football";
import type { DecisiveMatch, MatchPrediction } from "@/types/football";

interface MatchdayPredictionsProps {
  matches: MatchPrediction[];
  matchday: number;
  labels: {
    home: string;
    draw: string;
    away: string;
    titleImpact?: string;
    relegationImpact?: string;
    matchOfTheWeek?: string;
  };
  decisiveMatches?: DecisiveMatch[];
}

function ProbabilityBar({ pHome, pDraw, pAway }: {
  pHome: number;
  pDraw: number;
  pAway: number;
}) {
  return (
    <div className="flex h-5 w-full overflow-hidden">
      <div
        className="flex items-center justify-center text-[10px] font-bold text-white bg-stone-700"
        style={{ width: `${pHome * 100}%`, minWidth: pHome > 0.05 ? '28px' : 0 }}
      >
        {pHome >= 0.05 ? `${Math.round(pHome * 100)}%` : ''}
      </div>
      <div
        className="flex items-center justify-center text-[10px] font-bold text-stone-600 bg-stone-200"
        style={{ width: `${pDraw * 100}%`, minWidth: pDraw > 0.05 ? '28px' : 0 }}
      >
        {pDraw >= 0.05 ? `${Math.round(pDraw * 100)}%` : ''}
      </div>
      <div
        className="flex items-center justify-center text-[10px] font-bold text-white bg-stone-500"
        style={{ width: `${pAway * 100}%`, minWidth: pAway > 0.05 ? '28px' : 0 }}
      >
        {pAway >= 0.05 ? `${Math.round(pAway * 100)}%` : ''}
      </div>
    </div>
  );
}

export function MatchdayPredictions({ matches, matchday, labels, decisiveMatches }: MatchdayPredictionsProps) {
  if (!matches || matches.length === 0) return null;

  // Build lookup for decisive match annotations
  const decisiveLookup = new Map<string, DecisiveMatch>();
  if (decisiveMatches) {
    for (const dm of decisiveMatches) {
      decisiveLookup.set(`${dm.home_team}|${dm.away_team}`, dm);
    }
  }

  // Sort matches by importance (highest swing first)
  const sortedMatches = [...matches].sort((a, b) => {
    const dmA = decisiveLookup.get(`${a.home}|${a.away}`);
    const dmB = decisiveLookup.get(`${b.home}|${b.away}`);
    const impactA = (dmA?.title_swing ?? 0) + (dmA?.relegation_swing ?? 0);
    const impactB = (dmB?.title_swing ?? 0) + (dmB?.relegation_swing ?? 0);
    return impactB - impactA;
  });

  // Find match of the week (highest combined swing)
  const topDm = sortedMatches.length > 0
    ? decisiveLookup.get(`${sortedMatches[0].home}|${sortedMatches[0].away}`)
    : undefined;
  const topSwing = topDm ? (topDm.title_swing + (topDm.relegation_swing ?? 0)) : 0;
  const hasMatchOfWeek = topSwing > 0.05;

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex gap-4 text-[10px] uppercase tracking-wider text-stone-500 font-bold">
        <span>{labels.home}</span>
        <span>{labels.draw}</span>
        <span>{labels.away}</span>
      </div>

      {sortedMatches.map((match, i) => {
        const homeColor = ligaTeamColors[match.home] || '#78716c';
        const awayColor = ligaTeamColors[match.away] || '#78716c';
        const dm = decisiveLookup.get(`${match.home}|${match.away}`);
        const hasTitleImpact = dm && dm.title_swing > 0.05;
        const hasRelegImpact = dm && (dm.relegation_swing ?? 0) > 0.05;
        const isMatchOfWeek = i === 0 && hasMatchOfWeek;

        return (
          <div key={i} className={`border-b border-stone-100 pb-3 last:border-0 ${isMatchOfWeek ? 'pt-1' : ''}`}>
            {isMatchOfWeek && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 inline-flex items-center px-2 py-0.5 mb-2">
                {labels.matchOfTheWeek ?? "Jogo da Jornada"}
              </div>
            )}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4" style={{ backgroundColor: homeColor }} />
                <span className="text-sm font-medium text-stone-900">{teamDisplayName(match.home)}</span>
              </div>
              <span className="text-xs text-stone-400 px-2">vs</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-stone-900">{teamDisplayName(match.away)}</span>
                <div className="w-1 h-4" style={{ backgroundColor: awayColor }} />
              </div>
            </div>
            <ProbabilityBar
              pHome={match.p_home}
              pDraw={match.p_draw}
              pAway={match.p_away}
            />
            {/* Impact badges */}
            {(hasTitleImpact || hasRelegImpact) && (
              <div className="flex gap-2 mt-1.5">
                {hasTitleImpact && dm && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                    {labels.titleImpact ?? "Title impact"} {Math.round(dm.title_swing * 100)}pp
                  </span>
                )}
                {hasRelegImpact && dm && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200">
                    {labels.relegationImpact ?? "Relegation impact"} {Math.round((dm.relegation_swing ?? 0) * 100)}pp
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
