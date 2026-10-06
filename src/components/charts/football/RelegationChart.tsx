"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { distinctTeamColors, teamDisplayName } from "@/lib/config/football";
import { formatPercent } from "@/lib/football-format";
import type { LigaProbabilityHistory } from "@/types/football";
import { previousModelMatchdays, probabilityHistoryTable, trendTipTitle } from "./probability-history-table";
import { quietPlot } from "@/components/viz/plot-a11y";

interface RelegationChartProps {
  historical: LigaProbabilityHistory;
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
  // Look-alike club colours (Marítimo and Rio Ave are both dark green) get a
  // neutral line instead, so no two lines can be confused (audit UXD-V06).
  const colours = useMemo(() => distinctTeamColors(visibleTeams), [visibleTeams]);

  // The table twin: one row per visible team (highest risk first), one
  // column per matchday, newest first (the chart itself stays oldest-first).
  const table = useMemo(() => {
    const last = historical[historical.length - 1];
    const ordered = [...visibleTeams]
      .sort((a, b) => (last?.table.find(t => t.team === b)?.p_relegation ?? 0) - (last?.table.find(t => t.team === a)?.p_relegation ?? 0));
    return probabilityHistoryTable(historical, ordered, "p_relegation", locale);
  }, [historical, visibleTeams, locale]);

  useEffect(() => {
    if (!containerRef.current || historical.length === 0) return;

    const render = async () => {
      const Plot = await import("@observablehq/plot");
      const container = containerRef.current;
      if (!container) return;

      const width = container.offsetWidth;
      const publications = new Map(historical.map(md => [md.matchday, md]));
      const previous = new Set(previousModelMatchdays(historical));
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
      const usableHeight = height - 65; // marginTop (30) + marginBottom (35)
      const minSpacingPx = 15;
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
        // Room above the top tick for the axis label (audit UXD-15).
        marginTop: 30,
        marginLeft: 45,
        marginRight: width < 500 ? 92 : 128,
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
          range: Array.from(teamsAtRisk).map(t => colours[t] ?? '#5f7062'),
        },
        marks: [
          Plot.ruleY([0], { stroke: "#dadccf" }),
          // No band: see TitleRaceChart (audit F-H1).
          Plot.lineY(lineData, {
            x: "matchday",
            y: "p_relegation",
            stroke: "team",
            strokeWidth: 2,
            curve: "monotone-x",
          }),
          // A dot per published forecast (audit FA2-16).
          Plot.dot(lineData, { x: "matchday", y: "p_relegation", fill: "team", r: 2.5 }),
          Plot.tip(lineData, Plot.pointer({
            x: "matchday",
            y: "p_relegation",
            // Three short lines, so the tip fits a phone's plot (UXM3-01).
            title: (d: { team: string; matchday: number; p_relegation: number }) =>
              trendTipTitle(teamDisplayName(d.team), publications.get(d.matchday) ?? { matchday: d.matchday }, d.p_relegation / 100, locale, previous.has(d.matchday)),
          })),
          Plot.text(
            endLabels,
            {
              x: "matchday",
              y: "adjustedY",
              text: (d: { team: string; p_relegation: number }) => `${teamDisplayName(d.team)} ${formatPercent(d.p_relegation / 100, locale)}`,
              textAnchor: "start",
              dx: 6,
              fill: "#234c40",
              fontSize: width < 500 ? 11 : 12,
              fontWeight: "bold",
            }
          ),
        ],
      });

      container.replaceChildren(quietPlot(plot));
    };

    render();
    const observer = new ResizeObserver(() => render());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [historical, yAxisLabel, pt, visibleTeams, colours, locale]);

  const hiddenCount = allRiskTeams.length - focusTeams.length;

  return (
    <div className="w-full">
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
      <ChartTable caption={yAxisLabel} columns={table.columns} rows={table.rows} />
    </div>
  );
}
