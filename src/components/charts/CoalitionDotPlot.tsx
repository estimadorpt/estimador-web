"use client";

import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";

interface SeatData {
  [party: string]: number;
}

interface CoalitionDotPlotProps {
  data: SeatData[];
  leftCoalitionLabel?: string;
  rightCoalitionLabel?: string;
  projectedSeatsLabel?: string;
  majorityLabel?: string;
  showingOutcomesLabel?: string;
}

export function CoalitionDotPlot({ 
  data, 
  leftCoalitionLabel = "Left coalition", 
  rightCoalitionLabel = "Right coalition",
  projectedSeatsLabel = "Projected seats",
  majorityLabel = "Majority",
  showingOutcomesLabel = "Showing {count} simulation outcomes"
}: CoalitionDotPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) {
      console.log("CoalitionDotPlot: No data available");
      return;
    }
    
    // Get actual container width for responsive sizing
    const containerWidth = containerRef.current.offsetWidth || 1000;
    const containerHeight = 350;
    
    console.log(`CoalitionDotPlot: Processing ${data.length} data points, container width: ${containerWidth}`);
    console.log('First 3 data points:', data.slice(0, 3));

    // Calculate coalition seats for each simulation
    const blocDrawData = data.flatMap((simulation, index) => {
      const leftSeats = leftBlocParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
      const rightSeats = rightBlocParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
      
      return [
        { draw: index, bloc: leftCoalitionLabel, totalSeats: leftSeats },
        { draw: index, bloc: rightCoalitionLabel, totalSeats: rightSeats }
      ];
    });

    // Calculate medians
    const blocMedians = Array.from(
      d3.rollup(blocDrawData, v => d3.median(v, d => d.totalSeats), d => d.bloc),
      ([bloc, medianSeats]) => ({ bloc, medianSeats })
    );

    // Sample data for performance - increase for better density
    const sampleSize = Math.min(1600, blocDrawData.length);
    const sampledData = d3.shuffle(blocDrawData.slice()).slice(0, sampleSize);
    
    console.log(`CoalitionDotPlot: ${blocDrawData.length} coalition data points, sampling ${sampledData.length}`);
    console.log('Sample of blocDrawData:', blocDrawData.slice(0, 5));
    console.log('Sample of sampledData:', sampledData.slice(0, 5));
    console.log('Bloc medians:', blocMedians);

    const plot = Plot.plot({
      width: containerWidth,
      height: containerHeight,
      marginLeft: 140,
      marginRight: 60,
      marginTop: 30,
      marginBottom: 50,
      style: {
        backgroundColor: "transparent",
        fontSize: "12px",
        fontFamily: "Inter, system-ui, sans-serif"
      },
      x: {
        label: projectedSeatsLabel,
        domain: [40, 140],
        grid: true,
        ticks: [50, 75, 100, majorityThreshold, 125]
      },
      fy: {
        domain: [leftCoalitionLabel, rightCoalitionLabel],
        label: null,
        axis: "left",
        padding: 0.1
      },
      color: {
        domain: [leftCoalitionLabel, rightCoalitionLabel],
        range: ["#10b981", "#f59e0b"]
      },
      marks: [
        // Majority line (spans across facets)
        Plot.ruleX([majorityThreshold], { 
          stroke: "#dc2626", 
          strokeWidth: 2, 
          strokeDasharray: "4,2",
          facet: "exclude"
        }),
        
        // Dodged dots with consistent horizontal jitter
        Plot.dotX(sampledData, Plot.dodgeY({
          x: d => d.totalSeats + (d.draw % 100 - 50) * 0.03, // Consistent jitter based on draw index
          fy: "bloc",
          fill: "bloc",
          fillOpacity: 0.7,
          r: 1.2,
          anchor: "middle"
        })),
        
        // Median lines
        Plot.ruleX(blocMedians, {
          x: "medianSeats",
          fy: "bloc",
          stroke: "black",
          strokeWidth: 2,
          strokeDasharray: "2,2"
        }),
        
        // Median labels
        Plot.text(blocMedians, {
          x: "medianSeats",
          fy: "bloc",
          text: d => Math.round(d.medianSeats).toString(),
          dy: -8,
          dx: 5,
          fontSize: 11,
          fontWeight: "bold",
          fill: "black"
        }),
        
        // Majority label
        Plot.text([{ x: majorityThreshold, fy: leftCoalitionLabel }], {
          x: "x",
          fy: "fy",
          text: `${majorityLabel} (${majorityThreshold})`,
          dx: 5,
          dy: -10,
          fontSize: 11,
          fill: "#dc2626",
          fontWeight: "600"
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
          const containerHeight = 350;

          // Calculate coalition seats for each simulation
          const blocDrawData = data.flatMap((simulation, index) => {
            const leftSeats = leftBlocParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
            const rightSeats = rightBlocParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
            
            return [
              { draw: index, bloc: leftCoalitionLabel, totalSeats: leftSeats },
              { draw: index, bloc: rightCoalitionLabel, totalSeats: rightSeats }
            ];
          });

          // Calculate medians
          const blocMedians = Array.from(
            d3.rollup(blocDrawData, v => d3.median(v, d => d.totalSeats), d => d.bloc),
            ([bloc, medianSeats]) => ({ bloc, medianSeats })
          );

          // Sample data for performance
          const sampleSize = Math.min(1600, blocDrawData.length);
          const sampledData = d3.shuffle(blocDrawData.slice()).slice(0, sampleSize);

          const plot = Plot.plot({
            width: containerWidth,
            height: containerHeight,
            marginLeft: 140,
            marginRight: 60,
            marginTop: 30,
            marginBottom: 50,
            style: {
              backgroundColor: "transparent",
              fontSize: "12px",
              fontFamily: "Inter, system-ui, sans-serif"
            },
            x: {
              label: projectedSeatsLabel,
              domain: [40, 140],
              grid: true,
              ticks: [50, 75, 100, majorityThreshold, 125]
            },
            fy: {
              domain: [leftCoalitionLabel, rightCoalitionLabel],
              label: null,
              axis: "left",
              padding: 0.1
            },
            color: {
              domain: [leftCoalitionLabel, rightCoalitionLabel],
              range: ["#10b981", "#f59e0b"]
            },
            marks: [
              // Majority line (spans across facets)
              Plot.ruleX([majorityThreshold], { 
                stroke: "#dc2626", 
                strokeWidth: 2, 
                strokeDasharray: "4,2",
                facet: "exclude"
              }),
              
              // Dodged dots with consistent horizontal jitter
              Plot.dotX(sampledData, Plot.dodgeY({
                x: d => d.totalSeats + (d.draw % 100 - 50) * 0.03, // Consistent jitter based on draw index
                fy: "bloc",
                fill: "bloc",
                fillOpacity: 0.7,
                r: 1.2,
                anchor: "middle"
              })),
              
              // Median lines
              Plot.ruleX(blocMedians, {
                x: "medianSeats",
                fy: "bloc",
                stroke: "black",
                strokeWidth: 2,
                strokeDasharray: "2,2"
              }),
              
              // Median labels
              Plot.text(blocMedians, {
                x: "medianSeats",
                fy: "bloc",
                text: d => Math.round(d.medianSeats).toString(),
                dy: -8,
                dx: 5,
                fontSize: 11,
                fontWeight: "bold",
                fill: "black"
              }),
              
              // Majority label
              Plot.text([{ x: majorityThreshold, fy: leftCoalitionLabel }], {
                x: "x",
                fy: "fy",
                text: `${majorityLabel} (${majorityThreshold})`,
                dx: 5,
                dy: -10,
                fontSize: 11,
                fill: "#dc2626",
                fontWeight: "600"
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

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500">
        <p>Loading coalition data...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={containerRef} className="overflow-x-auto" />
      <div className="text-xs text-gray-500 mt-2">
        {showingOutcomesLabel.replace('{count}', data.length.toString())}
      </div>
    </div>
  );
}