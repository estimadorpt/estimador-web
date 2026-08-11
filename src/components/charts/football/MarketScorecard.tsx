"use client";

import { useEffect, useRef, useState } from "react";
import { teamDisplayName } from "@/lib/config/football";

/* ------------------------------------------------------------------ types */

export interface MarketBlock {
  n: number;
  model_rps: number;
  market_rps: number;
  delta: number;
  se: number;
  t: number;
}

export interface MarketCheckpoint extends MarketBlock {
  checkpoint: number;
  phase: "early" | "mid_late";
}

export interface MarketPhase extends MarketBlock {
  checkpoints: number[];
  label_pt: string;
  label_en: string;
}

type Side = "home" | "draw" | "away";

export interface MarketDisagreement {
  season: string;
  date: string | null;
  matchday: number | null;
  checkpoint: number;
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
  outcome: Side;
  model_pick: Side;
  model_pick_prob: number;
  market_pick: Side;
  market_pick_prob: number;
  model_rps: number;
  market_rps: number;
  verdict: "model" | "market" | "neither";
}

export interface MarketScorecardData {
  generated_at: string;
  model: string;
  market: string;
  metric: string;
  n: number;
  seasons: string[];
  n_seasons: number;
  overall: MarketBlock;
  overall_vs_open: MarketBlock;
  close_vs_open: {
    n: number;
    delta: number;
    se: number;
    t: number;
    all_priced_matches: { delta: number; se: number; n: number };
  };
  checkpoints: MarketCheckpoint[];
  phases: { early: MarketPhase; mid_late: MarketPhase };
  disagreement_summary: {
    n_disagree: number;
    pct_of_matches: number;
    model_pick_won: number;
    market_pick_won: number;
    neither_won: number;
    model_rps: number;
    market_rps: number;
    delta: number;
    se: number;
    mean_tvd_all_matches: number;
  };
  disagreements: MarketDisagreement[];
}

interface Props {
  data: MarketScorecardData;
  locale?: string;
}

/* ----------------------------------------------------------------- colors */
/* Validated with the dataviz palette checker against a light surface:
   CVD separation dE 15.1 (deutan), normal-vision dE 19.8, both above the
   surface contrast floor. Emerald carries the model, stone the market
   benchmark; marker shape and direct labels repeat the identity so it is
   never colour alone. */
const MODEL_COLOR = "#059669"; // emerald-600
const MARKET_COLOR = "#57534e"; // stone-600
const GRID = "#e7e5e4"; // stone-200
const AXIS_TEXT = "#78716c"; // stone-500
const SURFACE = "#ffffff";

/* ------------------------------------------------------------- formatting */

function makeFmt(pt: boolean) {
  const loc = pt ? "pt-PT" : "en-GB";
  const num = (v: number, d: number) =>
    v.toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (v: number, d: number) =>
    (v > 0 ? "+" : v < 0 ? "−" : "") + num(Math.abs(v), d);
  return { num, signed };
}

/* ---------------------------------------------------------------- helpers */

/** Rect with a rounded data-end and a square baseline end. */
function barPath(x: number, w: number, y0: number, y1: number, r: number) {
  const up = y1 < y0;
  const h = Math.abs(y1 - y0);
  const rr = Math.min(r, w / 2, h);
  if (up) {
    return `M${x},${y0} L${x},${y0 - h + rr} Q${x},${y0 - h} ${x + rr},${y0 - h} L${x + w - rr},${y0 - h} Q${x + w},${y0 - h} ${x + w},${y0 - h + rr} L${x + w},${y0} Z`;
  }
  return `M${x},${y0} L${x},${y0 + h - rr} Q${x},${y0 + h} ${x + rr},${y0 + h} L${x + w - rr},${y0 + h} Q${x + w},${y0 + h} ${x + w},${y0 + h - rr} L${x + w},${y0} Z`;
}

/* ------------------------------------------------------------- the chart */

