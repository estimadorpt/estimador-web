"use client";

import { useState } from "react";
import {
  isReserveSide,
  liga2DisplayName,
  liga2Initials,
  liga2LogoSrc,
  liga2TeamColor,
} from "@/lib/config/football";

/* ------------------------------------------------------------------ types */

export interface Liga2FinalRow {
  rank: number;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  gd: number;
  gf: number;
  ga: number;
  eligible: boolean;
  outcome: "promoted" | "relegated" | null;
}

export interface Liga2ProbRow {
  team: string;
  eligible: boolean;
  played: number;
  points: number;
  gd: number;
  mean_pts: number;
  std_pts: number;
  p_champion: number;
  /** P(top 2). Null for reserve sides, which cannot go up. */
  p_promotion: number | null;
  p_third: number;
  p_relegation: number;
  position_probs: number[];
  /** Only present in the retrospective checkpoints. */
  final_rank?: number;
}

export interface Liga2Checkpoint {
  matchday: number;
  matches_played: number;
  matches_remaining: number;
  seasons_fitted: string[];
  training_matches: number;
  convergence: { max_rhat: number; min_ess_bulk: number };
  teams: Liga2ProbRow[];
}

export interface Liga2Strength {
  team: string;
  attack: number;
  attack_lo: number;
  attack_hi: number;
  defense: number;
  defense_lo: number;
  defense_hi: number;
}

export interface Liga2Data {
  competition: string;
  generated_at: string;
  model: string;
  model_label: { pt: string; en: string };
  status: "live" | "review";
  target_season: string;
  n_sims: number;
  rules: {
    n_teams: number;
    promotion_slots: number;
    relegation_slots: number;
    b_teams_promotable: boolean;
    promotion_probability_definition: string;
    relegation_probability_definition: string;
  };
  seasons_available: string[];
  live: {
    season: string;
    matchday: number;
    matches_played: number;
    matches_remaining: number;
    seasons_fitted: string[];
    training_matches: number;
    convergence: { max_rhat: number; min_ess_bulk: number };
    teams: Liga2ProbRow[];
    team_strengths: Liga2Strength[];
    standings: Omit<Liga2FinalRow, "rank" | "eligible" | "outcome">[];
  } | null;
  review: {
    season: string;
    matches: number;
    matchdays: number;
    final_table: Liga2FinalRow[];
    promoted: string[];
    relegated: string[];
    team_strengths: Liga2Strength[];
    strengths_convergence: { max_rhat: number; min_ess_bulk: number };
    checkpoints: Liga2Checkpoint[];
  } | null;
  history: { season: string; final_table: Liga2FinalRow[] }[];
  caveats: { pt: string; en: string }[];
}

/* ------------------------------------------------------------- formatting */

function pct(v: number | null, pt: boolean): string {
  if (v === null) return "—";
  const p = v * 100;
  if (p === 0) return "—";
  if (p < 1) return pt ? "<1%" : "<1%";
  if (p > 99 && p < 100) return ">99%";
  return `${Math.round(p)}%`;
}

