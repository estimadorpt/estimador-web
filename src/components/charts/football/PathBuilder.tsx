"use client";

import { useEffect, useMemo, useState } from "react";
import { useClockReached } from "@/components/football/ClockSwitch";
import { forecastAsOf, matchPlayedAt } from "@/lib/football-status";
import { teamLogoSrc, teamDisplayName, teamWithArticle } from "@/lib/config/football";
import type { CriticalPathMatch } from "@/types/football";
import { CHOICE_GROUP_CLASS, ChoiceCheck, choiceClass } from "@/components/brand/Choice";
import { Disclosure } from "@/components/viz/Disclosure";
import {
  decisiveGames,
  expectedPoints as expectedPointsOf,
  pickedPoints,
  runningProbabilities,
  type PathOutcome,
} from "@/lib/football-path-builder";
import type { ClubFrame } from "@/lib/football-scenarios";
import { describePp, formatInteger, formatPercent, formatPp } from "@/lib/football-format";

interface PathBuilderProps {
  team: string;
  matches: CriticalPathMatch[];
  /** The published target's chance now (critical_paths[team].p_current). */
  pCurrent: number;
  /** What the published paths count: the title, or staying up. */
  target: "champion" | "survival";
  /** The page's one frame. A survival path is read as relegation (1 − p),
   * so the page never says "permanência 47%" beside "despromoção 53%". */
  frame: ClubFrame;
  locale: string;
  /** Simulated seasons behind the conditionals (prediction.n_sims). */
  nSims: number;
  /** When the forecast's "agora" goes out of date: the next round played (FR3-01). */
  staleAt?: string | null;
  /** The forecast's timestamp, to date "agora" after `staleAt`. */
  forecastTimestamp?: string | null;
  /** Confirmed kickoffs of the club's games, by matchday: a game two hours
   * past its kickoff is marked as played and can no longer be picked. */
  kickoffs?: Record<number, string>;
}

const OUTCOMES: PathOutcome[] = ["W", "D", "L"];
/** Games shown before the rest fold away (audit PUB2-08: 27 rows ran to 2,700px on a phone). */
const FIRST_GAMES = 6;

/**
 * "Cria o teu cenário": fix the result of any of the club's remaining games
 * and read its title (or relegation) chance after each pick. The maths lives
 * in football-path-builder.ts: one pick gives the exact conditional from the
 * simulations, several are combined as if independent given the target.
 *
 * The decisive games are marked in the list itself (`decisiveGames`: a game
 * that moves the chance 5 points more than the club's typical game), and
 * shown with the next six; the rest of the season folds into a Disclosure.
 * When no game stands out, one sentence says how much every game moves it,
 * instead of a separate list of near-identical rows (review, October 2026).
 *
 * Each result is a choice box (ChoiceGroup's grammar: the chosen one in ink
 * and checked); only picked rows carry a figure (UXD2-16). The running answer
 * is said once, in a live region on the page from load, beside the list and
 * sticky from `lg`, under it below (A11Y3-02, A11Y3-M1), with "Limpar tudo"
 * as a text action next to it.
 */
