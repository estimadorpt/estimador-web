"use client";

import { ligaTeamColors } from "@/lib/config/football";
import type { PositionProbs, TeamStanding } from "@/types/football";

interface PositionHeatmapProps {
  positionProbs: PositionProbs;
  table: TeamStanding[];
  labels: {
    team: string;
    position: string;
  };
}

function getCellColor(value: number): string {
  if (value === 0) return "transparent";
  if (value < 0.01) return "#f5f5f4"; // stone-100
  if (value < 0.05) return "#e7e5e4"; // stone-200
  if (value < 0.10) return "#d6d3d1"; // stone-300
  if (value < 0.20) return "#a8a29e"; // stone-400
  if (value < 0.40) return "#78716c"; // stone-500
  if (value < 0.60) return "#57534e"; // stone-600
  if (value < 0.80) return "#44403c"; // stone-700
  return "#292524"; // stone-800
}

function getTextColor(value: number): string {
  if (value >= 0.20) return "#fff";
  return "#44403c";
}

export function PositionHeatmap({ positionProbs, table, labels }: PositionHeatmapProps) {
  if (!positionProbs || !table || table.length === 0) return null;

  // Use table order (already sorted by predicted finish)
  const teams = table.map(t => t.team);
  const positions = Array.from({ length: teams.length }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full" style={{ minWidth: `${teams.length * 32 + 120}px` }}>
        <thead>
          <tr className="border-b border-stone-300">
            <th className="py-1.5 pr-2 text-left font-medium text-stone-600 sticky left-0 bg-white z-10">
              {labels.team}
            </th>
            {positions.map(pos => (
              <th key={pos} className="py-1.5 px-0 text-center font-medium text-stone-500 w-8">
                {pos}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map(team => {
            const probs = positionProbs[team] || [];
            const teamColor = ligaTeamColors[team] || '#78716c';
            return (
              <tr key={team} className="border-b border-stone-100">
                <td className="py-1 pr-2 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-4" style={{ backgroundColor: teamColor }} />
                    <span className="font-medium text-stone-800 whitespace-nowrap">{team}</span>
                  </div>
                </td>
                {positions.map((_, posIdx) => {
                  const prob = probs[posIdx] || 0;
                  const bg = getCellColor(prob);
                  const color = getTextColor(prob);
                  return (
                    <td
                      key={posIdx}
                      className="py-1 px-0 text-center tabular-nums"
                      style={{ backgroundColor: bg, color }}
                    >
                      {prob >= 0.005 ? Math.round(prob * 100) : ''}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
