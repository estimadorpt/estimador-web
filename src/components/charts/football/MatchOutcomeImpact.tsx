"use client";

import { useState } from "react";
import { describePp, formatInteger, formatPercent, formatPp, formatShortDate } from "@/lib/football-format";
import { useClockReached } from "@/components/football/ClockSwitch";
import { matchPlayedAt } from "@/lib/football-status";
import { OUTCOME_TONES, teamColorOnPaper, teamDisplayName } from "@/lib/config/football";
import { Link } from "@/i18n/routing";
import { relevantObjective, formatObjectiveLabel, type ClubObjective } from "@/lib/football-fixtures";
import { impactStakes as stakesFor, initialImpactSide, type TeamProbs } from "@/lib/football-scenarios";
import type {
  DecisiveMatch,
  NextMatchdayScenarioMatch,
  TeamStanding,
} from "@/types/football";


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
  /** Confirmed kickoff (UTC ISO): after it, "agora" becomes "antes do jogo" (audit FRESH-01). */
  kickoff?: string | null;
  /** The forecast's timestamp, to date the figures once the game has started. */
  forecastTimestamp?: string | null;
  /** For a game of an earlier round: when the round the forecast waits for
   * is played, and its "agora" goes out of date before this kickoff (FR3-02). */
  staleAt?: string | null;
  /** That round, for "antes da jornada 8". */
  staleRound?: number | null;
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
  kickoff,
  forecastTimestamp,
  staleAt = null,
  staleRound = null,
}: MatchOutcomeImpactProps) {
  const pt = locale !== "en";
  const [chosen, setChosen] = useState<"home" | "away">(() => initialImpactSide(scenario, baseline, home, away));
  // After kickoff the "now" row is what the model gave before the game; for
  // a postponed game, already once the round the forecast waits for is
  // played (audit FR3-02).
  const started = useClockReached(kickoff);
  // Two hours on, the game has been played, not "started" (FR3-04).
  const finished = useClockReached(matchPlayedAt(kickoff));
  const staleReached = useClockReached(staleAt);
  const stale = staleReached && !started;
  const forecastDate = forecastTimestamp ? formatShortDate(forecastTimestamp, locale) : "";
  const chosenTeam = chosen === "home" ? home : away;
  const otherTeam = chosen === "home" ? away : home;
  // Bars by outcome, not by club: a red kit drew a good result as a "bad"
  // bar and Moreirense's loss row in its own green (audit UXD3-07). The
  // baseline is a pale neutral, the three results ink.
  const nowWord = stale
    ? pt ? `na previsão de ${forecastDate}${staleRound ? `, antes da jornada ${staleRound}` : ""}` : `in the ${forecastDate} forecast${staleRound ? `, before matchday ${staleRound}` : ""}`
    : started
      ? pt ? "antes do jogo" : "before the match"
      : pt ? "agora" : "now";

  const L = {
    title: pt ? `O que muda para o ${teamDisplayName(chosenTeam)}?` : `What changes for ${teamDisplayName(chosenTeam)}?`,
    switchLabel: pt ? "Ver as contas de" : "Show the stakes for",
    withData: (objective: ClubObjective) =>
      pt
        ? `Probabilidade de ${formatObjectiveLabel(objective, "pt")}, ${nowWord} e em cada um dos três resultados possíveis, na mesma escala.`
        : `Probability of ${formatObjectiveLabel(objective, "en")}, ${nowWord} and under each of the three possible results, on the same scale.`,
    noData: pt
      ? "Os cenários por resultado só são publicados para a jornada em curso. Para já, o retrato é a projeção de época de cada equipa."
      : "Per-outcome scenarios are only published for the matchday in progress. For now, here is each team's season projection.",
    champion: pt ? "Título" : "Title",
    top3: pt ? "Top 3" : "Top 3",
    relegation: pt ? "Despromoção" : "Relegation",
    baselineNow: started
      ? pt ? `Antes do jogo (previsão de ${forecastDate})` : `Before the match (forecast of ${forecastDate})`
      : stale
        ? pt ? `Na previsão de ${forecastDate}` : `In the ${forecastDate} forecast`
        : pt ? "Agora" : "Now",
    win: (team: string) => (pt ? `Se o ${teamDisplayName(team)} vencer` : `If ${teamDisplayName(team)} win`),
    draw: pt ? "Se empatar" : "If they draw",
    loss: (team: string) => (pt ? `Se o ${teamDisplayName(team)} perder` : `If ${teamDisplayName(team)} lose`),
    // "Sp. Braga's title chance is currently 0.2%", not "has 0.2% of title" (FA3-13).
    comparison: (team: string, label: string, value: string) =>
      pt
        ? started
          ? `Para comparação: o ${teamDisplayName(team)} tinha antes do jogo ${value} de ${label}.`
          : stale
            ? `Para comparação: o ${teamDisplayName(team)} tinha ${value} de ${label} ${nowWord}.`
            : `Para comparação: o ${teamDisplayName(team)} tem agora ${value} de ${label}.`
        : started
          ? `For comparison: ${teamDisplayName(team)}'s ${label} chance was ${value} before the match.`
          : stale
            ? `For comparison: ${teamDisplayName(team)}'s ${label} chance was ${value} ${nowWord}.`
            : `For comparison: ${teamDisplayName(team)}'s ${label} chance is currently ${value}.`,
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
      { key: "baseline", label: L.baselineNow, value: stakes.baseline, color: OUTCOME_TONES.away },
      { key: "win", label: L.win(chosenTeam), value: stakes.win, color: "var(--color-ink)" },
      { key: "draw", label: L.draw, value: stakes.draw, color: "var(--color-ink)" },
      { key: "loss", label: L.loss(chosenTeam), value: stakes.loss, color: "var(--color-ink)" },
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
            // Every row's value cell has the same fixed width, so all four
            // tracks are equally long and the bars share one scale on a phone
            // too (audit PUB2-02: "(+2,8 pp)" used to shorten only the
            // outcome tracks, drawing 22% longer than 25%).
            <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-x-3 gap-y-1 sm:flex sm:gap-3">
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
              <div className="w-[7.5rem] shrink-0 text-right sm:w-36">
                <span className="text-sm font-bold tabular-nums text-stone-900">{formatPercent(row.value, locale)}</span>
                {row.key !== "baseline" && (
                  <span className="ml-1.5 text-[11px] tabular-nums text-stone-500">
                    <span aria-hidden="true">({formatPp(row.value - stakes.baseline, locale)})</span>
                    <span className="sr-only">, {describePp(row.value - stakes.baseline, locale, started ? (pt ? "face a antes do jogo" : "from before the match") : stale ? (pt ? `face à previsão de ${forecastDate}` : `from the ${forecastDate} forecast`) : (pt ? "face a agora" : "from now"))}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-500 mt-3">
          {started
            ? pt
              ? `${finished ? "O jogo já foi disputado" : "O jogo já começou"}: a linha vertical marca a probabilidade antes do jogo, na previsão de ${forecastDate}; as barras mostram cada resultado, na mesma escala. Isto não é a probabilidade de o jogo terminar assim.`
              : `${finished ? "The match has been played" : "The match has started"}: the vertical line marks the probability before it, in the forecast of ${forecastDate}; the bars show each result, on the same scale. This is not the chance the match ends that way.`
            : stale
              ? pt
                ? `A linha vertical marca a probabilidade ${nowWord}; as barras mostram cada resultado, na mesma escala. Isto não é a probabilidade de o jogo terminar assim.`
                : `The vertical line marks the probability ${nowWord}; the bars show each result, on the same scale. This is not the chance the match ends that way.`
              : pt
                ? "A linha vertical marca a probabilidade atual (agora); as barras mostram cada resultado, na mesma escala. Isto não é a probabilidade de o jogo terminar assim — ver a secção de probabilidades do jogo acima."
                : "The vertical line marks the current probability (now); the bars show each result, on the same scale. This is not the chance the match ends that way — see the match-probabilities section above."}{" "}
          {/* The method behind these numbers, not the generic page (METH3-17). */}
          <Link
            href={pt ? "/desporto/liga/metodologia#jogos-decisivos" : "/desporto/liga/metodologia#decisive-matches"}
            locale={pt ? "pt" : "en"}
            className="font-semibold text-ink underline underline-offset-4"
          >
            {pt ? "Como se calcula" : "How it is computed"}
          </Link>
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
          {L.swing}: <strong>{formatPp(decisive.title_swing, locale).replace(/^\+/, "")}</strong> (
          {L.swingWho}: {teamDisplayName(decisive.most_affected_team)})
        </div>
      )}
    </div>
  );
}
