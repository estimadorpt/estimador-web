"use client";

import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface PathStep {
  matchday: string;
  opponent: string;
  result: "win" | "draw" | "lose";
  titleBefore: number;
  titleAfter: number;
  isKeyMatch?: boolean;
  isDivergence?: boolean;
}

interface NarrativePath {
  name: string;
  frequency: number;
  frequencyLabel: string;
  summary: string;
  steps: PathStep[];
}

interface TeamPaths {
  teamName: string;
  teamColor: string;
  currentProb: number;
  sharedPrefix: PathStep[];
  paths: NarrativePath[];
  keyMatchCallout?: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const portoData: TeamPaths = {
  teamName: "Porto",
  teamColor: "#003893",
  currentProb: 0.66,
  keyMatchCallout:
    "J28 é o jogo que decide a corrida — uma vitória do Porto vale mais do que as quatro jornadas seguintes combinadas.",
  sharedPrefix: [
    { matchday: "J24", opponent: "Estoril", result: "win", titleBefore: 0.66, titleAfter: 0.7 },
    { matchday: "J25", opponent: "Gil Vicente", result: "win", titleBefore: 0.7, titleAfter: 0.74 },
  ],
  paths: [
    {
      name: "O Passeio",
      frequency: 0.38,
      frequencyLabel: "em 4 de cada 10 cenários",
      summary: "Vence todos os jogos grandes. Campeão antes da última jornada.",
      steps: [
        { matchday: "J28", opponent: "Sporting CP", result: "win", titleBefore: 0.74, titleAfter: 0.88, isKeyMatch: true, isDivergence: true },
        { matchday: "J30", opponent: "Benfica", result: "win", titleBefore: 0.88, titleAfter: 0.95, isKeyMatch: true },
        { matchday: "J34", opponent: "SC Braga", result: "win", titleBefore: 0.95, titleAfter: 0.99 },
      ],
    },
    {
      name: "A Recuperação",
      frequency: 0.2,
      frequencyLabel: "em 2 de cada 10 cenários",
      summary: "Perde o confronto direto com o Sporting mas recupera nos restantes jogos.",
      steps: [
        { matchday: "J28", opponent: "Sporting CP", result: "lose", titleBefore: 0.74, titleAfter: 0.45, isKeyMatch: true, isDivergence: true },
        { matchday: "J30", opponent: "Benfica", result: "win", titleBefore: 0.45, titleAfter: 0.58, isKeyMatch: true },
        { matchday: "J34", opponent: "SC Braga", result: "win", titleBefore: 0.58, titleAfter: 0.65 },
      ],
    },
    {
      name: "A Conquista Improvável",
      frequency: 0.08,
      frequencyLabel: "em 1 de cada 10 cenários",
      summary: "Perde dois jogos grandes mas os rivais também tropeçam.",
      steps: [
        { matchday: "J25", opponent: "Gil Vicente", result: "draw", titleBefore: 0.7, titleAfter: 0.62, isDivergence: true },
        { matchday: "J28", opponent: "Sporting CP", result: "lose", titleBefore: 0.62, titleAfter: 0.35, isKeyMatch: true },
        { matchday: "J30", opponent: "Benfica", result: "lose", titleBefore: 0.35, titleAfter: 0.18, isKeyMatch: true },
        { matchday: "J34", opponent: "SC Braga", result: "win", titleBefore: 0.18, titleAfter: 0.22 },
      ],
    },
  ],
};

const sportingData: TeamPaths = {
  teamName: "Sporting CP",
  teamColor: "#006B3F",
  currentProb: 0.33,
  keyMatchCallout:
    "J28 no Dragão é a única oportunidade do Sporting para virar a corrida — sem vitória aqui, o título depende de um colapso do Porto.",
  sharedPrefix: [
    { matchday: "J24", opponent: "Moreirense", result: "win", titleBefore: 0.33, titleAfter: 0.37 },
  ],
  paths: [
    {
      name: "A Reviravolta",
      frequency: 0.15,
      frequencyLabel: "em 1.5 de cada 10 cenários",
      summary: "Vence no Porto e não falha mais. O Porto colapsa sob pressão.",
      steps: [
        { matchday: "J28", opponent: "Porto", result: "win", titleBefore: 0.37, titleAfter: 0.55, isKeyMatch: true, isDivergence: true },
        { matchday: "J30", opponent: "SC Braga", result: "win", titleBefore: 0.55, titleAfter: 0.65 },
        { matchday: "J32", opponent: "Benfica", result: "win", titleBefore: 0.65, titleAfter: 0.78, isKeyMatch: true },
      ],
    },
    {
      name: "A Persistência",
      frequency: 0.12,
      frequencyLabel: "em 1 de cada 10 cenários",
      summary: "Empata no Porto e compensa com 100% nas restantes. Decide-se na última jornada.",
      steps: [
        { matchday: "J28", opponent: "Porto", result: "draw", titleBefore: 0.37, titleAfter: 0.32, isKeyMatch: true, isDivergence: true },
        { matchday: "J30", opponent: "SC Braga", result: "win", titleBefore: 0.32, titleAfter: 0.42 },
        { matchday: "J32", opponent: "Benfica", result: "win", titleBefore: 0.42, titleAfter: 0.55, isKeyMatch: true },
      ],
    },
    {
      name: "O Milagre",
      frequency: 0.06,
      frequencyLabel: "em 1 de cada 20 cenários",
      summary: "Perde no Porto mas os rivais canibalizam-se entre si na reta final.",
      steps: [
        { matchday: "J28", opponent: "Porto", result: "lose", titleBefore: 0.37, titleAfter: 0.18, isKeyMatch: true, isDivergence: true },
        { matchday: "J30", opponent: "SC Braga", result: "win", titleBefore: 0.18, titleAfter: 0.25 },
        { matchday: "J32", opponent: "Benfica", result: "win", titleBefore: 0.25, titleAfter: 0.35, isKeyMatch: true },
      ],
    },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

// ── Components ─────────────────────────────────────────────────────────────

function StepRow({
  step,
  teamColor,
  muted,
}: {
  step: PathStep;
  teamColor: string;
  muted?: boolean;
}) {
  const delta = step.titleAfter - step.titleBefore;
  const isPositive = delta >= 0;

  return (
    <div
      className={`flex items-center gap-2 md:gap-3 py-2 border-b border-stone-100 last:border-0 ${muted ? "opacity-50" : ""}`}
    >
      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 tabular-nums w-7 shrink-0">
            {step.matchday}
          </span>
          <span className="text-sm text-stone-700 truncate">
            {step.opponent}
          </span>
          {step.isKeyMatch && !muted && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1 py-0.5 bg-amber-100 text-amber-800 shrink-0">
              Decisivo
            </span>
          )}
        </div>

        {/* Bar */}
        <div className="h-4 bg-stone-100 relative overflow-hidden mt-1 w-full">
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: pct(Math.min(step.titleBefore, step.titleAfter)),
              backgroundColor: teamColor,
              opacity: 0.12,
            }}
          />
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
                opacity: 0.35,
              }}
            />
          )}
        </div>
      </div>

      {/* Result + probability */}
      <div className="w-14 shrink-0 text-right">
        <div
          className="text-sm font-bold tabular-nums"
          style={{ color: isPositive ? teamColor : "#dc2626" }}
        >
          {pct(step.titleAfter)}
        </div>
        <div
          className={`text-[10px] tabular-nums ${isPositive ? "text-stone-400" : "text-red-400"}`}
        >
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
  const borderOpacity = index === 0 ? 1 : index === 1 ? 0.4 : 0.2;

  return (
    <div className="border border-stone-200">
      {/* Top accent bar */}
      <div
        className="h-1"
        style={{ backgroundColor: teamColor, opacity: borderOpacity }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-3 md:p-4 border-b border-stone-100 bg-stone-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className="text-base font-bold text-stone-900">{path.name}</h4>
            <span className="text-xs text-stone-400">{path.frequencyLabel}</span>
          </div>
          <p className="text-sm text-stone-500 mt-0.5">{path.summary}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-black tabular-nums text-stone-700">
            {pct(path.frequency)}
          </div>
        </div>
      </div>

      {/* Divergence marker + step rows */}
      <div className="px-3 md:px-4">
        {path.steps[0]?.isDivergence && (
          <div className="flex items-center gap-2 pt-2 pb-1">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Ponto de divergência
            </span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>
        )}
        {path.steps.map((step, i) => (
          <StepRow key={i} step={step} teamColor={teamColor} />
        ))}
      </div>

      {/* Final line */}
      <div
        className="flex items-center justify-end gap-2 px-3 md:px-4 py-2 text-xs text-stone-400"
      >
        Prob. final →{" "}
        <span
          className="text-sm font-black tabular-nums"
          style={{ color: teamColor }}
        >
          {pct(finalProb)}
        </span>
      </div>
    </div>
  );
}

