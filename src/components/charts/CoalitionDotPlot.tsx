"use client";

import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
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
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side only rendering to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !data || data.length === 0 || !containerRef.current) {
      if (!isClient) {
        console.log("CoalitionDotPlot: Waiting for client-side rendering");
      } else {
        console.log("CoalitionDotPlot: No data available");
      }
      return;
    }
    
    // Get actual container width for responsive sizing
    const containerWidth = containerRef.current.offsetWidth || 1000;
    const containerHeight = 350;
    const isMobile = containerWidth < 768;
    
    console.log(`CoalitionDotPlot: Processing ${data.length} data points, container width: ${containerWidth}`);
    console.log('First 3 data points:', data.slice(0, 3));
    console.log('User agent:', navigator.userAgent);
    console.log('Is mobile device:', isMobile);

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

    // Sample data for performance - reduce for mobile devices
    const sampleSize = Math.min(isMobile ? 200 : 1600, blocDrawData.length);
    const sampledData = d3.shuffle(blocDrawData.slice()).slice(0, sampleSize);
    
    console.log(`CoalitionDotPlot: ${blocDrawData.length} coalition data points, sampling ${sampledData.length}`);
    console.log('Sample of blocDrawData:', blocDrawData.slice(0, 5));
    console.log('Sample of sampledData:', sampledData.slice(0, 5));
    console.log('Bloc medians:', blocMedians);

    console.log('CoalitionDotPlot: About to create Plot.plot()');
    let plot;
    try {
      plot = Plot.plot({
      width: containerWidth,
      height: containerHeight,
      marginLeft: isMobile ? 80 : 140,
      marginRight: isMobile ? 30 : 60,
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
        
        // Dodged dots with mobile-optimized sizing
        Plot.dotX(sampledData, Plot.dodgeY({
          x: d => d.totalSeats + (d.draw % 100 - 50) * 0.03, // Consistent jitter based on draw index
          fy: "bloc",
          fill: "bloc",
          fillOpacity: isMobile ? 0.8 : 0.7,
          r: isMobile ? 2 : 1.2, // Larger dots for mobile
          stroke: "white",
          strokeWidth: isMobile ? 0.5 : 0.3,
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
      console.log('CoalitionDotPlot: Plot.plot() created successfully');
    } catch (plotError) {
      console.error('CoalitionDotPlot: Error creating Plot.plot():', plotError);
      return;
    }

    if (containerRef.current) {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Check if the plot was rendered successfully
      try {
        console.log('CoalitionDotPlot: Attempting to append plot to container');
        containerRef.current.appendChild(plot);
        console.log('CoalitionDotPlot: Plot appended successfully');
        
        // Verify dots were actually rendered
        const dots = plot.querySelectorAll('circle');
        console.log(`CoalitionDotPlot: Rendered ${dots.length} dots`);
        console.log('CoalitionDotPlot: Plot HTML preview:', plot.outerHTML.substring(0, 500));
        
        if (dots.length === 0) {
          console.warn('CoalitionDotPlot: No dots rendered, Observable Plot may have failed');
          // Force a re-render with simpler visualization
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.innerHTML = `
                <div style="padding: 20px; text-align: center; background: #f9fafb; border-radius: 8px;">
                  <p style="margin: 0; color: #6b7280;">Coalition visualization temporarily unavailable on this device.</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #9ca3af;">Please try viewing on desktop for full chart functionality.</p>
                </div>
              `;
            }
          }, 100);
        }
      } catch (error) {
        console.error('CoalitionDotPlot: Error rendering plot:', error);
        containerRef.current.innerHTML = `
          <div style="padding: 20px; text-align: center; background: #fef2f2; border-radius: 8px;">
            <p style="margin: 0; color: #dc2626;">Error loading coalition chart</p>
          </div>
        `;
      }
    }

    return () => {
      try {
        plot.remove();
      } catch (e) {
        console.warn('Error removing plot:', e);
      }
    };
  }, [isClient, data, leftCoalitionLabel, rightCoalitionLabel, projectedSeatsLabel, majorityLabel]);


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