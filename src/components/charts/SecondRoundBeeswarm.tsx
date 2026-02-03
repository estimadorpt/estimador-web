"use client";

import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { SecondRoundTrajectoriesData } from "@/types";

interface SecondRoundBeeswarmProps {
  trajectories: SecondRoundTrajectoriesData;
  translations: {
    fiftyPercentLine: string;
    showingOutcomes: string;
  };
}

export function SecondRoundBeeswarm({
  trajectories,
  translations,
}: SecondRoundBeeswarmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !trajectories || !containerRef.current) {
      return;
    }

    const containerWidth = containerRef.current.offsetWidth || 800;
    const containerHeight = 300;
    const isMobile = containerWidth < 768;

    // Extract final day values from trajectories (excluding Blank/Null)
    const simulationPoints: { draw: number; candidate: string; voteShare: number; color: string }[] = [];

    for (const [candidateName, data] of Object.entries(trajectories.candidates)) {
      if (candidateName === 'Blank/Null') continue;

      data.trajectories.forEach((traj, idx) => {
        simulationPoints.push({
          draw: idx,
          candidate: candidateName,
          voteShare: traj[traj.length - 1], // Final day value
          color: data.color,
        });
      });
    }

    // Sample for performance if needed
    const sampleSize = Math.min(isMobile ? 100 : 200, simulationPoints.length);
    const sampledData = d3.shuffle(simulationPoints.slice()).slice(0, sampleSize);

    // Calculate medians for each candidate
    const candidateMedians = Array.from(
      d3.rollup(simulationPoints, v => d3.median(v, d => d.voteShare), d => d.candidate),
      ([candidate, medianVote]) => ({ candidate, medianVote })
    );

    // Get unique candidates and their colors
    const candidateColors = new Map<string, string>();
    for (const [name, data] of Object.entries(trajectories.candidates)) {
      if (name !== 'Blank/Null') {
        candidateColors.set(name, data.color);
      }
    }
    const candidateNames = Array.from(candidateColors.keys());

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
          label: "Vote share (%)",
          domain: [0.15, 0.85],
          tickFormat: (d: number) => `${(d * 100).toFixed(0)}%`,
          grid: true,
          ticks: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
        },
        fy: {
          domain: candidateNames,
          label: null,
          axis: "left",
          padding: 0.2
        },
        color: {
          domain: candidateNames,
          range: candidateNames.map(name => candidateColors.get(name) || '#888')
        },
        marks: [
          // 50% majority line
          Plot.ruleX([0.5], {
            stroke: "#dc2626",
            strokeWidth: 2,
            strokeDasharray: "4,2",
            facet: "exclude"
          }),

          // Dodged dots
          Plot.dotX(sampledData, Plot.dodgeY({
            x: d => d.voteShare + (d.draw % 100 - 50) * 0.001,
            fy: "candidate",
            fill: "candidate",
            fillOpacity: isMobile ? 0.8 : 0.7,
            r: isMobile ? 3 : 2,
            stroke: "white",
            strokeWidth: isMobile ? 0.5 : 0.3,
            anchor: "middle"
          })),

          // Median lines
          Plot.ruleX(candidateMedians, {
            x: "medianVote",
            fy: "candidate",
            stroke: "black",
            strokeWidth: 2,
            strokeDasharray: "2,2"
          }),

          // Median labels
          Plot.text(candidateMedians, {
            x: "medianVote",
            fy: "candidate",
            text: d => `${((d.medianVote || 0) * 100).toFixed(1)}%`,
            dy: -10,
            dx: 5,
            fontSize: 11,
            fontWeight: "bold",
            fill: "black"
          }),

          // 50% label
          Plot.text([{ x: 0.5, fy: candidateNames[0] }], {
            x: "x",
            fy: "fy",
            text: translations.fiftyPercentLine,
            dx: 5,
            dy: -12,
            fontSize: 11,
            fill: "#dc2626",
            fontWeight: "600"
          })
        ]
      });
    } catch (plotError) {
      console.error('SecondRoundBeeswarm: Error creating Plot.plot():', plotError);
      return;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';

      try {
        containerRef.current.appendChild(plot);
      } catch (error) {
        console.error('SecondRoundBeeswarm: Error rendering plot:', error);
        containerRef.current.innerHTML = `
          <div style="padding: 20px; text-align: center; background: #fef2f2; border-radius: 8px;">
            <p style="margin: 0; color: #dc2626;">Error loading distribution chart</p>
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
  }, [isClient, trajectories, translations]);

  if (!trajectories || Object.keys(trajectories.candidates).length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500">
        <p>Loading simulation data...</p>
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="beeswarm">
      <div ref={containerRef} className="overflow-x-auto" />
      <div className="text-xs text-gray-500 mt-2">
        {translations.showingOutcomes}
      </div>
    </div>
  );
}
