// Which outstanding fixture the published forecast bundle supports for a
// given Liga Portugal club, and what each of its three outcomes changes for
// that club's relevant season objective.
//
// Pure, server-safe (no React, no fetch): callers load the JSON (via
// football-data-loader.ts or directly) and pass the parsed objects in.
//
// Terminology, matching the JSON on disk:
//  - `prediction` (mdNN.json)          uses `home` / `away` on its matches.
//  - `scenarios`  (mdNN_scenarios.json) uses `home_team` / `away_team` on its
//    `next_matchday_scenarios.matches`, which can span several matchdays at
//    once (the round in progress, a postponed leftover from an earlier
//    round, and the next full round).
//  - `game_fixtures.json`               is the only place a fixture's own
//    kickoff and its confirmation status live; the match/prediction files
//    never carry both.
//
// See docs/design/product-usability-diagnosis-2026-09-17.md §4/5/12 for the
// editorial rules this module encodes (fixture eligibility, club continuity,
// orientation, "never claim a verified kickoff").

import type {
  LigaPrediction,
  NextMatchdayScenarioMatch,
  ScenarioData,
} from '@/types/football';
import { assignFixtureSlugs, fixtureSlug } from '@/lib/config/fixtures';
import { formatLongDate } from '@/lib/football-format';

/* --------------------------------------------------------- game_fixtures */

/** One fixture entry inside game_fixtures.json. Defined locally: nothing in
 * src/types/football.ts models this file, and it is not consumed anywhere
 * else in a way that would justify adding it there. */
export interface GameFixtureEntry {
  id: string;
  home: string;
  away: string;
  /** UTC ISO timestamp. A placeholder until `kickoff_confirmed` is true. */
  kickoff: string;
  kickoff_confirmed: boolean;
  /** When the game server stops taking picks for this fixture. */
  locks_at?: string | null;
  /** The model's pre-round 1X2, frozen when the round opened; null until priced. */
  p_home?: number | null;
  p_draw?: number | null;
  p_away?: number | null;
  home_goals?: number | null;
  away_goals?: number | null;
  /** Which publication the probabilities came from (`md07.json@10877c9`). */
  probs_source?: string | null;
  published_at?: string | null;
  [key: string]: unknown;
}

export interface GameFixturesMatchday {
  matchday: number;
  kickoff_confirmed: boolean;
  opens_at?: string | null;
  fixtures: GameFixtureEntry[];
}

export interface GameFixturesData {
  season: string;
  generated_at: string;
  n_matchdays: number;
  matchdays: GameFixturesMatchday[];
}

/* --------------------------------------------------------------- fixtures */

export interface SupportedFixture {
  /** Index into scenarios.next_matchday_scenarios.matches. */
  index: number;
  matchday: number;
  home: string;
  away: string;
  /** ISO timestamp, only when present in matches_remaining or game_fixtures.json. */
  kickoff?: string;
  kickoffConfirmed: boolean;
  /** True when this fixture's matchday is below the bundle's current matchday
   * (scenarios.matchday) — a leftover from an earlier round, not the club's
   * next scheduled game. */
  postponed: boolean;
  /** 1X2 for this fixture, from prediction.next_matchday, when available. */
  matchProbabilities?: { p_home: number; p_draw: number; p_away: number };
  /** Match page slug, or null when the page cannot be resolved (e.g. a
   * postponed fixture that neither matches_remaining nor next_matchday carries). */
  slug: string | null;
}

/** Editorial thresholds and small helpers shared by relevantObjective. */
export const RELEVANT_OBJECTIVE_THRESHOLD = 0.05;
/** Below the title threshold, relegation/top-3 must still clear this to be
 * worth leading with — otherwise a club like mid-table Arouca (relegation
 * 2.3%, top-3 0.03%) would still get a stat, just a meaningless one. */
export const RELEVANT_OBJECTIVE_FALLBACK_THRESHOLD = 0.01;

export type ClubObjective = 'p_champion' | 'p_relegation' | 'p_top3';

/** Shape of one entry in next_matchday_scenarios.baseline / conditionals.teams. */
export interface TeamBaseline {
  p_champion: number;
  p_top3: number;
  p_relegation: number;
}

