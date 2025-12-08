"use client";

import React, { useMemo } from 'react';
import { PresidentialHeadToHeadData } from '@/types';

interface PresidentialHeadToHeadProps {
  data: PresidentialHeadToHeadData;
  cutoffDate?: string;
  height?: number;
  translations?: {
    title: string;
    description: string;
    probability: string;
  };
}

export function PresidentialHeadToHead({
  data,
  cutoffDate,
  height = 280,
  translations = {
    title: 'Head-to-Head Probability',
    description: 'Probability of leading on election day',
    probability: 'leads',
  },
}: PresidentialHeadToHeadProps) {
  const { dates, probability_a_leads, candidate_a, candidate_b, color_a, color_b } = data;

  // Filter dates and probabilities up to cutoff date
  const { filteredDates, filteredProbs } = useMemo(() => {
    if (!cutoffDate) {
      return { filteredDates: dates, filteredProbs: probability_a_leads };
    }
    const cutoff = new Date(cutoffDate);
    const idx = dates.findIndex(d => new Date(d) > cutoff);
    const finalIdx = idx === -1 ? dates.length : idx;
    return { 
      filteredDates: dates.slice(0, finalIdx), 
      filteredProbs: probability_a_leads.slice(0, finalIdx) 
    };
  }, [dates, probability_a_leads, cutoffDate]);

  // Chart configuration
  const chartConfig = useMemo(() => {
    if (filteredDates.length === 0) return null;

    const parsedDates = filteredDates.map(d => new Date(d));
    const minDate = parsedDates[0];
    const lastDataDate = parsedDates[parsedDates.length - 1];
    
    // Add 3 days padding for visual breathing room
    const maxDate = new Date(lastDataDate);
    maxDate.setDate(maxDate.getDate() + 3);
    
    const dateRange = maxDate.getTime() - minDate.getTime();

    const margin = { top: 30, right: 140, bottom: 40, left: 50 };
    const width = 800;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = (date: Date) => {
      return margin.left + ((date.getTime() - minDate.getTime()) / dateRange) * innerWidth;
    };

    const yScale = (value: number) => {
      return margin.top + (1 - value) * innerHeight;
    };

    return {
      parsedDates,
      minDate,
      maxDate,
      lastDataDate,
      margin,
      width,
      height,
      innerWidth,
      innerHeight,
      xScale,
      yScale,
    };
  }, [filteredDates, height]);

  // Generate path and fill areas
  const pathData = useMemo(() => {
    if (!chartConfig || filteredProbs.length === 0) return null;

    const { parsedDates, xScale, yScale, margin, innerWidth, innerHeight } = chartConfig;
    
    // Main line path
    let linePath = '';
    filteredProbs.forEach((prob, idx) => {
      const x = xScale(parsedDates[idx]);
      const y = yScale(prob);
      linePath += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    // Fill path for area above 50% (candidate A leads)
    let fillPathA = `M ${margin.left} ${yScale(0.5)}`;
    filteredProbs.forEach((prob, idx) => {
      const x = xScale(parsedDates[idx]);
      const y = yScale(Math.max(prob, 0.5));
      fillPathA += ` L ${x} ${y}`;
    });
    fillPathA += ` L ${margin.left + innerWidth} ${yScale(0.5)} Z`;

    // Fill path for area below 50% (candidate B leads)
    let fillPathB = `M ${margin.left} ${yScale(0.5)}`;
    filteredProbs.forEach((prob, idx) => {
      const x = xScale(parsedDates[idx]);
      const y = yScale(Math.min(prob, 0.5));
      fillPathB += ` L ${x} ${y}`;
    });
    fillPathB += ` L ${margin.left + innerWidth} ${yScale(0.5)} Z`;

    // Current probability (last value)
    const currentProb = filteredProbs[filteredProbs.length - 1];
    const currentX = xScale(parsedDates[parsedDates.length - 1]);
    const currentY = yScale(currentProb);

    return { linePath, fillPathA, fillPathB, currentProb, currentX, currentY };
  }, [chartConfig, filteredProbs]);

  // X-axis ticks (every 2 weeks)
  const xTicks = useMemo(() => {
    if (!chartConfig) return [];
    const ticks: Date[] = [];
    const start = new Date(chartConfig.minDate);
    // Start from nearest Sunday
    start.setDate(start.getDate() + (7 - start.getDay()) % 7);
    
    while (start <= chartConfig.maxDate) {
      ticks.push(new Date(start));
      start.setDate(start.getDate() + 14);
    }
    return ticks;
  }, [chartConfig]);

  if (!chartConfig || !pathData) {
    return <div className="text-gray-500 text-center py-8">No head-to-head data available</div>;
  }

  const currentLeader = pathData.currentProb >= 0.5 ? candidate_a : candidate_b;
  const currentProbPct = pathData.currentProb >= 0.5 
    ? (pathData.currentProb * 100).toFixed(0)
    : ((1 - pathData.currentProb) * 100).toFixed(0);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
        className="w-full"
        style={{ minWidth: '500px' }}
      >
        {/* Fill areas */}
        <path
          d={pathData.fillPathA}
          fill={color_a}
          opacity={0.2}
        />
        <path
          d={pathData.fillPathB}
          fill={color_b}
          opacity={0.2}
        />

        {/* 50% reference line */}
        <line
          x1={chartConfig.margin.left}
          y1={chartConfig.yScale(0.5)}
          x2={chartConfig.width - chartConfig.margin.right}
          y2={chartConfig.yScale(0.5)}
          stroke="#9ca3af"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <text
          x={chartConfig.margin.left - 8}
          y={chartConfig.yScale(0.5)}
          textAnchor="end"
          dominantBaseline="middle"
          className="text-xs fill-gray-500"
        >
          50%
        </text>

        {/* Y-axis labels */}
        {[0.25, 0.75].map(tick => (
          <text
            key={tick}
            x={chartConfig.margin.left - 8}
            y={chartConfig.yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-xs fill-gray-400"
          >
            {(tick * 100).toFixed(0)}%
          </text>
        ))}

        {/* X-axis ticks */}
        {xTicks.map(date => (
          <g key={date.toISOString()}>
            <line
              x1={chartConfig.xScale(date)}
              y1={chartConfig.height - chartConfig.margin.bottom}
              x2={chartConfig.xScale(date)}
              y2={chartConfig.height - chartConfig.margin.bottom + 5}
              stroke="#9ca3af"
              strokeWidth={1}
            />
            <text
              x={chartConfig.xScale(date)}
              y={chartConfig.height - chartConfig.margin.bottom + 18}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          </g>
        ))}

        {/* Last data marker */}
        <line
          x1={chartConfig.xScale(chartConfig.lastDataDate)}
          y1={chartConfig.margin.top}
          x2={chartConfig.xScale(chartConfig.lastDataDate)}
          y2={chartConfig.height - chartConfig.margin.bottom}
          stroke="#d1d5db"
          strokeWidth={1}
          strokeDasharray="2,2"
        />

        {/* Main probability line */}
        <path
          d={pathData.linePath}
          fill="none"
          stroke="#374151"
          strokeWidth={2.5}
        />

        {/* Current value indicator */}
        <circle
          cx={pathData.currentX}
          cy={pathData.currentY}
          r={6}
          fill={pathData.currentProb >= 0.5 ? color_a : color_b}
          stroke="white"
          strokeWidth={2}
        />

        {/* Legend */}
        <g transform={`translate(${chartConfig.width - chartConfig.margin.right + 15}, ${chartConfig.margin.top + 10})`}>
          {/* Candidate A */}
          <g>
            <rect x={0} y={0} width={12} height={12} rx={2} fill={color_a} />
            <text x={18} y={10} className="text-xs fill-gray-700 font-medium">
              {candidate_a}
            </text>
            <text x={18} y={24} className="text-[10px] fill-gray-500">
              {translations.probability}
            </text>
          </g>
          
          {/* Candidate B */}
          <g transform="translate(0, 45)">
            <rect x={0} y={0} width={12} height={12} rx={2} fill={color_b} />
            <text x={18} y={10} className="text-xs fill-gray-700 font-medium">
              {candidate_b}
            </text>
            <text x={18} y={24} className="text-[10px] fill-gray-500">
              {translations.probability}
            </text>
          </g>

          {/* Current probability */}
          <g transform="translate(0, 100)">
            <text className="text-xs fill-gray-500 font-medium">Currently:</text>
            <text y={18} className="text-sm font-bold" fill={pathData.currentProb >= 0.5 ? color_a : color_b}>
              {currentLeader}
            </text>
            <text y={34} className="text-lg font-black tabular-nums" fill={pathData.currentProb >= 0.5 ? color_a : color_b}>
              {currentProbPct}%
            </text>
          </g>
        </g>

        {/* Axis labels */}
        <text
          x={chartConfig.margin.left + chartConfig.innerWidth / 2}
          y={chartConfig.height - 5}
          textAnchor="middle"
          className="text-xs fill-gray-500"
        >
          Date
        </text>
      </svg>
    </div>
  );
}

