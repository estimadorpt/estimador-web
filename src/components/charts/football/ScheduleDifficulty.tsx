"use client";

import { ligaTeamColors, ligaTeamShortNames, teamLogoSrc, teamDisplayName } from "@/lib/config/football";

export interface ScheduleDifficultyEntry {
  team: string;
  difficulty: number; // 0-1 normalized
  toughestOpponents: string[];
  remainingGames: number;
}

interface ScheduleDifficultyProps {
  data: ScheduleDifficultyEntry[];
  labels: {
    title?: string;
    hardest?: string;
    easiest?: string;
    toughOpponents?: string;
  };
}

export function ScheduleDifficulty({ data, labels }: ScheduleDifficultyProps) {
  if (!data || data.length === 0) return null;

  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">
        <span>{labels.easiest ?? "Mais fácil"}</span>
        <span>{labels.hardest ?? "Mais difícil"}</span>
      </div>
      <div className="space-y-1.5">
        {data.map((entry) => {
          const color = ligaTeamColors[entry.team] || '#78716c';
          return (
            <div key={entry.team} className="flex items-center gap-2">
              <div className="w-16 sm:w-32 flex items-center gap-1.5 flex-shrink-0">
                {teamLogoSrc(entry.team) ? (
                  <img src={teamLogoSrc(entry.team)} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                ) : (
                  <div className="w-1 h-4 flex-shrink-0" style={{ backgroundColor: color }} />
                )}
                <span className="text-xs font-medium text-stone-700 truncate sm:hidden">
                  {ligaTeamShortNames[entry.team] || entry.team}
                </span>
                <span className="text-xs font-medium text-stone-700 truncate hidden sm:inline">
                  {teamDisplayName(entry.team)}
                </span>
              </div>
              <div className="flex-1 h-5 bg-stone-100 relative">
                <div
                  className="h-full"
                  style={{
                    width: `${entry.difficulty * 100}%`,
                    backgroundColor: color,
                    opacity: 0.7,
                  }}
                />
              </div>
              <div className="w-20 sm:w-40 flex-shrink-0 text-[10px] text-stone-500 truncate text-right">
                {entry.toughestOpponents.map(op => ligaTeamShortNames[op] || op).join(", ")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
