"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { PresidentialTrendsData, PresidentialPollsData } from '@/types';

interface PresidentialTrendChartProps {
  trends: PresidentialTrendsData;
  polls?: PresidentialPollsData;
  electionDate: string;
  cutoffDate?: string;
  height?: number;
  showPolls?: boolean;
  maxCandidates?: number;
}

export function PresidentialTrendChart({
  trends,
  polls,
  electionDate,
  cutoffDate,
  height = 400,
  showPolls = true,
  maxCandidates = 5,
}: PresidentialTrendChartProps) {
  const { dates, candidates } = trends;
  const [hoveredCandidate, setHoveredCandidate] = useState<string | null>(null);

  // Filter dates up to cutoff date + a few days padding
  const { filteredDates, cutoffIndex, displayMaxDate } = useMemo(() => {
    if (!cutoffDate) {
      return { 
        filteredDates: dates, 
        cutoffIndex: dates.length,
        displayMaxDate: new Date(dates[dates.length - 1])
      };
    }
    const cutoff = new Date(cutoffDate);
    const idx = dates.findIndex(d => new Date(d) > cutoff);
    const finalIdx = idx === -1 ? dates.length : idx;
    
    // Add 5 days padding for visual breathing room
    const lastDataDate = new Date(dates[finalIdx - 1]);
    const paddedDate = new Date(lastDataDate);
    paddedDate.setDate(paddedDate.getDate() + 5);
    
    return { 
      filteredDates: dates.slice(0, finalIdx), 
      cutoffIndex: finalIdx,
      displayMaxDate: paddedDate
    };
  }, [dates, cutoffDate]);

  // Get top candidates by mean at cutoff date
  const topCandidates = useMemo(() => {
    const candidateEntries = Object.entries(candidates);
    candidateEntries.sort((a, b) => {
      const aIdx = Math.min(cutoffIndex - 1, a[1].mean.length - 1);
      const bIdx = Math.min(cutoffIndex - 1, b[1].mean.length - 1);
      const aMean = a[1].mean[aIdx];
      const bMean = b[1].mean[bIdx];
      return bMean - aMean;
    });
    return candidateEntries.slice(0, maxCandidates);
  }, [candidates, maxCandidates, cutoffIndex]);

  // Chart configuration
  const chartConfig = useMemo(() => {
    const parsedDates = filteredDates.map(d => new Date(d));
    const minDate = parsedDates[0];
    const maxDate = displayMaxDate;
    const dateRange = maxDate.getTime() - minDate.getTime();

    const margin = { top: 30, right: 150, bottom: 50, left: 55 };
    const width = 800;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Find max value for y scale
    let maxVal = 0;
    topCandidates.forEach(([, data]) => {
      const max95 = Math.max(...data.ci_95.slice(0, cutoffIndex));
      if (max95 > maxVal) maxVal = max95;
    });
    const yMax = Math.min(0.45, Math.ceil(maxVal * 20) / 20 + 0.05);

    const xScale = (date: Date) => {
      return margin.left + ((date.getTime() - minDate.getTime()) / dateRange) * innerWidth;
    };

    const yScale = (value: number) => {
      return margin.top + (1 - value / yMax) * innerHeight;
    };

    return {
      parsedDates,
      minDate,
      maxDate,
      margin,
      width,
      height,
      innerWidth,
      innerHeight,
      yMax,
      xScale,
      yScale,
      cutoffIndex,
    };
  }, [filteredDates, displayMaxDate, height, topCandidates, cutoffIndex]);

  // Generate paths for each candidate
  const candidatePaths = useMemo(() => {
    const result: Record<string, {
      meanPath: string;
      ci50Path: string;
      ci95Path: string;
      color: string;
      lastMean: number;
      lastY: number;
    }> = {};

    const numPoints = chartConfig.cutoffIndex;

    topCandidates.forEach(([name, data]) => {
      let meanPath = '';
      for (let idx = 0; idx < numPoints; idx++) {
        const x = chartConfig.xScale(chartConfig.parsedDates[idx]);
        const y = chartConfig.yScale(data.mean[idx]);
        meanPath += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }

      let ci50Path = '';
      for (let i = 0; i < numPoints; i++) {
        const x = chartConfig.xScale(chartConfig.parsedDates[i]);
        const y = chartConfig.yScale(data.ci_75[i]);
        ci50Path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
      for (let i = numPoints - 1; i >= 0; i--) {
        const x = chartConfig.xScale(chartConfig.parsedDates[i]);
        const y = chartConfig.yScale(data.ci_25[i]);
        ci50Path += ` L ${x} ${y}`;
      }
      ci50Path += ' Z';

      let ci95Path = '';
      for (let i = 0; i < numPoints; i++) {
        const x = chartConfig.xScale(chartConfig.parsedDates[i]);
        const y = chartConfig.yScale(data.ci_95[i]);
        ci95Path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
      for (let i = numPoints - 1; i >= 0; i--) {
        const x = chartConfig.xScale(chartConfig.parsedDates[i]);
        const y = chartConfig.yScale(data.ci_05[i]);
        ci95Path += ` L ${x} ${y}`;
      }
      ci95Path += ' Z';

      const lastMean = data.mean[numPoints - 1];
      const lastY = chartConfig.yScale(lastMean);

      result[name] = { meanPath, ci50Path, ci95Path, color: data.color, lastMean, lastY };
    });

    return result;
  }, [topCandidates, chartConfig]);

  // Calculate non-overlapping label positions
  const labelPositions = useMemo(() => {
    const minSpacing = 36; // Minimum pixels between labels (each label is ~30px tall)
    const positions: { name: string; y: number; originalY: number }[] = [];
    
    // Get all candidates with their y positions, sorted by y (top to bottom)
    const candidates = topCandidates.map(([name]) => ({
      name,
      y: candidatePaths[name].lastY,
    })).sort((a, b) => a.y - b.y);

    // Push labels apart if they overlap
    candidates.forEach((candidate, idx) => {
      let targetY = candidate.y;
      
      // Check against all previously placed labels
      for (let i = 0; i < positions.length; i++) {
        const prevPos = positions[i];
        if (Math.abs(targetY - prevPos.y) < minSpacing) {
          // Push this label down
          targetY = prevPos.y + minSpacing;
        }
      }
      
      positions.push({ 
        name: candidate.name, 
        y: targetY, 
        originalY: candidate.y 
      });
    });

    return positions;
  }, [topCandidates, candidatePaths]);

  // Parse poll data for scatter points
  const pollPoints = useMemo(() => {
    if (!polls || !showPolls) return [];

    const points: { x: number; y: number; color: string; candidate: string; value: number; pollster: string; date: Date }[] = [];
    const minTime = chartConfig.minDate.getTime();
    const lastDataDate = chartConfig.parsedDates[chartConfig.cutoffIndex - 1];
    const maxTime = lastDataDate.getTime();

    polls.polls.forEach(poll => {
      const pollDate = new Date(poll.date);
      if (pollDate.getTime() < minTime || pollDate.getTime() > maxTime) return;

      const x = chartConfig.xScale(pollDate);

      topCandidates.forEach(([candidateName, candidateData]) => {
        const value = poll[candidateName];
        if (typeof value === 'number') {
          points.push({
            x,
            y: chartConfig.yScale(value),
            color: candidateData.color,
            candidate: candidateName,
            value,
            pollster: poll.pollster,
            date: pollDate,
          });
        }
      });
    });

    return points;
  }, [polls, showPolls, topCandidates, chartConfig]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let v = 0; v <= chartConfig.yMax; v += 0.05) {
      ticks.push(v);
    }
    return ticks;
  }, [chartConfig.yMax]);

  // X-axis ticks (every 2 weeks)
  const xTicks = useMemo(() => {
    const ticks: Date[] = [];
    const start = new Date(chartConfig.minDate);
    start.setDate(start.getDate() + (7 - start.getDay()) % 7);
    
    while (start <= chartConfig.maxDate) {
      ticks.push(new Date(start));
      start.setDate(start.getDate() + 14);
    }
    return ticks;
  }, [chartConfig.minDate, chartConfig.maxDate]);

  // Today line position
  const [todayX, setTodayX] = useState<number | null>(null);
  useEffect(() => {
    const today = new Date();
    const lastDataDate = chartConfig.parsedDates[chartConfig.cutoffIndex - 1];
    if (today >= chartConfig.minDate && today <= lastDataDate) {
      setTodayX(chartConfig.xScale(today));
    } else {
      setTodayX(null);
    }
  }, [chartConfig]);

  // Last data point x position
  const lastDataX = chartConfig.xScale(chartConfig.parsedDates[chartConfig.cutoffIndex - 1]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
        className="w-full"
        style={{ minWidth: '600px' }}
      >
        {/* Background grid */}
        {yTicks.map(tick => (
          <line
            key={tick}
            x1={chartConfig.margin.left}
            y1={chartConfig.yScale(tick)}
            x2={chartConfig.width - chartConfig.margin.right}
            y2={chartConfig.yScale(tick)}
            stroke="#f0f0f0"
            strokeWidth={1}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.filter((_, i) => i % 2 === 0).map(tick => (
          <text
            key={tick}
            x={chartConfig.margin.left - 10}
            y={chartConfig.yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-xs fill-gray-500"
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
              y={chartConfig.height - chartConfig.margin.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          </g>
        ))}

        {/* Today line */}
        {todayX && (
          <g>
            <line
              x1={todayX}
              y1={chartConfig.margin.top}
              x2={todayX}
              y2={chartConfig.height - chartConfig.margin.bottom}
              stroke="#6b7280"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <text
              x={todayX}
              y={chartConfig.height - chartConfig.margin.bottom + 35}
              textAnchor="middle"
              className="text-[10px] fill-gray-500 font-medium"
            >
              Today
            </text>
          </g>
        )}

        {/* Last data marker */}
        <g>
          <line
            x1={lastDataX}
            y1={chartConfig.margin.top}
            x2={lastDataX}
            y2={chartConfig.height - chartConfig.margin.bottom}
            stroke="#d1d5db"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <text
            x={lastDataX}
            y={chartConfig.margin.top - 8}
            textAnchor="middle"
            className="text-[10px] fill-gray-400"
          >
            Last poll
          </text>
        </g>

        {/* Confidence bands and mean lines for each candidate */}
        {topCandidates.map(([name]) => {
          const { ci95Path, ci50Path, meanPath, color } = candidatePaths[name];
          const isHovered = hoveredCandidate === name;
          const isOtherHovered = hoveredCandidate !== null && !isHovered;

          return (
            <g
              key={name}
              style={{ transition: 'opacity 0.2s ease' }}
              opacity={isOtherHovered ? 0.15 : 1}
            >
              <path
                d={ci95Path}
                fill={color}
                opacity={isHovered ? 0.15 : 0.08}
              />
              <path
                d={ci50Path}
                fill={color}
                opacity={isHovered ? 0.3 : 0.15}
              />
              <path
                d={meanPath}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? 3 : 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
              r={isHovered ? 5 : 4}
              fill={point.color}
              opacity={isOtherHovered ? 0.1 : 0.7}
              stroke="white"
              strokeWidth={1.5}
              style={{ transition: 'opacity 0.2s ease' }}
            />
          );
        })}

        {/* End labels with connector lines */}
        {labelPositions.map((pos) => {
          const { color, lastMean } = candidatePaths[pos.name];
          const isHovered = hoveredCandidate === pos.name;
          const isOtherHovered = hoveredCandidate !== null && !isHovered;
          
          return (
            <g
              key={`label-${pos.name}`}
              style={{ transition: 'opacity 0.2s ease' }}
              opacity={isOtherHovered ? 0.3 : 1}
            >
              {/* Connector line from data point to label */}
              <line
                x1={lastDataX}
                y1={pos.originalY}
                x2={chartConfig.width - chartConfig.margin.right + 5}
                y2={pos.y}
                stroke={color}
                strokeWidth={1}
                opacity={0.4}
              />
              {/* Label group */}
              <g
                transform={`translate(${chartConfig.width - chartConfig.margin.right + 8}, ${pos.y})`}
                onMouseEnter={() => setHoveredCandidate(pos.name)}
                onMouseLeave={() => setHoveredCandidate(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={0} cy={0} r={4} fill={color} />
                <text
                  x={10}
                  y={-5}
                  className="text-[11px]"
                  fill={isHovered ? '#111827' : '#4b5563'}
                  fontWeight={isHovered ? 600 : 500}
                >
                  {pos.name.length > 15 ? pos.name.substring(0, 15) + '…' : pos.name}
                </text>
                <text
                  x={10}
                  y={9}
                  className="text-xs tabular-nums"
                  fill={color}
                  fontWeight={600}
                >
                  {(lastMean * 100).toFixed(1)}%
                </text>
              </g>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={chartConfig.margin.left + chartConfig.innerWidth / 2}
          y={chartConfig.height - 5}
          textAnchor="middle"
          className="text-xs fill-gray-500"
        >
          Date
        </text>
        <text
          x={15}
          y={chartConfig.margin.top + chartConfig.innerHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${chartConfig.margin.top + chartConfig.innerHeight / 2})`}
          className="text-xs fill-gray-500"
        >
          Estimated Support
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-gray-400 rounded" />
          <span>Mean estimate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-3 bg-gray-400/30 rounded" />
          <span>50% CI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-3 bg-gray-400/15 rounded" />
          <span>95% CI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span>Poll result</span>
        </div>
      </div>
    </div>
  );
}
