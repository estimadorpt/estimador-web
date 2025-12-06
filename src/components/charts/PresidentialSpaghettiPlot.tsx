"use client";

import React, { useMemo, useState } from 'react';
import {
  PresidentialTrajectoriesData,
  PresidentialPollsData,
} from '@/types';

interface PresidentialSpaghettiPlotProps {
  trajectories: PresidentialTrajectoriesData;
  polls?: PresidentialPollsData;
  electionDate: string;
  height?: number;
  showPolls?: boolean;
  maxTrajectories?: number;
}

export function PresidentialSpaghettiPlot({
  trajectories,
  polls,
  electionDate,
  height = 450,
  showPolls = true,
  maxTrajectories = 50,
}: PresidentialSpaghettiPlotProps) {
  const { dates, candidates } = trajectories;
  const [hoveredCandidate, setHoveredCandidate] = useState<string | null>(null);

  // Parse dates and calculate chart dimensions
  const chartConfig = useMemo(() => {
    const parsedDates = dates.map(d => new Date(d));
    const electionDateParsed = new Date(electionDate);
    const minDate = parsedDates[0];
    const maxDate = electionDateParsed;
    const dateRange = maxDate.getTime() - minDate.getTime();

    // Chart margins
    const margin = { top: 20, right: 120, bottom: 40, left: 50 };
    const width = 800;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Scale functions
    const xScale = (date: Date) => {
      return margin.left + ((date.getTime() - minDate.getTime()) / dateRange) * innerWidth;
    };

    const yScale = (value: number) => {
      // Values are 0-1, display as 0-50%
      return margin.top + (1 - value / 0.5) * innerHeight;
    };

    return {
      parsedDates,
      electionDateParsed,
      minDate,
      maxDate,
      margin,
      width,
      height,
      innerWidth,
      innerHeight,
      xScale,
      yScale,
    };
  }, [dates, electionDate, height]);

  // Generate path data for trajectories
  const candidatePaths = useMemo(() => {
    const result: Record<string, { paths: string[]; color: string }> = {};
    
    Object.entries(candidates).forEach(([name, data]) => {
      const paths: string[] = [];
      const numToShow = Math.min(maxTrajectories, data.trajectories.length);
      
      // Randomly sample trajectories (using fixed seed for consistency)
      const step = Math.max(1, Math.floor(data.trajectories.length / numToShow));
      
      for (let i = 0; i < data.trajectories.length && paths.length < numToShow; i += step) {
        const trajectory = data.trajectories[i];
        let pathD = '';
        
        trajectory.forEach((value, idx) => {
          const x = chartConfig.xScale(chartConfig.parsedDates[idx]);
          const y = chartConfig.yScale(value);
          pathD += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        });
        
        paths.push(pathD);
      }
      
      result[name] = { paths, color: data.color };
    });
    
    return result;
  }, [candidates, chartConfig, maxTrajectories]);

  // Parse poll data for scatter points
  const pollPoints = useMemo(() => {
    if (!polls || !showPolls) return [];
    
    const points: { x: number; y: number; color: string; candidate: string; value: number; pollster: string }[] = [];
    
    polls.polls.forEach(poll => {
      const pollDate = new Date(poll.date);
      const x = chartConfig.xScale(pollDate);
      
      Object.entries(candidates).forEach(([candidateName, candidateData]) => {
        const value = poll[candidateName];
        if (typeof value === 'number') {
          points.push({
            x,
            y: chartConfig.yScale(value),
            color: candidateData.color,
            candidate: candidateName,
            value,
            pollster: poll.pollster,
          });
        }
      });
    });
    
    return points;
  }, [polls, showPolls, candidates, chartConfig]);

  // Y-axis ticks
  const yTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5];

  // X-axis ticks (monthly)
  const xTicks = useMemo(() => {
    const ticks: Date[] = [];
    const start = new Date(chartConfig.minDate);
    start.setDate(1);
    start.setMonth(start.getMonth() + 1);
    
    while (start <= chartConfig.maxDate) {
      ticks.push(new Date(start));
      start.setMonth(start.getMonth() + 1);
    }
    
    return ticks;
  }, [chartConfig.minDate, chartConfig.maxDate]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
        className="w-full"
        style={{ minWidth: '600px' }}
      >
        {/* Grid lines */}
        {yTicks.map(tick => (
          <g key={tick}>
            <line
              x1={chartConfig.margin.left}
              y1={chartConfig.yScale(tick)}
              x2={chartConfig.width - chartConfig.margin.right}
              y2={chartConfig.yScale(tick)}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text
              x={chartConfig.margin.left - 8}
              y={chartConfig.yScale(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-gray-500"
            >
              {(tick * 100).toFixed(0)}%
            </text>
          </g>
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
              {date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
            </text>
          </g>
        ))}

        {/* Election day line */}
        <line
          x1={chartConfig.xScale(chartConfig.electionDateParsed)}
          y1={chartConfig.margin.top}
          x2={chartConfig.xScale(chartConfig.electionDateParsed)}
          y2={chartConfig.height - chartConfig.margin.bottom}
          stroke="#000"
          strokeWidth={2}
          strokeDasharray="4,4"
        />
        <text
          x={chartConfig.xScale(chartConfig.electionDateParsed)}
          y={chartConfig.margin.top - 5}
          textAnchor="middle"
          className="text-xs fill-gray-700 font-medium"
        >
          Election Day
        </text>

        {/* 50% threshold line */}
        <line
          x1={chartConfig.margin.left}
          y1={chartConfig.yScale(0.5)}
          x2={chartConfig.width - chartConfig.margin.right}
          y2={chartConfig.yScale(0.5)}
          stroke="#ef4444"
          strokeWidth={1}
          strokeDasharray="2,2"
          opacity={0.5}
        />
        <text
          x={chartConfig.width - chartConfig.margin.right + 5}
          y={chartConfig.yScale(0.5)}
          dominantBaseline="middle"
          className="text-xs fill-red-500"
        >
          50%
        </text>

        {/* Trajectory paths with hover effects */}
        {Object.entries(candidatePaths).map(([candidateName, { paths, color }]) => {
          const isHovered = hoveredCandidate === candidateName;
          const isOtherHovered = hoveredCandidate !== null && !isHovered;
          
          return (
            <g 
              key={candidateName}
              style={{ transition: 'opacity 0.15s ease' }}
              opacity={isOtherHovered ? 0.08 : 1}
            >
              {paths.map((pathD, idx) => (
                <path
                  key={idx}
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHovered ? 1.5 : 1}
                  opacity={isHovered ? 0.35 : 0.15}
                />
              ))}
            </g>
          );
        })}

        {/* Poll points */}
        {pollPoints.map((point, idx) => {
          const isHovered = hoveredCandidate === point.candidate;
          const isOtherHovered = hoveredCandidate !== null && !isHovered;
          
          return (
            <circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r={3}
              fill={point.color}
              opacity={isOtherHovered ? 0.1 : 0.6}
              stroke="white"
              strokeWidth={1}
              style={{ transition: 'opacity 0.15s ease' }}
            />
          );
        })}

        {/* Clean Legend */}
        <g transform={`translate(${chartConfig.width - chartConfig.margin.right + 10}, ${chartConfig.margin.top + 20})`}>
          {Object.entries(candidates).slice(0, 5).map(([name, data], idx) => {
            const isHovered = hoveredCandidate === name;
            
            return (
              <g 
                key={name} 
                transform={`translate(0, ${idx * 22})`}
                onMouseEnter={() => setHoveredCandidate(name)}
                onMouseLeave={() => setHoveredCandidate(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={0}
                  y={-4}
                  width={10}
                  height={10}
                  fill={data.color}
                  rx={2}
                />
                <text
                  x={16}
                  y={2}
                  dominantBaseline="middle"
                  className="text-xs"
                  fill={isHovered ? '#111827' : '#6b7280'}
                  fontWeight={isHovered ? 500 : 400}
                >
                  {name.length > 12 ? name.substring(0, 12) + '…' : name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

