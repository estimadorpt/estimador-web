"use client";

import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface MatchRow {
  matchday: string;
  opponent: string;
  isKeyMatch?: boolean;
  paths: {
    result: "win" | "draw" | "lose";
    titleAfter: number;
  }[];
}

interface TeamTable {
  teamName: string;
  teamColor: string;
  currentProb: number;
  pathNames: string[];
  pathFrequencies: number[];
  pathFrequencyLabels: string[];
  matches: MatchRow[];
  keyMatchCallout?: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const portoTable: TeamTable = {
  teamName: "Porto",
  teamColor: "#003893",
  currentProb: 0.66,
  keyMatchCallout:
    "J28 é o jogo que decide a corrida — uma vitória vale mais do que as quatro jornadas seguintes combinadas.",
  pathNames: ["O Passeio", "A Recuperação", "A Conquista Improvável"],
  pathFrequencies: [0.38, 0.2, 0.08],
  pathFrequencyLabels: ["4 em 10", "2 em 10", "1 em 10"],
  matches: [
    {
      matchday: "J24", opponent: "Estoril",
      paths: [
        { result: "win", titleAfter: 0.7 },
        { result: "win", titleAfter: 0.7 },
        { result: "win", titleAfter: 0.7 },
      ],
    },
    {
      matchday: "J25", opponent: "Gil Vicente",
      paths: [
        { result: "win", titleAfter: 0.74 },
        { result: "win", titleAfter: 0.74 },
        { result: "draw", titleAfter: 0.62 },
      ],
    },
    {
      matchday: "J28", opponent: "Sporting CP", isKeyMatch: true,
      paths: [
        { result: "win", titleAfter: 0.88 },
        { result: "lose", titleAfter: 0.45 },
        { result: "lose", titleAfter: 0.35 },
      ],
    },
    {
      matchday: "J30", opponent: "Benfica", isKeyMatch: true,
      paths: [
        { result: "win", titleAfter: 0.95 },
        { result: "win", titleAfter: 0.58 },
        { result: "lose", titleAfter: 0.18 },
      ],
    },
    {
      matchday: "J34", opponent: "SC Braga",
      paths: [
        { result: "win", titleAfter: 0.99 },
        { result: "win", titleAfter: 0.65 },
        { result: "win", titleAfter: 0.22 },
      ],
    },
  ],
};

const sportingTable: TeamTable = {
  teamName: "Sporting CP",
  teamColor: "#006B3F",
  currentProb: 0.33,
  keyMatchCallout:
    "J28 no Dragão é a única oportunidade do Sporting para virar a corrida.",
  pathNames: ["A Reviravolta", "A Persistência", "O Milagre"],
  pathFrequencies: [0.15, 0.12, 0.06],
  pathFrequencyLabels: ["1.5 em 10", "1 em 10", "1 em 20"],
  matches: [
    {
      matchday: "J24", opponent: "Moreirense",
      paths: [
        { result: "win", titleAfter: 0.37 },
        { result: "win", titleAfter: 0.37 },
        { result: "win", titleAfter: 0.37 },
      ],
    },
    {
      matchday: "J28", opponent: "Porto", isKeyMatch: true,
      paths: [
        { result: "win", titleAfter: 0.55 },
        { result: "draw", titleAfter: 0.32 },
        { result: "lose", titleAfter: 0.18 },
      ],
    },
    {
      matchday: "J30", opponent: "SC Braga",
      paths: [
        { result: "win", titleAfter: 0.65 },
        { result: "win", titleAfter: 0.42 },
        { result: "win", titleAfter: 0.25 },
      ],
    },
    {
      matchday: "J32", opponent: "Benfica", isKeyMatch: true,
      paths: [
        { result: "win", titleAfter: 0.78 },
        { result: "win", titleAfter: 0.55 },
        { result: "win", titleAfter: 0.35 },
      ],
    },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

const resultStyles: Record<string, { letter: string; text: string; bg: string }> = {
  win: { letter: "V", text: "text-stone-700", bg: "" },
  draw: { letter: "E", text: "text-amber-700", bg: "bg-amber-50" },
  lose: { letter: "D", text: "text-red-600", bg: "bg-red-50" },
};

// ── Component ──────────────────────────────────────────────────────────────

function TeamTableView({ data }: { data: TeamTable }) {
  const numPaths = data.pathNames.length;
  // Check if all paths have the same result for a given row
  const isDivergent = (row: MatchRow) => {
    const first = row.paths[0].result;
    return row.paths.some((p) => p.result !== first || p.titleAfter !== row.paths[0].titleAfter);
  };

  return (
    <div className="space-y-3">
      {/* Team header */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 shrink-0" style={{ backgroundColor: data.teamColor }} />
        <div>
          <div className="text-lg font-bold tracking-tight text-stone-900">{data.teamName}</div>
          <div className="text-sm text-stone-500">
            Probabilidade atual:{" "}
            <span className="font-bold tabular-nums" style={{ color: data.teamColor }}>
              {pct(data.currentProb)}
            </span>
          </div>
        </div>
      </div>

      {/* Key match callout */}
      {data.keyMatchCallout && (
        <div className="border-l-2 border-amber-400 pl-3 py-1">
          <p className="text-sm text-stone-600 italic">{data.keyMatchCallout}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Column headers */}
          <thead>
            <tr className="border-b border-stone-200">
              <th className="text-left py-2 pr-3 text-xs font-bold uppercase tracking-wider text-stone-400 w-32">
                Jogo
              </th>
              {data.pathNames.map((name, i) => (
                <th
                  key={i}
                  className="text-center py-2 px-2"
                  style={{ minWidth: 100 }}
                >
                  <div className="text-xs font-bold text-stone-900">{name}</div>
                  <div className="text-[10px] text-stone-400 tabular-nums">
                    {data.pathFrequencyLabels[i]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Starting probability row */}
            <tr className="border-b border-stone-100">
              <td className="py-2 pr-3 text-xs text-stone-400 italic">Prob. atual</td>
              {Array.from({ length: numPaths }).map((_, i) => (
                <td key={i} className="text-center py-2 px-2">
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: data.teamColor }}
                  >
                    {pct(data.currentProb)}
                  </span>
                </td>
              ))}
            </tr>

            {/* Match rows */}
            {data.matches.map((row, ri) => {
              const divergent = isDivergent(row);

              return (
                <tr
                  key={ri}
                  className={`border-b border-stone-100 ${divergent ? "bg-stone-50" : ""}`}
                >
                  {/* Match label */}
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-400 tabular-nums">
                        {row.matchday}
                      </span>
                      <span className="text-sm text-stone-700 truncate">{row.opponent}</span>
                    </div>
                    {row.isKeyMatch && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1 py-0.5 bg-amber-100 text-amber-800 inline-block mt-0.5">
                        Decisivo
                      </span>
                    )}
                  </td>

                  {/* Path cells */}
                  {row.paths.map((p, pi) => {
                    const style = resultStyles[p.result];
                    const prevProb = ri === 0 ? data.currentProb : data.matches[ri - 1].paths[pi].titleAfter;
                    const delta = p.titleAfter - prevProb;

                    return (
                      <td
                        key={pi}
                        className={`text-center py-2 px-2 ${style.bg}`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`text-xs font-bold ${style.text}`}>
                            {style.letter}
                          </span>
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{ color: p.result === "lose" ? "#dc2626" : p.result === "draw" ? "#b45309" : data.teamColor }}
                          >
                            {pct(p.titleAfter)}
                          </span>
                        </div>
                        <div className={`text-[10px] tabular-nums ${delta >= 0 ? "text-stone-400" : "text-red-400"}`}>
                          {delta >= 0 ? "+" : ""}{Math.round(delta * 100)}pp
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-stone-400">
        Cada cenário representa um grupo de simulações com percursos semelhantes — não é uma previsão de resultados específicos.
      </p>
    </div>
  );
}

export default function PathsTable() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Abordagem E — Tabela
        </div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">
          Cenários de Vitória
        </h3>
        <p className="text-sm text-stone-500 max-w-2xl">
          Uma linha por jogo, uma coluna por cenário. As células onde os caminhos divergem
          ficam em destaque.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <TeamTableView data={portoTable} />
        <div className="border-t border-stone-200" />
        <TeamTableView data={sportingTable} />
      </div>
    </div>
  );
}
