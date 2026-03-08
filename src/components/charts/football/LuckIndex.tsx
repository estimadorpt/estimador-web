"use client";

import { ligaTeamShortNames, teamLogoSrc, teamDisplayName } from "@/lib/config/football";

export interface LuckEntry {
  team: string;
  actualPts: number;
  expectedPts: number;
  delta: number; // actual - expected (positive = overperforming)
}

interface LuckIndexProps {
  entries: LuckEntry[];
  labels: {
    overperforming?: string;
    underperforming?: string;
  };
}

export function LuckIndex({ entries, labels }: LuckIndexProps) {
  if (!entries || entries.length === 0) return null;

  const maxAbsDelta = Math.max(...entries.map(e => Math.abs(e.delta)), 0.5);

  return (
    <div>
      {/* Scale labels */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-16 sm:w-28 flex-shrink-0" />
        <div className="flex-1 flex justify-between text-[10px] font-bold uppercase tracking-wider px-1">
          <span className="text-red-400">{labels.underperforming ?? "Abaixo do esperado"}</span>
          <span className="text-emerald-600">{labels.overperforming ?? "Acima do esperado"}</span>
        </div>
        <div className="w-16 sm:w-36 flex-shrink-0" />
      </div>

      <div className="space-y-1">
        {entries.map((entry) => {
          const barPct = (Math.abs(entry.delta) / maxAbsDelta) * 45; // max 45% of container width
          const isPositive = entry.delta >= 0;

          return (
            <div key={entry.team} className="flex items-center gap-2">
              {/* Team name */}
              <div className="w-16 sm:w-28 flex items-center gap-1.5 flex-shrink-0">
                {teamLogoSrc(entry.team) ? (
                  <img src={teamLogoSrc(entry.team)} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                ) : (
                  <div className="w-1 h-4 flex-shrink-0 bg-stone-400" />
                )}
                <span className="text-xs font-medium text-stone-700 truncate sm:hidden">
                  {ligaTeamShortNames[entry.team] || entry.team}
                </span>
                <span className="text-xs font-medium text-stone-700 truncate hidden sm:inline">
                  {teamDisplayName(entry.team)}
                </span>
              </div>

              {/* Diverging bar */}
              <div className="flex-1 h-5 relative">
                <div className="absolute inset-0 bg-stone-50" />
                {/* Center line */}
                <div className="absolute top-0 bottom-0 w-px bg-stone-300" style={{ left: '50%' }} />

                {isPositive ? (
                  // Overperforming — green bar extends right from center
                  <div
                    className="absolute top-0 h-full"
                    style={{
                      left: '50%',
                      width: `${barPct}%`,
                      backgroundColor: '#166534',
                      opacity: 0.45,
                    }}
                  />
                ) : (
                  // Underperforming — red bar extends left from center
                  <div
                    className="absolute top-0 h-full"
                    style={{
                      left: `${50 - barPct}%`,
                      width: `${barPct}%`,
                      backgroundColor: '#dc2626',
                      opacity: 0.35,
                    }}
                  />
                )}

                {/* Delta label on bar */}
                {Math.abs(entry.delta) >= 0.5 && (
                  <div
                    className="absolute top-0 h-full flex items-center text-[10px] font-bold tabular-nums"
                    style={{
                      ...(isPositive
                        ? { left: `${50 + barPct + 1}%` }
                        : { right: `${50 + barPct + 1}%` }),
                      color: isPositive ? '#166534' : '#dc2626',
                    }}
                  >
                    {isPositive ? '+' : ''}{entry.delta.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Actual vs expected annotation */}
              <div className="w-16 sm:w-36 text-right flex-shrink-0">
                <span className="text-xs tabular-nums font-semibold text-stone-700">
                  {entry.actualPts}
                </span>
                <span className="text-[10px] text-stone-400 mx-0.5">vs</span>
                <span className="text-xs tabular-nums text-stone-400">
                  {entry.expectedPts.toFixed(0)}
                </span>
                <span className="text-[10px] text-stone-300 ml-0.5 hidden sm:inline">xPts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