export function PathBuilder({ team, matches, pCurrent, target, frame, locale, nSims, staleAt = null, forecastTimestamp = null, kickoffs = {} }: PathBuilderProps) {
  const pt = locale !== "en";
  const [selections, setSelections] = useState<Record<number, PathOutcome>>({});
  const [notice, setNotice] = useState("");

  // The reader's clock, after mount only (hydration parity): "agora" is
  // dated once the next round is played, and a played game is marked.
  const stale = useClockReached(staleAt);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const isPlayed = (matchday: number) => {
    const at = matchPlayedAt(kickoffs[matchday]);
    return now != null && at != null && Date.parse(at) <= now;
  };
  const nowWord = stale && forecastTimestamp ? forecastAsOf(forecastTimestamp, locale) : (pt ? "agora" : "now");

  // A survival path read in the page's frame: relegation is 1 − survival.
  const flip = target === "survival" && frame === "relegation";
  const shown = (p: number) => (flip ? 1 - p : p);
  const upIsGood = frame === "title";
  const frameWord = frame === "title" ? (pt ? "título" : "title") : (pt ? "despromoção" : "relegation");
  const FrameWord = frameWord.charAt(0).toUpperCase() + frameWord.slice(1);

  const byDate = useMemo(() => [...matches].sort((a, b) => a.matchday - b.matchday), [matches]);
  const decisive = useMemo(() => decisiveGames(pCurrent, byDate), [pCurrent, byDate]);
  // The next six and every decisive game, in date order, then the rest. The
  // running figure follows this order, the order the reader sees.
  const firstIdx = useMemo(
    () => byDate.flatMap((_, i) => (i < FIRST_GAMES || decisive.indices.has(i) ? [i] : [])),
    [byDate, decisive],
  );
  const restIdx = useMemo(() => byDate.flatMap((_, i) => (firstIdx.includes(i) ? [] : [i])), [byDate, firstIdx]);
  const ordered = useMemo(() => [...firstIdx, ...restIdx].map(i => byDate[i]), [firstIdx, restIdx, byDate]);
  // Selections are keyed by position in `ordered`.
  const running = useMemo(() => runningProbabilities(pCurrent, ordered, selections), [pCurrent, ordered, selections]);
  const nPicked = Object.keys(selections).length;
  const hasSelections = nPicked > 0;
  const finalProb = running.length ? running[running.length - 1] : pCurrent;
  const finalShown = shown(hasSelections ? finalProb : pCurrent);
  const finalStep = shown(finalProb) - shown(pCurrent);

  const verb = (o: PathOutcome) =>
    o === "W" ? (pt ? "Ganhar" : "Win") : o === "D" ? (pt ? "Empatar" : "Draw") : (pt ? "Perder" : "Lose");
  const letter = (o: PathOutcome) => (o === "W" ? (pt ? "V" : "W") : o === "D" ? (pt ? "E" : "D") : (pt ? "D" : "L"));
  const venueWord = (venue: "H" | "A") => (venue === "H" ? (pt ? "em casa" : "at home") : (pt ? "fora" : "away"));

  function toggle(pos: number, outcome: PathOutcome) {
    // A played game is marked, not removed: its boxes stay focusable and say
    // why they do nothing (aria-disabled, never `disabled`, A11Y3-01).
    if (isPlayed(ordered[pos].matchday)) return;
    setNotice("");
    setSelections(prev => {
      const next = { ...prev };
      if (next[pos] === outcome) delete next[pos];
      else next[pos] = outcome;
      return next;
    });
  }

  // "Limpar tudo" stays where it is (aria-disabled with nothing picked), so
  // focus stays on it instead of dropping to <body> (A11Y3-01); the reset is
  // announced.
  function resetAll() {
    if (!hasSelections) return;
    setSelections({});
    setNotice(pt ? "Escolhas limpas." : "Picks cleared.");
  }

  // "26 a 27", or "26" when both ends round alike: percentage points.
  const span = (xs: number[]) => {
    const lo = formatInteger(Math.round(Math.min(...xs) * 100), locale);
    const hi = formatInteger(Math.round(Math.max(...xs) * 100), locale);
    return lo === hi ? hi : `${lo} ${pt ? "a" : "to"} ${hi}`;
  };
  const marked = decisive.swings.filter((_, i) => decisive.indices.has(i));
  const others = decisive.swings.filter((_, i) => !decisive.indices.has(i));
  const inFrame = pt ? `${frame === "title" ? "no título" : "na despromoção"} ${teamWithArticle(team, "de")}` : `${teamDisplayName(team)}'s ${frameWord} chance`;
  const decisiveSentence = marked.length > 0
    ? pt
      ? `Marcados como decisivos: ${marked.length === 1 ? "o jogo" : `os ${marked.length} jogos`} em que ganhar ou perder mexe mais ${inFrame}, ${span(marked)} pontos percentuais entre um resultado e o outro; cada um dos outros mexe ${span(others)}.`
      : `Marked as decisive: the ${marked.length === 1 ? "game" : `${marked.length} games`} where winning or losing moves ${inFrame} most, ${span(marked)} percentage points between one result and the other; each of the others moves it ${span(others)}.`
    : pt
      ? `Nenhum jogo se destaca: entre ganhar e perder, cada jogo que falta mexe ${span(decisive.swings)} pontos percentuais ${inFrame}.`
      : `No game stands out: between winning and losing, each game left moves ${inFrame} by ${span(decisive.swings)} percentage points.`;

  const row = (m: CriticalPathMatch, pos: number) => {
    const sel = selections[pos];
    const prob = shown(running[pos]);
    const prev = shown(pos === 0 ? pCurrent : running[pos - 1]);
    const step = prob - prev;
    const good = upIsGood ? step > 0 : step < 0;
    const opponent = teamDisplayName(m.opponent);
    const played = isPlayed(m.matchday);
    const isDecisive = decisive.indices.has(byDate.indexOf(m));
    const context = pt
      ? `${teamWithArticle(m.opponent, "contra")}, ${venueWord(m.venue)}, jornada ${m.matchday}${played ? ", já jogado" : ""}`
      : `against ${opponent}, ${venueWord(m.venue)}, matchday ${m.matchday}${played ? ", already played" : ""}`;
    const figure = sel ? (
      <>
        <span className="text-sm font-bold text-ink">{formatPercent(prob, locale)}</span>
        {Math.abs(step) >= 0.0005 && (
          <span className={`ml-1 text-[11px] font-semibold sm:ml-0 ${good ? "text-emerald-700" : "text-red-700"}`}>
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
          sel ? "-ml-2 border-l-2 border-ink pl-2" : ""
        }`}
      >
        <span className="text-center text-xs tabular-nums text-stone-600">
          <span className="sr-only">{pt ? "Jornada " : "Matchday "}</span>{m.matchday}
        </span>
        <span className="min-w-0">
          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5">
            {teamLogoSrc(m.opponent) && <img src={teamLogoSrc(m.opponent)} alt="" width={16} height={16} loading="lazy" decoding="async" className="h-4 w-4 shrink-0 object-contain" />}
            <span className="truncate text-sm font-medium text-ink">{opponent}</span>
            <span className="shrink-0 text-[11px] text-stone-600">({m.venue === "H" ? (pt ? "C" : "H") : (pt ? "F" : "A")})</span>
            {isDecisive && (
              <span className="shrink-0 text-[12px] font-semibold text-ink">{pt ? "decisivo" : "decisive"}</span>
            )}
            {played && (
              <span className="shrink-0 text-[12px] font-semibold text-ink">{pt ? "jogado" : "played"}</span>
            )}
          </span>
          {/* On a phone the figure sits under the opponent, so the result
              boxes share the opponent's row. */}
          {figure && <span className="mt-0.5 block tabular-nums sm:hidden">{figure}</span>}
        </span>
        <span
          role="group"
          aria-label={pt ? `Resultado ${context}` : `Result ${context}`}
          className={`${CHOICE_GROUP_CLASS} flex-nowrap justify-self-end sm:justify-self-start`}
        >
          {OUTCOMES.map(o => {
            const active = sel === o;
            return (
              <button
                key={o}
                type="button"
                aria-pressed={active}
                aria-disabled={played || undefined}
                aria-label={`${verb(o)} ${context}`}
                onClick={() => toggle(pos, o)}
                className={choiceClass(active, "w-[3.75rem]")}
              >
                {active && <ChoiceCheck />}
                <span aria-hidden="true">{letter(o)}</span>
              </button>
            );
          })}
        </span>
        <span className="hidden flex-col items-end tabular-nums sm:flex">{figure}</span>
      </li>
    );
  };

  const nRestPicked = restIdx.reduce((n, _, k) => n + (selections[firstIdx.length + k] ? 1 : 0), 0);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,48rem)_18rem] lg:items-start lg:gap-8">
      <div className="min-w-0">
        <p className="mb-2 max-w-3xl text-sm leading-relaxed text-ink">{decisiveSentence}</p>
        <p className="mb-4 max-w-3xl text-xs leading-relaxed text-stone-500">
          {pt
            ? `Com uma escolha, o número é a probabilidade condicional tirada das ${formatInteger(nSims, locale)} simulações. Com várias, as escolhas combinam-se como se fossem independentes entre si, uma aproximação: o ficheiro publicado não guarda a combinação de vários resultados.`
            : `With one pick, the number is the conditional probability read from the ${formatInteger(nSims, locale)} simulations. With several, the picks are combined as if independent of one another, an approximation: the published file does not hold combinations of results.`}
        </p>

        {/* Column heads, wide screens only (on phones each row names its own parts). */}
        <div aria-hidden="true" className="hidden grid-cols-[2.5rem_minmax(0,1fr)_auto_6.5rem] items-end gap-3 border-b border-ink pb-1 text-[12px] font-semibold text-graphite sm:grid">
          <span className="text-center">{pt ? "Jorn." : "MD"}</span>
          <span>{pt ? "Adversário" : "Opponent"}</span>
          <span className="w-[11.25rem] text-center">{pt ? "Resultado" : "Result"}</span>
          <span className="text-right">{pt ? `${FrameWord}, se escolheres` : `${FrameWord}, if picked`}</span>
        </div>

        <ol className="divide-y divide-line">
          {firstIdx.map((_, k) => row(ordered[k], k))}
        </ol>

        {restIdx.length > 0 && (
          <Disclosure
            className="mt-1 border-t border-rule"
            summary={pt
              ? `Os outros ${restIdx.length} jogos, até à jornada ${byDate[byDate.length - 1].matchday}${nRestPicked ? ` (${nRestPicked} ${nRestPicked === 1 ? "escolhido" : "escolhidos"})` : ""}`
              : `The other ${restIdx.length} games, to matchday ${byDate[byDate.length - 1].matchday}${nRestPicked ? ` (${nRestPicked} picked)` : ""}`}
          >
            <ol className="divide-y divide-line">
              {restIdx.map((_, k) => row(ordered[firstIdx.length + k], firstIdx.length + k))}
            </ol>
          </Disclosure>
        )}
      </div>

      {/* The running answer, once: beside the list and sticky from `lg`,
          under it in the flow below (A11Y3-02, A11Y3-M1). */}
      <div data-scenario-bar className="mt-4 border-t border-ink bg-paper pt-3 pb-4 lg:sticky lg:top-24 lg:mt-0">
        <div aria-live="polite">
          <p className="text-[12px] font-semibold text-graphite">
            {hasSelections ? `${pt ? "O teu cenário" : "Your scenario"} · ${frameWord}` : `${FrameWord} · ${nowWord}`}
          </p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-extrabold tabular-nums text-ink">{formatPercent(finalShown, locale)}</span>
            {hasSelections && Math.abs(finalStep) >= 0.0005 && (
              <span className={`text-sm font-bold ${(upIsGood ? finalStep > 0 : finalStep < 0) ? "text-emerald-700" : "text-red-700"}`}>
                <span aria-hidden="true">{formatPp(finalStep, locale)}</span>
                <span className="sr-only">{describePp(finalStep, locale, pt ? `face a ${stale ? nowWord : "agora"}` : `from ${stale ? nowWord : "now"}`)}</span>
              </span>
            )}
          </p>
          <p className="text-xs text-stone-600">
            {hasSelections
              ? pt
                ? `${formatInteger(pickedPoints(selections), locale)} pontos das tuas escolhas (${nPicked} de ${ordered.length} jogos) · pontos esperados nesses jogos: ${formatInteger(expectedPointsOf(ordered.filter((_, i) => selections[i])), locale)}`
                : `${formatInteger(pickedPoints(selections), locale)} points from your picks (${nPicked} of ${ordered.length} games) · expected points in those games: ${formatInteger(expectedPointsOf(ordered.filter((_, i) => selections[i])), locale)}`
              : pt
                ? "Escolhe ganhar (V), empatar (E) ou perder (D) num jogo para ver o que muda."
                : "Pick win (W), draw (D) or lose (L) in a game to see what changes."}
          </p>
        </div>
        <button
          type="button"
          onClick={resetAll}
          aria-disabled={!hasSelections || undefined}
          className="mt-2 inline-flex min-h-12 items-center gap-1.5 text-[15px] font-semibold text-ink underline-offset-4 hover:underline aria-disabled:cursor-not-allowed aria-disabled:text-graphite aria-disabled:hover:no-underline"
        >
          {pt ? "Limpar tudo" : "Clear all"}
        </button>
        <p role="status" className="sr-only">{notice}</p>
      </div>
    </div>
  );
}
