"use client";

import React from "react";
import type {
  TeamNarrativeScenarios,
  NarrativeScenario,
  ScenarioStep,
  ScenarioRivalCondition,
} from "@/types/football";
import { ligaTeamColors, ligaTeamShortNames } from "@/lib/config/football";

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(v: number): string {
  const rounded = Math.round(v * 100);
  if (rounded >= 100) return ">99%";
  if (rounded <= 0 && v > 0) return "<1%";
  return `${rounded}%`;
}

/** Safe CSS percentage — never returns ">99%" or "<1%", always a clean number */
function cssPct(v: number): string {
  return `${Math.min(Math.max(Math.round(v * 100), 0), 100)}%`;
}

/** Generate a one-line summary of the scenario from its steps */
function scenarioSummary(
  scenario: NarrativeScenario,
  labels: { win: string; draw: string; loss: string },
): string {
  const wins = scenario.steps.filter(s => s.result === "W").length;
  const draws = scenario.steps.filter(s => s.result === "D").length;
  const losses = scenario.steps.filter(s => s.result === "L").length;
  const parts: string[] = [];
  if (wins > 0) parts.push(`${wins} ${wins === 1 ? labels.win : labels.win}`);
  if (draws > 0) parts.push(`${draws} ${draws === 1 ? labels.draw : labels.draw}`);
  if (losses > 0) parts.push(`${losses} ${losses === 1 ? labels.loss : labels.loss}`);
  return parts.join(", ");
}

// ── Components ──────────────────────────────────────────────────────────────

interface StepLabels {
  resultWin: string;
  resultDraw: string;
  resultLoss: string;
  matchdayPrefix: string;
  home: string;
  away: string;
}