function CheckpointChart({
  data,
  pt,
}: {
  data: MarketScorecardData;
  pt: boolean;
}) {
  const { num, signed } = makeFmt(pt);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(280, el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cps = data.checkpoints;
  const narrow = width < 520;

  const padL = narrow ? 34 : 44;
  const padR = 12;
  const padT = 18;
  const plotH = narrow ? 170 : 210;
  const axisH = 34;
  const stripH = narrow ? 70 : 84;
  const stripTop = padT + plotH + axisH + 40;
  const H = stripTop + stripH + 24;

  const innerW = Math.max(60, width - padL - padR);
  const xs = cps.map((_, i) => padL + (innerW * (i + 0.5)) / cps.length);
  const bandW = innerW / cps.length;

  // RPS scale — truncated axis (values live in a narrow band); flagged in the note.
  const yLo = 0.165;
  const yHi = 0.205;
  const y = (v: number) => padT + plotH - ((v - yLo) / (yHi - yLo)) * plotH;
  const ticks = [0.17, 0.18, 0.19, 0.2];

  // Delta strip scale
  const maxAbs = Math.max(
    ...cps.map((c) => Math.abs(c.delta) + (c.se ?? 0)),
    0.012
  );
  const dy = (v: number) => stripTop + stripH / 2 - (v / maxAbs) * (stripH / 2 - 6);

  const line = (get: (c: MarketCheckpoint) => number) =>
    cps.map((c, i) => `${i === 0 ? "M" : "L"}${xs[i]},${y(get(c))}`).join(" ");

  // Phase boundary sits between checkpoint 10 and checkpoint 14.
  const boundaryIdx = cps.findIndex((c) => c.phase === "mid_late");
  const boundaryX =
    boundaryIdx > 0 ? (xs[boundaryIdx - 1] + xs[boundaryIdx]) / 2 : padL;

  const h = hover !== null ? cps[hover] : null;
  const hoverX = hover !== null ? xs[hover] : 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Legend — identity never rests on colour alone */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-2 text-xs text-stone-600">
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="10" aria-hidden="true">
            <line x1="0" y1="5" x2="22" y2="5" stroke={MODEL_COLOR} strokeWidth="2.5" />
            <circle cx="11" cy="5" r="4" fill={MODEL_COLOR} stroke={SURFACE} strokeWidth="2" />
          </svg>
          {pt ? "Modelo" : "Model"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="10" aria-hidden="true">
            <line x1="0" y1="5" x2="22" y2="5" stroke={MARKET_COLOR} strokeWidth="2" />
            <rect x="7" y="1" width="8" height="8" fill={SURFACE} stroke={MARKET_COLOR} strokeWidth="2" />
          </svg>
          {pt ? "Mercado (linha de fecho)" : "Market (closing line)"}
        </span>
      </div>

      <svg
        width={width}
        height={H}
        role="img"
        aria-label={
          pt
            ? "Erro de previsão (RPS) do modelo e da linha de fecho do mercado, por jornada de referência, de 8 épocas históricas. O modelo está pior nas jornadas 6 e 10 e iguala o mercado da jornada 14 em diante."
            : "Forecast error (RPS) for the model and the market closing line by reference matchday across 8 historical seasons. The model is worse at matchdays 6 and 10 and matches the market from matchday 14 onward."
        }
      >
        {/* early-season wash */}
        <rect
          x={padL}
          y={padT}
          width={boundaryX - padL}
          height={plotH}
          fill="#fafaf9"
        />

        {/* gridlines + y ticks */}
        {ticks.map((tk) => (
          <g key={tk}>
            <line
              x1={padL}
              x2={padL + innerW}
              y1={y(tk)}
              y2={y(tk)}
              stroke={GRID}
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={y(tk) + 3}
              textAnchor="end"
              fontSize={narrow ? 9 : 10}
              fill={AXIS_TEXT}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {num(tk, narrow ? 2 : 3)}
            </text>
          </g>
        ))}

        {/* phase boundary */}
        <line
          x1={boundaryX}
          x2={boundaryX}
          y1={padT}
          y2={padT + plotH}
          stroke="#d6d3d1"
          strokeWidth="1"
        />

        {/* hover crosshair */}
        {hover !== null && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={padT}
            y2={stripTop + stripH}
            stroke="#d6d3d1"
            strokeWidth="1"
          />
        )}

        {/* series */}
        <path d={line((c) => c.market_rps)} fill="none" stroke={MARKET_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={line((c) => c.model_rps)} fill="none" stroke={MODEL_COLOR} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {cps.map((c, i) => (
          <rect
            key={`mk-${c.checkpoint}`}
            x={xs[i] - 4}
            y={y(c.market_rps) - 4}
            width="8"
            height="8"
            fill={SURFACE}
            stroke={MARKET_COLOR}
            strokeWidth="2"
          />
        ))}
        {cps.map((c, i) => (
          <circle
            key={`md-${c.checkpoint}`}
            cx={xs[i]}
            cy={y(c.model_rps)}
            r="4"
            fill={MODEL_COLOR}
            stroke={SURFACE}
            strokeWidth="2"
          />
        ))}

        {/* direct labels at the left edge, where the two series separate */}
        {!narrow && (
          <>
            <text
              x={xs[0] + 8}
              y={y(cps[0].model_rps) - 8}
              fontSize="11"
              fontWeight={600}
              fill="#44403c"
            >
              {pt ? "Modelo" : "Model"}
            </text>
            <text
              x={xs[0] + 8}
              y={y(cps[0].market_rps) + 16}
              fontSize="11"
              fontWeight={600}
              fill="#44403c"
            >
              {pt ? "Mercado" : "Market"}
            </text>
          </>
        )}

        {/* phase captions */}
        <text
          x={padL + 4}
          y={padT + 12}
          fontSize={narrow ? 8 : 9}
          fill={AXIS_TEXT}
          className="uppercase"
          letterSpacing="0.06em"
        >
          {pt ? "Início" : "Early"}
        </text>
        <text
          x={boundaryX + 6}
          y={padT + 12}
          fontSize={narrow ? 8 : 9}
          fill={AXIS_TEXT}
          className="uppercase"
          letterSpacing="0.06em"
        >
          {pt ? "Jornada 14 em diante" : "Matchday 14 onward"}
        </text>

        {/* x axis */}
        <line
          x1={padL}
          x2={padL + innerW}
          y1={padT + plotH}
          y2={padT + plotH}
          stroke="#d6d3d1"
          strokeWidth="1"
        />
        {cps.map((c, i) => (
          <text
            key={`x-${c.checkpoint}`}
            x={xs[i]}
            y={padT + plotH + 15}
            textAnchor="middle"
            fontSize={narrow ? 9 : 10}
            fill={AXIS_TEXT}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {c.checkpoint}
          </text>
        ))}
        <text
          x={padL + innerW / 2}
          y={padT + plotH + 30}
          textAnchor="middle"
          fontSize={narrow ? 8 : 9}
          fill="#a8a29e"
          className="uppercase"
          letterSpacing="0.06em"
        >
          {pt ? "Jornada de referência" : "Reference matchday"}
        </text>

        {/* delta strip */}
        <text
          x={padL}
          y={stripTop - 26}
          fontSize={narrow ? 9 : 10}
          fontWeight={600}
          fill="#57534e"
        >
          {pt
            ? "Diferença (modelo − mercado), com ±1 erro padrão"
            : "Difference (model − market), with ±1 standard error"}
        </text>
        {[0.01, -0.01].map((v) => (
          <g key={`dg-${v}`}>
            <line
              x1={padL}
              x2={padL + innerW}
              y1={dy(v)}
              y2={dy(v)}
              stroke={GRID}
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={dy(v) + 3}
              textAnchor="end"
              fontSize={narrow ? 8 : 9}
              fill={AXIS_TEXT}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {signed(v, narrow ? 2 : 3)}
            </text>
          </g>
        ))}
        <line
          x1={padL}
          x2={padL + innerW}
          y1={dy(0)}
          y2={dy(0)}
          stroke="#a8a29e"
          strokeWidth="1"
        />
        <text
          x={padL - 6}
          y={dy(0) + 3}
          textAnchor="end"
          fontSize={narrow ? 8 : 9}
          fill={AXIS_TEXT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          0
        </text>
        {cps.map((c, i) => {
          const ahead = c.delta < 0; // negative delta = lower error = model ahead
          const col = ahead ? MODEL_COLOR : MARKET_COLOR;
          const bw = Math.min(16, bandW * 0.34);
          return (
            <g key={`d-${c.checkpoint}`}>
              <path
                d={barPath(xs[i] - bw / 2, bw, dy(0), dy(c.delta), 3)}
                fill={col}
                opacity={0.85}
              />
              <line
                x1={xs[i]}
                x2={xs[i]}
                y1={dy(c.delta - c.se)}
                y2={dy(c.delta + c.se)}
                stroke="#44403c"
                strokeWidth="1"
              />
              <line
                x1={xs[i] - 3}
                x2={xs[i] + 3}
                y1={dy(c.delta + c.se)}
                y2={dy(c.delta + c.se)}
                stroke="#44403c"
                strokeWidth="1"
              />
              <line
                x1={xs[i] - 3}
                x2={xs[i] + 3}
                y1={dy(c.delta - c.se)}
                y2={dy(c.delta - c.se)}
                stroke="#44403c"
                strokeWidth="1"
              />
            </g>
          );
        })}
        <text x={padL} y={stripTop - 8} fontSize={narrow ? 8 : 9} fill={AXIS_TEXT}>
          {pt ? "▲ mercado erra menos" : "▲ market errs less"}
        </text>
        <text x={padL} y={stripTop + stripH + 12} fontSize={narrow ? 8 : 9} fill={AXIS_TEXT}>
          {pt ? "▼ modelo erra menos" : "▼ model errs less"}
        </text>

        {/* hover hit areas — wider than the marks */}
        {cps.map((c, i) => (
          <rect
            key={`hit-${c.checkpoint}`}
            x={xs[i] - bandW / 2}
            y={padT}
            width={bandW}
            height={stripTop + stripH - padT}
            fill="transparent"
            className="cp-hit cursor-crosshair"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {/* Tooltip — enhances; every value is also in the table below */}
      {h && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-stone-200 bg-white/95 px-3 py-2 text-xs shadow-sm"
          style={{
            left: Math.min(Math.max(hoverX - 92, 0), Math.max(0, width - 184)),
            top: padT + 4,
            width: 184,
          }}
        >
          <div className="font-semibold text-stone-900 mb-1">
            {pt ? "Jornada" : "Matchday"} {h.checkpoint}{" "}
            <span className="font-normal text-stone-400">n={h.n}</span>
          </div>
          <div className="flex justify-between tabular-nums">
            <span className="text-stone-500">{pt ? "Modelo" : "Model"}</span>
            <span className="font-medium text-stone-800">{num(h.model_rps, 4)}</span>
          </div>
          <div className="flex justify-between tabular-nums">
            <span className="text-stone-500">{pt ? "Mercado" : "Market"}</span>
            <span className="font-medium text-stone-800">{num(h.market_rps, 4)}</span>
          </div>
          <div className="flex justify-between tabular-nums border-t border-stone-100 mt-1 pt-1">
            <span className="text-stone-500">{pt ? "Diferença" : "Difference"}</span>
            <span className="font-medium text-stone-800">{signed(h.delta, 4)}</span>
          </div>
          <div className="text-right tabular-nums text-[11px] text-stone-400">
            ± {num(h.se, 4)}
          </div>
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-stone-400">
        {pt
          ? "Eixo vertical truncado (0,165–0,205) para tornar visível o cruzamento; as diferenças reais são as da faixa inferior. Cada ponto é uma jornada prevista em cada uma das 8 épocas (n = 72 jogos por ponto)."
          : "Vertical axis truncated (0.165–0.205) so the crossover is visible; the real differences are the ones in the lower strip. Each point is one predicted matchday in each of the 8 seasons (n = 72 matches per point)."}
      </p>

      {/* Table view twin */}
      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-medium text-stone-500 hover:text-stone-800">
          {pt ? "Ver os números em tabela" : "See the numbers as a table"}
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <caption className="sr-only">
              {pt
                ? "RPS do modelo e do mercado por jornada de referência"
                : "Model and market RPS by reference matchday"}
            </caption>
            <thead>
              <tr className="border-b border-stone-300 text-stone-500 text-left">
                <th scope="col" className="py-1 pr-3 font-medium">
                  {pt ? "Jornada" : "Matchday"}
                </th>
                <th scope="col" className="py-1 px-3 font-medium text-right">
                  {pt ? "Modelo" : "Model"}
                </th>
                <th scope="col" className="py-1 px-3 font-medium text-right">
                  {pt ? "Mercado" : "Market"}
                </th>
                <th scope="col" className="py-1 px-3 font-medium text-right">
                  {pt ? "Diferença" : "Difference"}
                </th>
                <th scope="col" className="py-1 pl-3 font-medium text-right">
                  {pt ? "Erro padrão" : "Std. error"}
                </th>
              </tr>
            </thead>
            <tbody>
              {cps.map((c) => (
                <tr key={c.checkpoint} className="border-b border-stone-100">
                  <th scope="row" className="py-1 pr-3 font-medium text-stone-700 text-left">
                    {c.checkpoint}
                  </th>
                  <td className="py-1 px-3 text-right text-stone-700">{num(c.model_rps, 4)}</td>
                  <td className="py-1 px-3 text-right text-stone-700">{num(c.market_rps, 4)}</td>
                  <td
                    className="py-1 px-3 text-right font-medium"
                    style={{ color: c.delta < 0 ? MODEL_COLOR : MARKET_COLOR }}
                  >
                    {signed(c.delta, 4)}
                  </td>
                  <td className="py-1 pl-3 text-right text-stone-400">{num(c.se, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* ------------------------------------------------------------- stat tiles */

function PhaseTile({
  label,
  sub,
  block,
  tone,
  verdict,
  pt,
}: {
  label: string;
  sub: string;
  block: MarketBlock;
  tone: "market" | "model" | "neutral";
  verdict: string;
  pt: boolean;
}) {
  const { num, signed } = makeFmt(pt);
  const color =
    tone === "model" ? MODEL_COLOR : tone === "market" ? MARKET_COLOR : "#d6d3d1";
  return (
    <div className="border border-stone-200 p-4">
      <div className="flex items-baseline gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <h3 className="text-sm font-bold text-stone-900">{label}</h3>
      </div>
      <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
      <p className="mt-3 text-2xl font-semibold text-stone-900">
        {signed(block.delta, 4)}
      </p>
      <p className="text-xs text-stone-500 mt-0.5">
        {pt ? "erro padrão" : "standard error"} {num(block.se, 4)} · n = {block.n}
      </p>
      <p className="text-sm text-stone-600 mt-2 leading-snug">{verdict}</p>
    </div>
  );
}

/* ------------------------------------------------------- disagreement row */

function pickLabel(
  side: Side,
  home: string,
  away: string,
  pt: boolean
): string {
  if (side === "draw") return pt ? "Empate" : "Draw";
  return teamDisplayName(side === "home" ? home : away);
}

function Disagreements({ data, pt }: { data: MarketScorecardData; pt: boolean }) {
  const { num, signed } = makeFmt(pt);
  const s = data.disagreement_summary;

  const verdictChip = (v: MarketDisagreement["verdict"]) => {
    const map = {
      model: {
        text: pt ? "Modelo certo" : "Model right",
        cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
      },
      market: {
        text: pt ? "Mercado certo" : "Market right",
        cls: "bg-stone-100 text-stone-700 border-stone-300",
      },
      neither: {
        text: pt ? "Nenhum" : "Neither",
        cls: "bg-white text-stone-500 border-stone-200",
      },
    } as const;
    const m = map[v];
    return (
      <span className={`text-[10px] font-semibold uppercase tracking-wide border px-1.5 py-0.5 ${m.cls}`}>
        {m.text}
      </span>
    );
  };

  return (
    <div>
      <p className="text-sm text-stone-600 leading-relaxed max-w-3xl">
        {pt
          ? `Em ${s.n_disagree} dos ${data.n} jogos (${num(s.pct_of_matches, 1)}%) o modelo e o mercado apontaram favoritos diferentes. Nesses jogos o favorito do mercado ganhou ${s.market_pick_won} vezes e o do modelo ${s.model_pick_won}, com ${s.neither_won} a acabar num terceiro resultado. A diferença de erro nesse subconjunto é ${signed(s.delta, 4)}, com erro padrão ${num(s.se, 4)} — demasiado ruidosa para arbitrar a questão.`
          : `In ${s.n_disagree} of the ${data.n} matches (${num(s.pct_of_matches, 1)}%) model and market named different favourites. In those, the market's pick won ${s.market_pick_won} times and the model's ${s.model_pick_won}, with ${s.neither_won} landing on a third result. The error gap on that subset is ${signed(s.delta, 4)}, with a standard error of ${num(s.se, 4)} — far too noisy to settle the question.`}
      </p>

      <ul className="mt-5 divide-y divide-stone-100 border-t border-stone-200">
        {data.disagreements.map((d, i) => (
          <li key={`${d.season}-${d.home_team}-${d.away_team}-${i}`} className="py-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-stone-900">
                {teamDisplayName(d.home_team)}{" "}
                <span className="tabular-nums text-stone-500">
                  {d.home_goals}–{d.away_goals}
                </span>{" "}
                {teamDisplayName(d.away_team)}
              </span>
              <span className="text-xs text-stone-400">
                {d.season} · {pt ? "jornada" : "matchday"} {d.matchday ?? d.checkpoint}
              </span>
              <span className="ml-auto">{verdictChip(d.verdict)}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: MODEL_COLOR }}
                  aria-hidden="true"
                />
                <span className="text-stone-500">{pt ? "Modelo:" : "Model:"}</span>
                <span className="text-stone-800">
                  {pickLabel(d.model_pick, d.home_team, d.away_team, pt)}
                </span>
                <span className="tabular-nums text-stone-400">
                  {Math.round(d.model_pick_prob * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: MARKET_COLOR }}
                  aria-hidden="true"
                />
                <span className="text-stone-500">{pt ? "Mercado:" : "Market:"}</span>
                <span className="text-stone-800">
                  {pickLabel(d.market_pick, d.home_team, d.away_team, pt)}
                </span>
                <span className="tabular-nums text-stone-400">
                  {Math.round(d.market_pick_prob * 100)}%
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-stone-400">
        {pt
          ? "Os oito jogos em que os dois favoritos mais se afastaram um do outro. “Nenhum” significa que saiu o terceiro resultado."
          : "The eight matches where the two favourites were furthest apart. “Neither” means the third result came in."}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------- the block */

export function MarketScorecard({ data, locale = "pt" }: Props) {
  const pt = locale !== "en";
  const { num, signed } = makeFmt(pt);
  const o = data.overall;
  const early = data.phases.early;
  const late = data.phases.mid_late;

  return (
    <div className="space-y-12">
      {/* Headline numbers */}
      <section>
        <h2 className="text-xl font-bold tracking-tight mb-1">
          {pt ? "O resultado, em três números" : "The result, in three numbers"}
        </h2>
        <p className="text-sm text-stone-500 mb-5 max-w-3xl">
          {pt
            ? `Diferença de RPS entre o modelo e a linha de fecho, jogo a jogo. Negativo = o modelo erra menos. ${data.n} jogos, ${data.n_seasons} épocas.`
            : `RPS difference between the model and the closing line, match by match. Negative = the model errs less. ${data.n} matches, ${data.n_seasons} seasons.`}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PhaseTile
            pt={pt}
            label={pt ? "Toda a época" : "Whole season"}
            sub={pt ? "Jornadas 6 a 30" : "Matchdays 6 to 30"}
            block={o}
            tone="neutral"
            verdict={
              pt
                ? "A diferença é menor do que metade do seu próprio erro padrão: indistinguível de zero."
                : "The gap is smaller than half its own standard error: indistinguishable from zero."
            }
          />
          <PhaseTile
            pt={pt}
            label={pt ? "Início da época" : "Early season"}
            sub={pt ? early.label_pt : early.label_en}
            block={early}
            tone="market"
            verdict={
              pt
                ? `O mercado está à frente, e aqui a diferença sobrevive ao erro padrão (t = ${num(early.t, 2)}).`
                : `The market is ahead, and here the gap survives its standard error (t = ${num(early.t, 2)}).`
            }
          />
          <PhaseTile
            pt={pt}
            label={pt ? "Resto da época" : "Rest of the season"}
            sub={pt ? late.label_pt : late.label_en}
            block={late}
            tone="model"
            verdict={
              pt
                ? "O modelo iguala a linha de fecho. O sinal é favorável, mas dentro do ruído."
                : "The model matches the closing line. The sign favours it, but stays inside the noise."
            }
          />
        </div>
      </section>

      {/* The chart */}
      <section>
        <h2 className="text-xl font-bold tracking-tight mb-1">
          {pt
            ? "Onde a desvantagem começa e onde acaba"
            : "Where the deficit starts and where it ends"}
        </h2>
        <p className="text-sm text-stone-500 mb-5 max-w-3xl">
          {pt
            ? "Erro de previsão (RPS) do modelo e da linha de fecho, para cada jornada de referência. Mais baixo é melhor. As duas linhas cruzam-se entre a jornada 10 e a jornada 14."
            : "Forecast error (RPS) for the model and the closing line at each reference matchday. Lower is better. The two lines cross between matchday 10 and matchday 14."}
        </p>
        <CheckpointChart data={data} pt={pt} />
      </section>

      {/* Explainer */}
      <section className="border border-stone-200 bg-stone-50 p-5 sm:p-6">
        <h2 className="text-base font-bold tracking-tight mb-3">
          {pt ? "Como lemos isto" : "How to read this"}
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
          <div>
            <dt className="font-semibold text-stone-900 mb-1">
              {pt ? "RPS: menos é melhor" : "RPS: lower is better"}
            </dt>
            <dd className="text-stone-600 leading-relaxed">
              {pt
                ? "O Ranked Probability Score mede quanto uma previsão de vitória-empate-derrota se afasta do que aconteceu, penalizando mais os erros grandes. Zero é uma previsão perfeita; dar 33% a cada resultado dá cerca de 0,22."
                : "The Ranked Probability Score measures how far a win-draw-loss forecast lands from what happened, penalising big misses more. Zero is a perfect forecast; putting 33% on each result scores about 0.22."}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-stone-900 mb-1">
              {pt ? "O que é a linha de fecho" : "What the closing line is"}
            </dt>
            <dd className="text-stone-600 leading-relaxed">
              {pt
                ? "É o último preço do mercado antes do apito inicial, já sem a margem (método de Shin). A essa hora incorporou tudo: lesões, onzes, castigos, e o dinheiro de quem sabe mais do que nós."
                : "It is the market's last price before kick-off, with the margin stripped out (Shin's method). By then it has absorbed everything: injuries, line-ups, suspensions, and the money of people who know more than we do."}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-stone-900 mb-1">
              {pt ? "Porque é difícil de bater" : "Why it is hard to beat"}
            </dt>
            <dd className="text-stone-600 leading-relaxed">
              {pt
                ? "A linha de fecho é o consenso de milhares de apostadores com dinheiro em risco, e é o padrão contra o qual qualquer modelo se mede. Igualá-la já é um bom resultado; bater a linha de abertura é outra conversa — nesta amostra a diferença entre fecho e abertura é de apenas alguns décimos de milésimo."
                : "The closing line is the consensus of thousands of bettors with money at stake, and it is the benchmark any model is measured against. Matching it is already a good result; beating the opening line is a different conversation — in this sample the gap between close and open is a few ten-thousandths."}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-stone-600 leading-relaxed max-w-3xl">
          {pt
            ? `Uma nota sobre incerteza, porque aqui ela decide tudo. A diferença global é ${signed(o.delta, 5)} com um erro padrão de ${num(o.se, 5)}: o intervalo passa confortavelmente por zero, por isso não afirmamos que o mercado esteja à nossa frente no conjunto da época. A única diferença que sobrevive ao seu próprio erro padrão é a do início da época.`
            : `A note on uncertainty, because here it decides everything. The overall gap is ${signed(o.delta, 5)} with a standard error of ${num(o.se, 5)}: the interval runs comfortably through zero, so we do not claim the market is ahead of us across the season. The only gap that survives its own standard error is the early-season one.`}
        </p>
      </section>

      {/* Disagreements */}
      <section>
        <h2 className="text-xl font-bold tracking-tight mb-1">
          {pt ? "Quando discordámos do mercado" : "When we disagreed with the market"}
        </h2>
        <p className="text-sm text-stone-500 mb-4 max-w-3xl">
          {pt
            ? "Modelo e mercado quase sempre veem o mesmo jogo. Estes são os casos em que não viram."
            : "Model and market almost always see the same match. These are the cases where they did not."}
        </p>
        <Disagreements data={data} pt={pt} />
      </section>
    </div>
  );
}
