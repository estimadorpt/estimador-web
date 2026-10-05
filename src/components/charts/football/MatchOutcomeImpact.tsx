"use client";

import { useState } from "react";
import { teamDisplayName } from "@/lib/config/football";
import { readableTextOn } from "@/lib/utils/football-contrast";
import { relevantObjective, formatObjectiveLabel, type ClubObjective } from "@/lib/football-fixtures";
import type {
  DecisiveMatch,
  NextMatchdayScenarioMatch,
  TeamStanding,
} from "@/types/football";

type TeamProbs = { p_champion: number; p_top3: number; p_relegation: number };

interface MatchOutcomeImpactProps {
  home: string;
  away: string;
  homeColor: string;
  awayColor: string;
  locale: string;
  /** Conditional block from md*_scenarios.json → next_matchday_scenarios.matches */
  scenario: NextMatchdayScenarioMatch | null;
  /** Season-wide baseline from next_matchday_scenarios.baseline */
  baseline: Record<string, TeamProbs> | null;
  /** Fallback when no conditionals exist for this fixture */
  homeStanding?: TeamStanding;
  awayStanding?: TeamStanding;
  decisive: DecisiveMatch | null;
}

function pctLabel(p: number): string {
  if (p >= 0.995) return ">99%";
  if (p > 0 && p < 0.005) return "<1%";
  return `${Math.round(p * 100)}%`;
}

function deltaLabel(delta: number, pt: boolean): string {
  const pp = delta * 100;
  const zero = pt ? "0,0" : "0.0";
  if (Math.abs(pp) < 0.05) return zero;
  const abs =
    Math.abs(pp) < 10 ? Math.abs(pp).toFixed(1) : Math.round(Math.abs(pp)).toString();
  return `${pp > 0 ? "+" : "−"}${pt ? abs.replace(".", ",") : abs}`;
}

/** Local mirror of football-fixtures.ts's clubStakes: that helper takes a
 * `SupportedFixture` + full `ScenarioData` wrapper, which this component
 * doesn't have (it only receives one match's conditional block plus the
 * season baseline). Same orientation rule: "win" is the club's own result,
 * whichever side of the fixture it plays on. */
function stakesFor(
  scenario: NextMatchdayScenarioMatch,
  baseline: Record<string, TeamProbs>,
  team: string,
  home: string,
  objective: ClubObjective,
) {
  const isHome = team === home;
  const winOutcome: "H" | "A" = isHome ? "H" : "A";
  const lossOutcome: "H" | "A" = isHome ? "A" : "H";
  const base = baseline[team]?.[objective];
  const win = scenario.conditionals?.[winOutcome]?.teams?.[team]?.[objective];
  const draw = scenario.conditionals?.D?.teams?.[team]?.[objective];
  const loss = scenario.conditionals?.[lossOutcome]?.teams?.[team]?.[objective];
  if (
    typeof base !== "number" ||
    typeof win !== "number" ||
    typeof draw !== "number" ||
    typeof loss !== "number"
  ) {
    return null;
  }
  return { baseline: base, win, draw, loss };
}

