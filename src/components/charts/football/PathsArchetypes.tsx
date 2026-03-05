"use client";

import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Archetype {
  name: string;
  frequency: number;
  narrative: string;
  keyConditions: string[];
  sentiment: "comfortable" | "realistic" | "scrappy";
}

interface TeamArchetypes {
  teamName: string;
  teamColor: string;
  currentProb: number;
  archetypes: Archetype[];
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const portoArchetypes: TeamArchetypes = {
  teamName: "Porto",
  teamColor: "#003893",
  currentProb: 0.66,
  archetypes: [
    {
      name: "O Passeio",
      frequency: 0.38,
      narrative:
        "O Porto vence todos os jogos grandes e é campeão com várias jornadas de antecedência. O Sporting tropeça pelo menos duas vezes.",
      keyConditions: [
        "Vitória vs Sporting (J28)",
        "Vitória vs Benfica (J30)",
        "Sporting perde pontos em ≥2 jornadas",
      ],
      sentiment: "comfortable",
    },
    {
      name: "O Caminho Realista",
      frequency: 0.2,
      narrative:
        "O Porto perde um jogo grande mas compensa com vitórias nos restantes. O título decide-se nas últimas 3 jornadas.",
      keyConditions: [
        "Derrota vs Benfica (J30) OU vs Sporting (J28)",
        "Vitórias em todos os outros jogos",
        "Sporting também perde ≥1 jogo grande",
      ],
      sentiment: "realistic",
    },
    {
      name: "A Conquista Improvável",
      frequency: 0.08,
      narrative:
        "O Porto perde pontos em jogos inesperados mas sobrevive porque os rivais também falham. Título decidido por diferença de golos ou confronto direto.",
      keyConditions: [
        "Empate/derrota em ≥2 jogos",
        "Sporting falha vs Braga (J30)",
        "Decisão na última jornada",
      ],
      sentiment: "scrappy",
    },
  ],
};

const sportingArchetypes: TeamArchetypes = {
  teamName: "Sporting CP",
  teamColor: "#006B3F",
  currentProb: 0.33,
  archetypes: [
    {
      name: "A Reviravolta",
      frequency: 0.15,
      narrative:
        "O Sporting vence o confronto direto em casa do Porto e ganha ímpeto para a reta final. O Porto colapsa sob a pressão.",
      keyConditions: [
        "Vitória vs Porto (J28)",
        "Vitória vs Benfica (J32)",
        "Porto perde pontos em ≥2 jogos",
      ],
      sentiment: "comfortable",
    },
    {
      name: "O Contra-Ataque",
      frequency: 0.12,
      narrative:
        "O Sporting empata no Porto mas compensa com 100% nas restantes jornadas. O título decide-se na última jornada.",
      keyConditions: [
        "Empate vs Porto (J28)",
        "100% nas restantes jornadas",
        "Porto perde pontos vs Benfica (J30)",
      ],
      sentiment: "realistic",
    },
    {
      name: "O Milagre",
      frequency: 0.06,
      narrative:
        "O Sporting perde no Porto mas recupera porque todos os rivais diretos se canibalizam entre si na reta final.",
      keyConditions: [
        "Derrota vs Porto (J28)",
        "Porto perde vs Benfica (J30) e vs Braga (J34)",
        "Sporting 100% nos jogos restantes",
      ],
      sentiment: "scrappy",
    },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

const sentimentStyles = {
  comfortable: {
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-800",
    icon: "●",
  },
  realistic: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    icon: "◐",
  },
  scrappy: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-800",
    icon: "○",
  },
};

// ── Component ──────────────────────────────────────────────────────────────

function ArchetypeCard({ archetype, teamColor }: { archetype: Archetype; teamColor: string }) {
  const style = sentimentStyles[archetype.sentiment];

  return (
    <div className={`border ${style.border} ${style.bg} p-4 md:p-5`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{style.icon}</span>
          <h4 className="text-base font-bold text-stone-900">{archetype.name}</h4>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="h-5 shrink-0"
            style={{
              width: `${Math.max(archetype.frequency * 200, 16)}px`,
              backgroundColor: teamColor,
              opacity: 0.6,
            }}
          />
          <span className="text-sm font-bold tabular-nums text-stone-700">
            {pct(archetype.frequency)}
          </span>
        </div>
      </div>

      <p className="text-sm text-stone-600 mb-3 leading-relaxed">
        {archetype.narrative}
      </p>

      <div className="space-y-1">
        {archetype.keyConditions.map((condition, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-stone-400 text-xs mt-0.5 shrink-0">→</span>
            <span className="text-xs text-stone-500">{condition}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamSection({ data }: { data: TeamArchetypes }) {
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
            <span
              className="font-bold tabular-nums"
              style={{ color: data.teamColor }}
            >
              {pct(data.currentProb)}
            </span>
          </div>
        </div>
      </div>

      {/* Frequency overview bar */}
      <div className="flex h-3 w-full overflow-hidden bg-stone-100">
        {data.archetypes.map((a, i) => (
          <div
            key={i}
            style={{
              width: pct(a.frequency / data.currentProb),
              backgroundColor: data.teamColor,
              opacity: 0.2 + (0.6 * (data.archetypes.length - i)) / data.archetypes.length,
            }}
            title={`${a.name}: ${pct(a.frequency)}`}
          />
        ))}
        <div className="flex-1" title="Outros cenários" />
      </div>
      <div className="flex justify-between text-xs text-stone-400">
        <span>Cenários classificados</span>
        <span className="tabular-nums">
          {pct(data.archetypes.reduce((s, a) => s + a.frequency, 0))} dos {pct(data.currentProb)} totais
        </span>
      </div>

      {/* Archetype cards */}
      <div className="space-y-3">
        {data.archetypes.map((archetype, i) => (
          <ArchetypeCard
            key={i}
            archetype={archetype}
            teamColor={data.teamColor}
          />
        ))}
      </div>
    </div>
  );
}

export default function PathsArchetypes() {
  return (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Abordagem B
        </div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">
          Arquétipos de Vitória
        </h3>
        <p className="text-sm text-stone-500">
          As simulações vencedoras agrupadas em narrativas. Cada arquétipo representa
          um cenário-tipo com as suas condições-chave.
        </p>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-1 gap-10">
        <TeamSection data={portoArchetypes} />
        <div className="border-t border-stone-200" />
        <TeamSection data={sportingArchetypes} />
      </div>
    </div>
  );
}
