"use client";

import { useEffect, useRef, useState } from "react";
import {
  ligaTeamColors,
  ligaTeamShortNames,
  teamDisplayName,
  teamLogoSrc,
} from "@/lib/config/football";

/* ------------------------------------------------------------------ types */

export interface SeasonReviewRow {
  pos: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface SeasonReviewXpts {
  team: string;
  played: number;
  xpts: number;
  xgf: number;
  xga: number;
}

export interface SeasonReviewLuck {
  team: string;
  pos: number;
  points: number;
  xpts: number;
  delta: number;
  gf: number;
  xgf: number;
  finishing: number;
  ga: number;
  xga: number;
  prevention: number;
  xpts_pos: number;
  pos_delta: number;
}

export interface SeasonReviewRace {
  matchdays: number[];
  series: { team: string; values: (number | null)[]; peak: number }[];
}

export interface SeasonReviewCheckpoint {
  matchday: number;
  points_mae: number | null;
  favourite: string;
  favourite_p: number;
  champion_p: number | null;
  champion_predicted_pts: number | null;
  favourite_correct: boolean;
  relegated_hits: number;
}

export interface SeasonReviewData {
  season: string;
  generated: string;
  teams: number;
  matches_played: number;
  matches_total: number;
  matchdays: number;
  xg_matches_per_team: number;
  champion: string;
  runner_up: string | null;
  relegated: string[];
  table: SeasonReviewRow[];
  xpts_table: SeasonReviewXpts[];
  luck: SeasonReviewLuck[];
  overperformers: SeasonReviewLuck[];
  underperformers: SeasonReviewLuck[];
  forecast_matchdays: number[];
  title_race: SeasonReviewRace;
  relegation_race: SeasonReviewRace;
  report_card: {
    champion: string;
    relegated: string[];
    checkpoints: SeasonReviewCheckpoint[];
    favourite_correct_from: number | null;
    relegation_correct_from: number | null;
    n_forecasts: number;
  } | null;
}

/* ------------------------------------------------------------- formatting */

function fmt(v: number, d: number, pt: boolean) {
  return v.toLocaleString(pt ? "pt-PT" : "en-GB", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function signed(v: number, d: number, pt: boolean) {
  return (v > 0 ? "+" : v < 0 ? "−" : "") + fmt(Math.abs(v), d, pt);
}

/* ------------------------------------------------------------ final table */

export function FinalTable({
  data,
  locale = "pt",
}: {
  data: SeasonReviewData;
  locale?: string;
}) {
  const pt = locale !== "en";
  const xpts = new Map(data.xpts_table.map((r) => [r.team, r]));
  const luck = new Map(data.luck.map((r) => [r.team, r]));
  const relegated = new Set(data.relegated);

  const th = "text-[10px] font-bold uppercase tracking-wider text-stone-400 py-2";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">
          {pt
            ? `Classificação final da Liga Portugal ${data.season}, com pontos esperados a partir do xG`
            : `Final Liga Portugal ${data.season} standings, with expected points from xG`}
        </caption>
        <thead>
          <tr className="border-b border-stone-300">
            <th scope="col" className={`${th} text-left w-8`}>
              #
            </th>
            <th scope="col" className={`${th} text-left`}>
              {pt ? "Equipa" : "Team"}
            </th>
            <th scope="col" className={`${th} text-right w-9`}>
              {pt ? "V" : "W"}
            </th>
            <th scope="col" className={`${th} text-right w-9`}>
              {pt ? "E" : "D"}
            </th>
            <th scope="col" className={`${th} text-right w-9`}>
              {pt ? "D" : "L"}
            </th>
            <th scope="col" className={`${th} text-right w-10 hidden sm:table-cell`}>
              {pt ? "MM" : "GF"}
            </th>
            <th scope="col" className={`${th} text-right w-10 hidden sm:table-cell`}>
              {pt ? "MS" : "GA"}
            </th>
            <th scope="col" className={`${th} text-right w-11`}>
              {pt ? "DG" : "GD"}
            </th>
            <th scope="col" className={`${th} text-right w-11`}>
              Pts
            </th>
            <th scope="col" className={`${th} text-right w-12`}>
              xPts
            </th>
            <th scope="col" className={`${th} text-right w-14`}>
              {pt ? "Sorte" : "Luck"}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.table.map((row) => {
            const x = xpts.get(row.team);
            const l = luck.get(row.team);
            const color = ligaTeamColors[row.team] || "#78716c";
            const isChampion = row.pos === 1;
            const isRelegated = relegated.has(row.team);
            return (
              <tr
                key={row.team}
                className={`border-b border-stone-100 ${
                  isChampion ? "bg-emerald-50/60" : isRelegated ? "bg-red-50/50" : ""
                }`}
              >
                <td className="py-2 tabular-nums text-stone-400 text-xs">{row.pos}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-0.5 h-4 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {teamLogoSrc(row.team) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={teamLogoSrc(row.team)}
                        alt=""
                        className="w-4 h-4 object-contain flex-shrink-0"
                      />
                    )}
                    <span className="font-medium text-stone-800 truncate sm:hidden">
                      {ligaTeamShortNames[row.team] || row.team}
                    </span>
                    <span className="font-medium text-stone-800 truncate hidden sm:inline">
                      {teamDisplayName(row.team)}
                    </span>
                    {row.lost === 0 && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200 px-1 py-px flex-shrink-0">
                        {pt ? "invicto" : "unbeaten"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 text-right tabular-nums text-stone-600">{row.won}</td>
                <td className="py-2 text-right tabular-nums text-stone-600">{row.drawn}</td>
                <td className="py-2 text-right tabular-nums text-stone-600">{row.lost}</td>
                <td className="py-2 text-right tabular-nums text-stone-600 hidden sm:table-cell">
                  {row.gf}
                </td>
                <td className="py-2 text-right tabular-nums text-stone-600 hidden sm:table-cell">
                  {row.ga}
                </td>
                <td className="py-2 text-right tabular-nums text-stone-500">
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className="py-2 text-right tabular-nums font-bold text-stone-900">
                  {row.points}
                </td>
                <td className="py-2 text-right tabular-nums text-stone-500">
                  {x ? fmt(x.xpts, 1, pt) : "—"}
                </td>
                <td
                  className={`py-2 text-right tabular-nums font-semibold ${
                    !l ? "text-stone-300" : l.delta >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {l ? signed(l.delta, 1, pt) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------------------------------- title race evolution */

export function TitleRaceEvolution({
  race,
  totalMatchdays,
  locale = "pt",
  outcomeLabel,
}: {
  race: SeasonReviewRace;
  totalMatchdays: number;
  locale?: string;
  /** Short note pinned to the right edge, e.g. who actually won. */
  outcomeLabel?: string;
}) {
  const pt = locale !== "en";
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(280, el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const mds = race.matchdays;
  if (mds.length === 0 || race.series.length === 0) return null;

  const narrow = width < 520;
  const padL = narrow ? 30 : 38;
  const padR = narrow ? 12 : 74;
  const padT = 14;
  const plotH = narrow ? 190 : 240;
  const axisH = 30;
  const H = padT + plotH + axisH;

  const innerW = Math.max(60, width - padL - padR);
  // x-domain runs to the end of the real season, not to the last forecast —
  // the gap between them is the point.
  const lastMd = Math.max(totalMatchdays, mds[mds.length - 1]);
  const firstMd = 1;
  const x = (md: number) => padL + ((md - firstMd) / (lastMd - firstMd)) * innerW;
  const y = (p: number) => padT + plotH - p * plotH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = [1, 5, 10, 15, 20, 25, 30, lastMd].filter(
    (v, i, a) => v <= lastMd && a.indexOf(v) === i
  );
  const lastForecastMd = mds[mds.length - 1];

  const lineFor = (values: (number | null)[]) =>
    values
      .map((v, i) => (v === null ? null : `${x(mds[i])},${y(v)}`))
      .filter((s): s is string => s !== null)
      .map((s, i) => `${i === 0 ? "M" : "L"}${s}`)
      .join(" ");

  const described = race.series
    .map(
      (s) =>
        `${teamDisplayName(s.team)} ${Math.round((s.values[0] ?? 0) * 100)}% → ${Math.round(
          (s.values[s.values.length - 1] ?? 0) * 100
        )}%`
    )
    .join("; ");

  return (
    <div ref={containerRef} className="w-full">
      <svg
        width={width}
        height={H}
        role="img"
        aria-label={
          pt
            ? `Probabilidade de título atribuída pelo modelo em cada jornada publicada, da jornada ${mds[0]} à ${lastForecastMd}. ${described}.`
            : `Model championship probability at each published matchday, from matchday ${mds[0]} to ${lastForecastMd}. ${described}.`
        }
      >
        {/* gridlines + y ticks */}
        {yTicks.map((tk) => (
          <g key={tk}>
            <line
              x1={padL}
              x2={padL + innerW}
              y1={y(tk)}
              y2={y(tk)}
              stroke="#e7e5e4"
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={y(tk) + 3}
              textAnchor="end"
              className="fill-stone-400"
              fontSize="10"
            >
              {Math.round(tk * 100)}%
            </text>
          </g>
        ))}

        {/* region past the last published forecast */}
        <rect
          x={x(lastForecastMd)}
          y={padT}
          width={Math.max(0, x(lastMd) - x(lastForecastMd))}
          height={plotH}
          fill="#f5f5f4"
          opacity={0.8}
        />
        <line
          x1={x(lastForecastMd)}
          x2={x(lastForecastMd)}
          y1={padT}
          y2={padT + plotH}
          stroke="#a8a29e"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {!narrow && (
          <text
            x={x(lastForecastMd) + 5}
            y={padT + 11}
            className="fill-stone-400"
            fontSize="9"
          >
            {pt ? "sem previsão" : "no forecast"}
          </text>
        )}

        {/* series */}
        {race.series.map((s) => {
          const color = ligaTeamColors[s.team] || "#78716c";
          const lastIdx = s.values.length - 1;
          const lastVal = s.values[lastIdx];
          return (
            <g key={s.team}>
              <path d={lineFor(s.values)} fill="none" stroke={color} strokeWidth="2" />
              {s.values.map((v, i) =>
                v === null ? null : (
                  <circle key={i} cx={x(mds[i])} cy={y(v)} r="2.5" fill={color} />
                )
              )}
              {!narrow && lastVal !== null && lastVal !== undefined && (
                <text
                  x={x(lastForecastMd) + 8}
                  y={y(lastVal) + 3}
                  fontSize="10"
                  fontWeight="600"
                  fill={color}
                >
                  {ligaTeamShortNames[s.team] || s.team} {Math.round(lastVal * 100)}%
                </text>
              )}
            </g>
          );
        })}

        {/* x axis */}
        <line
          x1={padL}
          x2={padL + innerW}
          y1={padT + plotH}
          y2={padT + plotH}
          stroke="#d6d3d1"
          strokeWidth="1"
        />
        {xTicks.map((tk) => (
          <text
            key={tk}
            x={x(tk)}
            y={padT + plotH + 15}
            textAnchor="middle"
            className="fill-stone-400"
            fontSize="10"
          >
            {tk}
          </text>
        ))}
        <text
          x={padL}
          y={padT + plotH + 28}
          className="fill-stone-400"
          fontSize="9"
        >
          {pt ? "jornada" : "matchday"}
        </text>
      </svg>

      {narrow && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px]">
          {race.series.map((s) => (
            <span key={s.team} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-0.5"
                style={{ backgroundColor: ligaTeamColors[s.team] || "#78716c" }}
              />
              <span className="text-stone-600">{teamDisplayName(s.team)}</span>
            </span>
          ))}
        </div>
      )}

      {outcomeLabel && (
        <p className="text-xs text-stone-500 mt-2">{outcomeLabel}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ report card */

export function ReportCard({
  data,
  locale = "pt",
}: {
  data: SeasonReviewData;
  locale?: string;
}) {
  const pt = locale !== "en";
  const rc = data.report_card;
  if (!rc || rc.checkpoints.length === 0) return null;

  const maxMae = Math.max(...rc.checkpoints.map((c) => c.points_mae ?? 0), 1);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-stone-200 border border-stone-200 mb-6">
        {[
          {
            value: `${rc.checkpoints.filter((c) => c.favourite_correct).length}/${rc.n_forecasts}`,
            label: pt
              ? "previsões com o campeão certo como favorito"
              : "forecasts with the eventual champion as favourite",
          },
          {
            value:
              rc.relegation_correct_from !== null
                ? pt
                  ? `jornada ${rc.relegation_correct_from}`
                  : `matchday ${rc.relegation_correct_from}`
                : "—",
            label: pt
              ? "a partir da qual os dois despromovidos foram sempre os dois últimos do modelo"
              : "from which the two relegated clubs were always the model's bottom two",
          },
          {
            value: `${fmt(rc.checkpoints[rc.checkpoints.length - 1].points_mae ?? 0, 1, pt)} ${pt ? "pts" : "pts"}`,
            label: pt
              ? "erro médio dos pontos finais previstos na última previsão publicada"
              : "average error on predicted final points in the last published forecast",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-4">
            <div className="text-2xl font-black text-stone-900 tabular-nums">
              {kpi.value}
            </div>
            <div className="text-xs text-stone-500 mt-1 leading-snug">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            {pt
              ? "Erro médio absoluto dos pontos finais previstos, por jornada publicada"
              : "Mean absolute error of predicted final points, by published matchday"}
          </caption>
          <thead>
            <tr className="border-b border-stone-300">
              <th
                scope="col"
                className="text-[10px] font-bold uppercase tracking-wider text-stone-400 py-2 text-left"
              >
                {pt ? "Jornada" : "Matchday"}
              </th>
              <th
                scope="col"
                className="text-[10px] font-bold uppercase tracking-wider text-stone-400 py-2 text-right w-20"
              >
                {pt
                  ? `${teamDisplayName(rc.champion)} campeão`
                  : `${teamDisplayName(rc.champion)} champion`}
              </th>
              <th
                scope="col"
                className="text-[10px] font-bold uppercase tracking-wider text-stone-400 py-2 text-left pl-4"
              >
                {pt ? "Erro médio nos pontos finais" : "Mean error on final points"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rc.checkpoints.map((c) => (
              <tr key={c.matchday} className="border-b border-stone-100">
                <td className="py-1.5 tabular-nums text-stone-600">{c.matchday}</td>
                <td className="py-1.5 tabular-nums text-right text-stone-700 font-medium">
                  {c.champion_p !== null ? `${Math.round(c.champion_p * 100)}%` : "—"}
                </td>
                <td className="py-1.5 pl-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-stone-50 relative min-w-[60px]">
                      <div
                        className="absolute inset-y-0 left-0 bg-stone-400"
                        style={{
                          width: `${((c.points_mae ?? 0) / maxMae) * 100}%`,
                          opacity: 0.5,
                        }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-stone-500 w-10 text-right">
                      {c.points_mae !== null ? fmt(c.points_mae, 1, pt) : "—"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