export function MatchOutcomeImpact({
  home,
  away,
  homeColor,
  awayColor,
  locale,
  scenario,
  baseline,
  homeStanding,
  awayStanding,
  decisive,
}: MatchOutcomeImpactProps) {
  const pt = locale !== "en";
  const [chosen, setChosen] = useState<"home" | "away">("home");
  const chosenTeam = chosen === "home" ? home : away;
  const otherTeam = chosen === "home" ? away : home;
  const chosenColor = chosen === "home" ? homeColor : awayColor;
  const otherColor = chosen === "home" ? awayColor : homeColor;

  const L = {
    title: pt ? `O que muda para ${teamDisplayName(chosenTeam)}?` : `What changes for ${teamDisplayName(chosenTeam)}?`,
    switchLabel: pt ? "Ver as contas de" : "Show the stakes for",
    withData: (objective: ClubObjective) =>
      pt
        ? `Probabilidade de ${formatObjectiveLabel(objective, "pt")}, agora e em cada um dos três resultados possíveis, na mesma escala.`
        : `Probability of ${formatObjectiveLabel(objective, "en")}, now and under each of the three possible results, on the same scale.`,
    noData: pt
      ? "Os cenários por resultado só são publicados para a jornada em curso. Para já, o retrato é a projeção de época de cada equipa."
      : "Per-outcome scenarios are only published for the matchday in progress. For now, here is each team's season projection.",
    champion: pt ? "Título" : "Title",
    top3: pt ? "Top 3" : "Top 3",
    relegation: pt ? "Descida" : "Relegation",
    baselineNow: pt ? "Agora" : "Now",
    win: (team: string) => (pt ? `Se ${teamDisplayName(team)} vencer` : `If ${teamDisplayName(team)} win`),
    draw: pt ? "Se empatar" : "If they draw",
    loss: (team: string) => (pt ? `Se ${teamDisplayName(team)} perder` : `If ${teamDisplayName(team)} lose`),
    comparison: (team: string, label: string, value: string) =>
      pt
        ? `Para comparação: ${teamDisplayName(team)} tem agora ${value} de ${label}.`
        : `For comparison: ${teamDisplayName(team)} currently has ${value} of ${label}.`,
    unit: "pp",
    noMaterial: pt
      ? "Nenhum objetivo deste clube muda de forma material com este jogo."
      : "No objective for this club changes materially with this match.",
    expectedPts: pt ? "Pontos esperados" : "Expected points",
    swing: pt ? "Oscilação no título" : "Title swing",
    swingWho: pt ? "equipa mais afetada" : "most affected team",
  };

  const hasConditionals = !!scenario?.conditionals && !!baseline;
  const objective: ClubObjective | null = hasConditionals
    ? (relevantObjective(baseline![chosenTeam]) ?? "p_top3")
    : null;
  const stakes =
    hasConditionals && objective ? stakesFor(scenario!, baseline!, chosenTeam, home, objective) : null;
  const otherObjective: ClubObjective | null = hasConditionals
    ? (relevantObjective(baseline![otherTeam]) ?? "p_top3")
    : null;
  const otherBaseline =
    hasConditionals && otherObjective ? baseline![otherTeam]?.[otherObjective] : undefined;

  const objectiveLabel: Record<ClubObjective, string> = {
    p_champion: L.champion,
    p_top3: L.top3,
    p_relegation: L.relegation,
  };

  if (hasConditionals && objective && stakes) {
    const rows: { key: "baseline" | "win" | "draw" | "loss"; label: string; value: number; color: string }[] = [
      { key: "baseline", label: L.baselineNow, value: stakes.baseline, color: "#9aa397" },
      { key: "win", label: L.win(chosenTeam), value: stakes.win, color: chosenColor },
      { key: "draw", label: L.draw, value: stakes.draw, color: "#7f9284" },
      { key: "loss", label: L.loss(chosenTeam), value: stakes.loss, color: otherColor },
    ];
    const maxValue = Math.max(0.05, ...rows.map(r => r.value));

    return (
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
          <h2 className="text-2xl tracking-tight">{L.title}</h2>
          <div className="inline-flex border border-stone-200 rounded-lg overflow-hidden text-xs font-bold" role="group" aria-label={L.switchLabel}>
            {(["home", "away"] as const).map(side => {
              const team = side === "home" ? home : away;
              const active = chosen === side;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => setChosen(side)}
                  aria-pressed={active}
                  className="px-3 py-1.5 transition-colors"
                  style={{
                    backgroundColor: active ? (side === "home" ? homeColor : awayColor) : "transparent",
                    color: active ? readableTextOn(side === "home" ? homeColor : awayColor) : "#5f6a5f",
                  }}
                >
                  {teamDisplayName(team)}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-sm text-stone-500 mb-6">{L.withData(objective)}</p>

        {/* One common labelled scale: baseline stays visible as its own row,
            not just a hover tick — so it survives on phones (diagnosis §5/9). */}
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.key} className="flex items-center gap-3">
              <div className="w-40 sm:w-52 shrink-0 text-xs text-stone-600">{row.label}</div>
              <div className="min-w-0 flex-1 h-6 bg-stone-100 rounded-sm relative overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{ width: `${(row.value / maxValue) * 100}%`, backgroundColor: row.color }}
                />
                {row.key !== "baseline" && (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 w-[2px] bg-stone-900"
                    style={{ left: `${(stakes.baseline / maxValue) * 100}%` }}
                  />
                )}
              </div>
              <div className="w-32 shrink-0 text-right">
                <span className="text-sm font-bold tabular-nums text-stone-900">{pctLabel(row.value)}</span>
                {row.key !== "baseline" && (
                  <span className="ml-1.5 text-[11px] tabular-nums text-stone-500">
                    ({deltaLabel(row.value - stakes.baseline, pt)} {L.unit})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-3">
          {pt
            ? "A linha vertical marca a probabilidade atual (agora); as barras mostram cada resultado, na mesma escala. Isto não é a probabilidade de o jogo terminar assim — ver a secção de probabilidades do jogo acima."
            : "The vertical line marks the current probability (now); the bars show each result, on the same scale. This is not the chance the match ends that way — see the match-probabilities section above."}
        </p>
        {otherObjective && typeof otherBaseline === "number" && (
          <p className="text-xs text-stone-500 mt-2">
            {L.comparison(otherTeam, objectiveLabel[otherObjective], pctLabel(otherBaseline))}
          </p>
        )}
      </div>
    );
  }

  // ---- Fallback: no per-outcome conditionals published for this fixture ----
  const metrics: { key: keyof TeamProbs; label: string }[] = [
    { key: "p_champion", label: L.champion },
    { key: "p_top3", label: L.top3 },
    { key: "p_relegation", label: L.relegation },
  ];
  const cards = [
    { name: home, color: homeColor, standing: homeStanding },
    { name: away, color: awayColor, standing: awayStanding },
  ].filter(c => !!c.standing);

  return (
    <div>
      <h2 className="text-2xl tracking-tight mb-1">
        {pt ? "O que está em jogo" : "What is at stake"}
      </h2>
      <p className="text-sm text-stone-500 mb-6">{L.noData}</p>

      {cards.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(c => (
            <div key={c.name} className="border border-stone-200 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="inline-block w-1 h-4" style={{ backgroundColor: c.color }} />
                <span className="text-sm font-bold text-stone-800">
                  {teamDisplayName(c.name)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {metrics.map(m => (
                  <div key={m.key}>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                      {m.label}
                    </div>
                    <div className="text-2xl font-display font-extrabold tabular-nums text-stone-900">
                      {pctLabel(c.standing![m.key])}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
                {L.expectedPts}:{" "}
                <strong className="text-stone-800">
                  {Math.round(c.standing!.mean_pts)} ± {Math.round(c.standing!.std_pts)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {decisive && (
        <div className="mt-4 border-l-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {L.swing}: <strong>{Math.round(decisive.title_swing * 100)} {L.unit}</strong> (
          {L.swingWho}: {teamDisplayName(decisive.most_affected_team)})
        </div>
      )}
    </div>
  );
}
