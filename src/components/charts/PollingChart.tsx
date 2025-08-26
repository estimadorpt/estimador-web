"use client";

import * as Plot from "@observablehq/plot";
import { useEffect, useRef } from "react";
import { partyColors } from "@/lib/config/colors";

interface TrendData {
  date: string;
  party: string;
  metric: string;
  value: number;
}

interface PollingChartProps {
  data: TrendData[];
}

export function PollingChart({ data }: PollingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    // Get actual container width for truly responsive sizing
    const containerWidth = containerRef.current.offsetWidth || 900;
    const containerHeight = 450; // Good height for the space

    // Filter for vote share data only
    const voteShareData = data.filter(d => d.metric === 'vote_share_mean');
    
    // Filter to recent time period - show all parties
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2); // Last 2 years only
    
    const filteredData = voteShareData.filter(d => new Date(d.date) >= cutoffDate);
    
    // Get latest values for all parties
    const latestData = filteredData
      .filter(d => {
        const maxDate = new Date(Math.max(...filteredData.map(dd => new Date(dd.date).getTime())));
        return new Date(d.date).getTime() === maxDate.getTime();
      })
      .sort((a, b) => b.value - a.value);
    
    const plot = Plot.plot({
      width: containerWidth,
      height: containerHeight,
      marginLeft: 60,
      marginRight: 120, // Space for labels
      marginTop: 20,
      marginBottom: 50, // Reasonable space for x-axis labels
      style: {
        backgroundColor: "transparent",
        fontSize: "12px",
        fontFamily: "Inter, system-ui, sans-serif"
      },
      x: {
        type: "time",
        label: null,
        tickFormat: "%b %Y",
        grid: true,
        ticks: 4
      },
      y: {
        label: "Vote share (%)",
        domain: [0, 0.5],
        tickFormat: d => `${(d * 100).toFixed(0)}%`,
        grid: true
      },
      color: {
        type: "categorical",
        domain: Object.keys(partyColors),
        range: Object.values(partyColors)
      },
      marks: [
        // Background grid
        Plot.gridY({ stroke: "#f3f4f6", strokeWidth: 1 }),
        Plot.gridX({ stroke: "#f3f4f6", strokeWidth: 1 }),
        
        // Lines for each party
        Plot.line(filteredData, {
          x: d => new Date(d.date),
          y: "value",
          stroke: "party",
          strokeWidth: 2.5,
          curve: "catmull-rom"
        }),
        
        // Points for latest values
        Plot.dot(latestData, {
          x: d => new Date(d.date),
          y: "value",
          fill: "party",
          r: 4,
          stroke: "white",
          strokeWidth: 2
        }),
        
        // Major parties - label at line end
        Plot.text(latestData.filter(d => d.value > 0.1), {
          x: d => new Date(d.date),
          y: "value",
          text: d => `${d.party} ${(d.value * 100).toFixed(1)}%`,
          fill: "party",
          dx: 8,
          fontSize: 11,
          fontWeight: "600",
          textAnchor: "start"
        }),
        
        // Minor parties - sorted bottom to top to match visual order
        Plot.text(latestData.filter(d => d.value <= 0.1).sort((a, b) => a.value - b.value), Plot.dodgeY({
          x: d => new Date(d.date),
          y: "value",
          text: d => `${d.party} ${(d.value * 100).toFixed(1)}%`,
          fill: "party",
          dx: 8,
          dy: -3, // Move labels slightly up
          fontSize: 10,
          fontWeight: "500",
          textAnchor: "start",
          padding: 4 // Increase spacing between dodged labels
        }))
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
          
          const containerWidth = containerRef.current.offsetWidth || 900;
          const containerHeight = 450;

          // Filter for vote share data only
          const voteShareData = data.filter(d => d.metric === 'vote_share_mean');
          
          // Filter to recent time period - show all parties
          const cutoffDate = new Date();
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
          
          const filteredData = voteShareData.filter(d => new Date(d.date) >= cutoffDate);
          
          // Get latest values for all parties
          const latestData = filteredData
            .filter(d => {
              const maxDate = new Date(Math.max(...filteredData.map(dd => new Date(dd.date).getTime())));
              return new Date(d.date).getTime() === maxDate.getTime();
            })
            .sort((a, b) => b.value - a.value);
          
          const plot = Plot.plot({
            width: containerWidth,
            height: containerHeight,
            marginLeft: 60,
            marginRight: 120,
            marginTop: 20,
            marginBottom: 50,
            style: {
              backgroundColor: "transparent",
              fontSize: "12px",
              fontFamily: "Inter, system-ui, sans-serif"
            },
            x: {
              type: "time",
              label: null,
              tickFormat: "%b %Y",
              grid: true,
              ticks: 4
            },
            y: {
              label: "Vote share (%)",
              domain: [0, 0.5],
              tickFormat: d => `${(d * 100).toFixed(0)}%`,
              grid: true
            },
            color: {
              type: "categorical",
              domain: Object.keys(partyColors),
              range: Object.values(partyColors)
            },
            marks: [
              Plot.gridY({ stroke: "#f3f4f6", strokeWidth: 1 }),
              Plot.gridX({ stroke: "#f3f4f6", strokeWidth: 1 }),
              
              Plot.line(filteredData, {
                x: d => new Date(d.date),
                y: "value",
                stroke: "party",
                strokeWidth: 2.5,
                curve: "catmull-rom"
              }),
              
              Plot.dot(latestData, {
                x: d => new Date(d.date),
                y: "value",
                fill: "party",
                r: 4,
                stroke: "white",
                strokeWidth: 2
              }),
              
              Plot.text(latestData.filter(d => d.value > 0.1), {
                x: d => new Date(d.date),
                y: "value",
                text: d => `${d.party} ${(d.value * 100).toFixed(1)}%`,
                fill: "party",
                dx: 8,
                fontSize: 11,
                fontWeight: "600",
                textAnchor: "start"
              }),
              
              Plot.text(latestData.filter(d => d.value <= 0.1).sort((a, b) => a.value - b.value), Plot.dodgeY({
                x: d => new Date(d.date),
                y: "value",
                text: d => `${d.party} ${(d.value * 100).toFixed(1)}%`,
                fill: "party",
                dx: 8,
                dy: -3,
                fontSize: 10,
                fontWeight: "500",
                textAnchor: "start",
                padding: 4
              }))
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