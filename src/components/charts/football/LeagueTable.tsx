"use client";

import { ligaTeamColors, ligaTeamShortNames, ligaTeamSlugs, teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import type { ActualStanding, TeamStanding, TeamDelta } from "@/types/football";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { formatDecimal, formatInteger, formatSigned } from "@/lib/football-format";
import { calibrationSentence } from "@/lib/football-scorecard";

/**
 * The league page's club chooser: a plain select that navigates straight to
 * the team page. This is the hero's main action (diagnosis §5/9/12 — reading
 * the outlook is the first task, so the simulator is no longer it), kept in
 * this file because it is the one football component in scope that is
 * already a client boundary with router + team-name plumbing.
 */
export function ClubChooser({
  teams,
  label,
  placeholder,
}: {
  teams: string[];
  label: string;
  placeholder: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const sorted = [...teams].sort((a, b) => teamDisplayName(a).localeCompare(teamDisplayName(b), "pt"));
  return (
    <label className="inline-flex min-w-0 flex-col gap-1 text-left">
      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</span>
      <select
        defaultValue=""
        onChange={e => {
          const slug = ligaTeamSlugs[e.target.value];
          if (slug) router.push(`/${locale}/desporto/liga/${slug}`);
        }}
        className="min-h-11 min-w-[220px] rounded-lg border border-line bg-paper px-3 text-sm text-ink"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {sorted.map(team => (
          <option key={team} value={team}>
            {teamDisplayName(team)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Final-points quantiles from the season simulation, per team. */
export interface PointsInterval {
  q05: number;
  q25: number;
  q50: number;
  q75: number;
  q95: number;
}

interface LeagueTableProps {
  data: TeamStanding[];
  actualStandings?: ActualStanding[];
  deltas?: Record<string, TeamDelta>;
  /** Keyed by team name. When absent the table renders exactly as before. */
  intervals?: Record<string, PointsInterval>;
  /** Simulated seasons behind the intervals (prediction.n_sims). */
  nSims?: number;
  /** The model that produced the forecast (prediction.model): the
   * calibration figure is only quoted for the model it was measured on. */
  model?: string;
  labels: {
    team: string;
    meanPoints: string;
    goalDifference: string;
    championship: string;
    top3: string;
    relegation: string;
    teamClickHint?: string;
    played?: string;
    actualPoints?: string;
  };
}

function DeltaIndicator({ value, invert = false }: { value: number; invert?: boolean }) {
  const rounded = Math.round(Math.abs(value));
  if (rounded < 1) return null;
  const isUp = value > 0;
  // For championship: up=good (green), down=bad (red)
  // For relegation (invert): up=bad (red), down=good (green)
  const isGood = invert ? !isUp : isUp;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] tabular-nums ml-0.5 ${isGood ? "text-emerald-600" : "text-red-500"}`}>
      {isUp ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
      {rounded}
    </span>
  );
}

function formatProb(value: number): string {
  const pct = value * 100;
  if (pct > 99 && pct < 100) return ">99%";
  if (pct < 1 && pct > 0) return "<1%";
  if (pct === 0) return "—";
  if (pct === 100) return "100%";
  return `${Math.round(pct)}%`;
}

/**
 * Final-points distribution as a horizontal range: the light rule spans the
 * 90% interval (q05–q95), the solid block the middle half (q25–q75), and the
 * tick marks the median. All teams share one scale, so bar positions and
 * widths are comparable down the column.
 */
function PointsBand({
  interval,
  min,
  max,
  color,
}: {
  interval: PointsInterval;
  min: number;
  max: number;
  color: string;
}) {
  const span = Math.max(max - min, 1);
  const pos = (v: number) => ((v - min) / span) * 100;
  const left = pos(interval.q05);
  const right = pos(interval.q95);
  const iqrLeft = pos(interval.q25);
  const iqrRight = pos(interval.q75);

  return (
    <div className="relative h-4 w-full min-w-[120px]">
      <div className="absolute inset-y-0 left-0 right-0" />
      {/* 90% interval */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-px bg-stone-300"
        style={{ left: `${left}%`, width: `${Math.max(right - left, 0.5)}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-px h-2 bg-stone-300"
        style={{ left: `${left}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-px h-2 bg-stone-300"
        style={{ left: `${right}%` }}
      />
      {/* middle half */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-sm"
        style={{
          left: `${iqrLeft}%`,
          width: `${Math.max(iqrRight - iqrLeft, 0.8)}%`,
          backgroundColor: color,
          opacity: 0.5,
        }}
      />
      {/* median */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-[2px] h-3 bg-stone-900"
        style={{ left: `${pos(interval.q50)}%` }}
      />
    </div>
  );
}

export function LeagueTable({
  data,
  actualStandings,
  deltas,
  intervals,
  labels,
  nSims = 50000,
  model,
}: LeagueTableProps) {
  const locale = useLocale();
  const router = useRouter();
  // Read ?club= after mount: useSearchParams would force a Suspense boundary in the static export.
  const [clubParam, setClubParam] = useState<string | null>(null);
  useEffect(() => {
    setClubParam(new URLSearchParams(window.location.search).get("club"));
  }, []);
  const [showHint, setShowHint] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsNarrow(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Build lookup for actual standings
  const actualLookup = new Map<string, ActualStanding>();
  if (actualStandings) {
    for (const s of actualStandings) {
      actualLookup.set(s.team, s);
    }
  }
  const hasActual = actualLookup.size > 0;

  // Plain rounding, the same as the hero, the homepage and the share card:
  // forcing each column to sum to 100% moved Porto's 51,5% to "52%", and on
  // relegation (two places, so the column sums to 200%) it floored every
  // value (site review LIVE-11).

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try { localStorage.setItem("liga-team-hint-seen", "1"); } catch {}
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem("liga-team-hint-seen")) {
        setShowHint(true);
        const timer = setTimeout(dismissHint, 8000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [dismissHint]);

  // Shared scale for the points bands, padded a point either side so the
  // extreme teams' whiskers do not sit flush against the column edge.
  const bandTeams = intervals
    ? data.filter(t => intervals[t.team])
    : [];
  const hasBands = bandTeams.length > 0;
  const bandMin = hasBands
    ? Math.min(...bandTeams.map(t => intervals![t.team].q05)) - 1
    : 0;
  const bandMax = hasBands
    ? Math.max(...bandTeams.map(t => intervals![t.team].q95)) + 1
    : 1;

  const pt = locale !== "en";
  const bandLabel = pt ? "Pontos finais" : "Final points";
  const bandRange = (v: PointsInterval) => `${v.q05}–${v.q95}`;
  const bandTitle = (v: PointsInterval) =>
    pt
      ? `90% das simulações entre ${v.q05} e ${v.q95} pontos; metade entre ${v.q25} e ${v.q75}; mediana ${v.q50}`
      : `90% of simulations between ${v.q05} and ${v.q95} points; half between ${v.q25} and ${v.q75}; median ${v.q50}`;

  if (!data || data.length === 0) return null;

  // ?club= (a slug) drives the phone-compact view: selected row + neighbours,
  // with a disclosure back to the full table (diagnosis §5 "League page").
  const selectedIndex = clubParam
    ? data.findIndex(t => ligaTeamSlugs[t.team] === clubParam)
    : -1;
  const compact = selectedIndex >= 0 && isNarrow && !expanded;
  const NEIGHBOURS = 2;
  const visibleData = compact
    ? data.filter((_, i) => Math.abs(i - selectedIndex) <= NEIGHBOURS)
    : data;
  const skippedBefore = compact ? Math.max(0, selectedIndex - NEIGHBOURS) : 0;
  const skippedAfter = compact ? Math.max(0, data.length - 1 - (selectedIndex + NEIGHBOURS)) : 0;

  const handleTeamClick = (teamName: string) => {
    const slug = ligaTeamSlugs[teamName];
    if (slug) {
      dismissHint();
      router.push(`/${locale}/desporto/liga/${slug}`);
    }
  };

  return (
    <div className="overflow-x-auto">
      {showHint && labels.teamClickHint && <p className="mb-4 text-xs text-ink-muted">{labels.teamClickHint} <span aria-hidden="true">↗</span></p>}
      <table className="w-full text-sm">
        <thead>
          {hasActual && (
            <tr className="text-left text-[11px] uppercase tracking-wider text-stone-500">
              <th className="py-1 pr-2" colSpan={2} />
              <th className="py-1 px-2 text-center" colSpan={2}>
                {pt ? "Atual" : "Current"}
              </th>
              <th
                className="py-1 px-3 border-l border-stone-200 text-center"
                colSpan={hasBands ? 5 : 4}
              >
                {pt ? "Previsão do modelo" : "Model forecast"}
              </th>
            </tr>
          )}
          <tr className="border-b border-ink/40 bg-cream text-left">
            <th className="py-2 pr-2 w-8 text-stone-500 font-medium">#</th>
            <th className="py-2 pr-4 font-medium">{labels.team}</th>
            {hasActual && (
              <>
                <th className="py-2 px-2 text-right font-medium hidden sm:table-cell text-stone-500 text-xs">{labels.played ?? "J"}</th>
                <th className="py-2 px-2 text-right font-medium text-xs">{labels.actualPoints ?? "Pts"}</th>
              </>
            )}
            <th className={`py-2 px-3 text-right font-medium ${hasActual ? "border-l border-stone-200" : ""}`}>{labels.meanPoints}</th>
            {hasBands && (
              <th className="py-2 px-3 font-medium hidden md:table-cell text-xs text-stone-500 w-[20%]">
                {bandLabel} <span className="text-stone-400">90%</span>
              </th>
            )}
            <th className="py-2 px-3 text-right font-medium hidden sm:table-cell">{labels.goalDifference}</th>
            <th className="py-2 px-3 text-right font-medium">{labels.championship}</th>
            <th className="py-2 px-3 text-right font-medium hidden sm:table-cell">{labels.top3}</th>
            <th className="py-2 px-3 text-right font-medium">{labels.relegation}</th>
          </tr>
        </thead>
        <tbody>
          {compact && skippedBefore > 0 && (
            <tr aria-hidden="true">
              <td colSpan={99} className="py-1 text-center text-[11px] text-stone-400">
                {pt ? `⋯ ${skippedBefore} equipa(s) acima` : `⋯ ${skippedBefore} team(s) above`}
              </td>
            </tr>
          )}
          {visibleData.map(team => {
            const i = data.indexOf(team);
            const color = ligaTeamColors[team.team] || '#5f7062';
            const interval = intervals?.[team.team];
            const isRelegationZone = i >= data.length - 3;
            const isChampionZone = i < 3;
            const isSelected = i === selectedIndex;
            return (
              <tr
                key={team.team}
                className={`border-b border-stone-200 ${
                  isSelected ? 'bg-parchment' : isRelegationZone ? 'bg-red-50/40' : isChampionZone ? 'bg-stone-50' : ''
                }`}
              >
                <td className="py-2.5 pr-2 text-stone-400 tabular-nums">{i + 1}</td>
                <td className="py-2.5 pr-4">
                  <div
                    className="flex items-center gap-2 cursor-pointer group relative"
                    onClick={() => handleTeamClick(team.team)}
                  >
                    {teamLogoSrc(team.team) ? (
                      <img
                        src={teamLogoSrc(team.team)}
                        alt=""
                        className="w-5 h-5 flex-shrink-0 object-contain"
                      />
                    ) : (
                      <div
                        className="w-1 h-5 flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    <span className="font-medium text-stone-900 group-hover:text-ink transition-colors sm:hidden">
                      {ligaTeamShortNames[team.team] || team.team}
                    </span>
                    <span className="font-medium text-stone-900 group-hover:text-ink transition-colors hidden sm:inline">
                      {teamDisplayName(team.team)}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-ink-muted opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />

                  </div>
                </td>
                {hasActual && (() => {
                  const actual = actualLookup.get(team.team);
                  if (!actual) return <><td className="py-2.5 px-2 text-right hidden sm:table-cell" /><td className="py-2.5 px-2 text-right" /></>;
                  return (
                    <>
                      <td className="py-2.5 px-2 text-right tabular-nums text-stone-400 text-xs hidden sm:table-cell">
                        {actual.played}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-semibold">
                        {actual.points}
                      </td>
                    </>
                  );
                })()}
                <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                  {formatDecimal(team.mean_pts, locale, 1)}
                  {/* The band has no room on phones, so the range travels
                      under the point estimate instead. */}
                  {interval && (
                    <div className="md:hidden text-[11px] font-normal text-stone-400 tabular-nums">
                      {bandRange(interval)}
                    </div>
                  )}
                </td>
                {hasBands && (
                  <td className="py-2.5 px-3 hidden md:table-cell" title={interval ? bandTitle(interval) : undefined}>
                    {interval ? (
                      <div className="flex items-center gap-2">
                        <PointsBand
                          interval={interval}
                          min={bandMin}
                          max={bandMax}
                          color={color}
                        />
                        <span className="text-[11px] tabular-nums text-stone-400 w-11 text-right flex-shrink-0">
                          {bandRange(interval)}
                        </span>
                      </div>
                    ) : null}
                  </td>
                )}
                <td className="py-2.5 px-3 text-right tabular-nums text-stone-500 hidden sm:table-cell">
                  {formatSigned(Math.round(team.mean_gd), locale, 0)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  <span className={team.p_champion > 0.01 ? 'font-semibold' : 'text-stone-400'}>
                    {formatProb(team.p_champion)}
                  </span>
                  {deltas?.[team.team] && (
                    <DeltaIndicator value={deltas[team.team].p_champion_delta} />
                  )}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums hidden sm:table-cell">
                  {formatProb(team.p_top3)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  <span className={team.p_relegation > 0.1 ? 'font-semibold text-red-700' : team.p_relegation > 0 ? 'text-red-600' : 'text-stone-400'}>
                    {formatProb(team.p_relegation)}
                  </span>
                  {deltas?.[team.team] && (
                    <DeltaIndicator value={deltas[team.team].p_relegation_delta} invert />
                  )}
                </td>
              </tr>
            );
          })}
          {compact && skippedAfter > 0 && (
            <tr aria-hidden="true">
              <td colSpan={99} className="py-1 text-center text-[11px] text-stone-400">
                {pt ? `⋯ ${skippedAfter} equipa(s) abaixo` : `⋯ ${skippedAfter} team(s) below`}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedIndex >= 0 && isNarrow && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="mt-3 min-h-11 text-sm font-semibold text-ink underline underline-offset-4"
        >
          {expanded
            ? (pt ? "Mostrar só a minha equipa" : "Show only my club")
            : (pt ? "Ver tabela completa" : "See the full table")}
        </button>
      )}

      {/* Legend + the calibration claim. Stated once, next to the thing it
          is a claim about. */}
      {hasBands && (
        <div className="mt-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-px bg-stone-300 relative inline-block" />
              {pt ? "90% das simulações" : "90% of simulations"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-1.5 rounded-sm bg-stone-400/50 inline-block" />
              {pt ? "metade das simulações" : "half of simulations"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-[2px] h-3 bg-stone-900 inline-block" />
              {pt ? "mediana" : "median"}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-stone-500 leading-relaxed">
            {pt
              ? `Os pontos finais são uma distribuição, não um número: a barra mostra onde caem as ${formatInteger(nSims, locale)} épocas simuladas.`
              : `Final points are a distribution, not a number: the bar shows where the ${formatInteger(nSims, locale)} simulated seasons fall.`}{" "}
            {calibrationSentence(model, locale)}
          </p>
        </div>
      )}
    </div>
  );
}
