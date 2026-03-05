"use client";

import React from "react";
import type {
  TeamNarrativeScenarios,
  NarrativeScenario,
  ScenarioStep,
  ScenarioRivalCondition,
} from "@/types/football";
import { ligaTeamColors } from "@/lib/config/football";

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(v: number): string {
  const rounded = Math.round(v * 100);
  if (rounded >= 100) return ">99%";
  if (rounded <= 0 && v > 0) return "<1%";
  return `${rounded}%`;
}

const resultLabels: Record<string, string> = {
  W: "V",
  D: "E",
  L: "D",
};

// ── Components ──────────────────────────────────────────────────────────────

function StepRow({
  step,
  teamColor,
  prevP,
}: {
  step: ScenarioStep;
  teamColor: string;
  prevP: number;
}) {
  const delta = step.p_target_after - prevP;
  const isPositive = delta >= 0;

  return (
    <div className="flex items-center gap-2 md:gap-3 py-2 border-b border-stone-100 last:border-0">
      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 tabular-nums w-7 shrink-0">
            J{step.matchday}
          </span>
          <span className="text-sm text-stone-700 truncate">
            {step.opponent}
          </span>
          <span
            className={`text-[10px] font-bold px-1 py-0.5 ${
              step.result === "L"
                ? "bg-red-50 text-red-600"
                : step.result === "D"
                ? "bg-amber-50 text-amber-700"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            {resultLabels[step.result] || step.result}
          </span>
        </div>

        {/* Bar */}
        <div className="h-4 bg-stone-100 relative overflow-hidden mt-1 w-full">
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: pct(Math.min(prevP, step.p_target_after)),
              backgroundColor: teamColor,
              opacity: 0.12,
            }}
          />
          {isPositive ? (
            <div
              className="absolute inset-y-0"
              style={{
                left: pct(prevP),
                width: pct(delta),
                backgroundColor: teamColor,
                opacity: 0.5,
              }}
            />
          ) : (
            <div
              className="absolute inset-y-0"
              style={{
                left: pct(step.p_target_after),
                width: pct(-delta),
                backgroundColor: "#dc2626",
                opacity: 0.35,
              }}
            />
          )}
        </div>
      </div>

      {/* Probability */}
      <div className="w-14 shrink-0 text-right">
        <div
          className="text-sm font-bold tabular-nums"
          style={{ color: isPositive ? teamColor : "#dc2626" }}
        >
          {pct(step.p_target_after)}
        </div>
        <div
          className={`text-[10px] tabular-nums ${
            isPositive ? "text-stone-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {Math.round(delta * 100)}pp
        </div>
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
    inThisScenario: string;
    normally: string;
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
            <div key={i} className="text-xs text-stone-500 flex items-baseline gap-1 flex-wrap">
              <span className="font-medium" style={{ color: rivalColor }}>
                {rc.rival}
              </span>
              <span>
                {labels.dropsPointsVs} {rc.opponent} (J{rc.matchday})
              </span>
              <span className="tabular-nums text-stone-400">
                {labels.normally} {pct(rc.p_rival_drops_baseline)} → {labels.inThisScenario} {pct(rc.p_rival_drops_in_scenario)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScenarioCard({
  scenario,
  teamColor,
  index,
  pCurrent,
  labels,
}: {
  scenario: NarrativeScenario;
  teamColor: string;
  index: number;
  pCurrent: number;
  labels: {
    scenarioComfortable: string;
    scenarioRealistic: string;
    scenarioUnlikely: string;
    ofChampionSims: string;
    ofSurvivalSims: string;
    thisWorksBecause: string;
    dropsPointsVs: string;
    inThisScenario: string;
    normally: string;
  };
  target?: string;
}) {
  const borderOpacity = index === 0 ? 1 : index === 1 ? 0.4 : 0.2;
  const scenarioName =
    scenario.label === "comfortable"
      ? labels.scenarioComfortable
      : scenario.label === "realistic"
      ? labels.scenarioRealistic
      : labels.scenarioUnlikely;

  const freqLabel = labels.ofChampionSims;
  const finalP = scenario.steps[scenario.steps.length - 1]?.p_target_after ?? pCurrent;

  return (
    <div className="border border-stone-200">
      {/* Accent bar */}
      <div
        className="h-1"
        style={{ backgroundColor: teamColor, opacity: borderOpacity }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-3 md:p-4 border-b border-stone-100 bg-stone-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className="text-base font-bold text-stone-900">
              {scenarioName}
            </h4>
          </div>
          <div className="text-xs text-stone-400 mt-0.5">
            <span className="tabular-nums font-medium">{pct(scenario.frequency)}</span>{" "}
            {freqLabel}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className="text-lg font-black tabular-nums"
            style={{ color: teamColor }}
          >
            {pct(finalP)}
          </div>
          <div className="text-[10px] text-stone-400">prob. final</div>
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
    inThisScenario: string;
    normally: string;
  };
}) {
  const teamColor = ligaTeamColors[data.team] || "#78716c";

  // Use the right frequency label based on target
  const adjustedLabels = {
    ...labels,
    ofChampionSims:
      data.target === "survival" ? labels.ofSurvivalSims : labels.ofChampionSims,
  };

  return (
    <div className="space-y-3">
      {data.scenarios
        .filter((scenario, i, arr) =>
          arr.findIndex((s) => s.label === scenario.label) === i
        )
        .map((scenario, i) => (
          <ScenarioCard
            key={i}
            scenario={scenario}
            teamColor={teamColor}
            index={i}
            pCurrent={data.p_current}
            labels={adjustedLabels}
            target={data.target}
          />
        ))}

      {/* Disclaimer */}
      <p className="text-xs text-stone-400">
        Cada cenário representa um grupo de simulações com percursos semelhantes
        — não é uma previsão de resultados específicos.
      </p>
    </div>
  );
}
