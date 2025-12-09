"use client";

import * as Plot from "@observablehq/plot";
import { useEffect, useRef, useState } from "react";
import { partyColors } from "@/lib/config/colors";

interface TrendData {
  date: string;
  party: string;
  metric: string;
  value: number;
}

interface PollingChartProps {
  data: TrendData[];
  voteShareLabel?: string;
}

const MOBILE_BREAKPOINT = 640;

export function PollingChart({ data, voteShareLabel = "Vote share (%)" }: PollingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [latestValues, setLatestValues] = useState<Array<{ party: string; value: number }>>([])

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    // Get actual container width for truly responsive sizing
    const containerWidth = containerRef.current.offsetWidth || 900;
    const mobile = containerWidth < MOBILE_BREAKPOINT;

    // Responsive dimensions
    const containerHeight = mobile ? 320 : 450;
    const marginLeft = mobile ? 45 : 60;
    const marginRight = mobile ? 16 : 120; // Minimal margin on mobile (no inline labels)
    const marginBottom = mobile ? 40 : 50;
    const fontSize = mobile ? "11px" : "12px";
    const xTicks = mobile ? 3 : 4;

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

    // Store latest values for legend
    setLatestValues(latestData.map(d => ({ party: d.party, value: d.value })));

    // Build marks array - conditionally include labels for desktop only
    const marks: Plot.Markish[] = [
      // Background grid
      Plot.gridY({ stroke: "#f3f4f6", strokeWidth: 1 }),
      Plot.gridX({ stroke: "#f3f4f6", strokeWidth: 1 }),

      // Lines for each party
      Plot.line(filteredData, {
        x: d => new Date(d.date),
        y: "value",
        stroke: "party",
        strokeWidth: mobile ? 2 : 2.5,
        curve: "catmull-rom"
      }),

      // Points for latest values
      Plot.dot(latestData, {
        x: d => new Date(d.date),
        y: "value",
        fill: "party",
        r: mobile ? 3 : 4,
        stroke: "white",
        strokeWidth: mobile ? 1.5 : 2
      })
    ];

    // Only add inline labels on desktop
    if (!mobile) {
      marks.push(
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
          dy: -3,
          fontSize: 10,
          fontWeight: "500",
          textAnchor: "start",
          padding: 4
        }))
      );
    }

    const plot = Plot.plot({
      width: containerWidth,
      height: containerHeight,
      marginLeft,
      marginRight,
      marginTop: 20,
      marginBottom,
      style: {
        backgroundColor: "transparent",
        fontSize,
        fontFamily: "Inter, system-ui, sans-serif"
      },
      x: {
        type: "time",
        label: null,
        tickFormat: mobile ? "%b '%y" : "%b %Y",
        grid: true,
        ticks: xTicks
      },
      y: {
        label: mobile ? null : voteShareLabel,
        domain: [0, 0.5],
        tickFormat: d => `${(d * 100).toFixed(0)}%`,
        grid: true
      },
      color: {
        type: "categorical",
        domain: Object.keys(partyColors),
        range: Object.values(partyColors)
      },
      marks
    });

    if (containerRef.current) {
      containerRef.current.replaceChildren(plot);
    }

    return () => plot.remove();
  }, [data, voteShareLabel]);

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
          const mobile = containerWidth < MOBILE_BREAKPOINT;

          // Responsive dimensions
          const containerHeight = mobile ? 320 : 450;
          const marginLeft = mobile ? 45 : 60;
          const marginRight = mobile ? 16 : 120;
          const marginBottom = mobile ? 40 : 50;
          const fontSize = mobile ? "11px" : "12px";
          const xTicks = mobile ? 3 : 4;

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

          // Update latest values for legend
          setLatestValues(latestData.map(d => ({ party: d.party, value: d.value })));

          // Build marks array
          const marks: Plot.Markish[] = [
            Plot.gridY({ stroke: "#f3f4f6", strokeWidth: 1 }),
            Plot.gridX({ stroke: "#f3f4f6", strokeWidth: 1 }),

            Plot.line(filteredData, {
              x: d => new Date(d.date),
              y: "value",
              stroke: "party",
              strokeWidth: mobile ? 2 : 2.5,
              curve: "catmull-rom"
            }),

            Plot.dot(latestData, {
              x: d => new Date(d.date),
              y: "value",
              fill: "party",
              r: mobile ? 3 : 4,
              stroke: "white",
              strokeWidth: mobile ? 1.5 : 2
            })
          ];

          // Only add inline labels on desktop
          if (!mobile) {
            marks.push(
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
            );
          }

          const plot = Plot.plot({
            width: containerWidth,
            height: containerHeight,
            marginLeft,
            marginRight,
            marginTop: 20,
            marginBottom,
            style: {
              backgroundColor: "transparent",
              fontSize,
              fontFamily: "Inter, system-ui, sans-serif"
            },
            x: {
              type: "time",
              label: null,
              tickFormat: mobile ? "%b '%y" : "%b %Y",
              grid: true,
              ticks: xTicks
            },
            y: {
              label: mobile ? null : voteShareLabel,
              domain: [0, 0.5],
              tickFormat: d => `${(d * 100).toFixed(0)}%`,
              grid: true
            },
            color: {
              type: "categorical",
              domain: Object.keys(partyColors),
              range: Object.values(partyColors)
            },
            marks
          });

          containerRef.current.replaceChildren(plot);
        }, 100);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [data, voteShareLabel]);

  return (
    <div className="w-full">
      <div ref={containerRef} />
      {/* Mobile legend - shown below chart on small screens */}
      {isMobile && latestValues.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 justify-center px-2">
          {latestValues.map(({ party, value }) => (
            <div key={party} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: partyColors[party as keyof typeof partyColors] || '#888' }}
              />
              <span className="font-medium">{party}</span>
              <span className="text-gray-600">{(value * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}