"use client";

import { useRef, useEffect, useMemo, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { quietPlot } from "@/components/viz/plot-a11y";
import { distinctTeamColors, teamDisplayName } from "@/lib/config/football";
import { formatPercent } from "@/lib/football-format";
import type { LigaProbabilityHistory } from "@/types/football";
import { previousModelMatchdays, probabilityHistoryTable, trendTipTitle } from "./probability-history-table";

interface TitleRaceChartProps {
  historical: LigaProbabilityHistory;
  yAxisLabel?: string;
  /** One line under the plot, above the table twin: what the lines are not
   * (the title-calibration caveat on the Liga page, audit F-H2). */
  caveat?: ReactNode;
}

// The title probability after each matchday, one line per club that ever
// cleared 1%. No band: the published p_champion_lo/hi fields are the spread
// of 500-simulation blocks, about ten times the Monte Carlo error of the
// 50 000-simulation figure, and read as a margin of error they mislead
// (audit F-H1; owner decision to remove them).
export function TitleRaceChart({ historical, yAxisLabel = "Champion (%)", caveat }: TitleRaceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const pt = locale !== "en";

  const teams = useMemo(() => {
    const set = new Set<string>();
    for (const md of historical) for (const t of md.table) if (t.p_champion > 0.01) set.add(t.team);
    const last = historical[historical.length - 1];
    return Array.from(set).sort(
      (a, b) => (last?.table.find(t => t.team === b)?.p_champion ?? 0) - (last?.table.find(t => t.team === a)?.p_champion ?? 0),
    );
  }, [historical]);
  const colours = useMemo(() => distinctTeamColors(teams), [teams]);

  // The table twin: one row per club on the chart, one column per matchday,
  // newest first (the chart itself stays oldest-first).
  const table = useMemo(
    () => probabilityHistoryTable(historical, teams, "p_champion", locale),
    [historical, teams, locale],
  );

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
      const teamSet = new Set(teams);

      const lineData = historical.flatMap(md =>
        md.table
          .filter(t => teamSet.has(t.team))
          .map(t => ({ matchday: md.matchday, team: t.team, p_champion: t.p_champion * 100 })),
      );

      // End-of-line labels, nudged apart so they never overlap.
      const lastMd = historical[historical.length - 1].matchday;
      const endPoints = lineData
        .filter(d => d.matchday === lastMd && d.p_champion > 1)
        .sort((a, b) => a.p_champion - b.p_champion);
      const usableHeight = height - 70;
      const minSpacingData = (15 / usableHeight) * 100;
      const endLabels: Array<{ matchday: number; team: string; p_champion: number; adjustedY: number }> = [];
      for (const d of endPoints) {
        let adjustedY = d.p_champion;
        const prev = endLabels[endLabels.length - 1];
        if (prev && adjustedY - prev.adjustedY < minSpacingData) adjustedY = prev.adjustedY + minSpacingData;
        endLabels.push({ ...d, adjustedY });
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
          ticks: Array.from(new Set(lineData.map(d => d.matchday))).sort((a, b) => a - b).filter((_, i, arr) => i % Math.max(1, Math.ceil(arr.length / Math.max(2, width / 60))) === 0),
          tickFormat: (d: number) => `${d}`,
        },
        y: {
          label: yAxisLabel,
          domain: [0, 100],
          grid: true,
          ticks: 5,
          tickFormat: (d: number) => `${d}%`,
        },
        color: { domain: teams, range: teams.map(t => colours[t]) },
        marks: [
          Plot.ruleY([0], { stroke: "#dadccf" }),
          Plot.lineY(lineData, { x: "matchday", y: "p_champion", stroke: "team", strokeWidth: 2, curve: "monotone-x" }),
          // A dot per published forecast: the curve between them is drawn,
          // the dots are the publications (audit FA2-16).
          Plot.dot(lineData, { x: "matchday", y: "p_champion", fill: "team", r: 2.5 }),
          // Three short lines, so the tip fits a phone's plot (UXM3-01).
          Plot.tip(lineData, Plot.pointer({
            x: "matchday",
            y: "p_champion",
            title: (d: { team: string; matchday: number; p_champion: number }) =>
              trendTipTitle(teamDisplayName(d.team), publications.get(d.matchday) ?? { matchday: d.matchday }, d.p_champion / 100, locale, previous.has(d.matchday)),
          })),
          Plot.text(endLabels, {
            x: "matchday",
            y: "adjustedY",
            text: (d: { team: string; p_champion: number }) => `${teamDisplayName(d.team)} ${formatPercent(d.p_champion / 100, locale)}`,
            textAnchor: "start",
            dx: 6,
            fill: "#234c40",
            fontSize: width < 500 ? 11 : 12,
            fontWeight: "bold",
          }),
        ],
      });

      container.replaceChildren(quietPlot(plot));
    };

    render();
    const observer = new ResizeObserver(() => render());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [historical, yAxisLabel, pt, teams, colours, locale]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full min-h-[280px]" />
      {caveat && <p className="mt-3 text-xs leading-relaxed text-stone-600">{caveat}</p>}
      <ChartTable caption={yAxisLabel} columns={table.columns} rows={table.rows} />
    </div>
  );
}
