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

/**
 * "Cria o teu cenário": fix the result of any of the club's remaining games
 * and read its title (or survival) chance after each pick. The maths lives
 * in football-path-builder.ts: one pick gives the exact conditional from the
 * simulations, several are combined as if independent given the target.
 */
export function PathBuilder({ matches, pCurrent, target, locale, nSims, labels }: PathBuilderProps) {
  const pt = locale !== "en";
  const [selections, setSelections] = useState<Record<number, PathOutcome>>({});

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

  return (
    <div className="max-w-3xl">
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
        <span className="text-right">{targetLabel}</span>
      </div>

      <ol className="divide-y divide-line">
        {sorted.map((m, i) => {
          const sel = selections[i];
          const prob = running[i];
          const prev = i === 0 ? pCurrent : running[i - 1];
          const step = prob - prev;
          const opponent = teamDisplayName(m.opponent);
          const context = pt
            ? `frente ao ${opponent}, ${venueWord(m.venue)}, jornada ${m.matchday}`
            : `against ${opponent}, ${venueWord(m.venue)}, matchday ${m.matchday}`;
          return (
            <li
              key={`${m.matchday}-${m.opponent}`}
              className={`grid grid-cols-[2.5rem_minmax(0,1fr)_6.5rem] items-center gap-x-3 gap-y-2 py-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_6.5rem] ${!sel && hasSelections ? "opacity-60" : ""}`}
            >
              <span className="text-center text-xs tabular-nums text-stone-500">
                <span className="sr-only">{pt ? "Jornada " : "Matchday "}</span>{m.matchday}
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                {teamLogoSrc(m.opponent) && <img src={teamLogoSrc(m.opponent)} alt="" className="h-4 w-4 shrink-0 object-contain" />}
                <span className="truncate text-sm font-medium text-ink">{opponent}</span>
                <span className="shrink-0 text-[11px] text-stone-500">({m.venue === "H" ? labels.home : labels.away})</span>
              </span>
              <span
                role="group"
                aria-label={pt ? `Resultado ${context}` : `Result ${context}`}
                className="col-span-3 inline-flex justify-self-start rounded-[10px] border border-line bg-paper p-1 sm:col-span-1 sm:col-start-3 sm:row-start-1"
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
                        active ? "bg-ink text-paper" : "text-stone-600 hover:bg-parchment hover:text-ink"
                      }`}
                    >
                      {active && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                      <span aria-hidden="true">{outcomeShort(o)}</span>
                    </button>
                  );
                })}
              </span>
              <span className="col-start-3 row-start-1 flex flex-col items-end tabular-nums sm:col-start-4">
                <span className="text-sm font-bold text-ink">{formatPercent(prob, locale)}</span>
                {sel && Math.abs(step) >= 0.0005 && (
                  <span className={`text-[11px] font-semibold ${step > 0 ? "text-emerald-700" : "text-red-700"}`}>
                    <span aria-hidden="true">{formatPp(step, locale)}</span>
                    <span className="sr-only">{describePp(step, locale)}</span>
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {hasSelections && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-4">
          <p className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-600">
            <span>
              <strong className="text-ink">{formatInteger(pickedPoints(selections), locale)}</strong> {labels.pointsFromPicks} ({nPicked}/{sorted.length})
            </span>
            <span>
              {labels.expectedPoints}: <strong className="text-ink">{formatInteger(expectedPointsOf(sorted.filter((_, i) => selections[i])), locale)}</strong>
            </span>
          </p>
          <div className="flex items-center gap-4">
            <div className="text-right" aria-live="polite">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{labels.yourScenario}</p>
              <p className="flex items-baseline justify-end gap-1.5">
                <span className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatPercent(finalProb, locale)}</span>
                <span className={`text-sm font-bold ${finalProb >= pCurrent ? "text-emerald-700" : "text-red-700"}`}>
                  <span aria-hidden="true">{formatPp(finalProb - pCurrent, locale)}</span>
                  <span className="sr-only">{describePp(finalProb - pCurrent, locale, pt ? "face a agora" : "from now")}</span>
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelections({})}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line px-3 text-sm font-semibold text-ink hover:bg-parchment"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              {labels.resetAll}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
