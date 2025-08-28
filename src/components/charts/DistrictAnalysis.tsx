"use client";

import * as Plot from "@observablehq/plot";
import { useEffect, useRef } from "react";
import { partyColors, partyNames } from "@/lib/config/colors";

interface DistrictData {
  district: string;
  party: string;
  seats: number;
}

interface ContestedData {
  districts: Record<string, {
    ENSC: number;
    parties: Record<string, Record<string, number>>;
  }>;
}

interface DistrictAnalysisProps {
  districtData: DistrictData[];
  contestedData: ContestedData;
  height?: number;
}

export function DistrictAnalysis({ districtData, contestedData, height = 400 }: DistrictAnalysisProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!districtData || districtData.length === 0 || !contestedData) return;

    // Calculate average seats per district per party
    const districtSummary = districtData.reduce((acc, d) => {
      if (!acc[d.district]) {
        acc[d.district] = {};
      }
      if (!acc[d.district][d.party]) {
        acc[d.district][d.party] = [];
      }
      acc[d.district][d.party].push(d.seats);
      return acc;
    }, {} as Record<string, Record<string, number[]>>);

    // Calculate means and add competitiveness
    const chartData = Object.entries(districtSummary).flatMap(([district, parties]) => {
      return Object.entries(parties).map(([party, seats]) => {
        const meanSeats = seats.reduce((sum, s) => sum + s, 0) / seats.length;
        const contestedInfo = contestedData.districts[district];
        const competitiveness = contestedInfo ? contestedInfo.ENSC : 0;
        
        return {
          district,
          party,
          meanSeats,
          competitiveness,
          isContested: competitiveness > 1.5
        };
      });
    }).filter(d => d.meanSeats > 0.1); // Only show parties with realistic chances

    // Sort districts by total seats (descending)
    const districtTotals = Object.keys(districtSummary).map(district => {
      const totalSeats = Object.values(districtSummary[district])
        .flat()
        .reduce((sum, s) => sum + s, 0) / Object.values(districtSummary[district])[0].length;
      return { district, totalSeats };
    }).sort((a, b) => b.totalSeats - a.totalSeats);

    const plot = Plot.plot({
      height,
      marginLeft: 100,
      marginRight: 20,
      marginTop: 40,
      marginBottom: 40,
      style: {
        backgroundColor: "transparent",
        fontSize: "11px",
        fontFamily: "Inter, system-ui, sans-serif"
      },
      color: {
        type: "categorical",
        domain: Object.keys(partyColors),
        range: Object.values(partyColors)
      },
      x: {
        label: "Average projected seats",
        grid: true,
        nice: true
      },
      y: {
        label: null,
        domain: districtTotals.map(d => d.district),
        tickFormat: d => d.length > 12 ? d.substring(0, 10) + "..." : d
      },
      marks: [
        // Background for contested districts
        Plot.barX(chartData.filter(d => d.isContested), {
          x: () => 20, // Max width
          y: "district",
          fill: "#fef3c7",
          fillOpacity: 0.3,
          height: 15
        }),
        
        // Main dots for seat projections
        Plot.dot(chartData, {
          x: "meanSeats",
          y: "district",
          fill: "party",
          r: d => Math.max(3, Math.sqrt(d.meanSeats) * 2),
          stroke: "white",
          strokeWidth: 1
        }),
        
        // Party labels for significant seats
        Plot.text(chartData.filter(d => d.meanSeats >= 1), {
          x: "meanSeats",
          y: "district",
          text: d => `${d.party} ${d.meanSeats.toFixed(1)}`,
          dx: 15,
          fontSize: 10,
          fill: "party",
          fontWeight: "500"
        }),
        
        // Legend for contested districts
        Plot.text([{x: 15, y: districtTotals[0].district, text: "Contested"}], {
          x: "x",
          y: "y",
          text: "text",
          fontSize: 10,
          fill: "#d97706",
          fontWeight: "600"
        })
      ]
    });

    if (containerRef.current) {
      containerRef.current.replaceChildren(plot);
    }

    return () => plot.remove();
  }, [districtData, contestedData, height]);

  return (
    <div className="w-full">
      <div ref={containerRef} />
      <div className="mt-2 text-xs text-gray-500">
        <span className="inline-block w-3 h-3 bg-yellow-200 mr-1"></span>
        Highlighted districts are highly contested (ENSC &gt; 1.5)
      </div>
    </div>
  );
}