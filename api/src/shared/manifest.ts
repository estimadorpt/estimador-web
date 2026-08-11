/**
 * The fixture manifest — the server's source of truth.
 *
 * Written by the model repo (estimador-football/scripts/export_game_fixtures.py,
 * built by liga_predict/analysis/game.py) and delivered here two ways:
 *
 *  1. POSTed to /api/score, which stores each matchday in Table Storage. This
 *     is authoritative and does not depend on a static-site deploy landing.
 *  2. Bundled at api/data/game_fixtures.json as a fallback, so a freshly
 *     provisioned API can still validate picks before the first /api/score run.
 *
 * Three things the browser must never be trusted with live here: which
 * fixtures belong to a matchday, when each one locks, and what the model
 * predicted (frozen at publication so a later re-fit cannot retroactively
 * change the yardstick a player was scored against).
 */

import * as fs from 'fs';
import * as path from 'path';
import { outcomeOf, type Outcome, type ProbVector, type ScorableFixture } from './scoring';

export interface ManifestFixture {
  id: string;
  home: string;
  away: string;
  kickoff: string;
  kickoff_confirmed: boolean;
  /** ISO-8601 `YYYY-MM-DDTHH:MM:SSZ`. The instant picks stop being accepted. */
  locks_at: string;
  p_home: number | null;
  p_draw: number | null;
  p_away: number | null;
  home_goals: number | null;
  away_goals: number | null;
  published_at?: string;
}

export interface ManifestMatchday {
  matchday: number;
  kickoff_confirmed: boolean;
  opens_at: string | null;
  fixtures: ManifestFixture[];
}

export interface Manifest {
  season: string;
  generated_at?: string;
  n_matchdays?: number;
  matchdays: ManifestMatchday[];
}

/* ----------------------------------------------------------------- parsing */

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function int(value: unknown): number | null {
  const n = num(value);
  return n === null ? null : Math.trunc(n);
}

/** Coerce untrusted JSON into a fixture, or drop it. */
export function parseFixture(raw: unknown): ManifestFixture | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id) return null;
  if (typeof o.home !== 'string' || typeof o.away !== 'string') return null;
  if (typeof o.locks_at !== 'string' || !o.locks_at) return null;

  return {
    id: o.id,
    home: o.home,
    away: o.away,
    kickoff: typeof o.kickoff === 'string' ? o.kickoff : o.locks_at,
    kickoff_confirmed: o.kickoff_confirmed === true,
    locks_at: o.locks_at,
    p_home: num(o.p_home),
    p_draw: num(o.p_draw),
    p_away: num(o.p_away),
    home_goals: int(o.home_goals),
    away_goals: int(o.away_goals),
    ...(typeof o.published_at === 'string' ? { published_at: o.published_at } : {}),
  };
}

export function parseMatchday(raw: unknown): ManifestMatchday | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const matchday = int(o.matchday);
  if (matchday === null || matchday <= 0) return null;

  const fixtures = Array.isArray(o.fixtures)
    ? o.fixtures.map(parseFixture).filter((f): f is ManifestFixture => f !== null)
    : [];
  if (fixtures.length === 0) return null;

  return {
    matchday,
    kickoff_confirmed: o.kickoff_confirmed === true,
    opens_at: typeof o.opens_at === 'string' ? o.opens_at : null,
    fixtures,
  };
}

export function parseManifest(raw: unknown): Manifest | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.season !== 'string' || !o.season) return null;
  if (!Array.isArray(o.matchdays)) return null;

  const matchdays = o.matchdays
    .map(parseMatchday)
    .filter((m): m is ManifestMatchday => m !== null)
    .sort((a, b) => a.matchday - b.matchday);
  if (matchdays.length === 0) return null;

  return {
    season: o.season,
    generated_at: typeof o.generated_at === 'string' ? o.generated_at : undefined,
    n_matchdays: matchdays.length,
    matchdays,
  };
}

/* ------------------------------------------------------------ lock + score */

