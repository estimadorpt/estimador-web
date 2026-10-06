"use client";

import { useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { formatPercent } from "@/lib/football-format";

interface TimelinePoint {
  matchday: number;
  /** Percentage, 0–100. */
  value: number;
}

interface TeamTimelineProps {
  data: TimelinePoint[];
  /** The club's colour, already contrast-checked for paper (teamColorOnPaper). */
  teamColor: string;
  yAxisLabel: string;
  /** Localised x-axis label; matchdays are integers, never dates. */
  xAxisLabel?: string;
}

// One club's probability after each matchday. No band (audit F-H1, see
// TitleRaceChart); the end label is in ink, never in the club colour, so a
// light club colour cannot make it disappear.
export function TeamTimeline({ data, teamColor, yAxisLabel, xAxisLabel = "Jornada" }: TeamTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const render = async () => {
      const Plot = await import("@observablehq/plot");
      const container = containerRef.current;
      if (!container) return;

      const width = container.offsetWidth;
      // Content-sized on phones: no tall blank area under a short chart.
      const height = Math.max(200, Math.min(320, width * 0.5));
      const maxVal = Math.max(...data.map(d => d.value));
      const yMax = Math.min(100, Math.ceil(maxVal / 10) * 10 + 5);

      const matchdays = data.map(d => d.matchday);
      const step = Math.max(1, Math.ceil(matchdays.length / Math.max(2, width / 60)));
      const tickValues = matchdays.filter((_, i) => i % step === 0);
      const last = data[data.length - 1];

      const plot = Plot.plot({
        width,
        height,
        marginTop: 30,
        marginLeft: 45,
        marginRight: 48,
        marginBottom: 35,
        style: { fontFamily: "Manrope, system-ui, sans-serif", fontSize: "12px", background: "transparent", color: "#5f7062", overflow: "visible" },
        x: { label: xAxisLabel, ticks: tickValues, tickFormat: (d: number) => `${Math.round(d)}` },
        y: { label: yAxisLabel, domain: [0, yMax], grid: true, tickFormat: (d: number) => `${d}%` },
        marks: [
          Plot.ruleY([0], { stroke: "#dadccf" }),
          Plot.lineY(data, { x: "matchday", y: "value", stroke: teamColor, strokeWidth: 2, curve: "monotone-x" }),
          Plot.tip(data, Plot.pointerX({
            x: "matchday",
            y: "value",
            title: (d: TimelinePoint) => `${xAxisLabel} ${d.matchday}: ${formatPercent(d.value / 100, locale)}`,
          })),
          Plot.dot([last], { x: "matchday", y: "value", fill: teamColor, r: 4 }),
          Plot.text([last], {
            x: "matchday",
            y: "value",
            text: (d: TimelinePoint) => formatPercent(d.value / 100, locale),
            dx: 8,
            textAnchor: "start",
            fill: "#234c40",
            fontSize: 12,
            fontWeight: "bold",
          }),
        ],
      });

      plot.setAttribute("aria-hidden", "true");
      container.replaceChildren(plot);
    };

    render();
    const observer = new ResizeObserver(() => render());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [data, teamColor, yAxisLabel, xAxisLabel, locale]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full min-h-[200px]" />
      <ChartTable caption={yAxisLabel} columns={[xAxisLabel, yAxisLabel]} rows={data.map(d => [d.matchday, formatPercent(d.value / 100, locale)])} />
    </div>
  );
}
