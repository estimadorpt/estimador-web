"use client";

import React from "react";

// ── Types & Data (shared) ──────────────────────────────────────────────────

interface CascadeStep {
  matchday: string;
  opponent: string;
  venue: "H" | "A";
  pWin: number;
  titleBefore: number;
  titleAfterWin: number;
  titleAfterLose: number;
  isKeyMatch?: boolean;
}

interface TeamCascade {
  teamName: string;
  teamColor: string;
  currentProb: number;
  steps: CascadeStep[];
}

const portoCascade: TeamCascade = {
  teamName: "Porto",
  teamColor: "#003893",
  currentProb: 0.66,
  steps: [
    { matchday: "J24", opponent: "Estoril", venue: "H", pWin: 0.78, titleBefore: 0.66, titleAfterWin: 0.7, titleAfterLose: 0.52 },
    { matchday: "J25", opponent: "Gil Vicente", venue: "A", pWin: 0.55, titleBefore: 0.7, titleAfterWin: 0.74, titleAfterLose: 0.6 },
    { matchday: "J28", opponent: "Sporting CP", venue: "H", pWin: 0.52, titleBefore: 0.74, titleAfterWin: 0.88, titleAfterLose: 0.45, isKeyMatch: true },
    { matchday: "J30", opponent: "Benfica", venue: "A", pWin: 0.45, titleBefore: 0.88, titleAfterWin: 0.95, titleAfterLose: 0.78, isKeyMatch: true },
    { matchday: "J34", opponent: "SC Braga", venue: "H", pWin: 0.65, titleBefore: 0.95, titleAfterWin: 0.99, titleAfterLose: 0.9 },
  ],
};

const sportingCascade: TeamCascade = {
  teamName: "Sporting CP",
  teamColor: "#006B3F",
  currentProb: 0.33,
  steps: [
    { matchday: "J24", opponent: "Moreirense", venue: "A", pWin: 0.62, titleBefore: 0.33, titleAfterWin: 0.37, titleAfterLose: 0.22 },
    { matchday: "J28", opponent: "Porto", venue: "A", pWin: 0.38, titleBefore: 0.37, titleAfterWin: 0.55, titleAfterLose: 0.18, isKeyMatch: true },
    { matchday: "J30", opponent: "SC Braga", venue: "H", pWin: 0.68, titleBefore: 0.55, titleAfterWin: 0.65, titleAfterLose: 0.38 },
    { matchday: "J32", opponent: "Benfica", venue: "A", pWin: 0.42, titleBefore: 0.65, titleAfterWin: 0.78, titleAfterLose: 0.48, isKeyMatch: true },
  ],
};

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

// ── Variant C1: Single-bar with lose as footnote ───────────────────────────

function StepSimple({ step, teamColor }: { step: CascadeStep; teamColor: string }) {
  const swing = step.titleAfterWin - step.titleAfterLose;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
      {/* Left: probability + match */}
      <div className="w-20 shrink-0">
        <div
          className="text-xl font-black tabular-nums leading-tight"
          style={{ color: teamColor }}
        >
          {pct(step.titleBefore)}
        </div>
        <div className="text-xs text-stone-400 mt-0.5">
          {step.matchday} · {step.venue === "H" ? "C" : "F"}
        </div>
      </div>

      {/* Middle: bar + match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-medium text-stone-700">
            vs {step.opponent}
          </span>
          {step.isKeyMatch && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800">
              Decisivo
            </span>
          )}
        </div>

        {/* Single bar: before → after win */}
        <div className="h-5 bg-stone-100 relative overflow-hidden w-full">
          {/* Base fill up to "before" */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: pct(step.titleBefore),
              backgroundColor: teamColor,
              opacity: 0.15,
            }}
          />
          {/* Uplift fill */}
          <div
            className="absolute inset-y-0"
            style={{
              left: pct(step.titleBefore),
              width: pct(step.titleAfterWin - step.titleBefore),
              backgroundColor: teamColor,
              opacity: 0.5,
            }}
          />
        </div>

        {/* Footnote: lose outcome + swing */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-stone-400">
            Se perde: <span className="tabular-nums text-red-500">{pct(step.titleAfterLose)}</span>
          </span>
          <span className="text-xs text-stone-400">
            Impacto: <span className="tabular-nums font-medium text-stone-600">{Math.round(swing * 100)}pp</span>
          </span>
        </div>
      </div>

      {/* Right: after-win number */}
      <div className="w-12 shrink-0 text-right">
        <div className="text-sm font-bold tabular-nums text-green-700">
          {pct(step.titleAfterWin)}
        </div>
        <div className="text-[10px] text-stone-400">se vence</div>
      </div>
    </div>
  );
}

function TeamSimple({ data }: { data: TeamCascade }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 shrink-0" style={{ backgroundColor: data.teamColor }} />
        <div>
          <div className="text-lg font-bold tracking-tight text-stone-900">{data.teamName}</div>
          <div className="text-sm text-stone-500">
            Prob. atual: <span className="font-bold tabular-nums" style={{ color: data.teamColor }}>{pct(data.currentProb)}</span>
          </div>
        </div>
      </div>
      <div>
        {data.steps.map((step, i) => (
          <StepSimple key={i} step={step} teamColor={data.teamColor} />
        ))}
      </div>
      <div className="p-3 text-center" style={{ backgroundColor: data.teamColor + "10" }}>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Se vencer todos os jogos-chave
        </div>
        <div className="text-3xl font-black tabular-nums" style={{ color: data.teamColor }}>
          {pct(data.steps[data.steps.length - 1].titleAfterWin)}
        </div>
      </div>
    </div>
  );
}

export default function PathsCascadeSimple() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Variante C1
        </div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">
          Barra Simples
        </h3>
        <p className="text-sm text-stone-500">
          Apenas o caminho da vitória em destaque. A derrota aparece como nota de rodapé,
          com o impacto total (swing) de cada jogo.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-10">
        <TeamSimple data={portoCascade} />
        <div className="border-t border-stone-200" />
        <TeamSimple data={sportingCascade} />
      </div>
    </div>
  );
}
