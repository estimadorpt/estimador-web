"use client";

import React from "react";

// ── Types & Data ───────────────────────────────────────────────────────────

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

// ── Variant C3: Merged into archetype-style cards ──────────────────────────

interface Archetype {
  name: string;
  frequency: number;
  narrative: string;
  sentiment: "comfortable" | "realistic" | "scrappy";
  steps: CascadeStep[];
}

interface TeamWithArchetypes {
  teamName: string;
  teamColor: string;
  currentProb: number;
  archetypes: Archetype[];
}

const portoData: TeamWithArchetypes = {
  teamName: "Porto",
  teamColor: "#003893",
  currentProb: 0.66,
  archetypes: [
    {
      name: "O Passeio",
      frequency: 0.38,
      narrative: "O Porto vence todos os jogos grandes. Campeão com várias jornadas de antecedência.",
      sentiment: "comfortable",
      steps: portoCascade.steps,
    },
    {
      name: "O Caminho Realista",
      frequency: 0.2,
      narrative: "O Porto perde um jogo grande mas compensa nos restantes. Decide-se nas últimas 3 jornadas.",
      sentiment: "realistic",
      steps: [
        { matchday: "J24", opponent: "Estoril", venue: "H", pWin: 0.78, titleBefore: 0.66, titleAfterWin: 0.7, titleAfterLose: 0.52 },
        { matchday: "J28", opponent: "Sporting CP", venue: "H", pWin: 0.52, titleBefore: 0.7, titleAfterWin: 0.82, titleAfterLose: 0.45, isKeyMatch: true },
        { matchday: "J30", opponent: "Benfica", venue: "A", pWin: 0.45, titleBefore: 0.45, titleAfterWin: 0.62, titleAfterLose: 0.35, isKeyMatch: true },
      ],
    },
  ],
};

const sportingData: TeamWithArchetypes = {
  teamName: "Sporting CP",
  teamColor: "#006B3F",
  currentProb: 0.33,
  archetypes: [
    {
      name: "A Reviravolta",
      frequency: 0.15,
      narrative: "O Sporting vence no Porto e ganha ímpeto. O Porto colapsa sob a pressão.",
      sentiment: "comfortable",
      steps: sportingCascade.steps,
    },
    {
      name: "O Contra-Ataque",
      frequency: 0.12,
      narrative: "O Sporting empata no Porto e compensa com 100% nas restantes jornadas.",
      sentiment: "realistic",
      steps: [
        { matchday: "J28", opponent: "Porto", venue: "A", pWin: 0.38, titleBefore: 0.33, titleAfterWin: 0.48, titleAfterLose: 0.15, isKeyMatch: true },
        { matchday: "J30", opponent: "SC Braga", venue: "H", pWin: 0.68, titleBefore: 0.48, titleAfterWin: 0.58, titleAfterLose: 0.32 },
        { matchday: "J32", opponent: "Benfica", venue: "A", pWin: 0.42, titleBefore: 0.58, titleAfterWin: 0.7, titleAfterLose: 0.4, isKeyMatch: true },
      ],
    },
  ],
};

const sentimentBorder = {
  comfortable: "border-l-green-500",
  realistic: "border-l-amber-500",
  scrappy: "border-l-red-500",
};

function MiniCascade({ steps, teamColor }: { steps: CascadeStep[]; teamColor: string }) {
  return (
    <div className="flex items-end gap-1 mt-3">
      {/* Starting value */}
      <div className="text-center shrink-0" style={{ width: 40 }}>
        <div
          className="text-xs font-bold tabular-nums"
          style={{ color: teamColor }}
        >
          {pct(steps[0].titleBefore)}
        </div>
        <div className="text-[9px] text-stone-400">Início</div>
      </div>

      {steps.map((step, i) => {
        const uplift = step.titleAfterWin - step.titleBefore;
        const barHeight = Math.max(uplift * 200, 8);

        return (
          <React.Fragment key={i}>
            {/* Arrow */}
            <div className="text-stone-300 text-xs self-center">→</div>

            {/* Step */}
            <div className="text-center flex-1 min-w-0">
              {/* Bar */}
              <div className="flex justify-center mb-1">
                <div
                  className="w-full max-w-10"
                  style={{
                    height: barHeight,
                    backgroundColor: teamColor,
                    opacity: step.isKeyMatch ? 0.6 : 0.25,
                  }}
                />
              </div>
              {/* Value after */}
              <div
                className="text-xs font-bold tabular-nums"
                style={{ color: teamColor }}
              >
                {pct(step.titleAfterWin)}
              </div>
              {/* Match label */}
              <div className="text-[9px] text-stone-400 truncate">
                {step.matchday}
              </div>
              <div className="text-[8px] text-stone-400 truncate">
                {step.opponent}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ArchetypeWithCascade({
  archetype,
  teamColor,
}: {
  archetype: Archetype;
  teamColor: string;
}) {
  return (
    <div
      className={`border-l-4 ${sentimentBorder[archetype.sentiment]} bg-stone-50 p-4`}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <h4 className="text-base font-bold text-stone-900">{archetype.name}</h4>
        <span className="text-sm font-bold tabular-nums text-stone-600 shrink-0">
          {pct(archetype.frequency)}
        </span>
      </div>

      <p className="text-sm text-stone-500 leading-relaxed">
        {archetype.narrative}
      </p>

      {/* Mini cascade inline */}
      <MiniCascade steps={archetype.steps} teamColor={teamColor} />
    </div>
  );
}

function TeamInline({ data }: { data: TeamWithArchetypes }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 shrink-0" style={{ backgroundColor: data.teamColor }} />
        <div>
          <div className="text-lg font-bold tracking-tight text-stone-900">{data.teamName}</div>
          <div className="text-sm text-stone-500">
            Prob. atual: <span className="font-bold tabular-nums" style={{ color: data.teamColor }}>{pct(data.currentProb)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.archetypes.map((a, i) => (
          <ArchetypeWithCascade key={i} archetype={a} teamColor={data.teamColor} />
        ))}
      </div>
    </div>
  );
}

export default function PathsCascadeInline() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Variante C3
        </div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">
          Arquétipos + Cascata
        </h3>
        <p className="text-sm text-stone-500">
          Cada arquétipo de vitória inclui uma mini-cascata mostrando a progressão
          da probabilidade ao longo dos jogos-chave desse cenário.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-10">
        <TeamInline data={portoData} />
        <div className="border-t border-stone-200" />
        <TeamInline data={sportingData} />
      </div>
    </div>
  );
}