function num(v: number, d: number, pt: boolean) {
  return v.toLocaleString(pt ? "pt-PT" : "en-GB", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function signed(v: number) {
  return v > 0 ? `+${v}` : `${v}`;
}

/* ------------------------------------------------------------- team badge */

function TeamBadge({ team }: { team: string }) {
  const logo = liga2LogoSrc(team);
  const [broken, setBroken] = useState(false);

  if (logo && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logo}
        alt=""
        className="w-5 h-5 object-contain flex-shrink-0"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span
      className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white tabular-nums"
      style={{ backgroundColor: liga2TeamColor(team) }}
      aria-hidden
    >
      {liga2Initials(team)}
    </span>
  );
}

function TeamCell({ team, muted = false }: { team: string; muted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <TeamBadge team={team} />
      <span
        className={`truncate ${muted ? "text-stone-500" : "text-stone-900 font-medium"}`}
      >
        {liga2DisplayName(team)}
      </span>
      {isReserveSide(team) && (
        <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold flex-shrink-0">
          B
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------ final table */

/** The actual finishing table of a completed season. */
export function Liga2FinalTable({
  rows,
  locale = "pt",
  promotionSlots = 2,
  relegationSlots = 2,
}: {
  rows: Liga2FinalRow[];
  locale?: string;
  promotionSlots?: number;
  relegationSlots?: number;
}) {
  const pt = locale !== "en";
  const n = rows.length;

  return (
    <div className="overflow-x-auto border border-stone-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
            <th className="py-2 pl-3 pr-1 text-left font-bold w-8">#</th>
            <th className="py-2 px-2 text-left font-bold">
              {pt ? "Clube" : "Club"}
            </th>
            <th className="py-2 px-2 text-right font-bold">J</th>
            <th className="py-2 px-1 text-right font-bold">
              {pt ? "V" : "W"}
            </th>
            <th className="py-2 px-1 text-right font-bold">
              {pt ? "E" : "D"}
            </th>
            <th className="py-2 px-1 text-right font-bold">
              {pt ? "D" : "L"}
            </th>
            <th className="py-2 px-2 text-right font-bold hidden sm:table-cell">
              {pt ? "GM" : "GF"}
            </th>
            <th className="py-2 px-2 text-right font-bold hidden sm:table-cell">
              {pt ? "GS" : "GA"}
            </th>
            <th className="py-2 px-2 text-right font-bold">DG</th>
            <th className="py-2 pr-3 pl-2 text-right font-bold">
              {pt ? "Pts" : "Pts"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const up = row.outcome === "promoted";
            const down = row.outcome === "relegated";
            // The promotion line sits below the last promoted club, which can
            // be lower than slot 2 when a reserve side finishes above it.
            const lastPromotedRank = Math.max(
              ...rows.filter(r => r.outcome === "promoted").map(r => r.rank),
              promotionSlots
            );
            const borderAfter =
              row.rank === lastPromotedRank || row.rank === n - relegationSlots;
            return (
              <tr
                key={row.team}
                className={`border-b border-stone-100 last:border-0 ${
                  borderAfter ? "border-b-2 border-b-stone-300" : ""
                } ${up ? "bg-emerald-50/60" : down ? "bg-red-50/60" : ""}`}
              >
                <td className="py-2 pl-3 pr-1 text-stone-400 tabular-nums text-xs">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="w-0.5 h-4"
                      style={{
                        backgroundColor: up
                          ? "#047857"
                          : down
                            ? "#dc2626"
                            : "transparent",
                      }}
                    />
                    {row.rank}
                  </span>
                </td>
                <td className="py-2 px-2 max-w-[10rem] md:max-w-none">
                  <TeamCell team={row.team} />
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-stone-500">
                  {row.played}
                </td>
                <td className="py-2 px-1 text-right tabular-nums text-stone-600">
                  {row.wins}
                </td>
                <td className="py-2 px-1 text-right tabular-nums text-stone-600">
                  {row.draws}
                </td>
                <td className="py-2 px-1 text-right tabular-nums text-stone-600">
                  {row.losses}
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-stone-500 hidden sm:table-cell">
                  {row.gf}
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-stone-500 hidden sm:table-cell">
                  {row.ga}
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-stone-500">
                  {signed(row.gd)}
                </td>
                <td className="py-2 pr-3 pl-2 text-right tabular-nums font-bold text-stone-900">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-3 py-2 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-700" />
          {pt ? "Subiu à Primeira Liga" : "Promoted to the Primeira"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-600" />
          {pt ? "Desceu à Liga 3" : "Relegated to Liga 3"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-bold text-stone-400">B</span>
          {pt ? "Equipa B, não pode subir" : "Reserve side, cannot be promoted"}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------- probabilistic table --- */

/** Simulated table: current points plus what the 50k seasons say happens next. */
export function Liga2ProbabilityTable({
  rows,
  locale = "pt",
  showFinalRank = false,
}: {
  rows: Liga2ProbRow[];
  locale?: string;
  showFinalRank?: boolean;
}) {
  const pt = locale !== "en";

  return (
    <div className="overflow-x-auto border border-stone-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
            <th className="py-2 pl-3 pr-2 text-left font-bold">
              {pt ? "Clube" : "Club"}
            </th>
            <th className="py-2 px-2 text-right font-bold">J</th>
            <th className="py-2 px-2 text-right font-bold">Pts</th>
            <th className="py-2 px-2 text-right font-bold">
              {pt ? "Pts finais" : "Final pts"}
            </th>
            <th className="py-2 px-2 text-right font-bold">
              {pt ? "1.º" : "1st"}
            </th>
            <th className="py-2 px-2 text-right font-bold">
              {pt ? "Subida" : "Promotion"}
            </th>
            <th className="py-2 px-2 text-right font-bold">
              {pt ? "Descida" : "Relegation"}
            </th>
            {showFinalRank && (
              <th className="py-2 pr-3 pl-2 text-right font-bold">
                {pt ? "Ficou" : "Finished"}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.team}
              className="border-b border-stone-100 last:border-0"
            >
              <td className="py-2 pl-3 pr-2 max-w-[9rem] md:max-w-none">
                <TeamCell team={row.team} />
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-stone-400">
                {row.played}
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-stone-600">
                {row.points}
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-stone-900">
                {num(row.mean_pts, 1, pt)}
                <span className="text-stone-400 text-[11px]">
                  {" "}
                  ±{num(row.std_pts, 0, pt)}
                </span>
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-stone-600">
                {pct(row.p_champion, pt)}
              </td>
              <td className="py-2 px-2 text-right tabular-nums">
                <ProbCell value={row.p_promotion} tone="emerald" pt={pt} />
              </td>
              <td className="py-2 px-2 text-right tabular-nums">
                <ProbCell value={row.p_relegation} tone="red" pt={pt} />
              </td>
              {showFinalRank && (
                <td className="py-2 pr-3 pl-2 text-right tabular-nums text-stone-500">
                  {row.final_rank ?? "—"}.º
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProbCell({
  value,
  tone,
  pt,
}: {
  value: number | null;
  tone: "emerald" | "red";
  pt: boolean;
}) {
  if (value === null) {
    return (
      <span
        className="text-stone-300"
        title={
          pt
            ? "Equipa B: não pode subir"
            : "Reserve side: cannot be promoted"
        }
      >
        —
      </span>
    );
  }
  const strong = value >= 0.5;
  const faint = value < 0.05;
  const color =
    tone === "emerald"
      ? strong
        ? "text-emerald-700 font-bold"
        : faint
          ? "text-stone-400"
          : "text-emerald-700"
      : strong
        ? "text-red-600 font-bold"
        : faint
          ? "text-stone-400"
          : "text-red-600";
  return <span className={color}>{pct(value, pt)}</span>;
}

/* ------------------------------------------------------- promotion race -- */

/** How the promotion probability moved across the retrospective checkpoints. */
export function Liga2PromotionRace({
  checkpoints,
  locale = "pt",
  maxTeams = 6,
}: {
  checkpoints: Liga2Checkpoint[];
  locale?: string;
  maxTeams?: number;
}) {
  const pt = locale !== "en";
  const last = checkpoints[checkpoints.length - 1];

  // Track the clubs that ever looked plausible, so a late riser is not hidden
  // by a club that led early and faded.
  const peak = new Map<string, number>();
  for (const cp of checkpoints) {
    for (const row of cp.teams) {
      if (row.p_promotion === null) continue;
      peak.set(row.team, Math.max(peak.get(row.team) ?? 0, row.p_promotion));
    }
  }
  const teams = [...peak.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTeams)
    .map(([team]) => team);

  const W = 720;
  const H = 260;
  const padL = 44;
  const padR = 128;
  const padT = 16;
  const padB = 30;
  const xs = checkpoints.map((_, i) =>
    checkpoints.length === 1
      ? padL
      : padL + (i * (W - padL - padR)) / (checkpoints.length - 1)
  );
  const y = (p: number) => padT + (1 - p) * (H - padT - padB);

  const valueFor = (team: string, cp: Liga2Checkpoint) =>
    cp.teams.find(t => t.team === team)?.p_promotion ?? null;

  const finalRank = (team: string) =>
    last.teams.find(t => t.team === team)?.final_rank;

  return (
    <div className="border border-stone-200 bg-white p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          pt
            ? "Evolução da probabilidade de subida por jornada de referência"
            : "Promotion probability by checkpoint matchday"
        }
      >
        {[0, 0.25, 0.5, 0.75, 1].map(g => (
          <g key={g}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(g)}
              y2={y(g)}
              stroke="#e7e5e4"
              strokeWidth={1}
            />
            <text
              x={padL - 8}
              y={y(g) + 3}
              textAnchor="end"
              className="fill-stone-400"
              fontSize={10}
            >
              {Math.round(g * 100)}%
            </text>
          </g>
        ))}

        {checkpoints.map((cp, i) => (
          <text
            key={cp.matchday}
            x={xs[i]}
            y={H - 10}
            textAnchor="middle"
            className="fill-stone-500"
            fontSize={10}
          >
            {pt ? `J${cp.matchday}` : `MD${cp.matchday}`}
          </text>
        ))}

        {teams.map(team => {
          const pts = checkpoints
            .map((cp, i) => {
              const v = valueFor(team, cp);
              return v === null ? null : { x: xs[i], y: y(v), v };
            })
            .filter((p): p is { x: number; y: number; v: number } => p !== null);
          if (pts.length === 0) return null;
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
          const rank = finalRank(team);
          const wentUp = rank !== undefined && rank <= 2;
          const colour = wentUp ? "#047857" : liga2TeamColor(team);
          const end = pts[pts.length - 1];
          return (
            <g key={team}>
              <path
                d={d}
                fill="none"
                stroke={colour}
                strokeWidth={wentUp ? 2.5 : 1.5}
                strokeOpacity={wentUp ? 1 : 0.65}
              />
              {pts.map(p => (
                <circle
                  key={p.x}
                  cx={p.x}
                  cy={p.y}
                  r={wentUp ? 3.5 : 2.5}
                  fill={colour}
                  fillOpacity={wentUp ? 1 : 0.65}
                />
              ))}
              <text
                x={end.x + 8}
                y={end.y + 3}
                fontSize={10}
                className={wentUp ? "fill-emerald-800" : "fill-stone-500"}
                fontWeight={wentUp ? 700 : 400}
              >
                {liga2DisplayName(team)} {Math.round(end.v * 100)}%
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
        {pt
          ? "A verde, os dois clubes que acabaram por subir. Cada ponto é um ajuste independente que só viu os jogos disputados até essa jornada."
          : "In green, the two clubs that actually went up. Each point is an independent refit that saw only the matches played up to that matchday."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- strengths - */

/** Attack and defence offsets, on the log scale the model works in. */
export function Liga2Strengths({
  rows,
  locale = "pt",
}: {
  rows: Liga2Strength[];
  locale?: string;
}) {
  const pt = locale !== "en";
  const span = Math.max(
    ...rows.flatMap(r => [Math.abs(r.attack), Math.abs(r.defense)]),
    0.05
  );
  const bar = (v: number) => Math.round((Math.abs(v) / span) * 50);

  return (
    <div className="border border-stone-200">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3 py-2 bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500 font-bold">
        <span>{pt ? "Clube" : "Club"}</span>
        <span className="w-28 text-center">{pt ? "Ataque" : "Attack"}</span>
        <span className="w-28 text-center">{pt ? "Defesa" : "Defence"}</span>
      </div>
      {rows.map(row => (
        <div
          key={row.team}
          className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-3 py-1.5 border-b border-stone-100 last:border-0 text-sm"
        >
          <span className="min-w-0">
            <TeamCell team={row.team} />
          </span>
          {[row.attack, row.defense].map((v, i) => (
            <span key={i} className="w-28 flex items-center justify-center">
              <span className="relative w-24 h-3 flex items-center">
                <span className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-300" />
                <span
                  className={`absolute h-2 ${v >= 0 ? "bg-emerald-600" : "bg-stone-400"}`}
                  style={{
                    width: `${bar(v)}%`,
                    left: v >= 0 ? "50%" : `${50 - bar(v)}%`,
                  }}
                />
              </span>
            </span>
          ))}
        </div>
      ))}
      <p className="px-3 py-2 text-[11px] text-stone-500 bg-stone-50 border-t border-stone-200 leading-relaxed">
        {pt
          ? "Desvios em relação à média da liga, na escala logarítmica do modelo. Barra à direita é melhor: mais golos marcados no ataque, menos sofridos na defesa."
          : "Offsets from the league average, on the model's log scale. Bars to the right are better: more goals scored in attack, fewer conceded in defence."}
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- caveats - */

/** What this model does not have, stated by the model itself. */
export function Liga2Caveats({
  items,
  locale = "pt",
}: {
  items: { pt: string; en: string }[];
  locale?: string;
}) {
  const pt = locale !== "en";
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li
          key={i}
          className="border-l-2 border-stone-300 pl-4 text-sm text-stone-600 leading-relaxed"
        >
          {pt ? item.pt : item.en}
        </li>
      ))}
    </ul>
  );
}
