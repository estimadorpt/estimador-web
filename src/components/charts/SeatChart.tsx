"use client";

import * as Plot from "@observablehq/plot";
import { useEffect, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import { partyColors, partyNames } from "@/lib/config/colors";

interface SeatData {
  party: string;
  seats: number;
}

interface SeatChartProps {
  data: SeatData[];
  /** Axis label; defaults to the locale's "projected seats". */
  seatsLabel?: string;
}

export function SeatChart({ data, seatsLabel }: SeatChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("forecast");
  const xLabel = seatsLabel ?? t("projectedSeats");
  const locale = useLocale();
  const pt = locale !== "en";

  // The table twin: the same statistics as the bars.
  const stats = useMemo(() => {
    const acc: Record<string, number[]> = {};
    for (const d of data ?? []) (acc[d.party] ??= []).push(d.seats);
    return Object.entries(acc)
      .map(([party, seats]) => { const s = [...seats].sort((a, b) => a - b); const q = (p: number) => s[Math.min(s.length - 1, Math.floor(s.length * p))]; return { party, mean: Math.round(s.reduce((x, y) => x + y, 0) / s.length), p10: q(0.1), p25: q(0.25), p75: q(0.75), p90: q(0.9) }; })
      .sort((a, b) => b.mean - a.mean);
  }, [data]);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    // Get actual container width for responsive sizing
    const containerWidth = containerRef.current.offsetWidth || 1000;
    const containerHeight = 400;

    // Calculate seat statistics for each party
    const seatStats = data.reduce((acc, d) => {
      if (!acc[d.party]) {
        acc[d.party] = [];
      }
      acc[d.party].push(d.seats);
      return acc;
    }, {} as Record<string, number[]>);

    const chartData = Object.entries(seatStats).map(([party, seats]) => {
      const sorted = seats.sort((a, b) => a - b);
      return {
        party,
        mean: Math.round(sorted.reduce((sum, s) => sum + s, 0) / sorted.length),
        p10: sorted[Math.floor(sorted.length * 0.1)],
        p25: sorted[Math.floor(sorted.length * 0.25)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        min: Math.min(...sorted),
        max: Math.max(...sorted)
      };
    }).sort((a, b) => b.mean - a.mean);

    const plot = Plot.plot({
      width: containerWidth,
      height: containerHeight,
      marginLeft: 56,
      marginRight: 20,
      marginTop: 20,
      marginBottom: 40,
      style: {
        backgroundColor: "transparent",
        fontSize: "12px",
        fontFamily: "Manrope, system-ui, sans-serif"
      },
      x: {
        label: xLabel,
        grid: true,
        domain: [0, Math.max(...chartData.map(d => d.max)) + 10]
      },
      y: {
        label: null,
        domain: chartData.map(d => d.party),
        tickFormat: (d: string) => d
      },
      color: {
        type: "categorical",
        domain: Object.keys(partyColors),
        range: Object.values(partyColors)
      },
      marks: [
        // Background grid
        Plot.gridX({ stroke: "#f5f4ed", strokeWidth: 1 }),
        
        // Uncertainty bands (80% confidence)
        Plot.barX(chartData, {
          x1: "p10",
          x2: "p90",
          y: "party",
          fill: "party",
          fillOpacity: 0.2,
          insetTop: 3, insetBottom: 3
        }),
        
        // Interquartile range (50% confidence)
        Plot.barX(chartData, {
          x1: "p25",
          x2: "p75",
          y: "party",
          fill: "party",
          fillOpacity: 0.4,
          insetTop: 3, insetBottom: 3
        }),
        
        // Mean projection
        Plot.dot(chartData, {
          x: "mean",
          y: "party",
          fill: "party",
          r: 4,
          stroke: "white",
          strokeWidth: 2
        }),
        
        Plot.tip(chartData, Plot.pointerY({
        
          x: "mean",
        
          y: "party",
        
          title: (d: { party: string; mean: number; p10: number; p90: number }) => `${partyNames[d.party as keyof typeof partyNames] ?? d.party}: ${d.mean} (${d.p10}–${d.p90})`,
        
        })),

        
        // Mean labels
        Plot.text(chartData, {
          x: "mean",
          y: "party",
          text: "mean",
          dx: 15,
          fontSize: 11,
          fontWeight: "600",
          fill: "#434d48"
        })
      ]
    });

    if (containerRef.current) {
      containerRef.current.replaceChildren(plot);
    }

    return () => plot.remove();
  }, [data, xLabel]);

  // Add resize observer for responsive behavior
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      // Re-render chart when container size changes
      if (containerRef.current && data && data.length > 0) {
        // Small delay to ensure container has final dimensions
        setTimeout(() => {
          if (!containerRef.current) return;
          
          const containerWidth = containerRef.current.offsetWidth || 1000;
          const containerHeight = 400;

          // Calculate seat statistics for each party
          const seatStats = data.reduce((acc, d) => {
            if (!acc[d.party]) {
              acc[d.party] = [];
            }
            acc[d.party].push(d.seats);
            return acc;
          }, {} as Record<string, number[]>);

          const chartData = Object.entries(seatStats).map(([party, seats]) => {
            const sorted = seats.sort((a, b) => a - b);
            return {
              party,
              mean: Math.round(sorted.reduce((sum, s) => sum + s, 0) / sorted.length),
              p10: sorted[Math.floor(sorted.length * 0.1)],
              p25: sorted[Math.floor(sorted.length * 0.25)],
              p75: sorted[Math.floor(sorted.length * 0.75)],
              p90: sorted[Math.floor(sorted.length * 0.9)],
              min: Math.min(...sorted),
              max: Math.max(...sorted)
            };
          }).sort((a, b) => b.mean - a.mean);

          const plot = Plot.plot({
            width: containerWidth,
            height: containerHeight,
            marginLeft: 56,
            marginRight: 20,
            marginTop: 20,
            marginBottom: 40,
            style: {
              backgroundColor: "transparent",
              fontSize: "12px",
              fontFamily: "Manrope, system-ui, sans-serif"
            },
            x: {
              label: xLabel,
              grid: true,
              domain: [0, Math.max(...chartData.map(d => d.max)) + 10]
            },
            y: {
              label: null,
              domain: chartData.map(d => d.party),
              tickFormat: (d: string) => d
            },
            color: {
              type: "categorical",
              domain: Object.keys(partyColors),
              range: Object.values(partyColors)
            },
            marks: [
              // Background grid
              Plot.gridX({ stroke: "#f5f4ed", strokeWidth: 1 }),
              
              // Uncertainty bands (80% confidence)
              Plot.barX(chartData, {
                x1: "p10",
                x2: "p90",
                y: "party",
                fill: "party",
                fillOpacity: 0.2,
                insetTop: 3, insetBottom: 3
              }),
              
              // Interquartile range (50% confidence)
              Plot.barX(chartData, {
                x1: "p25",
                x2: "p75",
                y: "party",
                fill: "party",
                fillOpacity: 0.4,
                insetTop: 3, insetBottom: 3
              }),
              
              // Mean projection
              Plot.dot(chartData, {
                x: "mean",
                y: "party",
                fill: "party",
                r: 4,
                stroke: "white",
                strokeWidth: 2
              }),
              
              Plot.tip(chartData, Plot.pointerY({
              
                x: "mean",
              
                y: "party",
              
                title: (d: { party: string; mean: number; p10: number; p90: number }) => `${partyNames[d.party as keyof typeof partyNames] ?? d.party}: ${d.mean} (${d.p10}–${d.p90})`,
              
              })),

              
              // Mean labels
              Plot.text(chartData, {
                x: "mean",
                y: "party",
                text: "mean",
                dx: 15,
                fontSize: 11,
                fontWeight: "600",
                fill: "#434d48"
              })
            ]
          });

          containerRef.current.replaceChildren(plot);
        }, 100);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [data, xLabel]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="overflow-x-auto" />
      <ChartTable caption={xLabel} columns={[pt ? "Partido" : "Party", "P10", "P25", pt ? "Média" : "Mean", "P75", "P90"]} rows={stats.map(s => [partyNames[s.party as keyof typeof partyNames] ?? s.party, s.p10, s.p25, s.mean, s.p75, s.p90])} />
    </div>
  );
}