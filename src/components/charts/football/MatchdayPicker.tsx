"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ligaTeamColors, ligaTeamSlugs, teamLogoSrc, teamDisplayName } from "@/lib/config/football";
import { Link } from "@/i18n/routing";
import type { NextMatchdayScenarios, ScenarioData } from "@/types/football";

import { conditionalProbabilities, rankMatches, readFootballExplorationState, writeFootballExplorationState, shouldPushSelectionState, type Outcome } from "@/lib/football-exploration";
import { nextSupportedFixtureFor, clubStakes, fixtureStatus, type SupportedFixture } from "@/lib/football-fixtures";
import { formatClubPercent, type Locale } from "@/components/football/club-outlook";

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

function formatDelta(delta: number): string {
  const pct = delta * 100;
  if (Math.abs(pct) < 0.5) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${Math.round(pct)} pp`;
}

function formatPct(value: number): string {
  const pct = value * 100;
  if (pct > 99 && pct < 100) return ">99%";
  if (pct < 1 && pct > 0) return "<1%";
  return `${Math.round(pct)}%`;
}

// Same digit rule as formatClubPercent (one decimal below 10 pp, whole above)
// so a small delta — e.g. Arouca's relegation odds moving from 2.29% to
// 0.89% — reads as "-1,4 pp" instead of rounding to "—". Kept separate from
// the shared `formatDelta` above (still Math.round-based) so this fix stays
// scoped to the header line and "O meu próximo jogo" stakes card, and
// doesn't change the detail table / title-race deltas below.
function formatDeltaPrecise(delta: number, locale: Locale): string {
  const pct = delta * 100;
  if (Math.abs(pct) < 1e-9) return "—";
  const digits = Math.abs(pct) < 10 ? 1 : 0;
  const sign = pct > 0 ? "+" : "";
  const formatted = new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(pct);
  return `${sign}${formatted} pp`;
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
    const winLabel = pt ? `Se ${teamDisplayName(focusTeam)} ganhar` : `If ${teamDisplayName(focusTeam)} win`;
    const loseLabel = pt ? `Se ${teamDisplayName(focusTeam)} perder` : `If ${teamDisplayName(focusTeam)} lose`;
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
    shortHome: teamDisplayName(match.home_team).charAt(0),
    shortDraw: pt ? "E" : "D",
    shortAway: teamDisplayName(match.away_team).charAt(0),
  };
}

export function MatchdayPicker({ data, labels, version = "demo", matchHrefs = {}, supportedFixtures = [], forecastTimestamp = "" }: MatchdayPickerProps) {
  const locale = useLocale();
  const pt = locale !== "en";
  const localeCode: Locale = pt ? "pt" : "en";
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
  const visibleOtherMatches = showAll ? otherRankedMatches : otherRankedMatches.filter((item, i) => i < 3 || selections[item.index]);
  const supportedByIndex = useMemo(() => {
    const map = new Map<number, SupportedFixture>();
    for (const f of supportedFixtures) map.set(f.index, f);
    return map;
  }, [supportedFixtures]);

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
            ? 'Segue uma equipa para veres o que o teu próximo jogo muda no objetivo escolhido, e quais os outros jogos que mais pesam.'
            : 'Follow a club to see what your next match changes for the chosen objective, and which other matches weigh most.'}
        </p>
        <select
          value=""
          onChange={e => e.target.value && setFocusTeam(e.target.value)}
          className="mb-6 block min-h-11 w-full max-w-sm rounded-lg border border-line bg-paper px-2 text-sm text-ink"
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

        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3">
          {pt ? 'Todos os jogos incluídos nesta previsão' : 'Every fixture in this forecast'}
        </div>
        <ul className="space-y-1">
          {supportedFixtures.map(f => (
            <li key={f.index} className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 py-2 text-sm text-ink">
              <span>
                {teamDisplayName(f.home)} — {teamDisplayName(f.away)}
                {f.postponed && (
                  <span className="ml-2 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    {pt ? 'jogo em atraso' : 'postponed'}
                  </span>
                )}
              </span>
              <span className="text-xs text-ink-muted">
                {pt ? `Jornada ${f.matchday}` : `Matchday ${f.matchday}`}
                {matchHrefs[`${f.home}|${f.away}`] && (
                  <>
                    {' · '}
                    <Link href={matchHrefs[`${f.home}|${f.away}`]} locale={locale} className="font-semibold text-ink underline underline-offset-2">
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <section aria-label={pt?'A tua pergunta':'Your question'} className="sticky top-[66px] z-20 col-span-full rounded-xl border border-line bg-cream p-3 shadow-sm md:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 text-xs font-semibold text-ink-muted">{pt?'Segue uma equipa':'Follow a team'}<select value={focusTeam} onChange={e=>setFocusTeam(e.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-paper px-2 text-sm text-ink">{Object.keys(data.baseline).sort((a,b)=>teamDisplayName(a).localeCompare(teamDisplayName(b),'pt')).map(team=><option key={team} value={team}>{teamDisplayName(team)}</option>)}</select></label>
          <label className="min-w-0 flex-1 text-xs font-semibold text-ink-muted">{pt?'O que queres saber?':'What matters to you?'}<select value={objective} onChange={e=>setObjective(e.target.value as typeof objective)} className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-paper px-2 text-sm text-ink"><option value="p_champion">{pt?'Ganhar o título':'Win the title'}</option><option value="p_relegation">{pt?'Despromoção':'Relegation'}</option></select></label>
          <p aria-live="polite" aria-atomic="true" className="basis-full text-sm leading-relaxed text-ink md:basis-auto"><strong>{teamDisplayName(focusTeam)}</strong> · {pt?'Base':'Baseline'} {formatClubPercent(focalBaseline, localeCode)} → <strong>{hasSelections?(pt?'Com a escolha':'With the choice'):(pt?'Sem escolha':'No selection')} {formatClubPercent(focalCurrent, localeCode)}</strong>{hasSelections&&` (${formatDeltaPrecise(focalCurrent - focalBaseline, localeCode)})`}</p>
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
        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3">
          {pt ? 'O meu próximo jogo' : 'My next match'}
        </div>
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
              <strong>{teamDisplayName(myFixture.home)}</strong> — <strong>{teamDisplayName(myFixture.away)}</strong>
              {myFixtureStatus && <span className="text-ink-muted"> · {myFixtureStatus.label}</span>}
            </p>
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-line bg-paper p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{pt ? 'Agora' : 'Now'}</div>
                <div className="mt-1 text-lg font-bold tabular-nums text-ink">{formatClubPercent(myStakes.baseline, localeCode)}</div>
              </div>
              {([
                { outcome: myWinOutcome, label: pt ? `Se ${teamDisplayName(focusTeam)} ganhar` : `If ${teamDisplayName(focusTeam)} win`, value: myStakes.win },
                { outcome: 'D' as Outcome, label: pt ? 'Se empatar' : 'If they draw', value: myStakes.draw },
                { outcome: myLossOutcome, label: pt ? `Se ${teamDisplayName(focusTeam)} perder` : `If ${teamDisplayName(focusTeam)} lose`, value: myStakes.loss },
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
                    <div className={`text-[11px] font-bold uppercase tracking-wider ${active ? 'text-cream' : 'text-stone-400'}`}>{row.label}</div>
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
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            {pt ? 'Outros jogos que afetam este objetivo' : 'Other matches that affect this objective'}
          </div>
          {hasSelections && (
            <button
              onClick={resetAll}
              className="min-h-11 rounded-lg border border-line px-3 text-xs font-bold text-ink hover:bg-paper transition-colors"
            >
              {labels.resetAll}
            </button>
          )}
        </div>

        <p className="mb-3 text-sm leading-relaxed text-ink-muted">{pt?'Ordenados pela diferença entre vitória, empate e derrota — não é uma pontuação de importância causal, nem ordem cronológica.':'Ordered by the spread between win, draw and loss — not a causal importance score, and not chronological.'}</p>
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
                <div className="order-0 col-span-2 flex items-center justify-between gap-3 text-[11px] text-ink-muted">
                  <span>
                    {meta && (pt ? `Jornada ${meta.matchday}` : `Matchday ${meta.matchday}`)}
                    {meta?.postponed && (
                      <span className="ml-1.5 font-bold uppercase tracking-wider text-amber-700">{pt ? '· jogo em atraso' : '· postponed'}</span>
                    )}
                    {meta && ' · '}
                    {pt ? 'Diferença entre desfechos' : 'Difference between outcomes'}: {(swing*100).toLocaleString(pt?'pt-PT':'en-GB',{maximumFractionDigits:1})} pp
                  </span>
                  {matchHrefs[`${match.home_team}|${match.away_team}`] && <Link href={matchHrefs[`${match.home_team}|${match.away_team}`]} locale={locale} className="font-semibold text-ink underline underline-offset-2">{pt?'Ver jogo':'Match preview'}</Link>}
                </div>
                {/* Home team */}
                <div className="order-1 flex min-w-0 items-center gap-1.5 sm:w-[120px] sm:justify-end">
                  {ligaTeamSlugs[match.home_team] ? <Link href={`/desporto/liga/${ligaTeamSlugs[match.home_team]}`} locale={locale} className="text-xs font-medium text-stone-700 text-right underline-offset-2 hover:underline">{teamDisplayName(match.home_team)}</Link> : <span className="text-xs font-medium text-stone-700 text-right">{teamDisplayName(match.home_team)}</span>}
                  {teamLogoSrc(match.home_team) && (
                    <img
                      src={teamLogoSrc(match.home_team)}
                      alt=""
                      className="w-5 h-5 object-contain flex-shrink-0"
                    />
                  )}
                </div>

                {/* H/D/A buttons */}
                <div className="order-3 col-span-2 flex justify-center gap-2 sm:order-2 sm:gap-1">
                  <button
                    onClick={() => toggleSelection(idx, "H")}
                    aria-pressed={selected === "H"}
                    aria-label={`${match.home_team} — ${match.away_team}: ${outcomeLabels.home}`}
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
                    aria-label={`${match.home_team} — ${match.away_team}: ${outcomeLabels.draw}`}
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
                    aria-label={`${match.home_team} — ${match.away_team}: ${outcomeLabels.away}`}
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
                      className="w-5 h-5 object-contain flex-shrink-0"
                    />
                  )}
                  {ligaTeamSlugs[match.away_team] ? <Link href={`/desporto/liga/${ligaTeamSlugs[match.away_team]}`} locale={locale} className="text-xs font-medium text-stone-700 underline-offset-2 hover:underline">{teamDisplayName(match.away_team)}</Link> : <span className="text-xs font-medium text-stone-700">{teamDisplayName(match.away_team)}</span>}
                </div>
              </div>
            );
          })}
        </div>
        {otherRankedMatches.length>3&&<button onClick={()=>setShowAll(!showAll)} className="mt-3 min-h-11 text-sm font-semibold text-ink underline underline-offset-4">{showAll?(pt?'Mostrar os jogos principais':'Show key matches'):(pt?`Ver todos os ${otherRankedMatches.length} jogos`:`See all ${otherRankedMatches.length} matches`)}</button>}
      </div>

      {/* Right: Probability impact */}
      <div className="min-w-0 rounded-2xl border border-line bg-cream p-5 md:p-6">
        <div className="mb-5 rounded-xl bg-paper p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{pt ? 'A resposta para a tua equipa' : 'Your team’s answer'}</p>
          <p className="mt-1 text-sm text-ink"><strong>{teamDisplayName(focusTeam)}</strong> · {objective === 'p_champion' ? (pt ? 'ganhar o título' : 'win the title') : (pt ? 'descer de divisão' : 'be relegated')}</p>
          {selectedFixture && selectedOutcome ? <p className="mt-2 text-sm leading-relaxed text-ink-muted">{teamDisplayName(selectedFixture.home_team)} {selectedOutcome === 'H' ? (pt ? 'vence' : 'win') : selectedOutcome === 'D' ? (pt ? 'empata com' : 'draw') : (pt ? 'perde para' : 'lose to')} {teamDisplayName(selectedFixture.away_team)}: <strong className="text-ink">{formatPct(focalCurrent)}</strong> ({formatDelta(focalCurrent - focalBaseline)} {pt ? 'face à base' : 'from baseline'}).</p> : <p className="mt-2 text-sm leading-relaxed text-ink-muted">{pt ? 'Escolhe vitória caseira, empate ou vitória visitante para comparar cada desfecho com a previsão de base.' : 'Choose a home win, draw or away win to compare that outcome with the baseline forecast.'}</p>}
        </div>
        <div className="mb-5 flex flex-wrap gap-x-4 gap-y-2 border-b border-line pb-4 text-xs text-ink-muted">
          <span>{pt ? 'Probabilidade · escala 0–100%' : 'Probability · 0–100% scale'}</span>
          {hasSelections && <span className="inline-flex items-center gap-2"><i aria-hidden="true" className="h-4 w-[2px] bg-ink" />{pt ? 'Previsão de base' : 'Baseline forecast'}</span>}
          {hasSelections && <span>{pt ? 'Variação em pontos percentuais' : 'Change in percentage points'}</span>}
        </div>
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-ink underline underline-offset-4">{pt ? 'Ver o detalhe de todas as equipas' : 'See all-team detail'}</summary>
          <div className="mt-5">
        {/* Title race */}
        {titleTeams.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3">
              {labels.impactOnTitle}
            </div>
            <div className="space-y-2">
              {titleTeams.map((team) => {
                const base = data.baseline[team];
                const current = probabilities[team];
                const delta = current.p_champion - base.p_champion;
                const teamColor = ligaTeamColors[team] || "#5f7062";

                return (
                  <div key={team} className="scenario-probability-row flex items-center gap-2 border-b border-line/50 py-2 last:border-0">
                    <div className="flex min-w-0 shrink-0 items-center gap-1.5 w-[88px] sm:w-[110px]">
                      {teamLogoSrc(team) && (
                        <img
                          src={teamLogoSrc(team)}
                          alt=""
                          className="w-4 h-4 object-contain flex-shrink-0"
                        />
                      )}
                      <span className="text-xs font-medium text-stone-700 truncate">
                        {team}
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
                                ? "text-emerald-600"
                                : delta < -0.005
                                ? "text-red-600"
                                : "text-stone-400"
                            }`}
                          >
                            {formatDelta(delta)}
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3">
              {labels.impactOnRelegation}
            </div>
            <div className="space-y-2">
              {relegationTeams.map((team) => {
                const base = data.baseline[team];
                const current = probabilities[team];
                const delta = current.p_relegation - base.p_relegation;
                const teamColor = ligaTeamColors[team] || "#5f7062";

                return (
                  <div key={team} className="scenario-probability-row flex items-center gap-2 border-b border-line/50 py-2 last:border-0">
                    <div className="flex min-w-0 shrink-0 items-center gap-1.5 w-[88px] sm:w-[110px]">
                      {teamLogoSrc(team) && (
                        <img
                          src={teamLogoSrc(team)}
                          alt=""
                          className="w-4 h-4 object-contain flex-shrink-0"
                        />
                      )}
                      <span className="text-xs font-medium text-stone-700 truncate">
                        {team}
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
                                ? "text-red-600"
                                : delta < -0.005
                                ? "text-emerald-600"
                                : "text-stone-400"
                            }`}
                          >
                            {formatDelta(delta)}
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
        </details>
      </div>

      {/* Full probability table */}
      {labels.simulatedStandings && (
        <details className="col-span-1 lg:col-span-2 mt-2 border-t border-stone-200 pt-5">
          <summary className="cursor-pointer text-sm font-semibold text-ink underline underline-offset-4">{pt ? 'Abrir a tabela completa' : 'Open the full table'}</summary>
          <SimulatedTable probabilities={probabilities} baseline={data.baseline} hasSelections={hasSelections} labels={labels} />
        </details>
      )}
    </div>
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
      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-4">
        {labels.simulatedStandings}
      </div>
      <div className="overflow-x-auto">
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
              const teamColor = ligaTeamColors[team] || "#5f7062";

              return (
                <motion.tr
                  key={team}
                  layout
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className={`border-b border-stone-200 ${
                    isRelegationZone ? "bg-red-50/40" : isChampionZone ? "bg-stone-50" : ""
                  }`}
                >
                  <td className="py-2 pr-2 text-stone-400 tabular-nums">{i + 1}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      {teamLogoSrc(team) ? (
                        <img src={teamLogoSrc(team)} alt="" className="w-5 h-5 flex-shrink-0 object-contain" />
                      ) : (
                        <div className="w-1 h-5 flex-shrink-0" style={{ backgroundColor: teamColor }} />
                      )}
                      <span className="font-medium text-stone-900">{team}</span>
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
  const showDelta = hasSelections && Math.abs(delta * 100) >= 0.5;
  const deltaColor = danger
    ? delta > 0.005 ? "text-red-600" : delta < -0.005 ? "text-emerald-600" : "text-stone-400"
    : delta > 0.005 ? "text-emerald-600" : delta < -0.005 ? "text-red-600" : "text-stone-400";

  return (
    <span className="inline-flex items-center gap-1 justify-end">
      <span className={bold ? (danger ? "font-semibold text-red-700" : "font-semibold") : danger && value > 0 ? "text-red-600" : "text-stone-400"}>
        {formatPct(value)}
      </span>
      {showDelta && (
        <span className={`text-[11px] font-bold ${deltaColor}`}>
          {formatDelta(delta)}
        </span>
      )}
    </span>
  );
}
