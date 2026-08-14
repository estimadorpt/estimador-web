"use client";

import { useRef, useEffect, useState } from "react";

interface TimelinePoint {
  matchday: number;
  value: number;
  lo: number;
  hi: number;
}

interface TeamTimelineProps {
  data: TimelinePoint[];
  teamColor: string;
  yAxisLabel: string;
  /** Localised x-axis label; matchdays are integers, never dates. */
  xAxisLabel?: string;
}

export function TeamTimeline({
  data,
  teamColor,
  yAxisLabel,
  xAxisLabel = "Jornada",
}: TeamTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const render = async () => {
      const Plot = (await import("@observablehq/plot")).default || await import("@observablehq/plot");
      const container = containerRef.current;
      if (!container) return;

      const width = container.offsetWidth;
      const height = Math.min(350, width * 0.5);

      const maxVal = Math.max(...data.map(d => d.hi), ...data.map(d => d.value));
      const yMax = Math.min(100, Math.ceil(maxVal / 10) * 10 + 5);

      // One tick per matchday, thinned to roughly one per 60px so a full
      // 34-matchday season does not collide.
      const matchdays = data.map(d => d.matchday);
      const step = Math.max(1, Math.ceil(matchdays.length / Math.max(2, width / 60)));
      const tickValues = matchdays.filter((_, i) => i % step === 0);

      const plot = Plot.plot({
        width,
        height,
        marginLeft: 45,
        marginRight: 20,
        marginBottom: 35,
        x: {
          label: xAxisLabel,
          // Matchdays are whole numbers. Left to its own devices Plot fits a
          // continuous scale to the domain and, with only a handful of
          // points, emits 1, 1.2, 1.4 … — which reads as fractional days on
          // a chart whose axis is labelled "Jornada". Pin the ticks to the
          // matchdays actually present, thinned so they never overlap.
          ticks: tickValues,
          tickFormat: (d: number) => `${Math.round(d)}`,
        },
        y: {
          label: yAxisLabel,
          domain: [0, yMax],
          grid: true,
        },
        marks: [
          Plot.ruleY([0]),
          Plot.areaY(data, {
            x: "matchday",
            y1: "lo",
            y2: "hi",
            fill: teamColor,
            fillOpacity: 0.12,
            curve: "monotone-x",
          }),
          Plot.lineY(data, {
            x: "matchday",
            y: "value",
            stroke: teamColor,
            strokeWidth: 2.5,
            curve: "monotone-x",
          }),
          Plot.dot(data.filter((_, i) => i === data.length - 1), {
            x: "matchday",
            y: "value",
            fill: teamColor,
            r: 4,
          }),
          Plot.text(data.filter((_, i) => i === data.length - 1), {
            x: "matchday",
            y: "value",
            text: (d: TimelinePoint) => `${Math.round(d.value)}%`,
            dy: -12,
            fill: teamColor,
            fontSize: 12,
            fontWeight: "bold",
          }),
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
  }, [data, teamColor, yAxisLabel]);

  return <div ref={containerRef} className="w-full min-h-[280px]" />;
}