/**
 * Parse a manifest timestamp to epoch ms.
 *
 * The exporter always writes `%Y-%m-%dT%H:%M:%SZ`, so this is unambiguous UTC.
 * A stamp we cannot read returns null, and callers treat an unreadable lock as
 * *locked* — refusing a pick is recoverable, accepting one after kickoff is not.
 */
export function parseInstant(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const ms = Date.parse(hasZone ? trimmed : `${trimmed}Z`);
  return Number.isNaN(ms) ? null : ms;
}

export function fixtureHasResult(fixture: ManifestFixture): boolean {
  return fixture.home_goals !== null && fixture.away_goals !== null;
}

export function fixtureOutcome(fixture: ManifestFixture): Outcome | null {
  if (!fixtureHasResult(fixture)) return null;
  return outcomeOf(fixture.home_goals as number, fixture.away_goals as number);
}

export function fixtureModelProbs(fixture: ManifestFixture): ProbVector | null {
  const { p_home, p_draw, p_away } = fixture;
  if (p_home === null || p_draw === null || p_away === null) return null;
  const total = p_home + p_draw + p_away;
  if (!(total > 0)) return null;
  return [p_home / total, p_draw / total, p_away / total];
}

/**
 * Is this fixture still open to picks at `nowMs`?
 *
 * Closed if the lock has passed, if the lock is unreadable, or if a result is
 * already published (belt and braces — a played match is closed whatever the
 * clock says).
 */
export function fixtureIsOpen(fixture: ManifestFixture, nowMs: number): boolean {
  if (fixtureHasResult(fixture)) return false;
  const locksAt = parseInstant(fixture.locks_at);
  if (locksAt === null) return false;
  return nowMs < locksAt;
}

export function toScorable(fixture: ManifestFixture): ScorableFixture {
  return {
    id: fixture.id,
    model: fixtureModelProbs(fixture),
    outcome: fixtureOutcome(fixture),
  };
}

/** The matchday a visitor should be shown: the first with a fixture still open. */
export function playableMatchday(
  matchdays: readonly ManifestMatchday[],
  nowMs: number,
): number | null {
  for (const md of [...matchdays].sort((a, b) => a.matchday - b.matchday)) {
    if (md.fixtures.some(f => fixtureIsOpen(f, nowMs))) return md.matchday;
  }
  return null;
}

/** Earliest lock in a matchday — the deadline shown to players. */
export function matchdayDeadline(md: ManifestMatchday): string | null {
  let earliest: number | null = null;
  let iso: string | null = null;
  for (const f of md.fixtures) {
    const ms = parseInstant(f.locks_at);
    if (ms === null) continue;
    if (earliest === null || ms < earliest) {
      earliest = ms;
      iso = f.locks_at;
    }
  }
  return iso;
}

/* ------------------------------------------------------- bundled fallback */

let bundledCache: Manifest | null | undefined;

/**
 * Read the manifest copy shipped with the function app.
 *
 * Compiled output lives at api/dist/shared/, so api/data is two levels up.
 * Several candidates are tried because the deployed layout is not something we
 * can verify from here, and a missing fallback must degrade, not throw.
 */
export function loadBundledManifest(): Manifest | null {
  if (bundledCache !== undefined) return bundledCache;

  const candidates = [
    path.join(__dirname, '..', '..', 'data', 'game_fixtures.json'),
    path.join(__dirname, '..', 'data', 'game_fixtures.json'),
    path.join(process.cwd(), 'data', 'game_fixtures.json'),
    path.join(process.cwd(), 'api', 'data', 'game_fixtures.json'),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = parseManifest(JSON.parse(fs.readFileSync(candidate, 'utf8')));
      if (parsed) {
        bundledCache = parsed;
        return bundledCache;
      }
    } catch {
      /* try the next candidate */
    }
  }

  bundledCache = null;
  return null;
}

/** Test seam — the cache would otherwise survive between cases. */
export function resetBundledManifestCache(): void {
  bundledCache = undefined;
}
