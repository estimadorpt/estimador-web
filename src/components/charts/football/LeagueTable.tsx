"use client";

import { ligaTeamColors, ligaTeamShortNames, ligaTeamSlugs, teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import type { ActualStanding, TeamStanding } from "@/types/football";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface LeagueTableProps {
  data: TeamStanding[];
  actualStandings?: ActualStanding[];
  labels: {
    team: string;
    meanPoints: string;
    goalDifference: string;
    championship: string;
    top3: string;
    relegation: string;
    teamClickHint?: string;
    played?: string;
    actualPoints?: string;
  };
}

function formatProb(value: number): string {
  const pct = value * 100;
  if (pct > 99 && pct < 100) return ">99%";
  if (pct < 1 && pct > 0) return "<1%";
  if (pct === 0) return "—";
  if (pct === 100) return "100%";
  return `${Math.round(pct)}%`;
}

/**
 * Largest remainder method: round probabilities so they sum to 100%.
 * Returns a map from index to display string.
 */
function roundToSum100(values: number[]): string[] {
  const pcts = values.map(v => v * 100);
  const floors = pcts.map(p => Math.floor(p));
  let remainder = 100 - floors.reduce((s, f) => s + f, 0);

  // Sort by fractional part descending, allocate +1 to largest remainders
  const indices = values.map((_, i) => i);
  indices.sort((a, b) => (pcts[b] - floors[b]) - (pcts[a] - floors[a]));

  const result = [...floors];
  for (const idx of indices) {
    if (remainder <= 0) break;
    result[idx] += 1;
    remainder -= 1;
  }

  return result.map((r, i) => {
    const raw = pcts[i];
    if (raw > 99 && raw < 100) return ">99%";
    if (raw < 1 && raw > 0) return "<1%";
    if (raw === 0) return "—";
    if (raw === 100) return "100%";
    return `${r}%`;
  });
}

export function LeagueTable({ data, actualStandings, labels }: LeagueTableProps) {
  const locale = useLocale();
  const router = useRouter();
  const [showHint, setShowHint] = useState(false);

  // Build lookup for actual standings
  const actualLookup = new Map<string, ActualStanding>();
  if (actualStandings) {
    for (const s of actualStandings) {
      actualLookup.set(s.team, s);
    }
  }
  const hasActual = actualLookup.size > 0;

  // Pre-compute consistent rounded probabilities (sum to 100%)
  const champRounded = roundToSum100(data.map(t => t.p_champion));
  const relegRounded = roundToSum100(data.map(t => t.p_relegation));

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try { localStorage.setItem("liga-team-hint-seen", "1"); } catch {}
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem("liga-team-hint-seen")) {
        setShowHint(true);
        const timer = setTimeout(dismissHint, 8000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [dismissHint]);

  if (!data || data.length === 0) return null;

  const handleTeamClick = (teamName: string) => {
    const slug = ligaTeamSlugs[teamName];
    if (slug) {
      dismissHint();
      router.push(`/${locale}/desporto/liga/${slug}`);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-stone-800 text-left">
            <th className="py-2 pr-2 w-8 text-stone-500 font-medium">#</th>
            <th className="py-2 pr-4 font-medium">{labels.team}</th>
            {hasActual && (
              <>
                <th className="py-2 px-2 text-right font-medium hidden sm:table-cell text-stone-500 text-xs">{labels.played ?? "J"}</th>
                <th className="py-2 px-2 text-right font-medium text-xs">{labels.actualPoints ?? "Pts"}</th>
              </>
            )}
            <th className="py-2 px-3 text-right font-medium">{labels.meanPoints}</th>
            <th className="py-2 px-3 text-right font-medium hidden sm:table-cell">{labels.goalDifference}</th>
            <th className="py-2 px-3 text-right font-medium">{labels.championship}</th>
            <th className="py-2 px-3 text-right font-medium hidden sm:table-cell">{labels.top3}</th>
            <th className="py-2 px-3 text-right font-medium">{labels.relegation}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((team, i) => {
            const color = ligaTeamColors[team.team] || '#78716c';
            const isRelegationZone = i >= data.length - 3;
            const isChampionZone = i < 3;
            return (
              <tr
                key={team.team}
                className={`border-b border-stone-200 ${
                  isRelegationZone ? 'bg-red-50/40' : isChampionZone ? 'bg-stone-50' : ''
                }`}
              >
                <td className="py-2.5 pr-2 text-stone-400 tabular-nums">{i + 1}</td>
                <td className="py-2.5 pr-4">
                  <div
                    className="flex items-center gap-2 cursor-pointer group relative"
                    onClick={() => handleTeamClick(team.team)}
                  >
                    {teamLogoSrc(team.team) ? (
                      <img
                        src={teamLogoSrc(team.team)}
                        alt=""
                        className="w-5 h-5 flex-shrink-0 object-contain"
                      />
                    ) : (
                      <div
                        className="w-1 h-5 flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    <span className="font-medium text-stone-900 group-hover:text-blue-700 transition-colors sm:hidden">
                      {ligaTeamShortNames[team.team] || team.team}
                    </span>
                    <span className="font-medium text-stone-900 group-hover:text-blue-700 transition-colors hidden sm:inline">
                      {teamDisplayName(team.team)}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    {/* Tooltip on first row */}
                    <AnimatePresence>
                      {i === 0 && showHint && labels.teamClickHint && (
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.3 }}
                          className="pointer-events-none flex-shrink-0 ml-1"
                        >
                          <div className="relative bg-stone-800 text-white text-[11px] px-2.5 py-1 whitespace-nowrap shadow-lg flex items-center">
                            {/* Arrow pointing left */}
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-stone-800 rotate-45" />
                            <span className="relative">{labels.teamClickHint}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </td>
                {hasActual && (() => {
                  const actual = actualLookup.get(team.team);
                  if (!actual) return <><td className="py-2.5 px-2 text-right hidden sm:table-cell" /><td className="py-2.5 px-2 text-right" /></>;
                  return (
                    <>
                      <td className="py-2.5 px-2 text-right tabular-nums text-stone-400 text-xs hidden sm:table-cell">
                        {actual.played}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-semibold">
                        {actual.points}
                      </td>
                    </>
                  );
                })()}
                <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                  {team.mean_pts.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-stone-500 hidden sm:table-cell">
                  {team.mean_gd > 0 ? '+' : ''}{team.mean_gd.toFixed(0)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  <span className={team.p_champion > 0.01 ? 'font-semibold' : 'text-stone-400'}>
                    {champRounded[i]}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums hidden sm:table-cell">
                  {formatProb(team.p_top3)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  <span className={team.p_relegation > 0.1 ? 'font-semibold text-red-700' : team.p_relegation > 0 ? 'text-red-600' : 'text-stone-400'}>
                    {relegRounded[i]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
