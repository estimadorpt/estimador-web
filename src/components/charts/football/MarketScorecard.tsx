"use client";

import { useEffect, useRef, useState } from "react";
import { Disclosure } from "@/components/viz/Disclosure";
import { teamDisplayName } from "@/lib/config/football";
import { formatPercent } from "@/lib/football-format";
import { SERIES } from "@/components/viz/theme";
import { blockVerdict, SIGNIFICANCE_T, type PointsCalibration } from "@/lib/football-scorecard";
import {
  crossingSentence,
  disagreementSentence,
  gamesOfMatchdays,
  openingLineSentence,
  phaseMatchdays,
  predictedMatchday,
  readingRule,
  verdictLine,
} from "@/lib/football-model-evaluation";

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
  /** The matchday whose games this checkpoint forecast (checkpoint + 1). */
  matchday_predicted?: number;
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
  first_season?: string;
  last_season?: string;
  /** Matches priced by each bookmaker's closing line ({ pinnacle: 773, b365: 37 }). */
  market_sources?: Record<string, number>;
  /** The final-points interval check quoted under the league table. */
  calibration?: PointsCalibration & {
    metric?: string;
    /** Reference matchdays the check was run at. */
    checkpoints?: number[];
    /** Forecasts checked: team-seasons × checkpoints (972 = 162 × 6). */
    n_team_seasons?: number;
  };
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
// The design system's first two series (teal, gold), in its fixed order
// (audit UXD2-V08); they never colour text (A11Y2-08), and marker shape plus
// the legend repeat the identity.
const MODEL_COLOR = SERIES[0];
const MARKET_COLOR = SERIES[1];
const GRID = "#dadccf"; // stone-200
const AXIS_TEXT = "#5f7062"; // stone-500
const SURFACE = "#f5f3ea"; // paper

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
  const stripH = narrow ? 96 : 112;
  const stripTop = padT + plotH + axisH + 40;
  const H = stripTop + stripH + 24;

  const innerW = Math.max(60, width - padL - padR);
  // Matchdays 2 to 11 are consecutive, then 15, 19, 23…: a gap and a break
  // mark on the axis where the step changes, so the later points do not
  // read as consecutive rounds (audit UXD2-V08).
  const BREAK_GAP = 0.6;
  const mdList = cps.map(predictedMatchday);
  const breaksBefore = mdList.map((md, i) => (i > 0 && md - mdList[i - 1] > 1 ? 1 : 0));
  const slots = cps.length + BREAK_GAP * breaksBefore.reduce<number>((a, b) => a + b, 0);
  const bandW = innerW / slots;
  let acc = 0;
  const xs = cps.map((_, i) => {
    acc += breaksBefore[i] ? BREAK_GAP : 0;
    return padL + bandW * (i + acc + 0.5);
  });
  const breakXs = breaksBefore.flatMap((b, i) => (b && !breaksBefore.slice(0, i).some(Boolean) ? [(xs[i - 1] + xs[i]) / 2] : []));

  // RPS scale — a truncated axis read from the data (the values live in a
  // narrow band), rounded out to the hundredth; the note states its range.
  const rpsValues = cps.flatMap((c) => [c.model_rps, c.market_rps]).filter(Number.isFinite);
  const yLo = rpsValues.length ? Math.floor(Math.min(...rpsValues) * 100) / 100 : 0;
  const yHi = rpsValues.length ? Math.max(Math.ceil(Math.max(...rpsValues) * 100) / 100, yLo + 0.01) : 0.01;
  const y = (v: number) => padT + plotH - ((v - yLo) / (yHi - yLo)) * plotH;
  const tickStep = (yHi - yLo) / 0.01 > (narrow ? 4 : 8) ? 0.02 : 0.01;
  const ticks = Array.from(
    { length: Math.floor((yHi - yLo) / tickStep + 1e-9) + 1 },
    (_, i) => Math.round((yLo + i * tickStep) * 1000) / 1000,
  );

  // Delta strip scale. The bars are ±2 standard errors: the page reads a
  // gap as real only beyond twice its standard error (M-04), so a bar that
  // crosses zero is exactly a gap the page calls a tie.
  const K = SIGNIFICANCE_T;
  const maxAbs = Math.max(
    ...cps.map((c) => Math.abs(c.delta) + K * (c.se ?? 0)),
    0.012
  );
  // Gridlines at a round step that leaves room for their labels.
  const stripTick = maxAbs > 0.025 ? 0.02 : 0.01;
  const dy = (v: number) => stripTop + stripH / 2 - (v / maxAbs) * (stripH / 2 - 6);

  // The line breaks where the axis does.
  const line = (get: (c: MarketCheckpoint) => number) =>
    cps.map((c, i) => `${i === 0 || breaksBefore[i] ? "M" : "L"}${xs[i]},${y(get(c))}`).join(" ");

  // Phase boundary sits between checkpoint 10 and checkpoint 14.
  const boundaryIdx = cps.findIndex((c) => c.phase === "mid_late");
  const boundaryX =
    boundaryIdx > 0 ? (xs[boundaryIdx - 1] + xs[boundaryIdx]) / 2 : padL;

  const lateCp = data.phases.mid_late.checkpoints?.[0] ?? null;
  const lateFromCp = lateCp == null ? null : cps.find((c) => c.checkpoint === lateCp) ?? null;
  const lateFrom = lateFromCp ? predictedMatchday(lateFromCp) : null;
  // Matches behind each point, from each checkpoint's own n.
  const pointNs = cps.map((c) => c.n).filter((n) => Number.isFinite(n));
  const nMin = pointNs.length ? Math.min(...pointNs) : null;
  const nMax = pointNs.length ? Math.max(...pointNs) : null;
  const perPoint = nMin === null || nMax === null
    ? null
    : nMin === nMax ? `${nMin}` : pt ? `${nMin} a ${nMax}` : `${nMin} to ${nMax}`;

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
            ? `Erro de previsão (RPS) do modelo e da linha de fecho do mercado, por jornada prevista, em ${data.n_seasons} épocas históricas. Os valores estão na tabela abaixo.`
            : `Forecast error (RPS) for the model and the market closing line by matchday forecast across ${data.n_seasons} historical seasons. The values are in the table below.`
        }
      >
        {/* early-season wash */}
        <rect
          x={padL}
          y={padT}
          width={boundaryX - padL}
          height={plotH}
          fill="#fcfbf5"
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
              fontSize={11}
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
          stroke="#cbccbb"
          strokeWidth="1"
        />

        {/* hover crosshair */}
        {hover !== null && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={padT}
            y2={stripTop + stripH}
            stroke="#cbccbb"
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

        {/* The legend above names the two series; inline labels used to
            overprint the lines at jornada 2 (audit UXD2-V08). */}

        {/* phase captions */}
        <text
          x={padL + 4}
          y={padT + 12}
          fontSize={11}
          fill={AXIS_TEXT}
          className="uppercase"
          letterSpacing="0.06em"
        >
          {pt ? "Início" : "Early"}
        </text>
        <text
          x={boundaryX + 6}
          y={padT + 12}
          fontSize={11}
          fill={AXIS_TEXT}
          className="uppercase"
          letterSpacing="0.06em"
        >
          {lateFrom != null
            ? narrow
              ? `J${lateFrom}+`
              : pt ? `Jornada ${lateFrom} em diante` : `Matchday ${lateFrom} onward`
            : ""}
        </text>

        {/* x axis */}
        <line
          x1={padL}
          x2={padL + innerW}
          y1={padT + plotH}
          y2={padT + plotH}
          stroke="#cbccbb"
          strokeWidth="1"
        />
        {breakXs.map((bx) => (
          <g key={`brk-${bx}`} aria-hidden="true">
            <rect x={bx - 5} y={padT + plotH - 4} width={10} height={8} fill={SURFACE} />
            <line x1={bx - 5} x2={bx - 1} y1={padT + plotH + 4} y2={padT + plotH - 4} stroke="#7f9284" strokeWidth="1" />
            <line x1={bx + 1} x2={bx + 5} y1={padT + plotH + 4} y2={padT + plotH - 4} stroke="#7f9284" strokeWidth="1" />
          </g>
        ))}
        {cps.map((c, i) => (
          <text
            key={`x-${c.checkpoint}`}
            x={xs[i]}
            y={padT + plotH + 15}
            textAnchor="middle"
            fontSize={11}
            fill={AXIS_TEXT}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {predictedMatchday(c)}
          </text>
        ))}
        <text
          x={padL + innerW / 2}
          y={padT + plotH + 30}
          textAnchor="middle"
          fontSize={11}
          fill={AXIS_TEXT}
          className="uppercase"
          letterSpacing="0.06em"
        >
          {pt ? "Jornada prevista" : "Matchday forecast"}
        </text>

        {/* delta strip */}
        <text
          x={padL}
          y={stripTop - 26}
          fontSize={11}
          fontWeight={600}
          fill="#4f5f57"
        >
          {pt
            ? `Diferença (modelo − mercado), com ±${K} erros padrão`
            : `Difference (model − market), with ±${K} standard errors`}
        </text>
        {[stripTick, -stripTick].map((v) => (
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
              fontSize={11}
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
          stroke="#7f9284"
          strokeWidth="1"
        />
        <text
          x={padL - 6}
          y={dy(0) + 3}
          textAnchor="end"
          fontSize={11}
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
                y1={dy(c.delta - K * c.se)}
                y2={dy(c.delta + K * c.se)}
                stroke="#434d48"
                strokeWidth="1"
              />
              <line
                x1={xs[i] - 3}
                x2={xs[i] + 3}
                y1={dy(c.delta + K * c.se)}
                y2={dy(c.delta + K * c.se)}
                stroke="#434d48"
                strokeWidth="1"
              />
              <line
                x1={xs[i] - 3}
                x2={xs[i] + 3}
                y1={dy(c.delta - K * c.se)}
                y2={dy(c.delta - K * c.se)}
                stroke="#434d48"
                strokeWidth="1"
              />
            </g>
          );
        })}
        <text x={padL} y={stripTop - 8} fontSize={11} fill={AXIS_TEXT}>
          {pt ? "▲ mercado erra menos" : "▲ market errs less"}
        </text>
        <text x={padL} y={stripTop + stripH + 12} fontSize={11} fill={AXIS_TEXT}>
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
          className="pointer-events-none absolute z-10 rounded-md border border-stone-200 bg-paper/95 px-3 py-2 text-xs shadow-sm"
          style={{
            left: Math.min(Math.max(hoverX - 92, 0), Math.max(0, width - 184)),
            top: padT + 4,
            width: 184,
          }}
        >
          <div className="font-semibold text-stone-900 mb-1">
            {pt ? "Jornada" : "Matchday"} {predictedMatchday(h)}{" "}
            <span className="font-normal text-stone-500">n={h.n}</span>
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
          <div className="text-right tabular-nums text-[11px] text-stone-500">
            {pt ? `±${K} erros padrão: ` : `±${K} standard errors: `}{num(K * h.se, 4)}
          </div>
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
        {pt
          ? `Eixo vertical truncado (${num(yLo, 2)} a ${num(yHi, 2)}) para tornar visíveis as diferenças; as diferenças reais são as da faixa inferior. Cada ponto junta os jogos de uma jornada nas ${data.n_seasons} épocas${perPoint ? ` (n = ${perPoint} jogos por ponto)` : ""}, previstos com os resultados até à jornada anterior. Na faixa inferior, uma barra cuja linha de ±${K} erros padrão atravessa o zero é um empate técnico.`
          : `Vertical axis truncated (${num(yLo, 2)} to ${num(yHi, 2)}) so the differences are visible; the real differences are the ones in the lower strip. Each point pools one matchday's games across the ${data.n_seasons} seasons${perPoint ? ` (n = ${perPoint} matches per point)` : ""}, forecast with the results up to the previous matchday. In the lower strip, a bar whose ±${K} standard-error line crosses zero is a statistical tie.`}
      </p>

      {/* Table view twin */}
      <Disclosure
        className="mt-3"
        summary={pt ? "Ver como tabela" : "See as a table"}
        srSuffix={pt ? "RPS do modelo e do mercado por jornada" : "model and market RPS by matchday"}
      >
        <div className="mt-2 overflow-x-auto" tabIndex={0} role="region" aria-label={pt ? "RPS do modelo e do mercado por jornada prevista" : "Model and market RPS by matchday forecast"}>
          <table className="w-full text-xs tabular-nums">
            <caption className="sr-only">
              {pt
                ? "RPS do modelo e do mercado por jornada prevista"
                : "Model and market RPS by matchday forecast"}
            </caption>
            <thead>
              <tr className="border-b border-stone-300 text-stone-500 text-left">
                <th scope="col" className="py-1 pr-3 font-medium">
                  {pt ? "Jornada prevista" : "Matchday forecast"}
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
                <th scope="col" className="py-1 px-3 font-medium text-right">
                  {pt ? "Erro padrão" : "Std. error"}
                </th>
                <th scope="col" className="py-1 px-3 font-medium text-right">
                  t
                </th>
                <th scope="col" className="py-1 pl-3 font-medium text-right">
                  {pt ? "Jogos" : "Matches"}
                </th>
              </tr>
            </thead>
            <tbody>
              {cps.map((c) => (
                <tr key={c.checkpoint} className="border-b border-stone-100">
                  <th scope="row" className="py-1 pr-3 font-medium text-stone-700 text-left">
                    {predictedMatchday(c)}
                  </th>
                  <td className="py-1 px-3 text-right text-stone-700">{num(c.model_rps, 4)}</td>
                  <td className="py-1 px-3 text-right text-stone-700">{num(c.market_rps, 4)}</td>
                  <td className="py-1 px-3 text-right font-medium text-ink">
                    {signed(c.delta, 4)}
                  </td>
                  <td className="py-1 px-3 text-right text-stone-500">{num(c.se, 4)}</td>
                  <td className="py-1 px-3 text-right text-stone-500">{c.t < 0 ? `−${num(Math.abs(c.t), 2)}` : num(c.t, 2)}</td>
                  <td className="py-1 pl-3 text-right text-stone-500">{c.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>
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
    tone === "model" ? MODEL_COLOR : tone === "market" ? MARKET_COLOR : "#cbccbb";
  return (
    <div className="rounded-2xl border border-line bg-cream p-4">
      <div className="flex items-baseline gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <h3 className="text-sm text-stone-900">{label}</h3>
      </div>
      <p className="text-xs text-stone-500 mt-0.5">{sub}</p>
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

function Disagreements({ data, pt, locale }: { data: MarketScorecardData; pt: boolean; locale: string }) {
  const s = data.disagreement_summary;

  const verdictChip = (v: MarketDisagreement["verdict"]) => {
    const map = {
      model: {
        text: pt ? "Modelo certo" : "Model right",
        cls: "bg-parchment text-ink border-line",
      },
      market: {
        text: pt ? "Mercado certo" : "Market right",
        cls: "bg-parchment text-ink border-line",
      },
      neither: {
        text: pt ? "Nenhum" : "Neither",
        cls: "bg-cream text-stone-600 border-line",
      },
    } as const;
    const m = map[v];
    // The site's rounded pill, sentence case (audit UXD2-09).
    return (
      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>
        {m.text}
      </span>
    );
  };

  return (
    <div>
      {/* The verdict comes from the same 2 SE rule as the cards (audit MR2-01). */}
      <p className="text-sm text-stone-600 leading-relaxed max-w-3xl">
        {disagreementSentence(s, data.n, locale)}
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
              <span className="text-xs text-stone-500">
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
                <span className="tabular-nums text-stone-500">
                  {formatPercent(d.model_pick_prob, locale)}
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
                <span className="tabular-nums text-stone-500">
                  {formatPercent(d.market_pick_prob, locale)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-stone-500">
        {pt
          ? `Os ${data.disagreements.length} jogos em que os dois favoritos mais se afastaram um do outro. «Nenhum» significa que saiu o terceiro resultado.`
          : `The ${data.disagreements.length} matches where the two favourites were furthest apart. “Neither” means the third result came in.`}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------- the block */

export function MarketScorecard({ data, locale = "pt" }: Props) {
  const pt = locale !== "en";
  const o = data.overall;
  const early = data.phases.early;
  const late = data.phases.mid_late;
  // Every verdict, range and crossing below is read from the file: the
  // scorecard is re-run when the production model changes. Cards are labelled
  // by the matchdays whose games were scored (reference matchday + 1), and the
  // whole set is "every matchday evaluated", never "the whole season" (M-06):
  // 15 reference points do not cover a 34-round season.
  const allMatchdays = data.checkpoints.map(predictedMatchday);
  const crossing = crossingSentence(data.checkpoints, locale);
  const openLine = openingLineSentence(data, locale);
  const tone = (b: MarketBlock): "model" | "market" | "neutral" => {
    const v = blockVerdict(b);
    return v === "market_ahead" ? "market" : v === "model_ahead" || v === "tie_model_sign" ? "model" : "neutral";
  };
  const games = (mds: number[]) => {
    const phrase = gamesOfMatchdays(mds, locale);
    return phrase ? phrase.charAt(0).toUpperCase() + phrase.slice(1) : "";
  };

  return (
    <div className="space-y-12">
      {/* Headline numbers */}
      <section>
        <h2 className="text-2xl tracking-tight mb-1">
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
            label={pt ? "Todas as jornadas avaliadas" : "Every matchday evaluated"}
            sub={games(allMatchdays)}
            block={o}
            tone={tone(o)}
            verdict={verdictLine(o, locale)}
          />
          <PhaseTile
            pt={pt}
            label={pt ? "Início da época" : "Early season"}
            sub={games(phaseMatchdays(data, "early"))}
            block={early}
            tone={tone(early)}
            verdict={verdictLine(early, locale)}
          />
          <PhaseTile
            pt={pt}
            label={pt ? "Resto da época" : "Rest of the season"}
            sub={games(phaseMatchdays(data, "mid_late"))}
            block={late}
            tone={tone(late)}
            verdict={verdictLine(late, locale)}
          />
        </div>
      </section>

      {/* The chart */}
      <section>
        <h2 className="text-2xl tracking-tight mb-1">
          {pt
            ? "Como muda a diferença ao longo da época?"
            : "How does the gap change through the season?"}
        </h2>
        <p className="text-sm text-stone-500 mb-5 max-w-3xl">
          {pt
            ? "Erro de previsão (RPS) do modelo e da linha de fecho, para cada jornada prevista. Mais baixo é melhor."
            : "Forecast error (RPS) for the model and the closing line at each matchday forecast. Lower is better."}
          {crossing ? ` ${crossing}` : ""}
        </p>
        <CheckpointChart data={data} pt={pt} />
      </section>

      {/* Explainer */}
      <section className="rounded-2xl border border-line bg-cream p-5 sm:p-6">
        <h2 className="text-base tracking-tight mb-3">
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
                ? "A linha de fecho é o consenso de milhares de apostadores com dinheiro em risco, e é o padrão contra o qual qualquer modelo se mede."
                : "The closing line is the consensus of thousands of bettors with money at stake, and it is the benchmark any model is measured against."}
              {openLine ? ` ${openLine}` : ""}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-stone-600 leading-relaxed max-w-3xl">
          {readingRule(locale)}
        </p>
      </section>

      {/* Disagreements */}
      <section>
        <h2 className="text-2xl tracking-tight mb-1">
          {pt ? "Quando discordámos do mercado" : "When we disagreed with the market"}
        </h2>
        <p className="text-sm text-stone-500 mb-4 max-w-3xl">
          {pt
            ? "Modelo e mercado quase sempre veem o mesmo jogo. Estes são os casos em que não viram."
            : "Model and market almost always see the same match. These are the cases where they did not."}
        </p>
        <Disagreements data={data} pt={pt} locale={locale} />
      </section>
    </div>
  );
}
