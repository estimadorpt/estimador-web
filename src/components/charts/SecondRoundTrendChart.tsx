"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { SecondRoundTrendsData } from '@/types';

interface SecondRoundTrendChartProps {
  trends: SecondRoundTrendsData;
  height?: number;
  translations: {
    fiftyPercentLine: string;
  };
}

const MOBILE_BREAKPOINT = 768;

export function SecondRoundTrendChart({
  trends,
  height = 400,
  translations,
}: SecondRoundTrendChartProps) {
  const { dates, candidates } = trends;
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const hoveredCandidate = selectedCandidate;

  // Sort candidates by mean at last date (descending)
  const sortedCandidates = useMemo(() => {
    const entries = Object.entries(candidates);
    entries.sort((a, b) => {
      const aMean = a[1].mean[a[1].mean.length - 1];
      const bMean = b[1].mean[b[1].mean.length - 1];
      return bMean - aMean;
    });
    return entries;
  }, [candidates]);

  // Chart configuration
  const chartConfig = useMemo(() => {
    const parsedDates = dates.map(d => new Date(d));
    const minDate = parsedDates[0];
    const maxDate = parsedDates[parsedDates.length - 1];
    const dateRange = maxDate.getTime() - minDate.getTime();

    const margin = {
      top: 30,
      right: isMobile ? 20 : 150,
      bottom: isMobile ? 40 : 50,
      left: isMobile ? 45 : 55
    };
    const width = 800;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Y-axis from 0 to 80% (fixed for second round)
    const yMax = 0.80;

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
    };
  }, [dates, height, isMobile]);

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

    const numPoints = dates.length;

    sortedCandidates.forEach(([name, data]) => {
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
  }, [sortedCandidates, chartConfig, dates.length]);

  // Calculate non-overlapping label positions
  const labelPositions = useMemo(() => {
    const minSpacing = 36;
    const positions: { name: string; y: number; originalY: number }[] = [];

    const candidatesList = sortedCandidates.map(([name]) => ({
      name,
      y: candidatePaths[name].lastY,
    })).sort((a, b) => a.y - b.y);

    candidatesList.forEach((candidate) => {
      let targetY = candidate.y;

      for (let i = 0; i < positions.length; i++) {
        const prevPos = positions[i];
        if (Math.abs(targetY - prevPos.y) < minSpacing) {
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
  }, [sortedCandidates, candidatePaths]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let v = 0; v <= chartConfig.yMax; v += 0.10) {
      ticks.push(v);
    }
    return ticks;
  }, [chartConfig.yMax]);

  // X-axis ticks (every 3 days for short period)
  const xTicks = useMemo(() => {
    const ticks: Date[] = [];
    const start = new Date(chartConfig.minDate);
    while (start <= chartConfig.maxDate) {
      ticks.push(new Date(start));
      start.setDate(start.getDate() + 4);
    }
    return ticks;
  }, [chartConfig.minDate, chartConfig.maxDate]);

  // 50% line position
  const fiftyPercentY = chartConfig.yScale(0.5);

  // Last data point x position
  const lastDataX = chartConfig.xScale(chartConfig.parsedDates[chartConfig.parsedDates.length - 1]);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
        className="w-full h-auto"
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

        {/* 50% threshold line - prominent */}
        <line
          x1={chartConfig.margin.left}
          y1={fiftyPercentY}
          x2={chartConfig.width - chartConfig.margin.right}
          y2={fiftyPercentY}
          stroke="#dc2626"
          strokeWidth={2}
          strokeDasharray="6,3"
        />
        <text
          x={chartConfig.margin.left + 5}
          y={fiftyPercentY - 8}
          className="text-xs fill-red-600 font-semibold"
        >
          {translations.fiftyPercentLine}
        </text>

        {/* Y-axis labels */}
        {yTicks.map(tick => (
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

        {/* Confidence bands and mean lines for each candidate */}
        {sortedCandidates.map(([name]) => {
          const { ci95Path, ci50Path, meanPath, color } = candidatePaths[name];
          const isHovered = hoveredCandidate === name;
          const isOtherHovered = hoveredCandidate !== null && !isHovered;
          const isBlankNull = name === 'Blank/Null';

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
                strokeDasharray={isBlankNull ? '4,3' : undefined}
              />
            </g>
          );
        })}

        {/* End labels with connector lines - desktop only */}
        {!isMobile && labelPositions.map((pos) => {
          const { color, lastMean } = candidatePaths[pos.name];
          const isHovered = hoveredCandidate === pos.name;
          const isOtherHovered = hoveredCandidate !== null && !isHovered;

          return (
            <g
              key={`label-${pos.name}`}
              style={{ transition: 'opacity 0.2s ease' }}
              opacity={isOtherHovered ? 0.3 : 1}
            >
              <line
                x1={lastDataX}
                y1={pos.originalY}
                x2={chartConfig.width - chartConfig.margin.right + 5}
                y2={pos.y}
                stroke={color}
                strokeWidth={1}
                opacity={0.4}
              />
              <g
                transform={`translate(${chartConfig.width - chartConfig.margin.right + 8}, ${pos.y})`}
                onMouseEnter={() => setSelectedCandidate(pos.name)}
                onMouseLeave={() => setSelectedCandidate(null)}
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
                  {pos.name.length > 15 ? pos.name.substring(0, 15) + '...' : pos.name}
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

      {/* Mobile: Interactive candidate legend */}
      {isMobile && (
        <div className="grid grid-cols-2 gap-2 mt-4 px-1">
          {sortedCandidates.map(([name, data]) => {
            const lastMean = data.mean[data.mean.length - 1];
            const isSelected = selectedCandidate === name;
            const isOtherSelected = selectedCandidate !== null && !isSelected;

            return (
              <button
                key={name}
                onClick={() => setSelectedCandidate(isSelected ? null : name)}
                className={`
                  flex items-center gap-2 p-2 rounded-lg text-left transition-all
                  ${isSelected
                    ? 'bg-gray-100 ring-2 ring-gray-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                  }
                  ${isOtherSelected ? 'opacity-40' : 'opacity-100'}
                `}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: data.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-700 truncate">
                    {name}
                  </div>
                  <div
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: data.color }}
                  >
                    {(lastMean * 100).toFixed(1)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 md:gap-4 mt-4 justify-center text-[10px] md:text-xs text-gray-500">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-4 md:w-6 h-0.5 bg-gray-400 rounded" />
          <span>Mean estimate</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-4 md:w-6 h-2 md:h-3 bg-gray-400/30 rounded" />
          <span>50% CI</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-4 md:w-6 h-2 md:h-3 bg-gray-400/15 rounded" />
          <span>90% CI</span>
        </div>
      </div>
    </div>
  );
}