export interface ClubStakes {
  team: string;
  objective: ClubObjective;
  /** Raw probability (0–1) before the match, for the chosen objective. */
  baseline: number;
  /** Raw probability (0–1) conditional on the club winning. */
  win: number;
  /** Raw probability (0–1) conditional on a draw. */
  draw: number;
  /** Raw probability (0–1) conditional on the club losing. */
  loss: number;
  /** Percentage points relative to baseline, from raw (unrounded) values. */
  deltas: { win: number; draw: number; loss: number };
  opponent: string;
  venue: 'home' | 'away';
}

function matchdayFixtureKey(home: string, away: string, matchday: number): string {
  return `${matchday}|${home}|${away}`;
}

/**
 * Every fixture the published bundle's conditional scenarios cover, in
 * scenario order. Each club's own supported fixture is found by calling
 * `nextSupportedFixtureFor` on the result — a club can appear in more than
 * one entry here (e.g. a postponed leftover from an earlier round *and* its
 * next scheduled round), and the eligibility rule is "lowest matchday wins".
 */
export function listSupportedFixtures(
  prediction: LigaPrediction,
  scenarios: ScenarioData | null | undefined,
  gameFixtures?: GameFixturesData | null,
): SupportedFixture[] {
  const nms = scenarios?.next_matchday_scenarios;
  if (!nms || !scenarios) return [];

  // Mirror loadUpcomingFixtures' union and ordering exactly, so the slugs we
  // compute here are the same ones the real per-match pages resolve to.
  type RawResolvable = { home: string; away: string; matchday: number };
  const resolvable: RawResolvable[] = [];
  for (const m of prediction.matches_remaining ?? []) {
    resolvable.push({ home: m.home, away: m.away, matchday: prediction.matchday });
  }
  const nextMd = prediction.next_matchday?.matchday ?? prediction.matchday + 1;
  for (const m of prediction.next_matchday?.matches ?? []) {
    resolvable.push({ home: m.home, away: m.away, matchday: nextMd });
  }
  const withSlugs = assignFixtureSlugs(resolvable);
  const slugByKey = new Map<string, string>();
  for (const r of withSlugs) {
    slugByKey.set(matchdayFixtureKey(r.home, r.away, r.matchday), r.slug);
  }

  // Kickoff + confirmation status: game_fixtures.json is the authoritative
  // source (it is the only file that carries kickoff_confirmed at all).
  const gameFixtureByKey = new Map<string, GameFixtureEntry>();
  for (const md of gameFixtures?.matchdays ?? []) {
    for (const fx of md.fixtures ?? []) {
      gameFixtureByKey.set(matchdayFixtureKey(fx.home, fx.away, md.matchday), fx);
    }
  }
  // Fallback for the round already in progress: matches_remaining carries a
  // kickoff (no confirmation flag) for fixtures not yet resolved in
  // game_fixtures.json.
  const remainingKickoffByKey = new Map<string, string>();
  for (const m of prediction.matches_remaining ?? []) {
    if (m.kickoff) {
      remainingKickoffByKey.set(matchdayFixtureKey(m.home, m.away, prediction.matchday), m.kickoff);
    }
  }

  const matchProbsByKey = new Map<string, { p_home: number; p_draw: number; p_away: number }>();
  for (const m of prediction.next_matchday?.matches ?? []) {
    matchProbsByKey.set(matchdayFixtureKey(m.home, m.away, nextMd), {
      p_home: m.p_home,
      p_draw: m.p_draw,
      p_away: m.p_away,
    });
  }

  return nms.matches.map((match, index) => {
    // `matchday` is optional on the type (older/synthetic bundles may omit
    // it); treat a missing value as "the round in progress" — not postponed,
    // since we have no evidence it is a leftover from an earlier round.
    const matchday = match.matchday ?? scenarios.matchday;
    const key = matchdayFixtureKey(match.home_team, match.away_team, matchday);
    const gameFixture = gameFixtureByKey.get(key);
    const postponed = matchday < scenarios.matchday;
    let kickoff = gameFixture?.kickoff ?? remainingKickoffByKey.get(key);
    // A leftover's kickoff is only its new date when it lies after this
    // forecast; an earlier one is the original slot it was postponed from.
    if (postponed && kickoff) {
      const ms = Date.parse(kickoff);
      const forecastMs = Date.parse(prediction.timestamp);
      if (Number.isNaN(ms) || Number.isNaN(forecastMs) || ms <= forecastMs) kickoff = undefined;
    }
    const fixture: SupportedFixture = {
      index,
      matchday,
      home: match.home_team,
      away: match.away_team,
      kickoffConfirmed: kickoff ? (gameFixture?.kickoff_confirmed ?? false) : false,
      postponed,
      slug: slugByKey.get(key) ?? null,
    };
    if (kickoff) fixture.kickoff = kickoff;
    const matchProbabilities = matchProbsByKey.get(key);
    if (matchProbabilities) fixture.matchProbabilities = matchProbabilities;
    return fixture;
  });
}

