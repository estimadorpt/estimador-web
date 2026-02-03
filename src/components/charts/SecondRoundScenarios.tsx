"use client";

import React, { useMemo } from 'react';
import { SecondRoundTrajectoriesData } from '@/types';

interface SecondRoundScenariosProps {
  trajectories: SecondRoundTrajectoriesData;
  translations: {
    keyScenarios: string;
    scenarioVenturaBeatsAD: string;
    scenarioCloseRace: string;
    scenarioVentura40: string;
    scenarioDescription: string;
  };
}

interface ScenarioResult {
  key: string;
  label: string;
  probability: number;
}

export function SecondRoundScenarios({
  trajectories,
  translations,
}: SecondRoundScenariosProps) {
  const scenarios = useMemo<ScenarioResult[]>(() => {
    const candidates = trajectories.candidates;

    // Find Seguro and Ventura data
    const seguroData = candidates['António José Seguro'];
    const venturaData = candidates['André Ventura'];

    if (!seguroData || !venturaData) {
      return [];
    }

    // Get final day values for each trajectory
    const seguroFinal = seguroData.trajectories.map(t => t[t.length - 1]);
    const venturaFinal = venturaData.trajectories.map(t => t[t.length - 1]);

    // Calculate valid vote shares (excluding blank/null)
    const validVotes = seguroFinal.map((s, i) => {
      const total = s + venturaFinal[i];
      return {
        seguro: s / total,
        ventura: venturaFinal[i] / total,
      };
    });

    const n = validVotes.length;

    // Scenario 1: Ventura surpasses AD's 2024 legislative result (32.7%)
    const adBenchmark = 0.327;
    const probVenturaBeatsAD = validVotes.filter(v => v.ventura > adBenchmark).length / n;

    // Scenario 2: Close race (margin within 10 points)
    const probCloseRace = validVotes.filter(v => Math.abs(v.seguro - v.ventura) < 0.10).length / n;

    // Scenario 3: Ventura exceeds 40%
    const probVentura40 = validVotes.filter(v => v.ventura > 0.40).length / n;

    return [
      {
        key: 'venturaBeatsAD',
        label: translations.scenarioVenturaBeatsAD,
        probability: probVenturaBeatsAD,
      },
      {
        key: 'closeRace',
        label: translations.scenarioCloseRace,
        probability: probCloseRace,
      },
      {
        key: 'ventura40',
        label: translations.scenarioVentura40,
        probability: probVentura40,
      },
    ];
  }, [trajectories, translations]);

  const formatPercent = (value: number) => {
    const pct = value * 100;
    if (pct < 1) return '<1%';
    if (pct > 99) return '>99%';
    return `${Math.round(pct)}%`;
  };

  if (scenarios.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="scenarios">
      <h3 className="text-lg font-bold text-stone-900">
        {translations.keyScenarios}
      </h3>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.key} className="bg-white rounded-lg border border-stone-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-stone-700">{scenario.label}</span>
              <span className="text-sm font-bold text-stone-900 tabular-nums">
                {formatPercent(scenario.probability)}
              </span>
            </div>
            <div className="relative h-3 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, scenario.probability * 100)}%`,
                  backgroundColor: scenario.probability > 0.5 ? '#dc2626' : '#6b7280',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-stone-500">
        {translations.scenarioDescription}
      </p>
    </div>
  );
}
