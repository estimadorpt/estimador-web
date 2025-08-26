"use client";

import * as Plot from "@observablehq/plot";
import { useEffect, useRef } from "react";
import { partyColors, partyNames } from "@/lib/config/colors";

interface SeatData {
  party: string;
  seats: number;
}

interface SeatChartProps {
  data: SeatData[];
}

export function SeatChart({ data }: SeatChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      marginLeft: 80,
      marginRight: 20,
      marginTop: 20,
      marginBottom: 40,
      style: {
        backgroundColor: "transparent",
        fontSize: "12px",
        fontFamily: "Inter, system-ui, sans-serif"
      },
      x: {
        label: "Projected seats",
        grid: true,
        domain: [0, Math.max(...chartData.map(d => d.max)) + 10]
      },
      y: {
        label: null,
        domain: chartData.map(d => d.party),
        tickFormat: d => partyNames[d as keyof typeof partyNames] || d
      },
      color: {
        type: "categorical",
        domain: Object.keys(partyColors),
        range: Object.values(partyColors)
      },
      marks: [
        // Background grid
        Plot.gridX({ stroke: "#f3f4f6", strokeWidth: 1 }),
        
        // Uncertainty bands (80% confidence)
        Plot.barX(chartData, {
          x1: "p10",
          x2: "p90",
          y: "party",
          fill: "party",
          fillOpacity: 0.2,
          height: 20
        }),
        
        // Interquartile range (50% confidence)
        Plot.barX(chartData, {
          x1: "p25",
          x2: "p75",
          y: "party",
          fill: "party",
          fillOpacity: 0.4,
          height: 20
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
        
        // Mean labels
        Plot.text(chartData, {
          x: "mean",
          y: "party",
          text: "mean",
          dx: 15,
          fontSize: 11,
          fontWeight: "600",
          fill: "#374151"
        })
      ]
    });

    if (containerRef.current) {
      containerRef.current.replaceChildren(plot);
    }

    return () => plot.remove();
  }, [data]);

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
            marginLeft: 80,
            marginRight: 20,
            marginTop: 20,
            marginBottom: 40,
            style: {
              backgroundColor: "transparent",
              fontSize: "12px",
              fontFamily: "Inter, system-ui, sans-serif"
            },
            x: {
              label: "Projected seats",
              grid: true,
              domain: [0, Math.max(...chartData.map(d => d.max)) + 10]
            },
            y: {
              label: null,
              domain: chartData.map(d => d.party),
              tickFormat: d => partyNames[d as keyof typeof partyNames] || d
            },
            color: {
              type: "categorical",
              domain: Object.keys(partyColors),
              range: Object.values(partyColors)
            },
            marks: [
              // Background grid
              Plot.gridX({ stroke: "#f3f4f6", strokeWidth: 1 }),
              
              // Uncertainty bands (80% confidence)
              Plot.barX(chartData, {
                x1: "p10",
                x2: "p90",
                y: "party",
                fill: "party",
                fillOpacity: 0.2,
                height: 20
              }),
              
              // Interquartile range (50% confidence)
              Plot.barX(chartData, {
                x1: "p25",
                x2: "p75",
                y: "party",
                fill: "party",
                fillOpacity: 0.4,
                height: 20
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
              
              // Mean labels
              Plot.text(chartData, {
                x: "mean",
                y: "party",
                text: "mean",
                dx: 15,
                fontSize: 11,
                fontWeight: "600",
                fill: "#374151"
              })
            ]
          });

          containerRef.current.replaceChildren(plot);
        }, 100);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [data]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="overflow-x-auto" />
    </div>
  );
}