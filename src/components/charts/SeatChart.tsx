"use client";

import * as Plot from "@observablehq/plot";
import { useEffect, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { FURNITURE } from "@/components/viz/theme";
import { partyColors, partyNames } from "@/lib/config/colors";
import { quantileSorted, type PartySeatStats } from "@/lib/election-aggregates";
import { quietPlot } from "@/components/viz/plot-a11y";

interface SeatData {
  party: string;
  seats: number;
}

interface SeatChartProps {
  /** Raw {party, seats} draws (MDX use, with inline data). Pages pass `stats` instead. */
  data?: SeatData[];
  /** Per-party distributions summarised on the server (see loadParliamentaryArchive). */
  stats?: PartySeatStats[];
  /** Axis label; defaults to the locale's "projected seats". */
  seatsLabel?: string;
  /** Name of the table twin; distinct from the bloc chart's, so two regions on one page never share a name. */
  tableCaption?: string;
}

function statsFromRows(rows: SeatData[]): PartySeatStats[] {
  const byParty: Record<string, number[]> = {};
  for (const d of rows) (byParty[d.party] ??= []).push(d.seats);
  return Object.entries(byParty)
    .map(([party, seats]) => {
      const s = [...seats].sort((a, b) => a - b);
      return {
        party,
        mean: Math.round(s.reduce((x, y) => x + y, 0) / s.length),
        p10: quantileSorted(s, 0.1),
        p25: quantileSorted(s, 0.25),
        median: quantileSorted(s, 0.5),
        p75: quantileSorted(s, 0.75),
        p90: quantileSorted(s, 0.9),
        max: s[s.length - 1],
      };
    })
    .sort((a, b) => b.mean - a.mean);
}

/** Seats per party: mean (dot), 50% band (P25–P75, darker) and 80% band (P10–P90, lighter). */
export function SeatChart({ data, stats: provided, seatsLabel, tableCaption }: SeatChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("forecast");
  const xLabel = seatsLabel ?? t("projectedSeats");
  const locale = useLocale();
  const pt = locale !== "en";
  const stats = useMemo(() => provided ?? statsFromRows(data ?? []), [provided, data]);
  const name = (party: string) => partyNames[party as keyof typeof partyNames] ?? party;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || stats.length === 0) return;
    const render = () => {
      const plot = Plot.plot({
        width: container.offsetWidth || 1000,
        height: 400,
        marginLeft: 56,
        marginRight: 20,
        marginTop: 20,
        marginBottom: 40,
        style: { backgroundColor: "transparent", fontSize: "12px", fontFamily: FURNITURE.font, color: FURNITURE.textMuted },
        x: { label: xLabel, grid: true, domain: [0, Math.max(...stats.map(d => d.max)) + 10] },
        y: { label: null, domain: stats.map(d => d.party) },
        color: { type: "categorical", domain: Object.keys(partyColors), range: Object.values(partyColors) },
        marks: [
          Plot.barX(stats, { x1: "p10", x2: "p90", y: "party", fill: "party", fillOpacity: 0.2, insetTop: 3, insetBottom: 3 }),
          Plot.barX(stats, { x1: "p25", x2: "p75", y: "party", fill: "party", fillOpacity: 0.4, insetTop: 3, insetBottom: 3 }),
          Plot.dot(stats, { x: "mean", y: "party", fill: "party", r: 4, stroke: FURNITURE.surface, strokeWidth: 2 }),
          Plot.tip(stats, Plot.pointerY({
            x: "mean",
            y: "party",
            title: (d: PartySeatStats) => `${name(d.party)}: ${d.mean} (P10–P90 ${d.p10}–${d.p90}; P25–P75 ${d.p25}–${d.p75})`,
          })),
          Plot.text(stats, { x: "mean", y: "party", text: "mean", dx: 15, fontSize: 11, fontWeight: 600, fill: FURNITURE.text }),
        ],
      });
      // The table twin below is the accessible version; Plot labels role-less <g>s (A11Y-12).
      container.replaceChildren(quietPlot(plot));
    };
    render();
    const observer = new ResizeObserver(() => render());
    observer.observe(container);
    return () => observer.disconnect();
  }, [stats, xLabel]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="overflow-x-auto" />
      <ChartTable caption={tableCaption ?? `${xLabel} · ${pt ? "por partido" : "by party"}`} columns={[pt ? "Partido" : "Party", "P10", "P25", pt ? "Média" : "Mean", "P75", "P90"]} rows={stats.map(s => [name(s.party), s.p10, s.p25, s.mean, s.p75, s.p90])} />
    </div>
  );
}
