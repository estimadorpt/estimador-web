"use client";

import { useState, useMemo } from "react";
import { teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import type { CriticalPathMatch, PointsLookupEntry } from "@/types/football";
import { RotateCcw } from "lucide-react";

type Outcome = "W" | "D" | "L";

interface PathBuilderProps {
  matches: CriticalPathMatch[];
  pCurrent: number;
  target: "champion" | "survival";
  teamColor: string;
  /** Points-to-probability lookup: remaining_points → {p_target, n_sims} */
  pointsLookup?: Record<string, PointsLookupEntry>;
  labels: {
    matchdayAbbr: string;
    win: string;
    draw: string;
    loss: string;
    home: string;
    away: string;
    resetAll: string;
    pointsFromPicks: string;
    expectedPoints: string;
    yourScenario: string;
    championship: string;
    survival: string;
  };
}

function outcomePoints(o: Outcome): number {
  return o === "W" ? 3 : o === "D" ? 1 : 0;
}

/**
 * Interpolate P(target) from the lookup table for a given remaining-points value.
 * Uses linear interpolation between the two nearest entries.
 */
function interpolateLookup(
  lookup: Record<string, PointsLookupEntry>,
  points: number
): number | null {
  const entries = Object.entries(lookup)
    .map(([k, v]) => ({ pts: parseInt(k), p: v.p_target }))
    .sort((a, b) => a.pts - b.pts);

  if (entries.length === 0) return null;

  // Exact match
  const exact = entries.find((e) => e.pts === points);
  if (exact) return exact.p;

  // Below minimum
  if (points < entries[0].pts) return entries[0].p;
  // Above maximum
  if (points > entries[entries.length - 1].pts)
    return entries[entries.length - 1].p;

  // Linear interpolation between two nearest
  for (let i = 0; i < entries.length - 1; i++) {
    if (points >= entries[i].pts && points <= entries[i + 1].pts) {
      const t =
        (points - entries[i].pts) / (entries[i + 1].pts - entries[i].pts);
      return entries[i].p + t * (entries[i + 1].p - entries[i].p);
    }
  }

  return null;
}

export function PathBuilder({
  matches,
  pCurrent,
  target,
  teamColor,
  pointsLookup,
  labels,
}: PathBuilderProps) {
  const [selections, setSelections] = useState<Record<number, Outcome>>({});

  const sorted = useMemo(
    () => [...matches].sort((a, b) => a.matchday - b.matchday),
    [matches]
  );

  const hasSelections = Object.keys(selections).length > 0;

  // Compute running probability using lookup table
  // Strategy: at each row, compute "if all remaining unselected matches go as expected,
  // what's the probability given picks so far?"
  const withDeltas = useMemo(() => {
    if (!pointsLookup) {
      // Fallback: no lookup available, use Bayesian LR (imperfect but functional)
      let cumProb = pCurrent;
      return sorted.map((m, i) => {
        const sel = selections[i];
        const prevProb = cumProb;
        if (sel) {
          const pGivenTarget =
            sel === "W"
              ? m.p_win_given_target
              : sel === "D"
              ? m.p_draw_given_target
              : m.p_loss_given_target;
          const pOverall =
            sel === "W"
              ? m.p_win_overall
              : sel === "D"
              ? m.p_draw_overall
              : m.p_loss_overall;
          if (pOverall > 0 && cumProb > 0 && cumProb < 1) {
            const lr = pGivenTarget / pOverall;
            const odds = (cumProb / (1 - cumProb)) * lr;
            cumProb = odds / (1 + odds);
          }
        }
        return { prob: cumProb, delta: cumProb - prevProb, selected: !!sel };
      });
    }

    // Lookup-based: for each row, compute total remaining points as:
    // picked points (from selected matches) + expected points (from unselected matches)
    // Then look up P(target | remaining_points) from the simulation data.

    // First compute expected points from ALL matches (baseline)
    const totalExpected = sorted.reduce(
      (sum, m) => sum + m.p_win_overall * 3 + m.p_draw_overall * 1,
      0
    );

    // For each row, track: cumulative picked points, cumulative expected points replaced
    const results: { prob: number; delta: number; selected: boolean }[] = [];
    let pickedPoints = 0;
    let expectedReplaced = 0; // how much expected we've replaced with actual picks

    for (let i = 0; i < sorted.length; i++) {
      const m = sorted[i];
      const sel = selections[i];
      const matchExpected = m.p_win_overall * 3 + m.p_draw_overall * 1;

      if (sel) {
        pickedPoints += outcomePoints(sel);
        expectedReplaced += matchExpected;
      }

      // Estimated total remaining = picked + expected from unpicked
      const estimatedTotal = pickedPoints + (totalExpected - expectedReplaced);
      const prevProb = i === 0 ? pCurrent : results[i - 1].prob;

      if (!hasSelections) {
        // No selections yet — show baseline
        results.push({ prob: pCurrent, delta: 0, selected: false });
      } else {
        const lookedUp = interpolateLookup(pointsLookup, estimatedTotal);
        const prob = lookedUp !== null ? lookedUp : pCurrent;
        results.push({ prob, delta: prob - prevProb, selected: !!sel });
      }
    }

    return results;
  }, [sorted, selections, pCurrent, pointsLookup, hasSelections]);

  const finalProb =
    withDeltas.length > 0 ? withDeltas[withDeltas.length - 1].prob : pCurrent;

  // Points tally
  const pointsFromPicks = Object.entries(selections).reduce(
    (sum, [, o]) => sum + outcomePoints(o),
    0
  );
  const expectedPoints = sorted.reduce(
    (sum, m) => sum + m.p_win_overall * 3 + m.p_draw_overall * 1,
    0
  );

  function toggle(index: number, outcome: Outcome) {
    setSelections((prev) => {
      const next = { ...prev };
      if (next[index] === outcome) {
        delete next[index];
      } else {
        next[index] = outcome;
      }
      return next;
    });
  }

  const targetLabel =
    target === "champion" ? labels.championship : labels.survival;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-200">
        <div className="w-8 text-center">{labels.matchdayAbbr}</div>
        <div className="w-36 md:w-44" />
        <div className="flex gap-1 w-[6.5rem]">
          <div className="w-8 text-center">{labels.win.charAt(0)}</div>
          <div className="w-8 text-center">{labels.draw.charAt(0)}</div>
          <div className="w-8 text-center">{labels.loss.charAt(0)}</div>
        </div>
        <div className="flex-1 text-right">{targetLabel}</div>
      </div>

      {/* Match rows */}
      <div className="divide-y divide-stone-100">
        {sorted.map((m, i) => {
          const sel = selections[i];
          const rp = withDeltas[i];
          const probPct = Math.round(rp.prob * 100);
          const prevPct = i === 0 ? Math.round(pCurrent * 100) : Math.round(withDeltas[i - 1].prob * 100);
          const deltaPp = probPct - prevPct;
          const isMuted = !sel && hasSelections;

          return (
            <div
              key={i}
              className={`flex items-center gap-2 py-1.5 transition-opacity ${
                isMuted ? "opacity-40" : ""
              }`}
            >
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

              {/* W/D/L toggle buttons */}
              <div className="flex gap-1 w-[6.5rem]">
                {(["W", "D", "L"] as Outcome[]).map((o) => {
                  const isSelected = sel === o;
                  const label =
                    o === "W"
                      ? labels.win.charAt(0)
                      : o === "D"
                      ? labels.draw.charAt(0)
                      : labels.loss.charAt(0);
                  let bg = "transparent";
                  let color = "#a8a29e";
                  let border = "2px solid #e7e5e4";
                  if (isSelected) {
                    if (o === "W") {
                      bg = teamColor;
                      color = "#fff";
                      border = `2px solid ${teamColor}`;
                    } else if (o === "D") {
                      bg = "#78716c";
                      color = "#fff";
                      border = "2px solid #78716c";
                    } else {
                      bg = "#ef4444";
                      color = "#fff";
                      border = "2px solid #ef4444";
                    }
                  }
                  return (
                    <button
                      key={o}
                      onClick={() => toggle(i, o)}
                      className="w-8 h-8 text-[11px] font-bold transition-all"
                      style={{ backgroundColor: bg, color, border }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Running probability + delta */}
              <div className="flex-1 flex items-center justify-end gap-1.5 tabular-nums">
                <span
                  className="text-sm font-bold"
                  style={{ color: rp.selected ? teamColor : "#a8a29e" }}
                >
                  {probPct}%
                </span>
                {rp.selected && deltaPp !== 0 && (
                  <span
                    className={`text-[11px] font-medium ${
                      deltaPp > 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {deltaPp > 0 ? "+" : ""}
                    {deltaPp}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary strip */}
      {hasSelections && (
        <div className="mt-4 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-500">
            <span>
              <strong className="text-stone-800">{pointsFromPicks}</strong>{" "}
              {labels.pointsFromPicks} ({Object.keys(selections).length}/
              {sorted.length})
            </span>
            <span>
              {labels.expectedPoints}:{" "}
              <strong className="text-stone-800">
                {Math.round(expectedPoints)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {labels.yourScenario}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-2xl font-black tabular-nums"
                  style={{ color: teamColor }}
                >
                  {Math.round(finalProb * 100)}%
                </span>
                {(() => {
                  const finalPct = Math.round(finalProb * 100);
                  const basePct = Math.round(pCurrent * 100);
                  const diff = finalPct - basePct;
                  if (diff === 0) return null;
                  return (
                    <span
                      className={`text-sm font-bold ${
                        diff > 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff}pp
                    </span>
                  );
                })()}
              </div>
            </div>
            <button
              onClick={() => setSelections({})}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {labels.resetAll}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
