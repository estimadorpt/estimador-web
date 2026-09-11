"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { ligaTeamColors, teamDisplayName } from "@/lib/config/football";
import type { LigaHistorical } from "@/types/football";

interface TitleRaceChartProps {
  historical: LigaHistorical;
  yAxisLabel?: string;
}

export function TitleRaceChart({ historical, yAxisLabel = "Champion (%)" }: TitleRaceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setDimensions] = useState({ width: 0, height: 0 });
  const locale = useLocale();
  const pt = locale !== "en";

  // The table twin: one row per team on the chart, one column per matchday.
  const table = useMemo(() => {
    const teams = new Set<string>();
    for (const md of historical) for (const t of md.table) if (t.p_champion > 0.01) teams.add(t.team);
    const last = historical[historical.length - 1];
    const rows = Array.from(teams)
      .sort((a, b) => (last?.table.find(t => t.team === b)?.p_champion ?? 0) - (last?.table.find(t => t.team === a)?.p_champion ?? 0))
      .map(team => [teamDisplayName(team), ...historical.map(md => { const t = md.table.find(x => x.team === team); if (!t) return ""; const v = Math.round(t.p_champion * 100); const lo = t.p_champion_lo, hi = t.p_champion_hi; return lo != null && hi != null ? `${v}% (${Math.round(lo * 100)}–${Math.round(hi * 100)}%)` : `${v}%`; })]);
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

      // Find teams with meaningful championship probability at any point
      const teamsWithChance = new Set<string>();
      for (const md of historical) {
        for (const team of md.table) {
          if (team.p_champion > 0.01) teamsWithChance.add(team.team);
        }
      }

      // Build data for line chart
      const lineData = historical.flatMap(md =>
        md.table
          .filter(t => teamsWithChance.has(t.team))
          .map(t => ({
            matchday: md.matchday,
            team: t.team,
            p_champion: t.p_champion * 100,
            p_champion_lo: (t.p_champion_lo ?? t.p_champion) * 100,
            p_champion_hi: (t.p_champion_hi ?? t.p_champion) * 100,
          }))
      );

      // Build end-of-line labels with overlap prevention
      const lastMd = historical[historical.length - 1].matchday;
      const endPoints = lineData
        .filter(d => d.matchday === lastMd && d.p_champion > 1)
        .sort((a, b) => a.p_champion - b.p_champion);

      const usableHeight = height - 55;
      const minSpacingPx = 14;
      const minSpacingData = (minSpacingPx / usableHeight) * 100; // y domain is [0, 100]

      const endLabels: Array<{ matchday: number; team: string; p_champion: number; adjustedY: number }> = [];
      for (const d of endPoints) {
        let adjustedY = d.p_champion;
        if (endLabels.length > 0) {
          const prevY = endLabels[endLabels.length - 1].adjustedY;
          if (adjustedY - prevY < minSpacingData) {
            adjustedY = prevY + minSpacingData;
          }
        }
        endLabels.push({ ...d, adjustedY });
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
          domain: [0, 100],
          grid: true,
        },
        color: {
          domain: Array.from(teamsWithChance),
          range: Array.from(teamsWithChance).map(t => ligaTeamColors[t] || '#5f7062'),
        },
        marks: [
          Plot.ruleY([0]),
          // HDI bands
          ...Array.from(teamsWithChance).map(team =>
            Plot.areaY(
              lineData.filter(d => d.team === team),
              {
                x: "matchday",
                y1: "p_champion_lo",
                y2: "p_champion_hi",
                fill: ligaTeamColors[team] || '#5f7062',
                fillOpacity: 0.12,
                curve: "monotone-x",
              }
            )
          ),
          Plot.lineY(lineData, {
            x: "matchday",
            y: "p_champion",
            stroke: "team",
            strokeWidth: 2.5,
            curve: "monotone-x",
          }),
          Plot.tip(lineData, Plot.pointer({
            x: "matchday",
            y: "p_champion",
            title: (d: { team: string; matchday: number; p_champion: number }) => `${teamDisplayName(d.team)} · ${pt ? "J" : "MD"}${d.matchday}: ${Math.round(d.p_champion)}%`,
          })),
          // End labels with adjusted positions
          Plot.text(
            endLabels,
            {
              x: "matchday",
              y: "adjustedY",
              text: (d: { team: string; p_champion: number }) => `${teamDisplayName(d.team)} ${Math.round(d.p_champion)}%`,
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
