"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { ligaTeamColors, teamDisplayName } from "@/lib/config/football";
import type { LigaHistorical } from "@/types/football";

interface RelegationChartProps {
  historical: LigaHistorical;
  yAxisLabel?: string;
  /** Defaults the chart to this club plus a few relevant comparisons, instead
   * of every team ever above the risk threshold (diagnosis §5/9 — "many
   * low-probability lines and clustered end labels obscure the relevant
   * clubs"). Falls back to the highest-risk team when omitted. */
  defaultTeam?: string;
}

const COMPARISON_COUNT = 3;

export function RelegationChart({ historical, yAxisLabel = "Relegation (%)", defaultTeam }: RelegationChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setDimensions] = useState({ width: 0, height: 0 });
  const [showAll, setShowAll] = useState(false);
  const locale = useLocale();
  const pt = locale !== "en";

  // Every team that was ever a material relegation risk, most recent risk first.
  const allRiskTeams = useMemo(() => {
    const teams = new Set<string>();
    for (const md of historical) for (const t of md.table) if (t.p_relegation > 0.02) teams.add(t.team);
    const last = historical[historical.length - 1];
    return Array.from(teams).sort(
      (a, b) => (last?.table.find(t => t.team === b)?.p_relegation ?? 0) - (last?.table.find(t => t.team === a)?.p_relegation ?? 0),
    );
  }, [historical]);

  // Default view: the selected club (or the highest-risk team, absent a
  // selection) plus a few relevant comparisons — "todas as equipas" stays
  // one click away via showAll.
  const focusTeams = useMemo(() => {
    if (allRiskTeams.length === 0) return [];
    const anchor = defaultTeam && allRiskTeams.includes(defaultTeam) ? defaultTeam : allRiskTeams[0];
    const rest = allRiskTeams.filter(t => t !== anchor).slice(0, COMPARISON_COUNT);
    return [anchor, ...rest];
  }, [allRiskTeams, defaultTeam]);

  const visibleTeams = showAll ? allRiskTeams : focusTeams;

  // The table twin: one row per visible team, one column per matchday.
  const table = useMemo(() => {
    const last = historical[historical.length - 1];
    const rows = [...visibleTeams]
      .sort((a, b) => (last?.table.find(t => t.team === b)?.p_relegation ?? 0) - (last?.table.find(t => t.team === a)?.p_relegation ?? 0))
      .map(team => [teamDisplayName(team), ...historical.map(md => { const t = md.table.find(x => x.team === team); if (!t) return ""; const v = Math.round(t.p_relegation * 100); const lo = t.p_relegation_lo, hi = t.p_relegation_hi; return lo != null && hi != null ? `${v}% (${Math.round(lo * 100)}–${Math.round(hi * 100)}%)` : `${v}%`; })]);
    return { columns: [pt ? "Equipa" : "Team", ...historical.map(md => `${pt ? "J" : "MD"}${md.matchday}`)], rows };
  }, [historical, pt, visibleTeams]);

  useEffect(() => {
    if (!containerRef.current || historical.length === 0) return;

    const render = async () => {
      const Plot = await import("@observablehq/plot");
      const container = containerRef.current;
      if (!container) return;

      const width = container.offsetWidth;
      const height = Math.max(280, Math.min(360, width * 0.45));

      const teamsAtRisk = new Set<string>(visibleTeams);

      if (teamsAtRisk.size === 0) {
        container.replaceChildren();
        return;
      }

      const lineData = historical.flatMap(md =>
        md.table
          .filter(t => teamsAtRisk.has(t.team))
          .map(t => ({
            matchday: md.matchday,
            team: t.team,
            p_relegation: t.p_relegation * 100,
            p_relegation_lo: (t.p_relegation_lo ?? t.p_relegation) * 100,
            p_relegation_hi: (t.p_relegation_hi ?? t.p_relegation) * 100,
          }))
      );

      const maxProb = Math.max(...lineData.map(d => d.p_relegation), 10);
      const yMax = Math.min(100, maxProb * 1.1);

      // Build end-of-line labels with overlap prevention
      const lastMd = historical[historical.length - 1].matchday;
      const endPoints = lineData
        .filter(d => d.matchday === lastMd && d.p_relegation > 2)
        .sort((a, b) => a.p_relegation - b.p_relegation);

      // Compute adjusted y positions to prevent label overlap
      const usableHeight = height - 55; // marginTop (~20) + marginBottom (35)
      const minSpacingPx = 14;
      const minSpacingData = (minSpacingPx / usableHeight) * yMax;

      const endLabels = endPoints.map(d => ({ ...d, adjustedY: d.p_relegation }));
      for (let i = 1; i < endLabels.length; i++) {
        if (endLabels[i].adjustedY - endLabels[i - 1].adjustedY < minSpacingData) {
          endLabels[i].adjustedY = endLabels[i - 1].adjustedY + minSpacingData;
        }
      }

      const plot = Plot.plot({
        width,
        height,
        marginLeft: 45,
        marginRight: width < 500 ? 82 : 120,
        marginBottom: 35,
        style: { fontFamily: "Manrope, system-ui, sans-serif", fontSize: "12px", background: "transparent", color: "#5f7062", overflow: "visible" },
        x: {
          label: pt ? "Jornada" : "Matchday",
          // Whole matchdays only, thinned to roughly one per 60px.
          ticks: Array.from(new Set(lineData.map(d => d.matchday))).sort((a, b) => a - b).filter((_, i, arr) => i % Math.max(1, Math.ceil(arr.length / Math.max(2, width / 60))) === 0),
          tickFormat: (d: number) => `${d}`,
        },
        y: {
          label: yAxisLabel,
          domain: [0, yMax],
          grid: true,
          ticks: 5,
          tickFormat: (d: number) => `${d}%`,
        },
        color: {
          domain: Array.from(teamsAtRisk),
          range: Array.from(teamsAtRisk).map(t => ligaTeamColors[t] || '#5f7062'),
        },
        marks: [
          Plot.ruleY([0], { stroke: "#dadccf" }),
          // HDI bands
          ...Array.from(teamsAtRisk).map(team =>
            Plot.areaY(
              lineData.filter(d => d.team === team),
              {
                x: "matchday",
                y1: "p_relegation_lo",
                y2: "p_relegation_hi",
                fill: ligaTeamColors[team] || '#5f7062',
                fillOpacity: 0.12,
                curve: "monotone-x",
              }
            )
          ),
          Plot.lineY(lineData, {
            x: "matchday",
            y: "p_relegation",
            stroke: "team",
            strokeWidth: 2.5,
            curve: "monotone-x",
          }),
          Plot.tip(lineData, Plot.pointer({
            x: "matchday",
            y: "p_relegation",
            title: (d: { team: string; matchday: number; p_relegation: number }) => `${teamDisplayName(d.team)} · ${pt ? "J" : "MD"}${d.matchday}: ${Math.round(d.p_relegation)}%`,
          })),
          Plot.text(
            endLabels,
            {
              x: "matchday",
              y: "adjustedY",
              text: (d: { team: string; p_relegation: number }) => `${teamDisplayName(d.team)} ${Math.round(d.p_relegation)}%`,
              textAnchor: "start",
              dx: 6,
              fill: "#234c40",
              fontSize: width < 500 ? 10 : 12,
              fontWeight: "bold",
            }
          ),
        ],
      });

      container.replaceChildren(plot);
    };

    render();

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
        render();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [historical, yAxisLabel, pt, visibleTeams]);

  const hiddenCount = allRiskTeams.length - focusTeams.length;

  return (
    <div className="football-history-chart w-full">
      <div ref={containerRef} className="w-full min-h-[280px]" />
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(s => !s)}
          className="mt-2 min-h-11 text-sm font-semibold text-ink underline underline-offset-4"
        >
          {showAll
            ? (pt ? "Mostrar só as equipas relevantes" : "Show only the relevant teams")
            : (pt ? `Ver todas as equipas (+${hiddenCount})` : `See all teams (+${hiddenCount})`)}
        </button>
      )}
      <ChartTable caption={`${yAxisLabel} · ${pt ? "valor e intervalo" : "value and interval"}`} columns={table.columns} rows={table.rows} />
    </div>
  );
}
