"use client";

import { useLocale } from "next-intl";
import { teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import { formatPercent } from "@/lib/football-format";
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
  const locale = useLocale();
  if (!matches || matches.length === 0) return null;

  const sorted = [...matches].sort((a, b) => a.matchday - b.matchday);

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-2 text-[12px] font-semibold text-graphite pb-1 border-b border-ink">
        <div className="w-8 text-center">{labels.matchdayAbbr}</div>
        <div className="w-36 md:w-44" />
        <div className="flex-1" />
        <div className="w-28 md:w-40 flex justify-between text-[11px]">
          <span>{labels.win}</span>
          <span>{labels.draw}</span>
          <span>{labels.loss}</span>
        </div>
      </div>

      {sorted.map((m, i) => {
        // Widths in %, labels by the one percentage rule (formatPercent).
        const pWin = m.p_win_overall * 100;
        const pDraw = m.p_draw_overall * 100;
        const pLoss = m.p_loss_overall * 100;

        return (
          <div key={i} className="flex items-center gap-2 py-1">
            {/* Matchday */}
            <div className="w-8 text-center text-xs text-stone-500 tabular-nums">
              {m.matchday}
            </div>

            {/* Opponent + venue */}
            <div className="w-36 md:w-44 flex items-center gap-1.5 shrink-0">
              {teamLogoSrc(m.opponent) && (
                <img
                  src={teamLogoSrc(m.opponent)}
                  alt=""
                  width={16}
                  height={16}
                  loading="lazy"
                  decoding="async"
                  className="w-4 h-4 object-contain"
                />
              )}
              <span className="text-sm font-medium text-ink truncate">
                {teamDisplayName(m.opponent)}
              </span>
              <span className="text-[11px] text-stone-500 shrink-0">
                ({m.venue === "H" ? labels.home : labels.away})
              </span>
            </div>

            {/* Stacked bar with 1px white gaps, no grey track */}
            <div aria-hidden="true" className="flex-1 h-5 flex gap-px overflow-hidden">
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
                className="h-full bg-red-700"
              />
            </div>

            {/* Numeric labels */}
            <div className="w-28 md:w-40 flex justify-between tabular-nums text-xs shrink-0">
              <span className="font-semibold text-ink">{formatPercent(m.p_win_overall, locale)}</span>
              <span className="text-graphite">{formatPercent(m.p_draw_overall, locale)}</span>
              <span className="text-graphite">{formatPercent(m.p_loss_overall, locale)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
