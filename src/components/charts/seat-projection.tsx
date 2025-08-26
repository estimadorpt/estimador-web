'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';
import { partyColors, partyOrder } from '@/lib/config/colors';

interface SeatData {
  [party: string]: number;
}

interface SeatProjectionProps {
  data: SeatData[];
  width?: number;
  height?: number;
}

export function SeatProjection({ data, width = 800, height = 500 }: SeatProjectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    // Clear previous chart
    containerRef.current.innerHTML = '';

    // Transform data to long format
    const longData = data.flatMap((simulation, index) => 
      partyOrder
        .filter(party => party in simulation && party !== 'OTH') // Exclude 'OTH' for clarity
        .map(party => ({
          party,
          seats: simulation[party],
          simulation: index
        }))
    );

    // Calculate statistics for each party
    const partyStats = partyOrder
      .filter(party => party !== 'OTH')
      .map(party => {
        const partyData = longData.filter(d => d.party === party);
        const seats = partyData.map(d => d.seats).sort((a, b) => a - b);
        
        return {
          party,
          mean: d3.mean(seats) || 0,
          median: d3.median(seats) || 0,
          p10: d3.quantile(seats, 0.1) || 0,
          p90: d3.quantile(seats, 0.9) || 0,
          min: d3.min(seats) || 0,
          max: d3.max(seats) || 0
        };
      })
      .sort((a, b) => b.mean - a.mean); // Sort by mean seats

    // Create the plot
    const plot = Plot.plot({
      width,
      height,
      marginLeft: 80,
      marginRight: 40,
      marginBottom: 60,
      marginTop: 20,
      x: {
        label: "Seats",
        domain: [0, Math.max(120, d3.max(partyStats, d => d.max) || 100)],
        grid: true
      },
      y: {
        label: "Party",
        domain: partyStats.map(d => d.party),
        padding: 0.2
      },
      color: {
        domain: partyOrder,
        range: partyOrder.map(party => partyColors[party as keyof typeof partyColors] || '#gray')
      },
      marks: [
        // Range bars (min to max)
        Plot.barX(partyStats, {
          x1: "min",
          x2: "max", 
          y: "party",
          fill: "party",
          fillOpacity: 0.2,
          height: 20
        }),

        // Interquartile range (P10 to P90)
        Plot.barX(partyStats, {
          x1: "p10",
          x2: "p90",
          y: "party", 
          fill: "party",
          fillOpacity: 0.6,
          height: 15
        }),

        // Median line
        Plot.ruleX(partyStats, {
          x: "median",
          y: "party",
          stroke: "white",
          strokeWidth: 3
        }),

        // Mean dot
        Plot.dot(partyStats, {
          x: "mean",
          y: "party",
          fill: "party",
          r: 4,
          stroke: "white",
          strokeWidth: 2
        }),

        // Value labels
        Plot.text(partyStats, {
          x: d => d.mean + 5,
          y: "party",
          text: d => `${Math.round(d.mean)} (${Math.round(d.p10)}-${Math.round(d.p90)})`,
          fontSize: 11,
          textAnchor: "start",
          fill: "currentColor"
        }),

        // Majority line
        Plot.ruleX([116], {
          stroke: "#ef4444",
          strokeWidth: 2,
          strokeDasharray: "5,5"
        }),

        // Majority label
        Plot.text([{x: 116, y: partyStats[0].party}], {
          x: "x",
          y: "y",
          text: "Majority (116)",
          dx: 5,
          dy: -10,
          fontSize: 10,
          fill: "#ef4444",
          fontWeight: "bold"
        })
      ]
    });

    containerRef.current.appendChild(plot);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [data, width, height]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full overflow-x-auto" />
      <p className="text-sm text-slate-600 mt-2">
        Bars show seat projection ranges: light bars = full range, dark bars = 80% confidence interval (P10-P90). 
        White lines = median, dots = mean. Numbers show mean (P10-P90 range).
      </p>
    </div>
  );
}