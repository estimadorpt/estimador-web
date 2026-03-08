"use client";

import { ligaTeamColors, ligaTeamShortNames, teamLogoSrc, teamDisplayName } from "@/lib/config/football";

export interface PointsPaceEntry {
  team: string;
  played: number;
  points: number;
  ppg: number;
  projected: number; // ppg * 34
}

interface PointsPaceProps {
  entry: PointsPaceEntry;
  threshold: number;
  thresholdLabel: string;
  teamColor: string;
}

// Fixed scale: 0 to MAX_PTS for all bars
const MAX_PTS = 102; // enough headroom for ~100 pts projections

function PaceBar({ entry, threshold, thresholdLabel, teamColor }: PointsPaceProps) {
  const currentPct = (entry.points / MAX_PTS) * 100;
  const projectedPct = Math.min((entry.projected / MAX_PTS) * 100, 100);
  const thresholdPct = (threshold / MAX_PTS) * 100;
  const isAboveThreshold = entry.projected >= threshold;

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 sm:w-28 flex items-center gap-1.5 flex-shrink-0">
        {teamLogoSrc(entry.team) ? (
          <img src={teamLogoSrc(entry.team)} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
        ) : (
          <div className="w-1 h-4 flex-shrink-0" style={{ backgroundColor: teamColor }} />
        )}
        <span className="text-xs font-medium text-stone-700 truncate sm:hidden">
          {ligaTeamShortNames[entry.team] || entry.team}
        </span>
        <span className="text-xs font-medium text-stone-700 truncate hidden sm:inline">
          {teamDisplayName(entry.team)}
        </span>
      </div>
      <div className="flex-1 h-5 bg-stone-100 relative">
        {/* Threshold line — fixed position for all bars */}
        <div
          className="absolute top-0 bottom-0 w-px bg-stone-800 z-10"
          style={{ left: `${thresholdPct}%` }}
        />
        {/* Current points (solid) */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            width: `${currentPct}%`,
            backgroundColor: teamColor,
            opacity: 0.8,
          }}
        />
        {/* Projected extension (faded) */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: `${currentPct}%`,
            width: `${Math.max(projectedPct - currentPct, 0)}%`,
            backgroundColor: teamColor,
            opacity: 0.25,
          }}
        />
      </div>
      <div className="w-14 text-right flex-shrink-0">
        <span className={`text-xs tabular-nums font-semibold ${isAboveThreshold ? 'text-stone-700' : 'text-red-700'}`}>
          {Math.round(entry.projected)}
        </span>
        <span className="text-[10px] text-stone-400 ml-0.5">pts</span>
      </div>
    </div>
  );
}

interface PointsPaceSectionProps {
  data: PointsPaceEntry[];
  threshold: number;
  labels: {
    sectionLabel?: string;
    thresholdLabel?: string;
  };
}

export function PointsPace({ data, threshold, labels }: PointsPaceSectionProps) {
  if (!data || data.length === 0) return null;

  const thresholdPct = (threshold / MAX_PTS) * 100;

  return (
    <div>
      <div className="relative mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {labels.sectionLabel}
        </div>
        {/* Threshold label aligned with line */}
        <div
          className="absolute text-[10px] font-bold text-stone-500 -translate-x-1/2"
          style={{ left: `calc(${thresholdPct}% + 5.5rem)`, top: 0 }}
        >
          <span className="hidden sm:inline">{labels.thresholdLabel ?? `~${threshold} pts`}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((entry) => (
          <PaceBar
            key={entry.team}
            entry={entry}
            threshold={threshold}
            thresholdLabel={labels.thresholdLabel ?? `~${threshold} pts`}
            teamColor={ligaTeamColors[entry.team] || '#78716c'}
          />
        ))}
      </div>
    </div>
  );
}
