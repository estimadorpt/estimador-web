"use client";

import { useState, useMemo } from "react";
import { teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import type { CriticalPathMatch } from "@/types/football";
import { RotateCcw, Check } from "lucide-react";
import {
  expectedPoints as expectedPointsOf,
  pickedPoints,
  runningProbabilities,
  type PathOutcome,
} from "@/lib/football-path-builder";
import { describePp, formatInteger, formatPercent, formatPp } from "@/lib/football-format";

interface PathBuilderProps {
  matches: CriticalPathMatch[];
  pCurrent: number;
  target: "champion" | "survival";
  locale: string;
  /** Simulated seasons behind the conditionals (prediction.n_sims). */
  nSims: number;
  labels: {
    matchdayAbbr: string;
    win: string;
    draw: string;
    loss: string;
    home: string;
    away: string;
    resetAll: string;
    pointsFromPicks: string;
    expectedPoints: string;
    yourScenario: string;
    championship: string;
    survival: string;
  };
}

const OUTCOMES: PathOutcome[] = ["W", "D", "L"];
/** Games shown before "Mostrar todos" (audit PUB2-08: 27 rows ran to 2,700px on a phone). */
const FIRST_GAMES = 6;

/**
 * "Cria o teu cenário": fix the result of any of the club's remaining games
 * and read its title (or survival) chance after each pick. The maths lives
 * in football-path-builder.ts: one pick gives the exact conditional from the
 * simulations, several are combined as if independent given the target.
 *
 * The running answer is said once, in a summary that stays in view (sticky
 * at the foot of the screen on phones, beside the list on wide screens), with
 * "Repor" next to it. Unpicked rows keep full contrast (audit A11Y2-01: an
 * opacity fade put them at 2,5–3,1:1); a picked row is marked by a rule and
 * a tint, and only picked rows carry a figure (UXD2-16).
 */
export function PathBuilder({ matches, pCurrent, target, locale, nSims, labels }: PathBuilderProps) {
  const pt = locale !== "en";
  const [selections, setSelections] = useState<Record<number, PathOutcome>>({});
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => [...matches].sort((a, b) => a.matchday - b.matchday), [matches]);
  const running = useMemo(() => runningProbabilities(pCurrent, sorted, selections), [pCurrent, sorted, selections]);
  const nPicked = Object.keys(selections).length;
  const hasSelections = nPicked > 0;
  const finalProb = running.length ? running[running.length - 1] : pCurrent;
  const targetLabel = target === "champion" ? labels.championship : labels.survival;

  const outcomeWord = (o: PathOutcome) => (o === "W" ? labels.win : o === "D" ? labels.draw : labels.loss);
  const outcomeShort = (o: PathOutcome) => outcomeWord(o).charAt(0);
  const venueWord = (venue: "H" | "A") => (venue === "H" ? (pt ? "em casa" : "at home") : (pt ? "fora" : "away"));

  function toggle(index: number, outcome: PathOutcome) {
    setSelections(prev => {
      const next = { ...prev };
      if (next[index] === outcome) delete next[index];
      else next[index] = outcome;
      return next;
    });
  }

  const hidden = sorted.length - FIRST_GAMES;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,48rem)_18rem] lg:items-start lg:gap-8">
      <div className="min-w-0">
        <p className="mb-4 max-w-3xl text-xs leading-relaxed text-stone-500">
          {pt
            ? `Com uma escolha, o número é a probabilidade condicional tirada das ${formatInteger(nSims, locale)} simulações. Com várias, as escolhas combinam-se como se fossem independentes entre si, uma aproximação: o ficheiro publicado não guarda a combinação de vários resultados.`
            : `With one pick, the number is the conditional probability read from the ${formatInteger(nSims, locale)} simulations. With several, the picks are combined as if independent of one another, an approximation: the published file does not hold combinations of results.`}
        </p>

        {/* Column heads, wide screens only (on phones each row names its own parts). */}
        <div aria-hidden="true" className="hidden grid-cols-[2.5rem_minmax(0,1fr)_auto_6.5rem] items-end gap-3 border-b border-stone-200 pb-1 text-[11px] font-bold uppercase tracking-wider text-stone-500 sm:grid">
          <span className="text-center">{labels.matchdayAbbr}</span>
          <span>{pt ? "Adversário" : "Opponent"}</span>
          <span className="w-[9.5rem] text-center">{pt ? "Resultado" : "Result"}</span>
          <span className="text-right">{pt ? `${targetLabel}, se escolheres` : `${targetLabel}, if picked`}</span>
        </div>

        <ol className="divide-y divide-line">
          {sorted.map((m, i) => {
            const sel = selections[i];
            if (!showAll && i >= FIRST_GAMES && !sel) return null;
            const prob = running[i];
            const prev = i === 0 ? pCurrent : running[i - 1];
            const step = prob - prev;
            const opponent = teamDisplayName(m.opponent);
            const context = pt
              ? `frente ao ${opponent}, ${venueWord(m.venue)}, jornada ${m.matchday}`
              : `against ${opponent}, ${venueWord(m.venue)}, matchday ${m.matchday}`;
            const figure = sel ? (
              <>
                <span className="text-sm font-bold text-ink">{formatPercent(prob, locale)}</span>
                {Math.abs(step) >= 0.0005 && (
                  <span className={`ml-1 text-[11px] font-semibold sm:ml-0 ${step > 0 ? "text-emerald-700" : "text-red-700"}`}>
                    <span aria-hidden="true">{formatPp(step, locale)}</span>
                    <span className="sr-only">{describePp(step, locale)}</span>
                  </span>
                )}
              </>
            ) : null;
            return (
              <li
                key={`${m.matchday}-${m.opponent}`}
                className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 py-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_6.5rem] ${
                  sel ? "-ml-2 border-l-2 border-ink bg-cream pl-2" : ""
                }`}
              >
                <span className="text-center text-xs tabular-nums text-stone-600">
                  <span className="sr-only">{pt ? "Jornada " : "Matchday "}</span>{m.matchday}
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {teamLogoSrc(m.opponent) && <img src={teamLogoSrc(m.opponent)} alt="" width={16} height={16} loading="lazy" className="h-4 w-4 shrink-0 object-contain" />}
                    <span className="truncate text-sm font-medium text-ink">{opponent}</span>
                    <span className="shrink-0 text-[11px] text-stone-600">({m.venue === "H" ? labels.home : labels.away})</span>
                  </span>
                  {/* On a phone the figure sits under the opponent, so the
                      result buttons share the opponent's row. */}
                  {figure && <span className="mt-0.5 block tabular-nums sm:hidden">{figure}</span>}
                </span>
                <span
                  role="group"
                  aria-label={pt ? `Resultado ${context}` : `Result ${context}`}
                  className="inline-flex justify-self-end rounded-[10px] border border-line bg-paper p-1 sm:justify-self-start"
                >
                  {OUTCOMES.map(o => {
                    const active = sel === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={active}
                        aria-label={`${outcomeWord(o)} ${context}`}
                        onClick={() => toggle(i, o)}
                        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-[8px] px-2 text-sm font-semibold transition-colors duration-150 ${
                          active ? "bg-ink text-paper" : "text-stone-700 hover:bg-parchment hover:text-ink"
                        }`}
                      >
                        {active && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                        <span aria-hidden="true">{outcomeShort(o)}</span>
                      </button>
                    );
                  })}
                </span>
                <span className="hidden flex-col items-end tabular-nums sm:flex">{figure}</span>
              </li>
            );
          })}
        </ol>

        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            aria-expanded={showAll}
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4"
          >
            {showAll
              ? pt ? `Mostrar só os próximos ${FIRST_GAMES} jogos` : `Show only the next ${FIRST_GAMES} games`
              : pt ? `Mostrar os ${sorted.length} jogos que faltam` : `Show all ${sorted.length} remaining games`}
          </button>
        )}
      </div>

      {/* The running answer, once, always in view while the builder is. */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-line bg-paper px-4 py-3 lg:top-24 lg:bottom-auto lg:mx-0 lg:mt-0 lg:rounded-2xl lg:border lg:bg-cream lg:p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div aria-live="polite">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              {hasSelections ? `${labels.yourScenario} · ${targetLabel}` : `${targetLabel} · ${pt ? "agora" : "now"}`}
            </p>
            <p className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatPercent(hasSelections ? finalProb : pCurrent, locale)}</span>
              {hasSelections && (
                <span className={`text-sm font-bold ${finalProb >= pCurrent ? "text-emerald-700" : "text-red-700"}`}>
                  <span aria-hidden="true">{formatPp(finalProb - pCurrent, locale)}</span>
                  <span className="sr-only">{describePp(finalProb - pCurrent, locale, pt ? "face a agora" : "from now")}</span>
                </span>
              )}
            </p>
            <p className="text-xs text-stone-600">
              {hasSelections
                ? pt
                  ? `${formatInteger(pickedPoints(selections), locale)} ${labels.pointsFromPicks} (${nPicked}/${sorted.length}) · ${labels.expectedPoints}: ${formatInteger(expectedPointsOf(sorted.filter((_, i) => selections[i])), locale)}`
                  : `${formatInteger(pickedPoints(selections), locale)} ${labels.pointsFromPicks} (${nPicked}/${sorted.length}) · ${labels.expectedPoints}: ${formatInteger(expectedPointsOf(sorted.filter((_, i) => selections[i])), locale)}`
                : pt
                  ? "Escolhe V, E ou D num jogo para ver o que muda."
                  : "Pick W, D or L in a game to see what changes."}
            </p>
          </div>
          {hasSelections && (
            <button
              type="button"
              onClick={() => setSelections({})}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line bg-cream px-3 text-sm font-semibold text-ink hover:bg-parchment"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              {labels.resetAll}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
