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

// ── Variant C2: Slope/sparkline chart ──────────────────────────────────────

function SlopeChart({ data }: { data: TeamCascade }) {
  const W = 600;
  const H = 200;
  const PAD_L = 0;
  const PAD_R = 0;
  const PAD_T = 24;
  const PAD_B = 56;

  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Build points: start + each step's "after win"
  const winPoints = [
    { x: 0, y: data.currentProb, label: "Atual", matchday: "" },
    ...data.steps.map((s, i) => ({
      x: i + 1,
      y: s.titleAfterWin,
      label: s.opponent,
      matchday: s.matchday,
      isKey: s.isKeyMatch,
      step: s,
    })),
  ];

  const losePoints = [
    { x: 0, y: data.currentProb },
    ...data.steps.map((s, i) => ({
      x: i + 1,
      y: s.titleAfterLose,
    })),
  ];

  const n = winPoints.length - 1;
  const xScale = (i: number) => PAD_L + (i / n) * chartW;
  const yScale = (v: number) => PAD_T + chartH * (1 - v);

  const winPath = winPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x)} ${yScale(p.y)}`)
    .join(" ");

  const losePath = losePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x)} ${yScale(p.y)}`)
    .join(" ");

  return (
    <div className="space-y-3">
      {/* Team header */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 shrink-0" style={{ backgroundColor: data.teamColor }} />
        <div>
          <div className="text-lg font-bold tracking-tight text-stone-900">{data.teamName}</div>
          <div className="text-sm text-stone-500">
            Prob. atual: <span className="font-bold tabular-nums" style={{ color: data.teamColor }}>{pct(data.currentProb)}</span>
            {" → "}
            <span className="font-bold tabular-nums text-green-700">{pct(data.steps[data.steps.length - 1].titleAfterWin)}</span>
            <span className="text-stone-400"> se vencer tudo</span>
          </div>
        </div>
      </div>

      {/* SVG slope chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: W }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yScale(v)}
              y2={yScale(v)}
              stroke="#e7e5e4"
              strokeWidth={0.5}
            />
            <text
              x={W - PAD_R + 4}
              y={yScale(v) + 3}
              className="text-[9px]"
              fill="#a8a29e"
            >
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}

        {/* Lose path (faded) */}
        <path d={losePath} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.25} strokeDasharray="4 3" />

        {/* Win path (main) */}
        <path d={winPath} fill="none" stroke={data.teamColor} strokeWidth={2.5} opacity={0.8} />

        {/* Points + labels */}
        {winPoints.map((p, i) => {
          const cx = xScale(p.x);
          const cy = yScale(p.y);
          const isKey = "isKey" in p && p.isKey;
          return (
            <g key={i}>
              {/* Point */}
              <circle
                cx={cx}
                cy={cy}
                r={isKey ? 5 : 3.5}
                fill="white"
                stroke={data.teamColor}
                strokeWidth={isKey ? 2.5 : 1.5}
              />

              {/* Value label */}
              <text
                x={cx}
                y={cy - 10}
                textAnchor="middle"
                fill={data.teamColor}
                className="text-[11px] font-bold"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {pct(p.y)}
              </text>

              {/* X-axis label */}
              <text
                x={cx}
                y={H - PAD_B + 16}
                textAnchor="middle"
                fill={isKey ? "#92400e" : "#78716c"}
                className="text-[9px] font-bold"
                style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                {p.matchday || "Atual"}
              </text>
              {i > 0 && (
                <text
                  x={cx}
                  y={H - PAD_B + 28}
                  textAnchor="middle"
                  fill="#a8a29e"
                  className="text-[8px]"
                >
                  {"step" in p ? p.label : ""}
                </text>
              )}

              {/* Key match marker */}
              {isKey && (
                <rect
                  x={cx - 2}
                  y={H - PAD_B + 34}
                  width={4}
                  height={4}
                  fill="#f59e0b"
                  rx={1}
                />
              )}

              {/* Lose point */}
              {i > 0 && (
                <circle
                  cx={cx}
                  cy={yScale(losePoints[i].y)}
                  r={2}
                  fill="#ef4444"
                  opacity={0.3}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-stone-400">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5" style={{ backgroundColor: data.teamColor, opacity: 0.8 }} />
          <span>Se vencer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 border-t border-dashed border-red-400" />
          <span>Se perder</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-amber-400 rounded-sm" />
          <span>Jogo decisivo</span>
        </div>
      </div>
    </div>
  );
}

export default function PathsCascadeSlope() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Variante C2
        </div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">
          Slope Chart
        </h3>
        <p className="text-sm text-stone-500">
          A probabilidade de título como uma linha ascendente. A inclinação mostra o impacto
          de cada jogo — quanto mais íngreme, mais decisivo. A linha tracejada mostra o
          cenário de derrota.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-10">
        <SlopeChart data={portoCascade} />
        <div className="border-t border-stone-200" />
        <SlopeChart data={sportingCascade} />
      </div>
    </div>
  );
}
