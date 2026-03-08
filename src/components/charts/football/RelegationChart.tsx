"use client";

import { useRef, useEffect, useState } from "react";
import { ligaTeamColors, teamDisplayName } from "@/lib/config/football";
import type { LigaHistorical } from "@/types/football";

interface RelegationChartProps {
  historical: LigaHistorical;
  yAxisLabel?: string;
}

export function RelegationChart({ historical, yAxisLabel = "Relegation (%)" }: RelegationChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current || historical.length === 0) return;

    const render = async () => {
      const Plot = (await import("@observablehq/plot")).default || await import("@observablehq/plot");
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
        x: {
          label: "Matchday",
          tickFormat: (d: number) => `${d}`,
        },
        y: {
          label: yAxisLabel,
          domain: [0, yMax],
          grid: true,
        },
        color: {
          domain: Array.from(teamsAtRisk),
          range: Array.from(teamsAtRisk).map(t => ligaTeamColors[t] || '#78716c'),
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
                fill: ligaTeamColors[team] || '#78716c',
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
  }, [historical, yAxisLabel]);

  return <div ref={containerRef} className="w-full min-h-[300px]" />;
}
