"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { ligaTeamColors, teamDisplayName } from "@/lib/config/football";
import type { LigaHistorical } from "@/types/football";

interface RelegationChartProps {
  historical: LigaHistorical;
  yAxisLabel?: string;
}

export function RelegationChart({ historical, yAxisLabel = "Relegation (%)" }: RelegationChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setDimensions] = useState({ width: 0, height: 0 });
  const locale = useLocale();
  const pt = locale !== "en";

  // The table twin: one row per team on the chart, one column per matchday.
  const table = useMemo(() => {
    const teams = new Set<string>();
    for (const md of historical) for (const t of md.table) if (t.p_relegation > 0.02) teams.add(t.team);
    const last = historical[historical.length - 1];
    const rows = Array.from(teams)
      .sort((a, b) => (last?.table.find(t => t.team === b)?.p_relegation ?? 0) - (last?.table.find(t => t.team === a)?.p_relegation ?? 0))
      .map(team => [teamDisplayName(team), ...historical.map(md => { const t = md.table.find(x => x.team === team); if (!t) return ""; const v = Math.round(t.p_relegation * 100); const lo = t.p_relegation_lo, hi = t.p_relegation_hi; return lo != null && hi != null ? `${v}% (${Math.round(lo * 100)}–${Math.round(hi * 100)}%)` : `${v}%`; })]);
    return { columns: [pt ? "Equipa" : "Team", ...historical.map(md => `${pt ? "J" : "MD"}${md.matchday}`)], rows };
  }, [historical, pt]);

  useEffect(() => {
    if (!containerRef.current || historical.length === 0) return;

    const render = async () => {
      const Plot = await import("@observablehq/plot");
      const container = containerRef.current;
      if (!container) return;

      const width = container.offsetWidth;
      const height = Math.min(400, width * 0.5);

      // Find teams with meaningful relegation probability at any point
      const teamsAtRisk = new Set<string>();
      for (const md of historical) {
        for (const team of md.table) {
          if (team.p_relegation > 0.02) teamsAtRisk.add(team.team);
        }
      }

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
        marginRight: 100,
        marginBottom: 35,
        style: { fontFamily: "Manrope, system-ui, sans-serif", fontSize: "12px", background: "transparent", overflow: "visible" },
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
        },
        color: {
          domain: Array.from(teamsAtRisk),
          range: Array.from(teamsAtRisk).map(t => ligaTeamColors[t] || '#5f7062'),
        },
        marks: [
          Plot.ruleY([0]),
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
              fill: "team",
              fontSize: 11,
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
  }, [historical, yAxisLabel, pt]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full min-h-[300px]" />
      <ChartTable caption={`${yAxisLabel} · ${pt ? "valor e intervalo" : "value and interval"}`} columns={table.columns} rows={table.rows} />
    </div>
  );
}
