"use client";

import { ligaTeamShortNames, teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import type { TeamStrength } from "@/types/football";

interface TeamStrengthRatingsProps {
  strengths: Record<string, TeamStrength>;
  labels: {
    attack?: string;
    defense?: string;
  };
}

// Consistent color palette — no team colors to avoid the white/red problem
const GOOD_COLOR = '#166534';   // green-800 — strong attack or strong defense
const WEAK_COLOR = '#dc2626';   // red-600  — weak attack or weak defense

export function TeamStrengthRatings({ strengths, labels }: TeamStrengthRatingsProps) {
  if (!strengths || Object.keys(strengths).length === 0) return null;

  const entries = Object.entries(strengths)
    .map(([team, s]) => ({ team, attack: s.attack, defense: s.defense, composite: s.attack - s.defense }))
    .sort((a, b) => b.composite - a.composite);

  // Normalize to the max absolute value across both dimensions
  const maxVal = Math.max(
    ...entries.map(e => Math.abs(e.attack)),
    ...entries.map(e => Math.abs(e.defense)),
    0.01
  );

  return (
    <div>
      {/* Column headers */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-16 sm:w-32 flex-shrink-0" />
        <div className="flex-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1">
          <span className="text-red-400 hidden sm:inline">&larr; pior</span>
          <span>{labels.defense ?? "Defesa"}</span>
          <span className="text-emerald-600 hidden sm:inline">melhor &rarr;</span>
        </div>
        <div className="flex-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1">
          <span className="text-red-400 hidden sm:inline">&larr; pior</span>
          <span>{labels.attack ?? "Ataque"}</span>
          <span className="text-emerald-600 hidden sm:inline">melhor &rarr;</span>
        </div>
      </div>

      <div className="space-y-1">
        {entries.map((entry) => {
          // Defense: negative = good (concedes less), positive = bad
          // We flip it so the bar always goes left-to-right = worse-to-better
          const defenseGoodness = -entry.defense; // flip: positive = good defense
          const defPct = (defenseGoodness / maxVal) * 50;
          const attPct = (entry.attack / maxVal) * 50;

          // Map to 0-100 scale for positioning (50 = center/average)
          const defPos = 50 + defPct;
          const attPos = 50 + attPct;

          return (
            <div key={entry.team} className="flex items-center gap-2">
              <div className="w-16 sm:w-32 flex items-center gap-1.5 flex-shrink-0">
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

              {/* Defense bar — left = bad, right = good */}
              <div className="flex-1 h-5 relative">
                <div className="absolute inset-0 bg-stone-50" />
                {/* Center line (league average) */}
                <div className="absolute top-0 bottom-0 w-px bg-stone-300" style={{ left: '50%' }} />
                {defenseGoodness >= 0 ? (
                  // Good defense — green bar from center to right
                  <div
                    className="absolute top-0 h-full"
                    style={{
                      left: '50%',
                      width: `${defPct}%`,
                      backgroundColor: GOOD_COLOR,
                      opacity: 0.5,
                    }}
                  />
                ) : (
                  // Bad defense — red bar from center to left
                  <div
                    className="absolute top-0 h-full"
                    style={{
                      left: `${defPos}%`,
                      width: `${Math.abs(defPct)}%`,
                      backgroundColor: WEAK_COLOR,
                      opacity: 0.35,
                    }}
                  />
                )}
              </div>

              {/* Attack bar — left = bad, right = good */}
              <div className="flex-1 h-5 relative">
                <div className="absolute inset-0 bg-stone-50" />
                {/* Center line (league average) */}
                <div className="absolute top-0 bottom-0 w-px bg-stone-300" style={{ left: '50%' }} />
                {entry.attack >= 0 ? (
                  // Good attack — green bar from center to right
                  <div
                    className="absolute top-0 h-full"
                    style={{
                      left: '50%',
                      width: `${attPct}%`,
                      backgroundColor: GOOD_COLOR,
                      opacity: 0.5,
                    }}
                  />
                ) : (
                  // Bad attack — red bar from center to left
                  <div
                    className="absolute top-0 h-full"
                    style={{
                      left: `${attPos}%`,
                      width: `${Math.abs(attPct)}%`,
                      backgroundColor: WEAK_COLOR,
                      opacity: 0.35,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