function SharedPrefix({
  steps,
  teamColor,
}: {
  steps: PathStep[];
  teamColor: string;
}) {
  if (steps.length === 0) return null;
  const lastStep = steps[steps.length - 1];

  return (
    <div className="mb-2">
      <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
        Caminho comum a todos os cenários
      </div>
      <div className="border border-stone-100 bg-stone-50 px-3 md:px-4">
        {steps.map((step, i) => (
          <StepRow key={i} step={step} teamColor={teamColor} muted />
        ))}
      </div>
      <div className="text-xs text-stone-400 mt-1">
        Todos os cenários partem de{" "}
        <span className="tabular-nums font-medium" style={{ color: teamColor }}>
          {pct(lastStep.titleAfter)}
        </span>{" "}
        — a partir daqui, os caminhos divergem.
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

      {/* Shared prefix */}
      <SharedPrefix steps={data.sharedPrefix} teamColor={data.teamColor} />

      {/* Key match callout */}
      {data.keyMatchCallout && (
        <div className="border-l-2 border-amber-400 pl-3 py-1">
          <p className="text-sm text-stone-600 italic">{data.keyMatchCallout}</p>
        </div>
      )}

      {/* Path cards */}
      <div className="space-y-3">
        {data.paths.map((path, i) => (
          <PathCard key={i} path={path} teamColor={data.teamColor} index={i} />
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-stone-400">
        Cada cenário representa um grupo de simulações com percursos semelhantes — não é uma previsão de resultados específicos.
      </p>
    </div>
  );
}

export default function PathsNarrativeRefined() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Abordagem D — Refinada
        </div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">
          Cenários de Vitória
        </h3>
        <p className="text-sm text-stone-500 max-w-2xl">
          Três cenários possíveis para cada candidato ao título. Os jogos comuns aparecem
          uma vez — depois, cada cenário mostra apenas o caminho que diverge.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <TeamSection data={portoData} />
        <div className="border-t border-stone-200" />
        <TeamSection data={sportingData} />
      </div>
    </div>
  );
}
