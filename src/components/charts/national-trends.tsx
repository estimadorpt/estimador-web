'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';
import { partyColors, partyOrder } from '@/lib/config/colors';

interface TrendData {
  date: string;
  party: string;
  metric: string;
  value: number;
}

interface NationalTrendsProps {
  data: TrendData[];
  width?: number;
  height?: number;
}

export function NationalTrends({ data, width = 800, height = 400 }: NationalTrendsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    // Clear previous chart
    containerRef.current.innerHTML = '';

    // Process data
    const typedData = data.map(d => ({
      ...d,
      date: new Date(d.date),
      value: d.value * 100 // Convert to percentage
    })).filter(d => !isNaN(d.date.getTime()));

    // Separate mean and interval data
    const meanData = typedData.filter(d => d.metric === 'vote_share_mean');
    const intervalData = typedData.filter(d => d.metric !== 'vote_share_mean');

    // Group interval data by date and party for ribbons
    const groupedIntervals = d3.group(intervalData, d => `${d.date.toISOString()}|${d.party}`);
    
    const ribbonData = Array.from(groupedIntervals, ([key, values]) => {
      const [dateStr, party] = key.split('|');
      const date = new Date(dateStr);
      const low = values.find(v => v.metric.includes('low'))?.value || 0;
      const high = values.find(v => v.metric.includes('high'))?.value || 0;
      return { date, party, low, high };
    });

    // Filter to main parties for clarity
    const mainParties = partyOrder.slice(0, 6); // Top 6 parties
    const filteredMeanData = meanData.filter(d => mainParties.includes(d.party));
    const filteredRibbonData = ribbonData.filter(d => mainParties.includes(d.party));

    // Create the plot
    const plot = Plot.plot({
      width,
      height,
      marginLeft: 60,
      marginRight: 120,
      marginBottom: 40,
      marginTop: 20,
      x: {
        type: "time",
        label: "Date",
        nice: true
      },
      y: {
        label: "Vote Share (%)",
        domain: [0, Math.max(40, d3.max(meanData, d => d.value) || 30)],
        grid: true
      },
      color: {
        domain: mainParties,
        range: mainParties.map(party => partyColors[party as keyof typeof partyColors] || '#gray')
      },
      marks: [
        // Confidence intervals as ribbons
        Plot.areaY(filteredRibbonData, {
          x: "date",
          y1: "low", 
          y2: "high",
          fill: "party",
          fillOpacity: 0.2,
          stroke: "none"
        }),
        
        // Mean lines
        Plot.lineY(filteredMeanData, {
          x: "date",
          y: "value", 
          stroke: "party",
          strokeWidth: 2.5,
          curve: "catmull-rom"
        }),

        // Points for latest values
        Plot.dot(
          filteredMeanData.filter(d => {
            const latestDate = d3.max(filteredMeanData.filter(td => td.party === d.party), td => td.date);
            return d.date.getTime() === latestDate?.getTime();
          }),
          {
            x: "date",
            y: "value",
            fill: "party",
            r: 4,
            stroke: "white",
            strokeWidth: 2
          }
        ),

        // Party labels at the end
        Plot.text(
          filteredMeanData.filter(d => {
            const latestDate = d3.max(filteredMeanData.filter(td => td.party === d.party), td => td.date);
            return d.date.getTime() === latestDate?.getTime();
          }),
          {
            x: "date",
            y: "value",
            text: d => `${d.party} ${d.value.toFixed(1)}%`,
            dx: 10,
            fill: "party",
            fontSize: 12,
            fontWeight: "bold"
          }
        )
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
        Lines show polling averages with confidence intervals (shaded areas). 
        Data filtered from March 2024 onwards.
      </p>
    </div>
  );
}