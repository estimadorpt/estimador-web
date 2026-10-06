"use client";

import { useState } from "react";
import { describePp, formatInteger, formatPercent, formatPp } from "@/lib/football-format";
import { teamColorOnPaper, teamDisplayName } from "@/lib/config/football";
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
  // Every bar is the chosen club's: "Se o Sp. Braga perder" is drawn in
  // Braga's colour, not Sporting's (audit UXD-17). Contrast-checked for paper.
  const chosenColor = teamColorOnPaper(chosenTeam) || (chosen === "home" ? homeColor : awayColor);

  const L = {
    title: pt ? `O que muda para o ${teamDisplayName(chosenTeam)}?` : `What changes for ${teamDisplayName(chosenTeam)}?`,
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
    relegation: pt ? "Despromoção" : "Relegation",
    baselineNow: pt ? "Agora" : "Now",
    win: (team: string) => (pt ? `Se o ${teamDisplayName(team)} vencer` : `If ${teamDisplayName(team)} win`),
    draw: pt ? "Se empatar" : "If they draw",
    loss: (team: string) => (pt ? `Se o ${teamDisplayName(team)} perder` : `If ${teamDisplayName(team)} lose`),
    comparison: (team: string, label: string, value: string) =>
      pt
        ? `Para comparação: o ${teamDisplayName(team)} tem agora ${value} de ${label}.`
        : `For comparison: ${teamDisplayName(team)} currently has ${value} of ${label}.`,
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
  // The comparison uses the same measure as the bars above: Sporting's
  // relegation risk is no comparison for Braga's top-three chances.
  const otherBaseline =
    hasConditionals && objective ? baseline![otherTeam]?.[objective] : undefined;

  const objectiveLabel: Record<ClubObjective, string> = {
    p_champion: L.champion,
    p_top3: L.top3,
    p_relegation: L.relegation,
  };

  if (hasConditionals && objective && stakes) {
    const rows: { key: "baseline" | "win" | "draw" | "loss"; label: string; value: number; color: string }[] = [
      { key: "baseline", label: L.baselineNow, value: stakes.baseline, color: "#8b9a8e" },
      { key: "win", label: L.win(chosenTeam), value: stakes.win, color: chosenColor },
      { key: "draw", label: L.draw, value: stakes.draw, color: chosenColor },
      { key: "loss", label: L.loss(chosenTeam), value: stakes.loss, color: chosenColor },
    ];
    const maxValue = Math.max(0.05, ...rows.map(r => r.value));

    return (
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
          <h2 className="text-2xl tracking-tight">{L.title}</h2>
          <div className="inline-flex rounded-[10px] border border-line bg-paper p-1 text-sm font-semibold" role="group" aria-label={L.switchLabel}>
            {(["home", "away"] as const).map(side => {
              const team = side === "home" ? home : away;
              const active = chosen === side;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => setChosen(side)}
                  aria-pressed={active}
                  className={`min-h-11 px-3 transition-colors duration-150 ${active ? "bg-ink text-paper" : "text-stone-600 hover:bg-parchment"}`}
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
            <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:flex sm:gap-3">
              <div className="col-span-2 text-xs text-stone-600 sm:w-52 sm:shrink-0">{row.label}</div>
              <div aria-hidden="true" className="min-w-0 flex-1 h-6 bg-stone-100 rounded-sm relative overflow-hidden">
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
              <div className="shrink-0 text-right sm:w-36">
                <span className="text-sm font-bold tabular-nums text-stone-900">{formatPercent(row.value, locale)}</span>
                {row.key !== "baseline" && (
                  <span className="ml-1.5 text-[11px] tabular-nums text-stone-500">
                    <span aria-hidden="true">({formatPp(row.value - stakes.baseline, locale)})</span>
                    <span className="sr-only">, {describePp(row.value - stakes.baseline, locale, pt ? "face a agora" : "from now")}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-500 mt-3">
          {pt
            ? "A linha vertical marca a probabilidade atual (agora); as barras mostram cada resultado, na mesma escala. Isto não é a probabilidade de o jogo terminar assim — ver a secção de probabilidades do jogo acima."
            : "The vertical line marks the current probability (now); the bars show each result, on the same scale. This is not the chance the match ends that way — see the match-probabilities section above."}
        </p>
        {typeof otherBaseline === "number" && (
          <p className="text-xs text-stone-500 mt-2">
            {L.comparison(otherTeam, objectiveLabel[objective].toLowerCase(), formatPercent(otherBaseline, locale))}
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
            <div key={c.name} className="rounded-2xl border border-line bg-cream p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span aria-hidden="true" className="inline-block w-1 h-4" style={{ backgroundColor: teamColorOnPaper(c.name) || c.color }} />
                <span className="text-sm font-bold text-stone-800">
                  {teamDisplayName(c.name)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {metrics.map(m => (
                  <div key={m.key}>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">
                      {m.label}
                    </div>
                    <div className="text-xl sm:text-2xl font-display font-extrabold tabular-nums text-stone-900">
                      {formatPercent(c.standing![m.key], locale)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
                {L.expectedPts}:{" "}
                <strong className="text-stone-800">{formatInteger(c.standing!.mean_pts, locale)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {decisive && (
        <div className="mt-4 rounded-lg border-l-2 border-line bg-parchment px-3 py-2 text-xs text-stone-700">
          {L.swing}: <strong>{Math.round(decisive.title_swing * 100)} pp</strong> (
          {L.swingWho}: {teamDisplayName(decisive.most_affected_team)})
        </div>
      )}
    </div>
  );
}
