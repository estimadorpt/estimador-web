"use client";

import { ligaTeamColors, teamLogoSrc } from "@/lib/config/football";
import type { CriticalPath } from "@/types/football";

interface CriticalPathsProps {
  paths: Record<string, CriticalPath>;
  nSims: number;
  labels: {
    titleRaceSection: string;
    survivalSection: string;
    currentTitleProb: string;
    currentSurvivalProb: string;
    freqFramingTitle: string;
    freqFramingSurvival: string;
  };
  maxMatchesPerTeam?: number;
  maxTeams?: number;
  survivalOnly?: boolean;
}

function formatNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatPct(value: number): string {
  const pct = value * 100;
  if (pct > 99 && pct < 100) return ">99%";
  if (pct < 1 && pct > 0) return "<1%";
  if (pct === 0) return "0%";
  return `${Math.round(pct)}%`;
}

export function CriticalPaths({ paths, nSims, labels, maxMatchesPerTeam = 5, maxTeams = 3, survivalOnly = false }: CriticalPathsProps) {
  if (!paths || Object.keys(paths).length === 0) return null;

  const titlePaths = survivalOnly ? [] : Object.entries(paths)
    .filter(([, p]) => p.target === 'champion')
    .sort(([, a], [, b]) => b.p_current - a.p_current)
    .slice(0, maxTeams);
  const survivalPaths = Object.entries(paths)
    .filter(([, p]) => p.target === 'survival')
    .sort(([, a], [, b]) => a.p_current - b.p_current)
    .slice(0, maxTeams);

  if (survivalOnly && survivalPaths.length === 0) return null;

  const renderTeamPath = (team: string, path: CriticalPath) => {
    const teamColor = ligaTeamColors[team] || '#78716c';
    const topMatches = path.matches
      .sort((a, b) => b.win_uplift - a.win_uplift)
      .slice(0, maxMatchesPerTeam);

    const isTitle = path.target === 'champion';
    const probLabel = isTitle ? labels.currentTitleProb : labels.currentSurvivalProb;
    const targetCount = Math.round(path.p_current * nSims);

    return (
      <div key={team} className="border-b border-stone-100 pb-5 last:border-0">
        {/* Team header */}
        <div className="flex items-center gap-3 mb-1">
          {teamLogoSrc(team) ? (
            <img src={teamLogoSrc(team)} alt="" className="w-6 h-6 object-contain" />
          ) : (
            <div className="w-1.5 h-6" style={{ backgroundColor: teamColor }} />
          )}
          <span className="font-bold text-stone-900 text-base">{team}</span>
          <span className="text-sm text-stone-500">
            {probLabel}: <strong className="text-stone-800">{formatPct(path.p_current)}</strong>
          </span>
        </div>

        {/* Frequency framing */}
        <p className="text-xs text-stone-400 italic mb-3 ml-4">
          {(isTitle ? labels.freqFramingTitle : labels.freqFramingSurvival)
            .replace('__NSIMS__', formatNum(nSims))
            .replace('__TEAM__', team)
            .replace('__COUNT__', formatNum(targetCount))
          }
        </p>

        {/* Matches — compact two-tone bars */}
        <div className="space-y-1.5 ml-4">
          {topMatches.map((m, i) => {
            const overall = Math.round(m.p_win_overall * 100);
            const conditional = Math.round(m.p_win_given_target * 100);
            const uplift = conditional - overall;

            return (
              <div key={i} className="flex items-center gap-2">
                {/* Match info */}
                <div className="flex items-center gap-1 w-40 shrink-0">
                  <span className="text-xs text-stone-400 tabular-nums w-6">J{m.matchday}</span>
                  <span className="text-sm font-medium text-stone-800 truncate">{m.opponent}</span>
                  <span className="text-[10px] text-stone-400 shrink-0">({m.venue === 'H' ? 'C' : 'F'})</span>
                </div>

                {/* Two-tone bar: light = normal win rate, dark = extra needed */}
                <div className="flex-1 h-5 bg-stone-50 relative overflow-hidden">
                  {/* Normal win rate (muted fill) */}
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{ width: `${overall}%`, backgroundColor: teamColor, opacity: 0.15 }}
                  />
                  {/* Extra needed (vivid) — the must-win premium */}
                  <div
                    className="absolute inset-y-0"
                    style={{
                      left: `${overall}%`,
                      width: `${Math.max(uplift, 1)}%`,
                      backgroundColor: teamColor,
                      opacity: 0.7,
                    }}
                  />
                </div>

                {/* Normal → Conditional win rate */}
                <div className="flex items-center shrink-0 tabular-nums text-xs">
                  <span className="text-stone-400 w-7 text-right">{overall}%</span>
                  <span className="text-stone-300 mx-0.5">→</span>
                  <span className="font-bold text-stone-700 w-7 text-right">{conditional}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSection = (entries: [string, CriticalPath][], sectionLabel: string) => {
    if (entries.length === 0) return null;
    return (
      <div className="space-y-5">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200 pb-1">
          {sectionLabel}
        </h4>
        {entries.map(([team, path]) => renderTeamPath(team, path))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderSection(titlePaths, labels.titleRaceSection)}
      {renderSection(survivalPaths, labels.survivalSection)}
    </div>
  );
}
