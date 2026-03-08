"use client";

import { teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import type { CriticalPathMatch } from "@/types/football";

interface RemainingScheduleProps {
  matches: CriticalPathMatch[];
  teamColor: string;
  labels: {
    matchdayAbbr: string;
    win: string;
    draw: string;
    loss: string;
    home: string;
    away: string;
  };
}

export function RemainingSchedule({ matches, teamColor, labels }: RemainingScheduleProps) {
  if (!matches || matches.length === 0) return null;

  const sorted = [...matches].sort((a, b) => a.matchday - b.matchday);

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-200">
        <div className="w-8 text-center">{labels.matchdayAbbr}</div>
        <div className="w-36 md:w-44" />
        <div className="flex-1" />
        <div className="w-28 md:w-40 flex justify-between text-[10px]">
          <span>{labels.win}</span>
          <span>{labels.draw}</span>
          <span>{labels.loss}</span>
        </div>
      </div>

      {sorted.map((m, i) => {
        const pWin = Math.round(m.p_win_overall * 100);
        const pDraw = Math.round(m.p_draw_overall * 100);
        const pLoss = Math.round(m.p_loss_overall * 100);

        return (
          <div key={i} className="flex items-center gap-2 py-1">
            {/* Matchday */}
            <div className="w-8 text-center text-xs text-stone-400 tabular-nums">
              {m.matchday}
            </div>

            {/* Opponent + venue */}
            <div className="w-36 md:w-44 flex items-center gap-1.5 shrink-0">
              {teamLogoSrc(m.opponent) && (
                <img
                  src={teamLogoSrc(m.opponent)}
                  alt=""
                  className="w-4 h-4 object-contain"
                />
              )}
              <span className="text-sm font-medium text-stone-800 truncate">
                {teamDisplayName(m.opponent)}
              </span>
              <span className="text-[10px] text-stone-400 shrink-0">
                ({m.venue === "H" ? labels.home : labels.away})
              </span>
            </div>

            {/* Stacked bar with 1px gaps */}
            <div className="flex-1 h-5 flex gap-[1px] bg-stone-100 overflow-hidden">
              <div
                style={{ width: `${pWin}%`, backgroundColor: teamColor }}
                className="h-full"
              />
              <div
                style={{ width: `${pDraw}%` }}
                className="h-full bg-stone-300"
              />
              <div
                style={{ width: `${pLoss}%` }}
                className="h-full bg-red-400"
              />
            </div>

            {/* Numeric labels */}
            <div className="w-28 md:w-40 flex justify-between tabular-nums text-xs shrink-0">
              <span className="font-semibold" style={{ color: teamColor }}>
                {pWin}%
              </span>
              <span className="text-stone-400">{pDraw}%</span>
              <span className="text-red-500">{pLoss}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
