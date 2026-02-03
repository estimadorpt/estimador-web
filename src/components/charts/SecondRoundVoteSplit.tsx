"use client";

import React from 'react';
import { SecondRoundValidVotesData } from '@/types';

interface SecondRoundVoteSplitProps {
  validVotes: SecondRoundValidVotesData;
  translations: {
    validVotesNote: string;
  };
}

export function SecondRoundVoteSplit({ validVotes, translations }: SecondRoundVoteSplitProps) {
  // Get the two candidates (should be exactly 2)
  const candidates = validVotes.candidates;

  if (candidates.length < 2) {
    return null;
  }

  const [candidateA, candidateB] = candidates;
  const totalMean = candidateA.mean + candidateB.mean;
  const percentA = (candidateA.mean / totalMean) * 100;
  const percentB = (candidateB.mean / totalMean) * 100;

  return (
    <div className="w-full" data-testid="vote-split">
      {/* Labels above bar */}
      <div className="flex justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: candidateA.color }}
          />
          <span className="text-sm font-medium text-stone-700">
            {candidateA.name}
          </span>
          <span className="text-lg font-bold" style={{ color: candidateA.color }}>
            {percentA.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: candidateB.color }}>
            {percentB.toFixed(1)}%
          </span>
          <span className="text-sm font-medium text-stone-700">
            {candidateB.name}
          </span>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: candidateB.color }}
          />
        </div>
      </div>

      {/* Horizontal stacked bar */}
      <div className="relative">
        <div className="flex h-10 rounded-lg overflow-hidden shadow-inner">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${percentA}%`,
              backgroundColor: candidateA.color,
            }}
          />
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${percentB}%`,
              backgroundColor: candidateB.color,
            }}
          />
        </div>

        {/* 50% marker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full flex flex-col items-center">
          <div className="h-full w-0.5 bg-white opacity-80" />
        </div>
      </div>

      {/* 50% label */}
      <div className="flex justify-center mt-1">
        <span className="text-xs text-stone-500">50%</span>
      </div>

      {/* Note */}
      <div className="text-xs text-stone-400 text-center mt-2">
        {translations.validVotesNote}
      </div>
    </div>
  );
}
