"use client";

import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────

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

// ── Mock Data ──────────────────────────────────────────────────────────────

const portoCascade: TeamCascade = {
  teamName: "Porto",
  teamColor: "#003893",
  currentProb: 0.66,
  steps: [
    {
      matchday: "J24",
      opponent: "Estoril",
      venue: "H",
      pWin: 0.78,
      titleBefore: 0.66,
      titleAfterWin: 0.7,
      titleAfterLose: 0.52,
    },
    {
      matchday: "J25",
      opponent: "Gil Vicente",
      venue: "A",
      pWin: 0.55,
      titleBefore: 0.7,
      titleAfterWin: 0.74,
      titleAfterLose: 0.6,
    },
    {
      matchday: "J28",
      opponent: "Sporting CP",
      venue: "H",
      pWin: 0.52,
      titleBefore: 0.74,
      titleAfterWin: 0.88,
      titleAfterLose: 0.45,
      isKeyMatch: true,
    },
    {
      matchday: "J30",
      opponent: "Benfica",
      venue: "A",
      pWin: 0.45,
      titleBefore: 0.88,
      titleAfterWin: 0.95,
      titleAfterLose: 0.78,
      isKeyMatch: true,
    },
    {
      matchday: "J34",
      opponent: "SC Braga",
      venue: "H",
      pWin: 0.65,
      titleBefore: 0.95,
      titleAfterWin: 0.99,
      titleAfterLose: 0.9,
    },
  ],
};

const sportingCascade: TeamCascade = {
  teamName: "Sporting CP",
  teamColor: "#006B3F",
  currentProb: 0.33,
  steps: [
    {
      matchday: "J24",
      opponent: "Moreirense",
      venue: "A",
      pWin: 0.62,
      titleBefore: 0.33,
      titleAfterWin: 0.37,
      titleAfterLose: 0.22,
    },
    {
      matchday: "J28",
      opponent: "Porto",
      venue: "A",
      pWin: 0.38,
      titleBefore: 0.37,
      titleAfterWin: 0.55,
      titleAfterLose: 0.18,
      isKeyMatch: true,
    },
    {
      matchday: "J30",
      opponent: "SC Braga",
      venue: "H",
      pWin: 0.68,
      titleBefore: 0.55,
      titleAfterWin: 0.65,
      titleAfterLose: 0.38,
    },
    {
      matchday: "J32",
      opponent: "Benfica",
      venue: "A",
      pWin: 0.42,
      titleBefore: 0.65,
      titleAfterWin: 0.78,
      titleAfterLose: 0.48,
      isKeyMatch: true,
    },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

// ── Component ──────────────────────────────────────────────────────────────

function CascadeStep({
  step,
  teamColor,
  isLast,
}: {
  step: CascadeStep;
  teamColor: string;
  isLast: boolean;
}) {
  const uplift = step.titleAfterWin - step.titleBefore;
  const drop = step.titleBefore - step.titleAfterLose;

  return (
    <div className="flex items-stretch gap-0">
      {/* Step content */}
      <div className="flex-1 min-w-0">
        {/* Before probability */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="text-2xl font-black tabular-nums"
            style={{ color: teamColor }}
          >
            {pct(step.titleBefore)}
          </div>
          {step.isKeyMatch && (
            <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800">
              Decisivo
            </span>
          )}
        </div>

        {/* Match info */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            {step.matchday}
          </span>
          <span className="text-sm font-medium text-stone-700">
            vs {step.opponent}
          </span>
          <span className="text-xs text-stone-400">
            ({step.venue === "H" ? "Casa" : "Fora"})
          </span>
        </div>

        {/* Win/loss outcomes */}
        <div className="space-y-1.5">
          {/* Win path (main) */}
          <div className="flex items-center gap-2">
            <div className="w-16 shrink-0">
              <div className="text-xs text-stone-400">Vitória</div>
              <div className="text-xs font-medium tabular-nums text-stone-500">
                {pct(step.pWin)}
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-6 bg-stone-100 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: pct(step.titleAfterWin),
                    backgroundColor: teamColor,
                    opacity: 0.2,
                  }}
                />
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: pct(step.titleBefore),
                    width: pct(uplift),
                    backgroundColor: "rgb(22 163 74)",
                    opacity: 0.5,
                  }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-green-700 shrink-0 w-8">
                {pct(step.titleAfterWin)}
              </span>
            </div>
          </div>

          {/* Lose path (faded) */}
          <div className="flex items-center gap-2 opacity-60">
            <div className="w-16 shrink-0">
              <div className="text-xs text-stone-400">Derrota</div>
              <div className="text-xs font-medium tabular-nums text-stone-500">
                {pct(1 - step.pWin)}
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-4 bg-stone-100 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: pct(step.titleAfterLose),
                    backgroundColor: teamColor,
                    opacity: 0.15,
                  }}
                />
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: pct(step.titleAfterLose),
                    width: pct(drop),
                    backgroundColor: "rgb(220 38 38)",
                    opacity: 0.3,
                  }}
                />
              </div>
              <span className="text-xs tabular-nums text-red-600 shrink-0 w-8">
                {pct(step.titleAfterLose)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connector arrow */}
      {!isLast && (
        <div className="flex flex-col items-center justify-end w-8 shrink-0 pb-2">
          <div
            className="w-px flex-1 min-h-4"
            style={{ backgroundColor: teamColor, opacity: 0.2 }}
          />
          <div
            className="w-0 h-0 mt-0.5"
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: `6px solid ${teamColor}`,
              opacity: 0.4,
            }}
          />
        </div>
      )}
    </div>
  );
}

function TeamCascadeSection({ data }: { data: TeamCascade }) {
  return (
    <div className="space-y-4">
      {/* Team header */}
      <div className="flex items-center gap-3">
        <div
          className="w-1.5 h-8 shrink-0"
          style={{ backgroundColor: data.teamColor }}
        />
        <div>
          <div className="text-lg font-bold tracking-tight text-stone-900">
            {data.teamName}
          </div>
          <div className="text-sm text-stone-500">
            Caminho mais provável: vitória em todos os jogos-chave
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-5">
        {data.steps.map((step, i) => (
          <div
            key={i}
            className={i < data.steps.length - 1 ? "border-b border-stone-100 pb-5" : ""}
          >
            <CascadeStep
              step={step}
              teamColor={data.teamColor}
              isLast={i === data.steps.length - 1}
            />
          </div>
        ))}
      </div>

      {/* Final probability */}
      <div
        className="p-3 text-center"
        style={{ backgroundColor: data.teamColor + "10" }}
      >
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Se vencer todos os jogos-chave
        </div>
        <div
          className="text-3xl font-black tabular-nums"
          style={{ color: data.teamColor }}
        >
          {pct(data.steps[data.steps.length - 1].titleAfterWin)}
        </div>
      </div>
    </div>
  );
}

export default function PathsCascade() {
  return (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Abordagem C
        </div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">
          Cascata Condicional
        </h3>
        <p className="text-sm text-stone-500">
          O caminho mais provável para o título, jogo a jogo. Cada passo mostra
          como a probabilidade evolui — o caminho principal (vitória) em destaque,
          com a alternativa atenuada.
        </p>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-1 gap-10">
        <TeamCascadeSection data={portoCascade} />
        <div className="border-t border-stone-200" />
        <TeamCascadeSection data={sportingCascade} />
      </div>
    </div>
  );
}
