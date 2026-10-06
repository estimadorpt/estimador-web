import { formatElectionProbability } from '@/lib/election-display';
import type { RunoffSimulations } from '@/lib/election-aggregates';

interface SecondRoundScenariosProps {
  simulations: RunoffSimulations;
  locale: string;
  translations: {
    keyScenarios: string;
    scenarioCloseRace: string;
    scenarioVentura40: string;
    scenarioDescription: string;
  };
}

/**
 * Two questions about the runoff on its own terms, answered as the share of
 * all simulations (computed on the server, on valid-vote shares). A scenario
 * comparing Ventura's runoff share with AD's 2024 legislative result was
 * removed: it compared two different elections without a stated basis.
 */
export function SecondRoundScenarios({ simulations, locale, translations }: SecondRoundScenariosProps) {
  const scenarios = [
    { key: 'closeRace', label: translations.scenarioCloseRace, probability: simulations.closeRace },
    { key: 'runnerUp40', label: translations.scenarioVentura40, probability: simulations.runnerUpAbove40 },
  ];

  return (
    <div className="space-y-4" data-testid="scenarios">
      {/* A section of the page like its siblings, so the same level and size. */}
      <h2 className="text-2xl text-stone-900 tracking-tight">
        {translations.keyScenarios}
      </h2>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.key} className="bg-cream rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm text-stone-700">{scenario.label}</span>
              <span className="shrink-0 whitespace-nowrap text-sm font-bold text-stone-900 tabular-nums">
                {formatElectionProbability(scenario.probability, locale)}
              </span>
            </div>
            <div className="relative h-3 bg-parchment rounded-full overflow-hidden" aria-hidden="true">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-stone-500"
                style={{ width: `${Math.min(100, scenario.probability * 100)}%` }}
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
