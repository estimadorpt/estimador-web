// Precomputes, server-side, every club's home/club-page "what does the next
// match change for me?" answer from one published bundle. Pure and
// server-safe (no React, no fetch) — callers load the JSON and pass the
// parsed objects in, same discipline as src/lib/football-fixtures.ts, which
// this module is a thin, presentation-shaped layer over.
//
// The point of computing this for all 18 clubs up front (rather than
// recomputing on the client when a visitor picks one) is diagnosis §4's
// requirement that "nothing is recomputed from rounded text" — the client
// only switches between pre-rounded, pre-linked answers.

import type { LigaPrediction, ScenarioData } from '@/types/football';
import { formatPercent } from '@/lib/football-format';
import {
  clubStakes,
  fixtureStatus,
  formatObjectiveLabel,
  listSupportedFixtures,
  nextSupportedFixtureFor,
  postponedLeftoverFor,
  relevantObjective,
  type ClubObjective,
  type FixtureStatus,
  type GameFixturesData,
} from '@/lib/football-fixtures';
import { ligaTeamSlugs, teamDisplayName } from '@/lib/config/football';

export type Locale = 'pt' | 'en';

/** One club's precomputed outlook: everything the interactive homepage
 * module and the club page's fixture section need to render without
 * recomputing anything from the underlying scenario data. */
export interface ClubOutlookEntry {
  team: string;
  slug: string;
  label: string;
  /** Route for this club's own page. */
  clubHref: string;
  /** The relevant season objective for this club (per relevantObjective), or
   * null when nothing clears its threshold — callers then fall back to the
   * finish distribution instead of forcing a stat. */
  objective: ClubObjective | null;
  objectiveLabel: string | null;
  /** Raw probability (0-1) for `objective`, before the supported match, from
   * the same dated bundle. Present whenever `objective` is, independent of
   * whether a fixture/stakes could also be resolved. */
  baseline: number | null;
  /** This club's three-outcome stakes for its supported fixture, oriented
   * from its own perspective. Null when there is no supported fixture, or
   * the conditionals don't carry this objective for this club. */
  win: number | null;
  draw: number | null;
  loss: number | null;
  opponent: string | null;
  opponentLabel: string | null;
  venue: 'home' | 'away' | null;
  /** Match-win probability for the supported fixture (1X2, this club's own
   * outcome), kept separate from the season-objective stakes above — never
   * to be mixed with them (diagnosis §4). Null when unavailable. */
  matchWinProbability: number | null;
  hasFixture: boolean;
  fixtureStatusKind: FixtureStatus['kind'] | null;
  fixtureStatusLabel: string | null;
  /** A second outstanding game from an earlier round, when the next match is
   * in the current round: "Jogo em atraso da jornada 2, marcado para 19 de
   * outubro". Null when there is none. */
  postponedLabel: string | null;
  /** `/desporto/liga/jogo/<slug>`, or null when the fixture has no resolvable
   * match page (e.g. an unresolved postponed leftover). */
  matchHref: string | null;
  /** Carries this club, its objective and the bundle version into the
   * simulator, per src/lib/football-exploration.ts's read/write contract.
   * The simulator only understands 'p_champion' | 'p_relegation' as `goal`,
   * so a top-three objective maps to 'p_champion' here (its own conditionals
   * are still the ones shown on this club's own answer, this link is only a
   * "explore further" jumping-off point). */
  simulatorHref: string;
}

function simulatorGoal(objective: ClubObjective | null): 'p_champion' | 'p_relegation' {
  return objective === 'p_relegation' ? 'p_relegation' : 'p_champion';
}

/**
 * Build one outlook entry per club in `prediction.table`, in table order.
 * Clubs without a resolvable slug are dropped (defensive: every current club
 * has one in src/lib/config/football.ts, but a data-entry name mismatch
 * should not crash the page).
 */
