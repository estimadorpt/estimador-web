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
}

export function TeamTimeline({ data, teamColor, yAxisLabel }: TeamTimelineProps) {
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

      const plot = Plot.plot({
        width,
        height,
        marginLeft: 45,
        marginRight: 20,
        marginBottom: 35,
        x: {
          label: "Matchday",
          tickFormat: (d: number) => `${d}`,
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
