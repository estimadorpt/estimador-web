"use client";

import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface PathStep {
  matchday: string;
  opponent: string;
  venue: "H" | "A";
  result: "win" | "draw" | "lose";
  titleBefore: number;
  titleAfter: number;
  isKeyMatch?: boolean;
}

interface NarrativePath {
  name: string;
  frequency: number;
  summary: string;
  steps: PathStep[];
}

interface TeamPaths {
  teamName: string;
  teamColor: string;
  currentProb: number;
  paths: NarrativePath[];
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const portoData: TeamPaths = {
  teamName: "Porto",
  teamColor: "#003893",
  currentProb: 0.66,
  paths: [
    {
      name: "O Passeio",
      frequency: 0.38,
      summary: "Vence todos os jogos grandes. Campeão antes da última jornada.",
      steps: [
        { matchday: "J24", opponent: "Estoril", venue: "H", result: "win", titleBefore: 0.66, titleAfter: 0.7 },
        { matchday: "J25", opponent: "Gil Vicente", venue: "A", result: "win", titleBefore: 0.7, titleAfter: 0.74 },
        { matchday: "J28", opponent: "Sporting CP", venue: "H", result: "win", titleBefore: 0.74, titleAfter: 0.88, isKeyMatch: true },
        { matchday: "J30", opponent: "Benfica", venue: "A", result: "win", titleBefore: 0.88, titleAfter: 0.95, isKeyMatch: true },
        { matchday: "J34", opponent: "SC Braga", venue: "H", result: "win", titleBefore: 0.95, titleAfter: 0.99 },
      ],
    },
    {
      name: "O Caminho Realista",
      frequency: 0.2,
      summary: "Perde o confronto direto com o Sporting mas recupera nos restantes jogos.",
      steps: [
        { matchday: "J24", opponent: "Estoril", venue: "H", result: "win", titleBefore: 0.66, titleAfter: 0.7 },
        { matchday: "J25", opponent: "Gil Vicente", venue: "A", result: "win", titleBefore: 0.7, titleAfter: 0.74 },
        { matchday: "J28", opponent: "Sporting CP", venue: "H", result: "lose", titleBefore: 0.74, titleAfter: 0.45, isKeyMatch: true },
        { matchday: "J30", opponent: "Benfica", venue: "A", result: "win", titleBefore: 0.45, titleAfter: 0.58, isKeyMatch: true },
        { matchday: "J34", opponent: "SC Braga", venue: "H", result: "win", titleBefore: 0.58, titleAfter: 0.65 },
      ],
    },
    {
      name: "A Conquista Improvável",
      frequency: 0.08,
      summary: "Perde dois jogos grandes mas os rivais também tropeçam. Decidido na última jornada.",
      steps: [
        { matchday: "J24", opponent: "Estoril", venue: "H", result: "win", titleBefore: 0.66, titleAfter: 0.7 },
        { matchday: "J25", opponent: "Gil Vicente", venue: "A", result: "draw", titleBefore: 0.7, titleAfter: 0.62 },
        { matchday: "J28", opponent: "Sporting CP", venue: "H", result: "lose", titleBefore: 0.62, titleAfter: 0.35, isKeyMatch: true },
        { matchday: "J30", opponent: "Benfica", venue: "A", result: "lose", titleBefore: 0.35, titleAfter: 0.18, isKeyMatch: true },
        { matchday: "J34", opponent: "SC Braga", venue: "H", result: "win", titleBefore: 0.18, titleAfter: 0.22 },
      ],
    },
  ],
};

const sportingData: TeamPaths = {
  teamName: "Sporting CP",
  teamColor: "#006B3F",
  currentProb: 0.33,
  paths: [
    {
      name: "A Reviravolta",
      frequency: 0.15,
      summary: "Vence no Porto e não falha mais. O Porto colapsa sob pressão.",
      steps: [
        { matchday: "J24", opponent: "Moreirense", venue: "A", result: "win", titleBefore: 0.33, titleAfter: 0.37 },
        { matchday: "J28", opponent: "Porto", venue: "A", result: "win", titleBefore: 0.37, titleAfter: 0.55, isKeyMatch: true },
        { matchday: "J30", opponent: "SC Braga", venue: "H", result: "win", titleBefore: 0.55, titleAfter: 0.65 },
        { matchday: "J32", opponent: "Benfica", venue: "A", result: "win", titleBefore: 0.65, titleAfter: 0.78, isKeyMatch: true },
      ],
    },
    {
      name: "O Contra-Ataque",
      frequency: 0.12,
      summary: "Empata no Porto mas compensa com 100% nas restantes. Decide-se na última jornada.",
      steps: [
        { matchday: "J24", opponent: "Moreirense", venue: "A", result: "win", titleBefore: 0.33, titleAfter: 0.37 },
        { matchday: "J28", opponent: "Porto", venue: "A", result: "draw", titleBefore: 0.37, titleAfter: 0.32, isKeyMatch: true },
        { matchday: "J30", opponent: "SC Braga", venue: "H", result: "win", titleBefore: 0.32, titleAfter: 0.42 },
        { matchday: "J32", opponent: "Benfica", venue: "A", result: "win", titleBefore: 0.42, titleAfter: 0.55, isKeyMatch: true },
      ],
    },
    {
      name: "O Milagre",
      frequency: 0.06,
      summary: "Perde no Porto mas os rivais canibalizam-se entre si na reta final.",
      steps: [
        { matchday: "J24", opponent: "Moreirense", venue: "A", result: "win", titleBefore: 0.33, titleAfter: 0.37 },
        { matchday: "J28", opponent: "Porto", venue: "A", result: "lose", titleBefore: 0.37, titleAfter: 0.18, isKeyMatch: true },
        { matchday: "J30", opponent: "SC Braga", venue: "H", result: "win", titleBefore: 0.18, titleAfter: 0.25 },
        { matchday: "J32", opponent: "Benfica", venue: "A", result: "win", titleBefore: 0.25, titleAfter: 0.35, isKeyMatch: true },
      ],
    },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

const resultLabel: Record<string, string> = {
  win: "V",
  draw: "E",
  lose: "D",
};

const resultColor: Record<string, string> = {
  win: "text-green-700 bg-green-50 border-green-200",
  draw: "text-amber-700 bg-amber-50 border-amber-200",
  lose: "text-red-600 bg-red-50 border-red-200",
};

// ── Components ─────────────────────────────────────────────────────────────

function StepRow({
  step,
  teamColor,
}: {
  step: PathStep;
  teamColor: string;
}) {
  const delta = step.titleAfter - step.titleBefore;
  const isPositive = delta >= 0;

  return (
    <div className="flex items-center gap-2 md:gap-3 py-2.5 border-b border-stone-100 last:border-0">
      {/* Result badge */}
      <div
        className={`w-6 h-6 flex items-center justify-center text-xs font-bold border shrink-0 ${resultColor[step.result]}`}
      >
        {resultLabel[step.result]}
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            {step.matchday}
          </span>
          <span className="text-sm font-medium text-stone-700 truncate">
            vs {step.opponent}
          </span>
          <span className="text-xs text-stone-400">
            ({step.venue === "H" ? "C" : "F"})
          </span>
          {step.isKeyMatch && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1 py-0.5 bg-amber-100 text-amber-800">
              Decisivo
            </span>
          )}
        </div>

        {/* Probability bar */}
        <div className="h-3 bg-stone-100 relative overflow-hidden mt-1.5 w-full">
          {/* Base fill (before) */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: pct(Math.min(step.titleBefore, step.titleAfter)),
              backgroundColor: teamColor,
              opacity: 0.15,
            }}
          />
          {/* Delta fill */}
          {isPositive ? (
            <div
              className="absolute inset-y-0"
              style={{
                left: pct(step.titleBefore),
                width: pct(delta),
                backgroundColor: teamColor,
                opacity: 0.5,
              }}
            />
          ) : (
            <div
              className="absolute inset-y-0"
              style={{
                left: pct(step.titleAfter),
                width: pct(-delta),
                backgroundColor: "#dc2626",
                opacity: 0.3,
              }}
            />
          )}
        </div>
      </div>

      {/* After probability */}
      <div className="w-12 shrink-0 text-right">
        <div
          className="text-sm font-bold tabular-nums"
          style={{ color: isPositive ? teamColor : "#dc2626" }}
        >
          {pct(step.titleAfter)}
        </div>
        <div className="text-[10px] tabular-nums text-stone-400">
          {isPositive ? "+" : ""}{Math.round(delta * 100)}pp
        </div>
      </div>
    </div>
  );
}

function PathCard({
  path,
  teamColor,
  index,
}: {
  path: NarrativePath;
  teamColor: string;
  index: number;
}) {
  const finalProb = path.steps[path.steps.length - 1].titleAfter;
  const opacity = index === 0 ? 0.7 : index === 1 ? 0.4 : 0.2;

  return (
    <div className="border border-stone-200">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 p-3 md:p-4 border-b border-stone-100 bg-stone-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-base font-bold text-stone-900">{path.name}</h4>
            <div
              className="h-4 shrink-0"
              style={{
                width: `${Math.max(path.frequency * 180, 12)}px`,
                backgroundColor: teamColor,
                opacity,
              }}
            />
          </div>
          <p className="text-sm text-stone-500">{path.summary}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-black tabular-nums text-stone-700">
            {pct(path.frequency)}
          </div>
          <div className="text-[10px] text-stone-400">das simulações</div>
        </div>
      </div>

      {/* Step rows */}
      <div className="px-3 md:px-4">
        {path.steps.map((step, i) => (
          <StepRow key={i} step={step} teamColor={teamColor} />
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 md:px-4 py-2"
        style={{ backgroundColor: teamColor + "08" }}
      >
        <span className="text-xs text-stone-400">Probabilidade final neste cenário</span>
        <span
          className="text-base font-black tabular-nums"
          style={{ color: teamColor }}
        >
          {pct(finalProb)}
        </span>
      </div>
    </div>
  );
}

function TeamSection({ data }: { data: TeamPaths }) {
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
            Probabilidade atual:{" "}
            <span className="font-bold tabular-nums" style={{ color: data.teamColor }}>
              {pct(data.currentProb)}
            </span>
          </div>
        </div>
      </div>

      {/* Path cards */}
      <div className="space-y-4">
        {data.paths.map((path, i) => (
          <PathCard key={i} path={path} teamColor={data.teamColor} index={i} />
        ))}
      </div>
    </div>
  );
}

export default function PathsNarrative() {
  return (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Caminhos para o Título
        </div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">
          Cenários de Vitória
        </h3>
        <p className="text-sm text-stone-500 max-w-2xl">
          Três cenários possíveis para cada candidato ao título, do mais provável ao menos provável.
          Cada cenário mostra o percurso jogo a jogo e como a probabilidade evolui.
        </p>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-1 gap-10">
        <TeamSection data={portoData} />
        <div className="border-t border-stone-200" />
        <TeamSection data={sportingData} />
      </div>
    </div>
  );
}