export function buildClubOutlooks(
  locale: Locale,
  prediction: LigaPrediction,
  scenarios: ScenarioData | null | undefined,
  gameFixtures: GameFixturesData | null | undefined,
): ClubOutlookEntry[] {
  const fixtures = listSupportedFixtures(prediction, scenarios, gameFixtures);
  const baselines = scenarios?.next_matchday_scenarios?.baseline ?? {};
  const version = `${prediction.season}-${prediction.timestamp}`;

  const entries: ClubOutlookEntry[] = [];
  for (const row of prediction.table) {
    const team = row.team;
    const slug = ligaTeamSlugs[team];
    if (!slug) continue;

    // Prefer the next-match-scenario baseline (what clubStakes' deltas are
    // relative to); fall back to the standings row so the lead objective can
    // still be picked when scenarios are unavailable (e.g. end of season).
    const objectiveSource = baselines[team] ?? row;
    const objective = relevantObjective(objectiveSource);
    const baseline = objective ? (objectiveSource[objective] ?? null) : null;

    const fixture = nextSupportedFixtureFor(team, fixtures);
    const leftover = postponedLeftoverFor(team, fixtures);
    let postponedLabel: string | null = null;
    if (leftover) {
      const other = leftover.home === team ? leftover.away : leftover.home;
      const status = fixtureStatus(leftover, prediction.timestamp, locale);
      postponedLabel = `${status.label} (${locale === 'pt' ? 'contra' : 'against'} ${teamDisplayName(other)})`;
    }
    let win: number | null = null;
    let draw: number | null = null;
    let loss: number | null = null;
    let opponent: string | null = null;
    let venue: 'home' | 'away' | null = null;
    let matchWinProbability: number | null = null;
    let fixtureStatusKind: FixtureStatus['kind'] | null = null;
    let fixtureStatusLabel: string | null = null;
    let matchHref: string | null = null;

    if (fixture) {
      const status = fixtureStatus(fixture, prediction.timestamp, locale);
      fixtureStatusKind = status.kind;
      fixtureStatusLabel = status.label;
      matchHref = fixture.slug ? `/desporto/liga/jogo/${fixture.slug}` : null;

      if (objective) {
        const stakes = clubStakes(scenarios, fixture, team, objective);
        if (stakes) {
          win = stakes.win;
          draw = stakes.draw;
          loss = stakes.loss;
          opponent = stakes.opponent;
          venue = stakes.venue;
        }
      }
      if (fixture.matchProbabilities) {
        const isHome = fixture.home === team;
        const isAway = fixture.away === team;
        if (isHome) matchWinProbability = fixture.matchProbabilities.p_home;
        else if (isAway) matchWinProbability = fixture.matchProbabilities.p_away;
      }
    }

    const simParams = new URLSearchParams({ v: version, team, goal: simulatorGoal(objective) });

    entries.push({
      team,
      slug,
      label: teamDisplayName(team),
      clubHref: `/desporto/liga/${slug}`,
      objective,
      objectiveLabel: objective ? formatObjectiveLabel(objective, locale) : null,
      baseline,
      win,
      draw,
      loss,
      opponent,
      opponentLabel: opponent ? teamDisplayName(opponent) : null,
      venue,
      matchWinProbability,
      hasFixture: Boolean(fixture),
      fixtureStatusKind,
      fixtureStatusLabel,
      postponedLabel,
      matchHref,
      simulatorHref: `/desporto/liga/simulador?${simParams.toString()}`,
    });
  }
  return entries;
}

/**
 * Percentage formatting rule shared by the homepage module and the club
 * page: whole numbers read fine at typical sizes, but a small probability
 * (Arouca's 2.3%, 0.9%…) needs one decimal or every distinct value below 10%
 * rounds to the same "2%"/"1%"/"2%"/"2%". `value` is a raw 0–1 fraction.
 */
export function formatClubPercent(value: number, locale: Locale): string {
  // The one football percentage rule (football-format.ts), so a club's
  // figure reads the same here, in the league table and on the hub (F16).
  return formatPercent(value, locale);
}

export interface PositionSpread {
  /** 1-based. */
  modalPosition: number;
  /** Raw 0–1 probability of the modal position. */
  modalProb: number;
  /** True when at least one neighbouring position also clears the "similar
   * support" threshold — the honest reading is then a range, not a single
   * confident rank. */
  broad: boolean;
  /** 1-based, inclusive: the contiguous run of positions around the modal
   * one that each carry at least half its probability. Equal to
   * modalPosition on both ends when `broad` is false. */
  rangeStart: number;
  rangeEnd: number;
  /** Raw 0–1 probability of finishing anywhere in rangeStart..rangeEnd. */
  rangeProb: number;
}

/**
 * Whether a club's finish-distribution top position only narrowly beats its
 * neighbours — i.e. whether the honest reading is "several positions have
 * similar support" rather than a single confident modal rank (diagnosis §5,
 * §9's "Club page" note on Arouca's 6th-at-12%). `probs` is position i+1's
 * probability, 0–1, index 0 = 1st place. Returns null for an empty or
 * all-zero distribution (nothing to report).
 */
export function positionSpread(probs: number[]): PositionSpread | null {
  if (!probs || probs.length === 0) return null;
  let modalIndex = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[modalIndex]) modalIndex = i;
  }
  const modalProb = probs[modalIndex];
  if (modalProb <= 0) return null;

  // A neighbour "has similar support" when it carries at least two thirds
  // of the modal position's own probability; the range extends outward from
  // the mode while that holds, contiguously. Half was too loose: it called
  // Porto's 51% first and 29% second "similar support" (audit F13).
  const threshold = (modalProb * 2) / 3;
  let start = modalIndex;
  let end = modalIndex;
  while (start > 0 && probs[start - 1] >= threshold) start--;
  while (end < probs.length - 1 && probs[end + 1] >= threshold) end++;

  return {
    modalPosition: modalIndex + 1,
    modalProb,
    broad: end > start,
    rangeStart: start + 1,
    rangeEnd: end + 1,
    rangeProb: probs.slice(start, end + 1).reduce((a, b) => a + b, 0),
  };
}
