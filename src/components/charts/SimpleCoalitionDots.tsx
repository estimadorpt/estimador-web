"use client";

import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";

interface SeatData {
  [party: string]: number;
}

interface SimpleCoalitionDotsProps {
  data: SeatData[];
  width?: number;
  height?: number;
}

export function SimpleCoalitionDots({ data, width = 600, height = 300 }: SimpleCoalitionDotsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Calculate coalition seats for each simulation
    const scatterData = data.slice(0, 1000).flatMap((simulation, i) => {
      const leftSeats = leftBlocParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
      const rightSeats = rightBlocParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
      
      return [
        { x: leftSeats, y: 0.2 + (i % 50) * 0.01, coalition: "Left", seats: leftSeats },
        { x: rightSeats, y: 0.8 + (i % 50) * 0.01, coalition: "Right", seats: rightSeats }
      ];
    });

    console.log('SimpleCoalitionDots: Created', scatterData.length, 'points');
    console.log('Sample:', scatterData.slice(0, 4));

    const plot = Plot.plot({
      width,
      height,
      marginLeft: 80,
      marginRight: 40,
      style: {
        backgroundColor: "transparent",
        fontSize: "12px",
        fontFamily: "Inter, system-ui, sans-serif"
      },
      x: {
        label: "Coalition seats",
        domain: [40, 180],
        grid: true
      },
      y: {
        label: null,
        domain: [0, 1],
        axis: null
      },
      color: {
        domain: ["Left", "Right"],
        range: ["#10b981", "#f59e0b"]
      },
      marks: [
        // Majority line
        Plot.ruleX([majorityThreshold], { 
          stroke: "#dc2626", 
          strokeWidth: 2, 
          strokeDasharray: "4,2"
        }),
        
        // Simple dots
        Plot.dot(scatterData, {
          x: "x",
          y: "y",
          fill: "coalition",
          fillOpacity: 0.6,
          r: 2
        }),
        
        // Coalition labels
        Plot.text([
          { x: 60, y: 0.2, text: "Left coalition" },
          { x: 60, y: 0.8, text: "Right coalition" }
        ], {
          x: "x",
          y: "y",
          text: "text",
          fontSize: 12,
          fontWeight: "bold",
          fill: "#374151"
        })
      ]
    });

    if (containerRef.current) {
      containerRef.current.replaceChildren(plot);
    }

    return () => plot.remove();
  }, [data, width, height]);

  return (
    <div className="w-full">
      <div ref={containerRef} />
    </div>
  );
}