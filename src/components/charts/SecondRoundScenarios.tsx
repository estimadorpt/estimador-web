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
    <div data-testid="scenarios">
      {/* A section of the page like its siblings, so the same level and size. */}
      <h2 className="text-2xl text-ink">
        {translations.keyScenarios}
      </h2>

      <ul className="mt-4 border-t border-ink">
        {scenarios.map((scenario) => (
          <li key={scenario.key} className="border-b border-grid py-3">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <span className="text-sm text-ink">{scenario.label}</span>
              <span className="shrink-0 whitespace-nowrap text-sm font-bold text-ink tabular-nums">
                {formatElectionProbability(scenario.probability, locale)}
              </span>
            </div>
            {/* An ink bar on a thin scale rule, no grey track. */}
            <div className="relative h-3 border-b border-scale" aria-hidden="true">
              <div
                className="absolute left-0 top-0 h-2 bg-ink"
                style={{ width: `${Math.min(100, scenario.probability * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-graphite">
        {translations.scenarioDescription}
      </p>
    </div>
  );
}