function StepRow({
  step,
  teamColor,
  prevP,
  labels,
}: {
  step: ScenarioStep;
  teamColor: string;
  prevP: number;
  labels: StepLabels;
}) {
  const delta = step.p_target_after - prevP;
  const isPositive = delta >= 0;

  const resultLabel =
    step.result === "W" ? labels.resultWin
    : step.result === "D" ? labels.resultDraw
    : labels.resultLoss;

  const venueLabel = step.venue === "H" ? labels.home : labels.away;

  return (
    <div className="flex items-center gap-2 py-2 border-b border-stone-100 last:border-0">
      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-stone-400 tabular-nums w-7 shrink-0">
            {labels.matchdayPrefix}{step.matchday}
          </span>
          <span className="text-sm text-stone-700 truncate sm:hidden">
            {ligaTeamShortNames[step.opponent] || step.opponent}
          </span>
          <span className="text-sm text-stone-700 truncate hidden sm:inline">
            {step.opponent}
          </span>
          <span className="text-[10px] text-stone-400 shrink-0">({venueLabel})</span>
          <span
            className={`text-[10px] font-bold px-1 py-0.5 shrink-0 ${
              step.result === "L"
                ? "bg-red-50 text-red-600"
                : step.result === "D"
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {resultLabel}
          </span>
        </div>

        {/* Bar */}
        <div className="h-5 bg-stone-100 relative overflow-hidden mt-1 w-full">
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: cssPct(Math.min(prevP, step.p_target_after)),
              backgroundColor: teamColor,
              opacity: 0.25,
            }}
          />
          {isPositive ? (
            <div
              className="absolute inset-y-0"
              style={{
                left: cssPct(prevP),
                width: cssPct(delta),
                backgroundColor: teamColor,
                opacity: 0.6,
              }}
            />
          ) : (
            <div
              className="absolute inset-y-0"
              style={{
                left: cssPct(step.p_target_after),
                width: cssPct(-delta),
                backgroundColor: "#dc2626",
                opacity: 0.4,
              }}
            />
          )}
        </div>
      </div>

      {/* Probability: from → to */}
      <div className="w-20 shrink-0 text-right">
        <span className="text-xs tabular-nums text-stone-400">
          {pct(prevP)}
        </span>
        <span className="text-stone-300 mx-0.5">&rarr;</span>
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: isPositive ? teamColor : "#dc2626" }}
        >
          {pct(step.p_target_after)}
        </span>
      </div>
    </div>
  );
}

function RivalConditions({
  conditions,
  labels,
}: {
  conditions: ScenarioRivalCondition[];
  labels: {
    thisWorksBecause: string;
    dropsPointsVs: string;
    matchdayPrefix: string;
  };
}) {
  if (conditions.length === 0) return null;

  return (
    <div className="px-3 md:px-4 py-2 border-t border-stone-100 bg-stone-50/50">
      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
        {labels.thisWorksBecause}
      </div>
      <div className="space-y-1">
        {conditions.map((rc, i) => {
          const rivalColor = ligaTeamColors[rc.rival] || "#78716c";
          return (
            <div key={i} className="text-xs text-stone-600">
              <span className="font-medium" style={{ color: rivalColor }}>
                {rc.rival}
              </span>
              {" "}
              {labels.dropsPointsVs}{" "}
              <span className="sm:hidden">{ligaTeamShortNames[rc.opponent] || rc.opponent}</span>
              <span className="hidden sm:inline">{rc.opponent}</span>
              <span className="text-stone-400"> ({labels.matchdayPrefix}{rc.matchday})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ScenarioCardLabels {
  scenarioComfortable: string;
  scenarioRealistic: string;
  scenarioUnlikely: string;
  ofChampionSims: string;
  thisWorksBecause: string;
  dropsPointsVs: string;
  resultWin: string;
  resultDraw: string;
  resultLoss: string;
  matchdayPrefix: string;
  home: string;
  away: string;
  winAbbr: string;
  drawAbbr: string;
  lossAbbr: string;
}

function ScenarioCard({
  scenario,
  teamColor,
  index,
  pCurrent,
  labels,
  summary,
}: {
  scenario: NarrativeScenario;
  teamColor: string;
  index: number;
  pCurrent: number;
  labels: ScenarioCardLabels;
  summary: string;
}) {
  const baseName =
    scenario.label === "comfortable"
      ? labels.scenarioComfortable
      : scenario.label === "realistic"
      ? labels.scenarioRealistic
      : labels.scenarioUnlikely;

  const finalP = scenario.steps[scenario.steps.length - 1]?.p_target_after ?? pCurrent;

  return (
    <div className="border border-stone-200">
      {/* Accent bar */}
      <div
        className="h-1"
        style={{ backgroundColor: teamColor }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-3 md:p-4 border-b border-stone-100 bg-stone-50">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-stone-900">
            {baseName}
          </h4>
          <div className="text-xs text-stone-500 mt-0.5">
            {summary}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            <span className="tabular-nums font-medium">{pct(scenario.frequency)}</span>{" "}
            {labels.ofChampionSims}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-stone-400 tabular-nums">
            {pct(pCurrent)}
          </div>
          <div className="text-stone-300">&darr;</div>
          <div
            className="text-lg font-black tabular-nums"
            style={{ color: teamColor }}
          >
            {pct(finalP)}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="px-3 md:px-4">
        {scenario.steps.map((step, i) => {
          const prevP =
            i === 0 ? pCurrent : scenario.steps[i - 1].p_target_after;
          return (
            <StepRow
              key={i}
              step={step}
              teamColor={teamColor}
              prevP={prevP}
              labels={labels}
            />
          );
        })}
      </div>

      {/* Rival conditions */}
      <RivalConditions
        conditions={scenario.rival_conditions}
        labels={labels}
      />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function NarrativeScenarios({
  data,
  labels,
}: {
  data: TeamNarrativeScenarios;
  labels: {
    scenarioComfortable: string;
    scenarioRealistic: string;
    scenarioUnlikely: string;
    ofChampionSims: string;
    ofSurvivalSims: string;
    thisWorksBecause: string;
    dropsPointsVs: string;
    resultWin: string;
    resultDraw: string;
    resultLoss: string;
    matchdayPrefix: string;
    home: string;
    away: string;
    winAbbr: string;
    drawAbbr: string;
    lossAbbr: string;
  };
}) {
  const teamColor = ligaTeamColors[data.team] || "#78716c";

  // Use the right frequency label based on target
  const adjustedLabels = {
    ...labels,
    ofChampionSims:
      data.target === "survival" ? labels.ofSurvivalSims : labels.ofChampionSims,
  };

  // Sort by frequency descending (most common scenario first)
  const sorted = [...data.scenarios].sort((a, b) => b.frequency - a.frequency);

  return (
    <div className="space-y-3">
      {sorted.map((scenario, i) => (
          <ScenarioCard
            key={i}
            scenario={scenario}
            teamColor={teamColor}
            index={i}
            pCurrent={data.p_current}
            labels={adjustedLabels}
            summary={scenarioSummary(scenario, {
              win: adjustedLabels.winAbbr,
              draw: adjustedLabels.drawAbbr,
              loss: adjustedLabels.lossAbbr,
            })}
          />
        ))}
    </div>
  );
}
