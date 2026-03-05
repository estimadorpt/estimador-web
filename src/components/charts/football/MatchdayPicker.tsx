"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ligaTeamColors, teamLogoSrc } from "@/lib/config/football";
import type { NextMatchdayScenarios } from "@/types/football";

type Outcome = "H" | "D" | "A";

interface MatchdayPickerProps {
  data: NextMatchdayScenarios;
  labels: {
    whatIfTitle: string;
    whatIfDescription: string;
    resetAll: string;
    impactOnTitle: string;
    impactOnRelegation: string;
    noChange: string;
    home: string;
    draw: string;
    away: string;
    win: string;
  };
}

function formatDelta(delta: number): string {
  const pct = delta * 100;
  if (Math.abs(pct) < 0.5) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${Math.round(pct)}%`;
}

function formatPct(value: number): string {
  const pct = value * 100;
  if (pct > 99 && pct < 100) return ">99%";
  if (pct < 1 && pct > 0) return "<1%";
  return `${Math.round(pct)}%`;
}

export function MatchdayPicker({ data, labels }: MatchdayPickerProps) {
  const [selections, setSelections] = useState<Record<number, Outcome | null>>(
    {}
  );

  const hasSelections = Object.values(selections).some((v) => v !== null);

  const toggleSelection = (matchIdx: number, outcome: Outcome) => {
    setSelections((prev) => ({
      ...prev,
      [matchIdx]: prev[matchIdx] === outcome ? null : outcome,
    }));
  };

  const resetAll = () => setSelections({});

  // Compute combined deltas using linear approximation (sum of individual deltas)
  const probabilities = useMemo(() => {
    const teamDeltas: Record<
      string,
      { p_champion: number; p_top3: number; p_relegation: number }
    > = {};

    // Initialize with baseline
    const result: Record<
      string,
      { p_champion: number; p_top3: number; p_relegation: number }
    > = {};
    for (const [team, base] of Object.entries(data.baseline)) {
      result[team] = { ...base };
      teamDeltas[team] = { p_champion: 0, p_top3: 0, p_relegation: 0 };
    }

    // Accumulate deltas from selected match outcomes
    for (const [idxStr, outcome] of Object.entries(selections)) {
      if (!outcome) continue;
      const idx = parseInt(idxStr);
      const match = data.matches[idx];
      if (!match) continue;

      const cond = match.conditionals[outcome];
      for (const [team, condProbs] of Object.entries(cond.teams)) {
        const base = data.baseline[team];
        if (!base) continue;
        teamDeltas[team].p_champion += condProbs.p_champion - base.p_champion;
        teamDeltas[team].p_top3 += condProbs.p_top3 - base.p_top3;
        teamDeltas[team].p_relegation +=
          condProbs.p_relegation - base.p_relegation;
      }
    }

    // Apply clamped deltas
    for (const [team, base] of Object.entries(data.baseline)) {
      result[team] = {
        p_champion: Math.min(
          1,
          Math.max(0, base.p_champion + teamDeltas[team].p_champion)
        ),
        p_top3: Math.min(
          1,
          Math.max(0, base.p_top3 + teamDeltas[team].p_top3)
        ),
        p_relegation: Math.min(
          1,
          Math.max(0, base.p_relegation + teamDeltas[team].p_relegation)
        ),
      };
    }

    return result;
  }, [data, selections]);

  // Teams with meaningful title or relegation probabilities
  const titleTeams = useMemo(() => {
    return Object.entries(data.baseline)
      .filter(([, b]) => b.p_champion > 0.005)
      .sort((a, b) => b[1].p_champion - a[1].p_champion)
      .map(([team]) => team);
  }, [data.baseline]);

  const relegationTeams = useMemo(() => {
    return Object.entries(data.baseline)
      .filter(([, b]) => b.p_relegation > 0.01)
      .sort((a, b) => b[1].p_relegation - a[1].p_relegation)
      .map(([team]) => team);
  }, [data.baseline]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Match picker */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {labels.whatIfDescription}
          </div>
          {hasSelections && (
            <button
              onClick={resetAll}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              {labels.resetAll}
            </button>
          )}
        </div>

        <div className="space-y-1">
          {data.matches.map((match, idx) => {
            const selected = selections[idx] ?? null;
            const homeColor = ligaTeamColors[match.home_team] || "#78716c";
            const awayColor = ligaTeamColors[match.away_team] || "#78716c";

            return (
              <div
                key={idx}
                className="flex items-center gap-2 py-2 border-b border-stone-100 last:border-b-0"
              >
                {/* Home team */}
                <div className="flex items-center gap-1.5 w-[120px] justify-end">
                  <span className="text-xs font-medium text-stone-700 text-right truncate">
                    {match.home_team}
                  </span>
                  {teamLogoSrc(match.home_team) && (
                    <img
                      src={teamLogoSrc(match.home_team)}
                      alt=""
                      className="w-5 h-5 object-contain flex-shrink-0"
                    />
                  )}
                </div>

                {/* H/D/A buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleSelection(idx, "H")}
                    className="w-8 h-8 rounded text-[11px] font-bold transition-all"
                    style={{
                      backgroundColor:
                        selected === "H" ? homeColor : "transparent",
                      color: selected === "H" ? "#fff" : "#a8a29e",
                      border:
                        selected === "H"
                          ? `2px solid ${homeColor}`
                          : "2px solid #e7e5e4",
                    }}
                  >
                    {labels.home.charAt(0)}
                  </button>
                  <button
                    onClick={() => toggleSelection(idx, "D")}
                    className="w-8 h-8 rounded text-[11px] font-bold transition-all"
                    style={{
                      backgroundColor:
                        selected === "D" ? "#78716c" : "transparent",
                      color: selected === "D" ? "#fff" : "#a8a29e",
                      border:
                        selected === "D"
                          ? "2px solid #78716c"
                          : "2px solid #e7e5e4",
                    }}
                  >
                    {labels.draw.charAt(0)}
                  </button>
                  <button
                    onClick={() => toggleSelection(idx, "A")}
                    className="w-8 h-8 rounded text-[11px] font-bold transition-all"
                    style={{
                      backgroundColor:
                        selected === "A" ? awayColor : "transparent",
                      color: selected === "A" ? "#fff" : "#a8a29e",
                      border:
                        selected === "A"
                          ? `2px solid ${awayColor}`
                          : "2px solid #e7e5e4",
                    }}
                  >
                    {labels.away.charAt(0)}
                  </button>
                </div>

                {/* Away team */}
                <div className="flex items-center gap-1.5 w-[120px]">
                  {teamLogoSrc(match.away_team) && (
                    <img
                      src={teamLogoSrc(match.away_team)}
                      alt=""
                      className="w-5 h-5 object-contain flex-shrink-0"
                    />
                  )}
                  <span className="text-xs font-medium text-stone-700 truncate">
                    {match.away_team}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Probability impact */}
      <div>
        {/* Title race */}
        {titleTeams.length > 0 && (
          <div className="mb-6">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">
              {labels.impactOnTitle}
            </div>
            <div className="space-y-2">
              {titleTeams.map((team) => {
                const base = data.baseline[team];
                const current = probabilities[team];
                const delta = current.p_champion - base.p_champion;
                const teamColor = ligaTeamColors[team] || "#78716c";

                return (
                  <div key={team} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-[100px]">
                      {teamLogoSrc(team) && (
                        <img
                          src={teamLogoSrc(team)}
                          alt=""
                          className="w-4 h-4 object-contain flex-shrink-0"
                        />
                      )}
                      <span className="text-xs font-medium text-stone-700 truncate">
                        {team}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="flex-1 h-5 bg-stone-100 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0"
                        style={{ backgroundColor: teamColor }}
                        initial={false}
                        animate={{ width: `${current.p_champion * 100}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </div>

                    {/* Value */}
                    <div className="w-[44px] text-right">
                      <span className="text-xs font-bold tabular-nums text-stone-800">
                        {formatPct(current.p_champion)}
                      </span>
                    </div>

                    {/* Delta */}
                    <AnimatePresence mode="wait">
                      {hasSelections && (
                        <motion.div
                          key={`${team}-delta`}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          className="w-[40px] text-right"
                        >
                          <span
                            className={`text-[11px] font-bold tabular-nums ${
                              delta > 0.005
                                ? "text-emerald-600"
                                : delta < -0.005
                                ? "text-red-600"
                                : "text-stone-400"
                            }`}
                          >
                            {formatDelta(delta)}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Relegation */}
        {relegationTeams.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">
              {labels.impactOnRelegation}
            </div>
            <div className="space-y-2">
              {relegationTeams.map((team) => {
                const base = data.baseline[team];
                const current = probabilities[team];
                const delta = current.p_relegation - base.p_relegation;
                const teamColor = ligaTeamColors[team] || "#78716c";

                return (
                  <div key={team} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-[100px]">
                      {teamLogoSrc(team) && (
                        <img
                          src={teamLogoSrc(team)}
                          alt=""
                          className="w-4 h-4 object-contain flex-shrink-0"
                        />
                      )}
                      <span className="text-xs font-medium text-stone-700 truncate">
                        {team}
                      </span>
                    </div>

                    <div className="flex-1 h-5 bg-stone-100 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0"
                        style={{ backgroundColor: teamColor, opacity: 0.7 }}
                        initial={false}
                        animate={{ width: `${current.p_relegation * 100}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </div>

                    <div className="w-[44px] text-right">
                      <span className="text-xs font-bold tabular-nums text-stone-800">
                        {formatPct(current.p_relegation)}
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      {hasSelections && (
                        <motion.div
                          key={`${team}-releg-delta`}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          className="w-[40px] text-right"
                        >
                          <span
                            className={`text-[11px] font-bold tabular-nums ${
                              delta > 0.005
                                ? "text-red-600"
                                : delta < -0.005
                                ? "text-emerald-600"
                                : "text-stone-400"
                            }`}
                          >
                            {formatDelta(delta)}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
