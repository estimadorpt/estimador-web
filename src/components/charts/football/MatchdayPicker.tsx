"use client";

import { useState, useMemo, useEffect, useRef, useId } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import { ligaTeamSlugs, teamColorOnPaper, teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import { describePp, formatKickoffShort, formatPercent, formatPp, matchLabel } from "@/lib/football-format";
import { Link } from "@/i18n/routing";
import { Disclosure } from "@/components/viz/Disclosure";
import type { NextMatchdayScenarios, ScenarioData } from "@/types/football";

import { conditionalProbabilities, rankMatches, readFootballExplorationState, writeFootballExplorationState, shouldPushSelectionState, type Outcome } from "@/lib/football-exploration";
import { nextSupportedFixtureFor, clubStakes, fixtureStatus, type SupportedFixture } from "@/lib/football-fixtures";
import { formatClubPercent, type Locale } from "@/components/football/club-outlook";
import { matchStartedLine } from "@/lib/football-status";

/** Below this spread, a game's effect on the followed club is within the
 * Monte Carlo noise of thin conditional buckets (audit FA2-06). */
const OTHER_MATCH_NOISE_FLOOR = 0.03;

interface MatchdayPickerProps {
  data: NextMatchdayScenarios;
  version?: string;
  matchHrefs?: Record<string, string>;
  /** Every fixture the bundle's conditionals cover, index-aligned with
   * `data.matches` — lets this component find each club's own outstanding
   * fixture and label postponed leftovers, without duplicating the
   * eligibility rule from football-fixtures.ts. */
  supportedFixtures?: SupportedFixture[];
  /** The published bundle's own timestamp, for dating an unscheduled fixture. */
  forecastTimestamp?: string;
  labels: {
    whatIfTitle: string;
    whatIfDescription: string;
    resetAll: string;
    impactOnTitle: string;
    impactOnRelegation: string;
    noChange: string;
    home: string;
    draw: string;
    away: string;
    win: string;
    simulatedStandings?: string;
    team?: string;
    championship?: string;
    top3?: string;
    relegation?: string;
  };
}

// One rule for every football figure (football-format.ts): whole numbers
// from 10, one decimal below, U+2212 for minus (audit F16).
function formatDelta(delta: number, locale: string): string {
  return Math.abs(delta) < 0.0005 ? "—" : formatPp(delta, locale);
}

function formatDeltaPrecise(delta: number, locale: Locale): string {
  return formatDelta(delta, locale);
}

interface RankedMatchTeams {
  home_team: string;
  away_team: string;
}

/** Outcome labels for the "Outros jogos" ranked list, from the followed
 * club's perspective when it plays in that fixture ("Se {clube} ganhar"),
 * or by team name when it doesn't ("{casa} ganha" / "{fora} ganha") — never
 * the generic Casa/Empate/Fora, which reads as the wrong club's stakes once
 * more than one match is on screen. `short*` feeds the narrow desktop
 * button glyph only (aria-hidden, full text carries the aria-label). */
function matchOutcomeLabels(match: RankedMatchTeams, focusTeam: string, pt: boolean) {
  const isHome = match.home_team === focusTeam;
  const isAway = match.away_team === focusTeam;
  if (isHome || isAway) {
    const winLabel = pt ? `Se o ${teamDisplayName(focusTeam)} ganhar` : `If ${teamDisplayName(focusTeam)} win`;
    const loseLabel = pt ? `Se o ${teamDisplayName(focusTeam)} perder` : `If ${teamDisplayName(focusTeam)} lose`;
    const winShort = pt ? "V" : "W";
    const loseShort = pt ? "D" : "L";
    return {
      home: isHome ? winLabel : loseLabel,
      draw: pt ? "Se empatar" : "If they draw",
      away: isAway ? winLabel : loseLabel,
      shortHome: isHome ? winShort : loseShort,
      shortDraw: pt ? "E" : "D",
      shortAway: isAway ? winShort : loseShort,
    };
  }
  return {
    home: pt ? `${teamDisplayName(match.home_team)} ganha` : `${teamDisplayName(match.home_team)} win`,
    draw: pt ? "Empate" : "Draw",
    away: pt ? `${teamDisplayName(match.away_team)} ganha` : `${teamDisplayName(match.away_team)} win`,
    shortHome: "1",
    shortDraw: "X",
    shortAway: "2",
  };
}

export function MatchdayPicker({ data, labels, version = "demo", matchHrefs = {}, supportedFixtures = [], forecastTimestamp = "" }: MatchdayPickerProps) {
  const locale = useLocale();
  const pt = locale !== "en";
  const localeCode: Locale = pt ? "pt" : "en";
  const formatPct = (value: number) => formatPercent(value, locale);
  const ids = useId();
  // After a club is chosen the chooser unmounts; focus moves to the new
  // view's heading instead of dropping to <body> (audit F-H7).
  const viewHeadingRef = useRef<HTMLHeadingElement>(null);
  const [focusPending, setFocusPending] = useState(false);
  const [pendingTeam, setPendingTeam] = useState('');
  const [chooseHint, setChooseHint] = useState(false);
  // The reader's clock, read after mount only (audit FRESH-01): a game that
  // has kicked off says so, instead of offering itself as still to come.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const started = (kickoff?: string | null) => {
    if (now == null || !kickoff) return false;
    const ms = Date.parse(kickoff);
    return !Number.isNaN(ms) && ms <= now;
  };
  useEffect(() => {
    if (focusPending && viewHeadingRef.current) {
      viewHeadingRef.current.focus();
      setFocusPending(false);
    }
  }, [focusPending]);
  const [selections, setSelections] = useState<Record<number, Outcome | null>>(
    {}
  );

  // No team until the URL says so, or the visitor picks one — never a silent
  // default (diagnosis §5/12 "Simulator", "Club continuity").
  const [focusTeam, setFocusTeam] = useState('');
  const [objective, setObjective] = useState<'p_champion'|'p_relegation'>('p_champion');
  const [showAll, setShowAll] = useState(false);
  const [ready, setReady] = useState(false);
  const [shareNotice,setShareNotice]=useState('');
  const [staleVersion, setStaleVersion] = useState(false);
  // Tracks what the URL last reflected, so the write effect below knows
  // whether a run changed only the selection (→ pushState, so Back undoes one
  // pick at a time) or the team/objective too (→ replaceState — rapid
  // browsing through teams and objectives shouldn't spam history).
  const lastWritten = useRef<{ team: string; objective: string; pick: string }>({ team: '', objective: '', pick: '' });
  useEffect(()=>{
    const restored = readFootballExplorationState(window.location.search, version, data);
    if (restored.state.selection) setSelections({ [restored.state.selection.index]: restored.state.selection.outcome });
    if (restored.state.team) setFocusTeam(restored.state.team);
    if (restored.state.objective) setObjective(restored.state.objective);
    if (restored.resetForVersion) {
      setStaleVersion(true);
      setShareNotice(pt?'Esta ligação já não corresponde à previsão atual. A mostrar a previsão de base atual, sem as escolhas partilhadas.':'This link no longer matches the current forecast. Showing the current baseline forecast, without the shared choices.');
    }
    lastWritten.current = {
      team: restored.state.team ?? '',
      objective: restored.state.objective ?? 'p_champion',
      pick: restored.state.selection ? `${restored.state.selection.index}:${restored.state.selection.outcome}` : '',
    };
    setReady(true);
  },[data,version,pt]);
  useEffect(()=>{
    if(!ready || !focusTeam)return;
    const picked = Object.entries(selections).find(([, outcome]) => outcome);
    const pickKey = picked ? `${picked[0]}:${picked[1]}` : '';
    const query = writeFootballExplorationState(window.location.search, version, {
      team: focusTeam,
      objective,
      ...(picked ? { selection: { index: Number(picked[0]), outcome: picked[1]! } } : {}),
    });
    const url = `${window.location.pathname}?${query}${window.location.hash}`;
    const next = { team: focusTeam, objective, pick: pickKey };
    if (shouldPushSelectionState(lastWritten.current, next)) window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
    lastWritten.current = { team: focusTeam, objective, pick: pickKey };
  },[ready,selections,focusTeam,objective,version]);
  async function shareScenario(){try{await navigator.clipboard.writeText(window.location.href);setShareNotice(pt?'Ligação copiada com a equipa e os resultados escolhidos.':'Link copied with your team and selected results.');}catch{setShareNotice(pt?'Copia a ligação da barra de endereços; inclui as tuas escolhas.':'Copy the address-bar link; it includes your choices.');}}

  const hasSelections = Object.values(selections).some((v) => v !== null);

  const toggleSelection = (matchIdx: number, outcome: Outcome) => {
    setSelections(prev => prev[matchIdx] === outcome ? {} : {[matchIdx]:outcome});
  };

  const resetAll = () => setSelections({});

  const probabilities = useMemo(() => {
    const picked = Object.entries(selections).find(([,outcome])=>outcome);
    return conditionalProbabilities(data,picked ? {index:Number(picked[0]),outcome:picked[1]!} : undefined);
  },[data,selections]);
  const rankedMatches = useMemo(()=>rankMatches(data,focusTeam,objective),[data,focusTeam,objective]);

  // Teams with meaningful title or relegation probabilities
  const titleTeams = useMemo(() => {
    return Object.entries(data.baseline)
      .filter(([, b]) => b.p_champion > 0.005)
      .sort((a, b) => b[1].p_champion - a[1].p_champion)
      .map(([team]) => team);
  }, [data.baseline]);

  const relegationTeams = useMemo(() => {
    return Object.entries(data.baseline)
      .filter(([, b]) => b.p_relegation > 0.01)
      .sort((a, b) => b[1].p_relegation - a[1].p_relegation)
      .map(([team]) => team);
  }, [data.baseline]);
  const selectedMatch = Object.entries(selections).find(([, outcome]) => outcome);
  const selectedOutcome = selectedMatch?.[1];
  const selectedFixture = selectedMatch ? data.matches[Number(selectedMatch[0])] : undefined;
  const focalBaseline = data.baseline[focusTeam]?.[objective] ?? 0;
  const focalCurrent = probabilities[focusTeam]?.[objective] ?? focalBaseline;

  // "O meu próximo jogo": the focus team's own outstanding fixture, with
  // team-labelled outcomes, always visible without a click (diagnosis §5/9
  // "Simulator" — an empty pre-selection chart is weaker than an immediately
  // populated one). "Outros jogos" (below) excludes this fixture so the two
  // paths stay explicitly different.
  const myFixture = useMemo(
    () => (focusTeam ? nextSupportedFixtureFor(focusTeam, supportedFixtures) : null),
    [focusTeam, supportedFixtures],
  );
  const myStakes = useMemo(
    () =>
      myFixture
        ? clubStakes({ next_matchday_scenarios: data } as ScenarioData, myFixture, focusTeam, objective)
        : null,
    [myFixture, data, focusTeam, objective],
  );
  const myFixtureStatus = myFixture && forecastTimestamp ? fixtureStatus(myFixture, forecastTimestamp, locale === 'en' ? 'en' : 'pt') : null;
  const myWinOutcome: Outcome | null = myStakes ? (myStakes.venue === 'home' ? 'H' : 'A') : null;
  const myLossOutcome: Outcome | null = myStakes ? (myStakes.venue === 'home' ? 'A' : 'H') : null;
  const otherRankedMatches = useMemo(
    () => rankedMatches.filter(m => m.index !== myFixture?.index),
    [rankedMatches, myFixture],
  );
  const supportedByIndex = useMemo(() => {
    const map = new Map<number, SupportedFixture>();
    for (const f of supportedFixtures) map.set(f.index, f);
    return map;
  }, [supportedFixtures]);
  // Which games to show: the three that move this objective most (or all),
  // listed in kickoff order with their Lisbon date (audit F-H4) — the
  // spread picks the games, it never orders them.
  const kickoffMs = (index: number) => {
    const k = supportedByIndex.get(index)?.kickoff;
    const ms = k ? Date.parse(k) : NaN;
    return Number.isNaN(ms) ? Number.MAX_SAFE_INTEGER : ms;
  };
  // The default list keeps only games that move this club's objective by at
  // least 3 pp; a 1,2 pp difference is noise, not a reason to watch a game.
  const aboveNoise = otherRankedMatches.filter(m => m.swing >= OTHER_MATCH_NOISE_FLOOR);
  const visibleOtherMatches = (showAll ? otherRankedMatches : otherRankedMatches.filter((item) => aboveNoise.indexOf(item) > -1 && aboveNoise.indexOf(item) < 3 || selections[item.index]))
    .slice()
    .sort((a, b) => kickoffMs(a.index) - kickoffMs(b.index) || a.index - b.index);
  const chronologicalFixtures = useMemo(
    () => [...supportedFixtures].sort((a, b) => {
      const am = a.kickoff ? Date.parse(a.kickoff) : Number.MAX_SAFE_INTEGER;
      const bm = b.kickoff ? Date.parse(b.kickoff) : Number.MAX_SAFE_INTEGER;
      return am - bm || a.matchday - b.matchday || a.index - b.index;
    }),
    [supportedFixtures],
  );

  if (!focusTeam) {
    // Before the mount effect has read the URL, render nothing rather than a
    // "choose a club" placeholder that would flash and then be replaced —
    // most visits arrive with `?team=` already set.
    if (!ready) return <div aria-hidden="true" className="min-h-[240px]" />;
    return (
      <div>
        {staleVersion && (
          <div role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {shareNotice}
          </div>
        )}
      <div className="rounded-2xl border border-line bg-cream p-5 md:p-8">
        <h2 className="mb-2 text-xl font-bold text-ink">{pt ? 'Escolhe uma equipa' : 'Choose a club'}</h2>
        <p className="mb-4 max-w-xl text-sm leading-relaxed text-ink-muted">
          {pt
            ? 'Segue uma equipa para veres o que o próximo jogo dela muda no objetivo escolhido, e quais os outros jogos que mais pesam.'
            : 'Follow a club to see what its next match changes for the chosen objective, and which other matches weigh most.'}
        </p>
        <form
          className="mb-6 flex flex-wrap items-end gap-2"
          onSubmit={e => {
            e.preventDefault();
            // Never a disabled button that looks broken (audit CL2-04).
            if (!pendingTeam) {
              setChooseHint(true);
              document.getElementById(`${ids}-choose`)?.focus();
              return;
            }
            setFocusTeam(pendingTeam);
            setFocusPending(true);
          }}
        >
          <span className="flex min-w-0 max-w-sm flex-1 flex-col gap-1">
            <label htmlFor={`${ids}-choose`} className="text-xs font-semibold text-ink-muted">{pt ? 'Equipa a seguir' : 'Club to follow'}</label>
            <select
              id={`${ids}-choose`}
              value={pendingTeam}
              aria-describedby={chooseHint ? `${ids}-choose-hint` : undefined}
              onChange={e => {
                setPendingTeam(e.target.value);
                setChooseHint(false);
              }}
              className="block min-h-11 w-full rounded-[10px] border border-line bg-paper px-2 text-base text-ink sm:text-sm"
            >
              <option value="" disabled>
                {pt ? 'Escolhe um clube' : 'Choose a club'}
              </option>
              {Object.keys(data.baseline)
                .sort((a, b) => teamDisplayName(a).localeCompare(teamDisplayName(b), 'pt'))
                .map(team => (
                  <option key={team} value={team}>
                    {teamDisplayName(team)}
                  </option>
                ))}
            </select>
          </span>
          <button type="submit" className="min-h-11 rounded-[10px] bg-ink px-4 text-sm font-semibold text-paper transition-colors duration-150 hover:bg-forest">
            {pt ? 'Seguir' : 'Follow'}
          </button>
          {chooseHint && (
            <p id={`${ids}-choose-hint`} role="status" className="w-full text-sm text-stone-600">
              {pt ? 'Escolhe primeiro um clube na lista.' : 'Choose a club from the list first.'}
            </p>
          )}
        </form>

        <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-3">
          {pt ? 'Todos os jogos incluídos nesta previsão, por ordem de início' : 'Every fixture in this forecast, in kickoff order'}
        </h3>
        <ul className="space-y-1">
          {chronologicalFixtures.map(f => (
            <li key={f.index} className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 py-2 text-sm text-ink">
              <span>
                {f.kickoff && (
                  <span className="mr-2 text-xs tabular-nums text-stone-600">
                    {f.kickoffConfirmed && started(f.kickoff) && forecastTimestamp
                      ? matchStartedLine(forecastTimestamp, locale)
                      : formatKickoffShort(f.kickoff, locale, { confirmed: f.kickoffConfirmed })}
                  </span>
                )}
                {matchLabel(teamDisplayName(f.home), teamDisplayName(f.away))}
                {f.postponed && (
                  <span className="ml-2 rounded bg-parchment px-1 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    {pt ? 'jogo em atraso' : 'postponed'}
                  </span>
                )}
              </span>
              <span className="text-xs text-ink-muted">
                {pt ? `Jornada ${f.matchday}` : `Matchday ${f.matchday}`}
                {matchHrefs[`${f.home}|${f.away}`] && (
                  <>
                    {' · '}
                    <Link href={matchHrefs[`${f.home}|${f.away}`]} locale={locale} className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-2">
                      {pt ? 'ver jogo' : 'match preview'}
                    </Link>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
      </div>
    );
  }

  return (
    // Layout and delta animations stop under prefers-reduced-motion (A11Y2-03).
    <MotionConfig reducedMotion="user">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <h2 ref={viewHeadingRef} tabIndex={-1} className="col-span-full text-2xl tracking-tight">
        {pt ? `${teamDisplayName(focusTeam)}: o que muda na próxima jornada?` : `${teamDisplayName(focusTeam)}: what changes in the next round?`}
      </h2>
      {/* Not sticky: a sticky panel this tall hid the control that had focus
          when tabbing backwards (audit A11Y2-02). */}
      <section aria-label={pt?'A tua pergunta':'Your question'} className="col-span-full rounded-2xl border border-line bg-cream p-3 md:p-5">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
          <span className="flex min-w-0 flex-col gap-1"><label htmlFor={`${ids}-team`} className="text-xs font-semibold text-ink-muted">{pt?'Equipa a seguir':'Club to follow'}</label><select id={`${ids}-team`} value={focusTeam} onChange={e=>setFocusTeam(e.target.value)} className="block min-h-11 w-full rounded-[10px] border border-line bg-paper px-2 text-base text-ink sm:text-sm">{Object.keys(data.baseline).sort((a,b)=>teamDisplayName(a).localeCompare(teamDisplayName(b),'pt')).map(team=><option key={team} value={team}>{teamDisplayName(team)}</option>)}</select></span>
          <span className="flex min-w-0 flex-col gap-1"><label htmlFor={`${ids}-goal`} className="text-xs font-semibold text-ink-muted">{pt?'O que queres saber?':'What matters to you?'}</label><select id={`${ids}-goal`} value={objective} onChange={e=>setObjective(e.target.value as typeof objective)} className="block min-h-11 w-full rounded-[10px] border border-line bg-paper px-2 text-base text-ink sm:text-sm"><option value="p_champion">{pt?'Ganhar o título':'Win the title'}</option><option value="p_relegation">{pt?'Despromoção':'Relegation'}</option></select></span>
          {/* No arrow to an identical number before a pick (audit MISS-02). */}
          <p aria-live="polite" aria-atomic="true" className="text-sm leading-relaxed text-ink sm:col-span-2">
            <strong>{teamDisplayName(focusTeam)}</strong>
            {hasSelections
              ? <> · {pt ? 'Base' : 'Baseline'} {formatClubPercent(focalBaseline, localeCode)} → <strong>{pt ? 'Com a escolha' : 'With the choice'} {formatClubPercent(focalCurrent, localeCode)}</strong> ({formatDeltaPrecise(focalCurrent - focalBaseline, localeCode)})</>
              : <> · {pt ? 'agora' : 'now'} {formatClubPercent(focalBaseline, localeCode)} · {pt ? 'escolhe um resultado para ver o que muda' : 'pick a result to see what changes'}</>}
          </p>
        </div>
      </section>
      {staleVersion && (
        <div role="alert" className="col-span-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {shareNotice}
        </div>
      )}
      <div className="col-span-full flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 text-sm text-ink-muted">
        <p className="max-w-2xl leading-relaxed">{pt?'Experimenta um resultado de cada vez. A previsão assume esse resultado e mantém a incerteza sobre os outros jogos.':'Try one result at a time. The forecast assumes that outcome and retains uncertainty about the other matches.'}</p>
        <button onClick={shareScenario} disabled={!ready} className="min-h-11 font-semibold text-ink underline underline-offset-4">{pt?'Partilhar estas escolhas':'Share these selections'}</button>
        {!staleVersion && <p role="status" className="basis-full">{shareNotice}</p>}
      </div>

      {/* "O meu próximo jogo" — the club's own outstanding fixture, always
          shown with all three outcomes, team-labelled, no click required
          (diagnosis §5/9 "Simulator"). */}
      <div className="col-span-full rounded-2xl border border-line bg-cream p-5 md:p-6">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-3">
          {pt ? `O próximo jogo do ${teamDisplayName(focusTeam)}` : `${teamDisplayName(focusTeam)}'s next match`}
        </h3>
        {!myFixture && (
          <p className="text-sm leading-relaxed text-ink-muted">
            {pt
              ? `Sem jogo suportado nesta previsão para ${teamDisplayName(focusTeam)}. A mostrar a previsão de base acima.`
              : `No supported fixture in this forecast for ${teamDisplayName(focusTeam)}. Showing the baseline forecast above.`}
          </p>
        )}
        {myFixture && !myStakes && (
          <p className="text-sm leading-relaxed text-ink-muted">
            {pt ? 'Sem cenários detalhados publicados para este jogo.' : 'No detailed scenarios published for this match.'}
          </p>
        )}
        {myFixture && myStakes && myWinOutcome && myLossOutcome && (
          <>
            <p className="mb-3 text-sm text-ink">
              <strong>{matchLabel(teamDisplayName(myFixture.home), teamDisplayName(myFixture.away))}</strong>
              {myFixtureStatus && (
                <span className="text-ink-muted"> · {myFixture.kickoffConfirmed && started(myFixture.kickoff) && forecastTimestamp ? matchStartedLine(forecastTimestamp, locale) : myFixtureStatus.label}</span>
              )}
            </p>
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-line bg-paper p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  {myFixture.kickoffConfirmed && started(myFixture.kickoff) ? (pt ? 'Antes do jogo' : 'Before the match') : (pt ? 'Agora' : 'Now')}
                </div>
                <div className="mt-1 text-lg font-bold tabular-nums text-ink">{formatClubPercent(myStakes.baseline, localeCode)}</div>
              </div>
              {([
                { outcome: myWinOutcome, label: pt ? `Se o ${teamDisplayName(focusTeam)} ganhar` : `If ${teamDisplayName(focusTeam)} win`, value: myStakes.win },
                { outcome: 'D' as Outcome, label: pt ? 'Se empatar' : 'If they draw', value: myStakes.draw },
                { outcome: myLossOutcome, label: pt ? `Se o ${teamDisplayName(focusTeam)} perder` : `If ${teamDisplayName(focusTeam)} lose`, value: myStakes.loss },
              ]).map(row => {
                const active = selections[myFixture.index] === row.outcome;
                return (
                  <button
                    key={row.outcome}
                    type="button"
                    onClick={() => toggleSelection(myFixture.index, row.outcome)}
                    aria-pressed={active}
                    className="rounded-lg border p-3 text-left transition-colors"
                    style={{
                      borderColor: active ? '#234c40' : '#dadccf',
                      backgroundColor: active ? '#234c40' : 'var(--color-paper, #fff)',
                    }}
                  >
                    <div className={`text-[11px] font-bold uppercase tracking-wider ${active ? 'text-cream' : 'text-stone-500'}`}>{row.label}</div>
                    <div className={`mt-1 text-lg font-bold tabular-nums ${active ? 'text-cream' : 'text-ink'}`}>{formatClubPercent(row.value, localeCode)}</div>
                    <div className={`text-[11px] tabular-nums ${active ? 'text-cream/80' : 'text-ink-muted'}`}>{formatDeltaPrecise(row.value - myStakes.baseline, localeCode)}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Left: Match picker — explicitly a different path: every other
          fixture the bundle covers, ranked by outcome spread, not causally
          and not by date (diagnosis §5/9 "Simulator"). */}
      <div className="min-w-0 rounded-2xl border border-line bg-cream p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            {pt ? 'Outros jogos que afetam este objetivo' : 'Other matches that affect this objective'}
          </h3>
          {hasSelections && (
            <button
              onClick={resetAll}
              className="min-h-11 rounded-lg border border-line px-3 text-xs font-bold text-ink hover:bg-paper transition-colors"
            >
              {labels.resetAll}
            </button>
          )}
        </div>

        <p className="mb-3 text-sm leading-relaxed text-ink-muted">{showAll
          ? (pt ? 'Todos os jogos, por ordem de início (hora de Lisboa). Abaixo de 3 pontos percentuais, a diferença entre desfechos confunde-se com o ruído das simulações.' : 'Every match, in kickoff order (Lisbon time). Below 3 percentage points, the difference between outcomes blends into the simulations\' noise.')
          : aboveNoise.length === 0
            ? (pt ? `Nenhum outro jogo muda as contas do ${teamDisplayName(focusTeam)} em 3 pontos percentuais ou mais.` : `No other match moves ${teamDisplayName(focusTeam)}'s chances by 3 percentage points or more.`)
            : (pt ? `Os jogos (até três) cujo resultado mexe pelo menos 3 pontos percentuais nas contas do ${teamDisplayName(focusTeam)}, por ordem de início (hora de Lisboa).` : `The matches (up to three) whose result moves ${teamDisplayName(focusTeam)}'s chances by at least 3 percentage points, in kickoff order (Lisbon time).`)}</p>
        <div className="space-y-1">
          {visibleOtherMatches.map(({match, index:idx, swing}) => {
            const meta = supportedByIndex.get(idx);
            const selected = selections[idx] ?? null;
            const homeColor = "#234c40";
            const awayColor = "#234c40";
            const outcomeLabels = matchOutcomeLabels(match, focusTeam, pt);

            return (
              <div
                key={idx}
                className="grid grid-cols-2 items-center gap-3 py-4 border-b border-line last:border-b-0 sm:flex sm:flex-wrap sm:gap-2"
              >
                <div className="order-0 col-span-2 flex flex-wrap items-center sm:w-full justify-between gap-3 text-[11px] text-ink-muted">
                  <span>
                    {meta?.kickoff && (
                      <span className="font-semibold tabular-nums">
                        {meta.kickoffConfirmed && started(meta.kickoff) && forecastTimestamp
                          ? matchStartedLine(forecastTimestamp, locale)
                          : formatKickoffShort(meta.kickoff, locale, { confirmed: meta.kickoffConfirmed })} ·{' '}
                      </span>
                    )}
                    {meta && (pt ? `Jornada ${meta.matchday}` : `Matchday ${meta.matchday}`)}
                    {meta?.postponed && (
                      <span className="ml-1.5 font-bold uppercase tracking-wider text-stone-600">{pt ? '· jogo em atraso' : '· postponed'}</span>
                    )}
                    {meta && ' · '}
                    {pt ? 'Diferença entre desfechos' : 'Difference between outcomes'}: {formatPp(swing, locale).replace('+', '')}
                  </span>
                  {matchHrefs[`${match.home_team}|${match.away_team}`] && <Link href={matchHrefs[`${match.home_team}|${match.away_team}`]} locale={locale} className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-2">{pt?'Ver jogo':'Match preview'}</Link>}
                </div>
                {/* Home team */}
                <div className="order-1 flex min-w-0 items-center gap-1.5 sm:w-[120px] sm:justify-end">
                  {ligaTeamSlugs[match.home_team] ? <Link href={`/desporto/liga/${ligaTeamSlugs[match.home_team]}`} locale={locale} className="text-xs font-medium text-stone-700 text-right underline-offset-2 hover:underline">{teamDisplayName(match.home_team)}</Link> : <span className="text-xs font-medium text-stone-700 text-right">{teamDisplayName(match.home_team)}</span>}
                  {teamLogoSrc(match.home_team) && (
                    <img
                      src={teamLogoSrc(match.home_team)}
                      alt=""
                      width={20}
                      height={20}
                      loading="lazy"
                      decoding="async"
                      className="w-5 h-5 object-contain flex-shrink-0"
                    />
                  )}
                </div>

                {/* H/D/A buttons */}
                <div className="order-3 col-span-2 flex justify-center gap-2 sm:order-2 sm:gap-1">
                  <button
                    onClick={() => toggleSelection(idx, "H")}
                    aria-pressed={selected === "H"}
                    aria-label={`${matchLabel(teamDisplayName(match.home_team), teamDisplayName(match.away_team))}: ${outcomeLabels.home}`}
                    className="h-12 flex-1 sm:w-11 sm:flex-none rounded-lg text-[12px] font-bold transition-colors duration-150"
                    style={{
                      backgroundColor:
                        selected === "H" ? homeColor : "transparent",
                      color: selected === "H" ? "#fff" : "#234c40",
                      border:
                        selected === "H"
                          ? `2px solid ${homeColor}`
                          : "2px solid #dadccf",
                    }}
                  >
                    <span className="sm:hidden">{outcomeLabels.home}</span><span className="hidden sm:inline" aria-hidden="true">{outcomeLabels.shortHome}</span>
                  </button>
                  <button
                    onClick={() => toggleSelection(idx, "D")}
                    aria-pressed={selected === "D"}
                    aria-label={`${matchLabel(teamDisplayName(match.home_team), teamDisplayName(match.away_team))}: ${outcomeLabels.draw}`}
                    className="h-12 flex-1 sm:w-11 sm:flex-none rounded-lg text-[12px] font-bold transition-colors duration-150"
                    style={{
                      backgroundColor:
                        selected === "D" ? "#5f7062" : "transparent",
                      color: selected === "D" ? "#fff" : "#234c40",
                      border:
                        selected === "D"
                          ? "2px solid #5f7062"
                          : "2px solid #dadccf",
                    }}
                  >
                    <span className="sm:hidden">{outcomeLabels.draw}</span><span className="hidden sm:inline" aria-hidden="true">{outcomeLabels.shortDraw}</span>
                  </button>
                  <button
                    onClick={() => toggleSelection(idx, "A")}
                    aria-pressed={selected === "A"}
                    aria-label={`${matchLabel(teamDisplayName(match.home_team), teamDisplayName(match.away_team))}: ${outcomeLabels.away}`}
                    className="h-12 flex-1 sm:w-11 sm:flex-none rounded-lg text-[12px] font-bold transition-colors duration-150"
                    style={{
                      backgroundColor:
                        selected === "A" ? awayColor : "transparent",
                      color: selected === "A" ? "#fff" : "#234c40",
                      border:
                        selected === "A"
                          ? `2px solid ${awayColor}`
                          : "2px solid #dadccf",
                    }}
                  >
                    <span className="sm:hidden">{outcomeLabels.away}</span><span className="hidden sm:inline" aria-hidden="true">{outcomeLabels.shortAway}</span>
                  </button>
                </div>

                <p className="order-4 col-span-2 text-center text-[11px] leading-relaxed text-ink-muted sm:order-4 sm:w-full">
                  <strong>{teamDisplayName(focusTeam)}</strong> · {objective === 'p_champion' ? (pt ? 'título' : 'title') : (pt ? 'despromoção' : 'relegation')}: {outcomeLabels.home} {formatClubPercent(match.conditionals.H.teams[focusTeam]?.[objective] ?? focalBaseline, localeCode)} · {outcomeLabels.draw} {formatClubPercent(match.conditionals.D.teams[focusTeam]?.[objective] ?? focalBaseline, localeCode)} · {outcomeLabels.away} {formatClubPercent(match.conditionals.A.teams[focusTeam]?.[objective] ?? focalBaseline, localeCode)}
                </p>

                {/* Away team */}
                <div className="order-2 flex min-w-0 items-center justify-end gap-1.5 sm:order-3 sm:w-[120px] sm:justify-start">
                  {teamLogoSrc(match.away_team) && (
                    <img
                      src={teamLogoSrc(match.away_team)}
                      alt=""
                      width={20}
                      height={20}
                      loading="lazy"
                      decoding="async"
                      className="w-5 h-5 object-contain flex-shrink-0"
                    />
                  )}
                  {ligaTeamSlugs[match.away_team] ? <Link href={`/desporto/liga/${ligaTeamSlugs[match.away_team]}`} locale={locale} className="text-xs font-medium text-stone-700 underline-offset-2 hover:underline">{teamDisplayName(match.away_team)}</Link> : <span className="text-xs font-medium text-stone-700">{teamDisplayName(match.away_team)}</span>}
                </div>
              </div>
            );
          })}
        </div>
        {otherRankedMatches.length>visibleOtherMatches.length || showAll ? <button onClick={()=>setShowAll(!showAll)} className="mt-3 min-h-11 text-sm font-semibold text-ink underline underline-offset-4">{showAll?(pt?'Mostrar os jogos principais':'Show key matches'):(pt?`Ver todos os ${otherRankedMatches.length} jogos`:`See all ${otherRankedMatches.length} matches`)}</button> : null}
      </div>

      {/* Right: Probability impact */}
      <div className="min-w-0 rounded-2xl border border-line bg-cream p-5 md:p-6">
        <div className="mb-5 rounded-xl bg-paper p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{pt ? 'A resposta para a equipa que segues' : 'The answer for your club'}</p>
          <p className="mt-1 text-sm text-ink"><strong>{teamDisplayName(focusTeam)}</strong> · {objective === 'p_champion' ? (pt ? 'ganhar o título' : 'win the title') : (pt ? 'despromoção' : 'relegation')}</p>
          {selectedFixture && selectedOutcome ? <p className="mt-2 text-sm leading-relaxed text-ink-muted">{teamDisplayName(selectedFixture.home_team)} {selectedOutcome === 'H' ? (pt ? 'vence' : 'win') : selectedOutcome === 'D' ? (pt ? 'empata com' : 'draw') : (pt ? 'perde para' : 'lose to')} {teamDisplayName(selectedFixture.away_team)}: <strong className="text-ink">{formatPct(focalCurrent)}</strong> ({formatDelta(focalCurrent - focalBaseline, locale)} {pt ? 'face à base' : 'from baseline'}).</p> : <p className="mt-2 text-sm leading-relaxed text-ink-muted">{pt ? 'Escolhe vitória caseira, empate ou vitória visitante para comparar cada desfecho com a previsão de base.' : 'Choose a home win, draw or away win to compare that outcome with the baseline forecast.'}</p>}
        </div>
        <div className="mb-5 flex flex-wrap gap-x-4 gap-y-2 border-b border-line pb-4 text-xs text-ink-muted">
          <span>{pt ? 'Probabilidade · escala 0–100%' : 'Probability · 0–100% scale'}</span>
          {hasSelections && <span className="inline-flex items-center gap-2"><i aria-hidden="true" className="h-4 w-[2px] bg-ink" />{pt ? 'Previsão de base' : 'Baseline forecast'}</span>}
          {hasSelections && <span>{pt ? 'Variação em pontos percentuais' : 'Change in percentage points'}</span>}
        </div>
        <Disclosure summary={pt ? 'Ver o detalhe de todas as equipas' : 'See all-team detail'}>
          <div className="mt-5">
        {/* Title race */}
        {titleTeams.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-3">
              {labels.impactOnTitle}
            </div>
            <div className="space-y-2">
              {titleTeams.map((team) => {
                const base = data.baseline[team];
                const current = probabilities[team];
                const delta = current.p_champion - base.p_champion;
                const teamColor = teamColorOnPaper(team);

                return (
                  <div key={team} className="scenario-probability-row flex items-center gap-2 border-b border-line/50 py-2 last:border-0">
                    <div className="flex min-w-0 shrink-0 items-center gap-1.5 w-[88px] sm:w-[110px]">
                      {teamLogoSrc(team) && (
                        <img
                          src={teamLogoSrc(team)}
                          alt=""
                          width={16}
                          height={16}
                          loading="lazy"
                          decoding="async"
                          className="w-4 h-4 object-contain flex-shrink-0"
                        />
                      )}
                      <span className="text-xs font-medium text-stone-700 truncate">
                        {teamDisplayName(team)}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="min-w-0 flex-1 h-3 rounded-sm bg-parchment relative">
                      <div aria-hidden="true" className="absolute inset-y-0 left-0 rounded-sm" style={{ backgroundColor: teamColor, width: `${current.p_champion * 100}%` }} />
                      {hasSelections && <span aria-hidden="true" className="absolute -top-1 h-5 w-[2px] bg-ink ring-1 ring-cream" style={{ left: `${base.p_champion * 100}%` }} />}

                    </div>

                    {/* Value */}
                    <div className="w-[38px] shrink-0 text-right">
                      <span className="text-xs font-bold tabular-nums text-stone-800">
                        {formatPct(current.p_champion)}
                      </span>
                    </div>

                    {/* Delta */}
                    <AnimatePresence mode="wait">
                      {hasSelections && (
                        <motion.div
                          key={`${team}-delta`}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          className="w-[36px] shrink-0 text-right"
                        >
                          <span
                            className={`text-[11px] font-bold tabular-nums ${
                              delta > 0.005
                                ? "text-emerald-700"
                                : delta < -0.005
                                ? "text-red-700"
                                : "text-stone-500"
                            }`}
                          >
                            <span aria-hidden="true">{formatDelta(delta, locale)}</span>
                            <span className="sr-only">{describePp(delta, locale)}</span>
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Relegation */}
        {relegationTeams.length > 0 && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-3">
              {labels.impactOnRelegation}
            </div>
            <div className="space-y-2">
              {relegationTeams.map((team) => {
                const base = data.baseline[team];
                const current = probabilities[team];
                const delta = current.p_relegation - base.p_relegation;
                const teamColor = teamColorOnPaper(team);

                return (
                  <div key={team} className="scenario-probability-row flex items-center gap-2 border-b border-line/50 py-2 last:border-0">
                    <div className="flex min-w-0 shrink-0 items-center gap-1.5 w-[88px] sm:w-[110px]">
                      {teamLogoSrc(team) && (
                        <img
                          src={teamLogoSrc(team)}
                          alt=""
                          width={16}
                          height={16}
                          loading="lazy"
                          decoding="async"
                          className="w-4 h-4 object-contain flex-shrink-0"
                        />
                      )}
                      <span className="text-xs font-medium text-stone-700 truncate">
                        {teamDisplayName(team)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 h-3 rounded-sm bg-parchment relative">
                      <div aria-hidden="true" className="absolute inset-y-0 left-0 rounded-sm" style={{ backgroundColor: teamColor, width: `${current.p_relegation * 100}%` }} />
                      {hasSelections && <span aria-hidden="true" className="absolute -top-1 h-5 w-[2px] bg-ink ring-1 ring-cream" style={{ left: `${base.p_relegation * 100}%` }} />}

                    </div>

                    <div className="w-[38px] shrink-0 text-right">
                      <span className="text-xs font-bold tabular-nums text-stone-800">
                        {formatPct(current.p_relegation)}
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      {hasSelections && (
                        <motion.div
                          key={`${team}-releg-delta`}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          className="w-[36px] shrink-0 text-right"
                        >
                          <span
                            className={`text-[11px] font-bold tabular-nums ${
                              delta > 0.005
                                ? "text-red-700"
                                : delta < -0.005
                                ? "text-emerald-700"
                                : "text-stone-500"
                            }`}
                          >
                            <span aria-hidden="true">{formatDelta(delta, locale)}</span>
                            <span className="sr-only">{describePp(delta, locale)}</span>
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </div>
        </Disclosure>
      </div>

      {/* Full probability table */}
      {labels.simulatedStandings && (
        <Disclosure
          className="col-span-1 lg:col-span-2 mt-2 border-t border-stone-200 pt-5"
          summary={pt ? 'Abrir a tabela completa' : 'Open the full table'}
        >
          <SimulatedTable probabilities={probabilities} baseline={data.baseline} hasSelections={hasSelections} labels={labels} />
        </Disclosure>
      )}
    </div>
    </MotionConfig>
  );
}

function SimulatedTable({
  probabilities,
  baseline,
  hasSelections,
  labels,
}: {
  probabilities: Record<string, { p_champion: number; p_top3: number; p_relegation: number }>;
  baseline: Record<string, { p_champion: number; p_top3: number; p_relegation: number }>;
  hasSelections: boolean;
  labels: MatchdayPickerProps["labels"];
}) {
  const locale = useLocale();
  // MotionConfig does not stop layout animations: the rows only reorder in
  // place when the reader allows motion (audit A11Y2-03).
  const reduceMotion = useReducedMotion();
  const formatPct = (value: number) => formatPercent(value, locale);
  const sorted = useMemo(() => {
    return Object.entries(probabilities)
      .sort((a, b) => {
        // Sort by champion desc, then top3 desc, then relegation asc
        if (b[1].p_champion !== a[1].p_champion) return b[1].p_champion - a[1].p_champion;
        if (b[1].p_top3 !== a[1].p_top3) return b[1].p_top3 - a[1].p_top3;
        return a[1].p_relegation - b[1].p_relegation;
      });
  }, [probabilities]);

  return (
    <div className="col-span-1 lg:col-span-2 mt-8 border-t border-stone-200 pt-8">
      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-4">
        {labels.simulatedStandings}
      </div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={labels.simulatedStandings}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-stone-800 text-left">
              <th className="py-2 pr-2 w-8 text-stone-500 font-medium">#</th>
              <th className="py-2 pr-4 font-medium">{labels.team}</th>
              <th className="py-2 px-3 text-right font-medium">{labels.championship}</th>
              <th className="py-2 px-3 text-right font-medium">{labels.top3}</th>
              <th className="py-2 px-3 text-right font-medium">{labels.relegation}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([team, probs], i) => {
              const base = baseline[team];
              const champDelta = probs.p_champion - base.p_champion;
              const relegDelta = probs.p_relegation - base.p_relegation;
              const isRelegationZone = i >= sorted.length - 3;
              const isChampionZone = i < 3;
              const teamColor = teamColorOnPaper(team);

              return (
                <motion.tr
                  key={team}
                  layout={!reduceMotion}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 35 }}
                  className={`border-b border-stone-200 ${
                    isRelegationZone ? "bg-red-50/40" : isChampionZone ? "bg-stone-50" : ""
                  }`}
                >
                  <td className="py-2 pr-2 text-stone-500 tabular-nums">{i + 1}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      {teamLogoSrc(team) ? (
                        <img src={teamLogoSrc(team)} alt="" width={20} height={20} loading="lazy" decoding="async" className="w-5 h-5 flex-shrink-0 object-contain" />
                      ) : (
                        <div className="w-1 h-5 flex-shrink-0" style={{ backgroundColor: teamColor }} />
                      )}
                      <span className="font-medium text-stone-900">{teamDisplayName(team)}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    <DeltaCell value={probs.p_champion} delta={champDelta} hasSelections={hasSelections} bold={probs.p_champion > 0.01} />
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {formatPct(probs.p_top3)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    <DeltaCell value={probs.p_relegation} delta={relegDelta} hasSelections={hasSelections} bold={probs.p_relegation > 0.1} danger />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeltaCell({
  value,
  delta,
  hasSelections,
  bold,
  danger,
}: {
  value: number;
  delta: number;
  hasSelections: boolean;
  bold?: boolean;
  danger?: boolean;
}) {
  const locale = useLocale();
  const formatPct = (v: number) => formatPercent(v, locale);
  const showDelta = hasSelections && Math.abs(delta * 100) >= 0.5;
  const deltaColor = danger
    ? delta > 0.005 ? "text-red-700" : delta < -0.005 ? "text-emerald-700" : "text-stone-500"
    : delta > 0.005 ? "text-emerald-700" : delta < -0.005 ? "text-red-700" : "text-stone-500";

  return (
    <span className="inline-flex items-center gap-1 justify-end">
      <span className={bold ? (danger ? "font-semibold text-red-700" : "font-semibold") : danger && value > 0 ? "text-red-700" : "text-stone-500"}>
        {formatPct(value)}
      </span>
      {showDelta && (
        <span className={`text-[11px] font-bold ${deltaColor}`}>
          <span aria-hidden="true">{formatDelta(delta, locale)}</span>
          <span className="sr-only">{describePp(delta, locale)}</span>
        </span>
      )}
    </span>
  );
}