function kickoffMs(fixture: SupportedFixture): number | null {
  if (!fixture.kickoff) return null;
  const ms = Date.parse(fixture.kickoff);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * The fixture eligibility rule: a club's next match is its entry in the
 * current round (the lowest non-postponed matchday). A postponed leftover
 * from an earlier round only takes that place when it is genuinely played
 * first — it has a rescheduled kickoff earlier than the current-round game —
 * or when the club has nothing else outstanding. An undated leftover never
 * outranks a scheduled current-round game (Braga's postponed matchday 2 game,
 * moved to 19 October, is not its next match on 9 October).
 *
 * Returns null when the club has no entry at all: callers must then show the
 * dated baseline and say so, never substitute a rival's match.
 */
export function nextSupportedFixtureFor(
  team: string,
  fixtures: SupportedFixture[],
): SupportedFixture | null {
  const mine = fixtures.filter(f => f.home === team || f.away === team);
  if (mine.length === 0) return null;
  const lowest = (list: SupportedFixture[]) =>
    list.reduce<SupportedFixture | null>((best, f) => (!best || f.matchday < best.matchday ? f : best), null);

  const current = lowest(mine.filter(f => !f.postponed));
  const leftover = lowest(mine.filter(f => f.postponed));
  if (!current) return leftover;
  if (!leftover) return current;

  const leftoverMs = kickoffMs(leftover);
  const currentMs = kickoffMs(current);
  if (leftoverMs !== null && currentMs !== null && leftoverMs < currentMs) return leftover;
  return current;
}

/**
 * The club's other outstanding fixture when its next match is in the current
 * round but an earlier round's game is still to be played: shown as a
 * secondary "jogo em atraso" line. Null when there is none, or when the
 * leftover is itself the next match.
 */
export function postponedLeftoverFor(
  team: string,
  fixtures: SupportedFixture[],
): SupportedFixture | null {
  const next = nextSupportedFixtureFor(team, fixtures);
  const leftovers = fixtures.filter(
    f => f.postponed && f !== next && (f.home === team || f.away === team),
  );
  return leftovers.reduce<SupportedFixture | null>(
    (best, f) => (!best || f.matchday < best.matchday ? f : best),
    null,
  );
}

/**
 * Which season objective is worth showing this club's stakes for. Title
 * chances lead when they clear the 5% threshold. Otherwise, whichever of
 * relegation risk and top-three chances is larger wins — this is what lets a
 * club like Arouca (title ≈0%, relegation 2.3%, top-3 0.03%) surface its
 * relegation risk instead of a smaller, less relevant top-three figure — but
 * only when that larger value itself clears 1%; a club with negligible risk
 * on every count gets no forced stat. Top-three is not automatically the
 * same event as European qualification (see diagnosis §5, club page).
 * Returns null when nothing clears its threshold, so callers fall back to
 * the finish distribution instead of forcing a stat.
 */
export function relevantObjective(baseline: Partial<TeamBaseline> | undefined): ClubObjective | null {
  if (!baseline) return null;
  if (typeof baseline.p_champion === 'number' && baseline.p_champion >= RELEVANT_OBJECTIVE_THRESHOLD) {
    return 'p_champion';
  }
  const relegation = typeof baseline.p_relegation === 'number' ? baseline.p_relegation : -1;
  const top3 = typeof baseline.p_top3 === 'number' ? baseline.p_top3 : -1;
  if (relegation < 0 && top3 < 0) return null;
  const fallback: ClubObjective = relegation >= top3 ? 'p_relegation' : 'p_top3';
  const fallbackValue = Math.max(relegation, top3);
  return fallbackValue >= RELEVANT_OBJECTIVE_FALLBACK_THRESHOLD ? fallback : null;
}

function conditionalTeamValue(
  match: NextMatchdayScenarioMatch,
  outcome: 'H' | 'D' | 'A',
  team: string,
  objective: ClubObjective,
): number | undefined {
  const value = match.conditionals?.[outcome]?.teams?.[team]?.[objective];
  return typeof value === 'number' ? value : undefined;
}

/**
 * This club's three-outcome stakes for one fixture and objective, oriented
 * from its own perspective: "win" is the H conditional when the club plays
 * at home and the A conditional when it plays away, and "loss" is the
 * reverse. Deltas are computed from the raw (unrounded) probabilities.
 * Returns null when the fixture doesn't involve this club, the scenario
 * conditionals are unavailable, or the objective isn't carried for this club.
 */
export function clubStakes(
  scenarios: ScenarioData | null | undefined,
  fixture: SupportedFixture,
  team: string,
  objective: ClubObjective,
): ClubStakes | null {
  const nms = scenarios?.next_matchday_scenarios;
  if (!nms) return null;
  const match = nms.matches[fixture.index];
  if (!match) return null;

  const isHome = match.home_team === team;
  const isAway = match.away_team === team;
  if (!isHome && !isAway) return null;

  const baseline = nms.baseline[team]?.[objective];
  if (typeof baseline !== 'number') return null;

  const winOutcome: 'H' | 'A' = isHome ? 'H' : 'A';
  const lossOutcome: 'H' | 'A' = isHome ? 'A' : 'H';

  const win = conditionalTeamValue(match, winOutcome, team, objective);
  const draw = conditionalTeamValue(match, 'D', team, objective);
  const loss = conditionalTeamValue(match, lossOutcome, team, objective);
  if (win === undefined || draw === undefined || loss === undefined) return null;

  return {
    team,
    objective,
    baseline,
    win,
    draw,
    loss,
    deltas: {
      win: (win - baseline) * 100,
      draw: (draw - baseline) * 100,
      loss: (loss - baseline) * 100,
    },
    opponent: isHome ? match.away_team : match.home_team,
    venue: isHome ? 'home' : 'away',
  };
}

/* ---------------------------------------------------------------- labels */

const OBJECTIVE_LABELS: Record<ClubObjective, { pt: string; en: string }> = {
  p_champion: { pt: 'ser campeão', en: 'winning the title' },
  p_relegation: { pt: 'despromoção', en: 'relegation' },
  // Top three is not automatically the same event as European qualification
  // (diagnosis §5) — never call it "Europa".
  p_top3: { pt: 'ficar no top 3', en: 'finishing in the top 3' },
};

export function formatObjectiveLabel(objective: ClubObjective, locale: 'pt' | 'en'): string {
  return OBJECTIVE_LABELS[objective][locale];
}

// Kickoffs are published in UTC; the calendar day a reader needs is the
// Lisbon one (a 23:00Z kickoff in summer is the next day in Portugal).
function formatDate(iso: string, locale: 'pt' | 'en'): string {
  return formatLongDate(iso, locale, { year: false });
}

/** A postponed fixture's kickoff counts as its new date only when it falls
 * after the forecast it is published with; anything earlier is the original,
 * already-passed slot the manifest has not caught up with. */
function rescheduledKickoff(fixture: SupportedFixture, forecastTimestamp: string): string | null {
  if (!fixture.kickoff) return null;
  const kickoff = Date.parse(fixture.kickoff);
  const forecast = Date.parse(forecastTimestamp);
  if (Number.isNaN(kickoff) || Number.isNaN(forecast)) return null;
  return kickoff > forecast ? fixture.kickoff : null;
}

export interface FixtureStatus {
  label: string;
  kind: 'next' | 'postponed' | 'unscheduled';
}

/**
 * A label safe to publish next to a supported fixture. Never invents a
 * verified kickoff, "hoje"/"esta noite" wording or a countdown — those all
 * require knowing the current time, which this function deliberately does
 * not take as an input. `forecastTimestamp` is the published bundle's own
 * timestamp, used only to date an otherwise unscheduled fixture.
 */
export function fixtureStatus(
  fixture: SupportedFixture,
  forecastTimestamp: string,
  locale: 'pt' | 'en',
): FixtureStatus {
  if (fixture.postponed) {
    const newDate = rescheduledKickoff(fixture, forecastTimestamp);
    const base =
      locale === 'pt'
        ? `Jogo em atraso da jornada ${fixture.matchday}`
        : `Postponed round ${fixture.matchday} match`;
    return {
      kind: 'postponed',
      label: newDate
        ? `${base}${locale === 'pt' ? ', marcado para ' : ', now on '}${formatDate(newDate, locale)}`
        : base,
    };
  }

  if (!fixture.kickoff) {
    const forecastDate = formatDate(forecastTimestamp, locale);
    return {
      kind: 'unscheduled',
      label:
        locale === 'pt'
          ? `Próximo jogo incluído na previsão de ${forecastDate}`
          : `Next match included in the ${forecastDate} forecast`,
    };
  }

  const kickoffDate = formatDate(fixture.kickoff, locale);
  if (fixture.kickoffConfirmed) {
    return {
      kind: 'next',
      label: locale === 'pt' ? `Próximo jogo · ${kickoffDate}` : `Next match · ${kickoffDate}`,
    };
  }
  return {
    kind: 'next',
    label:
      locale === 'pt'
        ? `Próximo jogo previsto para ${kickoffDate} (horário por confirmar)`
        : `Next match expected ${kickoffDate} (kickoff unconfirmed)`,
  };
}

/* ------------------------------------------------------- fixture stakes */

/** The club a fixture moves most on one race, and by how much (0–1 scale). */
export interface RaceSwing {
  team: string;
  /** Spread between the club's best and worst conditional, in probability. */
  swing: number;
}

export interface FixtureSwings {
  title: RaceSwing | null;
  relegation: RaceSwing | null;
}

/** Editorial threshold for a stakes badge: 5 percentage points. */
export const STAKES_BADGE_THRESHOLD = 0.05;

/**
 * What one fixture can change, read from its own published conditionals:
 * for each race, the club whose probability spreads most between the home
 * win, the draw and the away win (Marítimo–Porto in md08: 18 pp on the
 * title for Porto, 15 pp on relegation for Marítimo). This replaces the
 * season-wide `decisive_matches` top-30 list, which covers only a handful of
 * the round's games and so left every other fixture with no stakes at all.
 */
export function fixtureSwings(match: NextMatchdayScenarioMatch | null | undefined): FixtureSwings {
  if (!match?.conditionals) return { title: null, relegation: null };
  const outcomes = (['H', 'D', 'A'] as const).map(o => match.conditionals[o]?.teams ?? {});
  const teams = new Set<string>();
  for (const t of outcomes) for (const name of Object.keys(t)) teams.add(name);
  const best = (metric: 'p_champion' | 'p_relegation'): RaceSwing | null => {
    let top: RaceSwing | null = null;
    for (const team of teams) {
      const values = outcomes
        .map(t => t[team]?.[metric])
        .filter((v): v is number => typeof v === 'number');
      if (values.length < 3) continue;
      const swing = Math.max(...values) - Math.min(...values);
      if (!top || swing > top.swing) top = { team, swing };
    }
    return top && top.swing > 0 ? top : null;
  };
  return { title: best('p_champion'), relegation: best('p_relegation') };
}

/** Combined stakes of a fixture, for choosing the round's "jogo da jornada". */
export function combinedSwing(s: FixtureSwings): number {
  return (s.title?.swing ?? 0) + (s.relegation?.swing ?? 0);
}

/**
 * Chronological order for a round: by kickoff, earliest first; fixtures
 * without a kickoff go last, in matchday order and then their given order
 * (the owner's standing preference is chronological, never by a hidden
 * importance score).
 */
export function byKickoff<T extends { kickoff?: string | null; matchday?: number }>(fixtures: T[]): T[] {
  return fixtures
    .map((f, i) => ({ f, i, ms: f.kickoff ? Date.parse(f.kickoff) : NaN }))
    .sort((a, b) => {
      const aHas = !Number.isNaN(a.ms);
      const bHas = !Number.isNaN(b.ms);
      if (aHas && bHas && a.ms !== b.ms) return a.ms - b.ms;
      if (aHas !== bHas) return aHas ? -1 : 1;
      const md = (a.f.matchday ?? 0) - (b.f.matchday ?? 0);
      return md !== 0 ? md : a.i - b.i;
    })
    .map(x => x.f);
}

// Re-exported so callers building slugs for a fixture this module didn't
// resolve (e.g. after the underlying data changes shape) stay consistent
// with the per-match route without duplicating the slug convention.
export { fixtureSlug };
