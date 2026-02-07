"use client";

import React, { useMemo } from 'react';
import { PresidentialRunoffPairsData } from '@/types';

interface PresidentialRunoffMatrixProps {
  data: PresidentialRunoffPairsData;
  translations?: {
    title: string;
    probability: string;
  };
}

// Color scale from light to dark (probability 0 to max)
function getHeatmapColor(value: number, maxValue: number): string {
  if (value === 0) return '#f5f5f5';
  
  const intensity = value / maxValue;
  // Interpolate from light purple to dark purple
  const r = Math.round(139 + (99 - 139) * intensity);
  const g = Math.round(92 + (50 - 92) * intensity);
  const b = Math.round(246 + (180 - 246) * intensity);
  
  return `rgb(${r}, ${g}, ${b})`;
}

export function PresidentialRunoffMatrix({
  data,
  translations = {
    title: 'Runoff Probability Matrix',
    probability: 'probability',
  },
}: PresidentialRunoffMatrixProps) {
  const { matrix } = data;
  const { candidates, colors, probabilities } = matrix;

  // Find max probability for color scaling
  const maxProb = useMemo(() => {
    let max = 0;
    for (const row of probabilities) {
      for (const val of row) {
        if (val > max) max = val;
      }
    }
    return max;
  }, [probabilities]);

  const formatPercent = (value: number) => {
    if (value === 0) return '';
    const pct = value * 100;
    if (pct > 99) return '>99';
    if (pct < 1) return '<1';
    return pct.toFixed(0);
  };

  if (candidates.length === 0) {
    return <div className="text-gray-500 text-center py-8">No matrix data available</div>;
  }

  const cellSize = 56;
  const labelWidth = 100;
  const headerHeight = 80;
  const svgWidth = labelWidth + candidates.length * cellSize;
  const svgHeight = headerHeight + candidates.length * cellSize;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ minWidth: '350px', maxWidth: '500px' }}>
        {/* Column headers (rotated) */}
        {candidates.map((candidate, idx) => (
          <g key={`header-${idx}`} transform={`translate(${labelWidth + idx * cellSize + cellSize / 2}, ${headerHeight - 5})`}>
            <g transform="rotate(-45)">
              <text
                textAnchor="start"
                dominantBaseline="middle"
                className="text-[10px] fill-gray-700 font-medium"
              >
                {candidate.length > 12 ? candidate.substring(0, 12) + '…' : candidate}
              </text>
            </g>
            {/* Color indicator dot */}
            <circle
              cx={0}
              cy={8}
              r={3}
              fill={colors[idx]}
            />
          </g>
        ))}

        {/* Row labels and cells */}
        {candidates.map((rowCandidate, rowIdx) => (
          <g key={`row-${rowIdx}`} transform={`translate(0, ${headerHeight + rowIdx * cellSize})`}>
            {/* Row label */}
            <g transform={`translate(${labelWidth - 8}, ${cellSize / 2})`}>
              <text
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[10px] fill-gray-700 font-medium"
              >
                {rowCandidate.length > 12 ? rowCandidate.substring(0, 12) + '…' : rowCandidate}
              </text>
              <circle
                cx={5}
                cy={0}
                r={3}
                fill={colors[rowIdx]}
              />
            </g>

            {/* Cells */}
            {candidates.map((colCandidate, colIdx) => {
              const value = probabilities[rowIdx][colIdx];
              const bgColor = getHeatmapColor(value, maxProb);
              const textColor = value > maxProb * 0.5 ? 'white' : '#374151';

              return (
                <g key={`cell-${rowIdx}-${colIdx}`} transform={`translate(${labelWidth + colIdx * cellSize}, 0)`}>
                  <rect
                    x={1}
                    y={1}
                    width={cellSize - 2}
                    height={cellSize - 2}
                    fill={bgColor}
                    rx={4}
                    className={rowIdx === colIdx ? 'opacity-30' : ''}
                  />
                  {rowIdx !== colIdx && value > 0 && (
                    <text
                      x={cellSize / 2}
                      y={cellSize / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={textColor}
                      className="text-xs font-bold tabular-nums"
                    >
                      {formatPercent(value)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}

        {/* Color scale legend */}
        <g transform={`translate(${labelWidth}, ${svgHeight - 20})`}>
          <defs>
            <linearGradient id="heatmapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f5f5f5" />
              <stop offset="100%" stopColor={getHeatmapColor(maxProb, maxProb)} />
            </linearGradient>
          </defs>
          <rect
            x={0}
            y={0}
            width={100}
            height={8}
            fill="url(#heatmapGradient)"
            rx={2}
          />
          <text x={0} y={-3} className="text-[9px] fill-gray-400">0%</text>
          <text x={100} y={-3} textAnchor="end" className="text-[9px] fill-gray-400">
            {(maxProb * 100).toFixed(0)}%
          </text>
        </g>
      </svg>
    </div>
  );
}


