// What the game manifest (game_fixtures.json) says about the model's own
// record in Contra o Modelo, for the notes on /dados and under the season
// table (audit M2 and F18).
//
// Two things the scoring server does not show by itself:
//  - a round whose frozen probabilities were published after some of its
//    games had kicked off (2026-27 matchday 1: published 10 August 07:36 UTC,
//    after 8 of its 9 games). Players could not enter that round, but the
//    model's record counts it;
//  - a game that locks long before it is played: a round closes as a unit at
//    its earliest lock, and a postponed game keeps its round's lock and
//    probabilities (Sp. Braga–Gil Vicente, matchday 2, played 19 October and
//    scored on the 10 August forecast).
import { parseKickoff } from '@/lib/utils/prediction-game';

export interface ManifestFixtureLike {
  id?: string;
  home: string;
  away: string;
  kickoff?: string | null;
  locks_at?: string | null;
  published_at?: string | null;
  probs_source?: string | null;
  /** False while the kickoff is a placeholder (its lock is then a guess too). */
  kickoff_confirmed?: boolean;
}

export interface ManifestRoundLike {
  matchday: number;
  fixtures?: ManifestFixtureLike[];
}

export interface LatePublication {
  matchday: number;
  publishedAt: string;
  /** Games of the round whose lock had passed when the forecast appeared. */
  startedBefore: number;
  total: number;
}

/** Rounds whose model probabilities appeared after at least one game locked. */
export function latePublications(rounds: readonly ManifestRoundLike[]): LatePublication[] {
  const out: LatePublication[] = [];
  for (const r of rounds) {
    const fixtures = r.fixtures ?? [];
    const published = fixtures
      .map(f => (f.published_at ? Date.parse(f.published_at) : NaN))
      .filter(Number.isFinite);
    if (!published.length) continue;
    const publishedMs = Math.min(...published);
    const startedBefore = fixtures.filter(f => {
      const lock = parseKickoff(f.locks_at ?? f.kickoff ?? null);
      return lock !== null && lock <= publishedMs;
    }).length;
    if (startedBefore > 0) {
      out.push({
        matchday: r.matchday,
        publishedAt: new Date(publishedMs).toISOString(),
        startedBefore,
        total: fixtures.length,
      });
    }
  }
  return out.sort((a, b) => a.matchday - b.matchday);
}

export interface EarlyLock {
  matchday: number;
  id: string | null;
  home: string;
  away: string;
  kickoff: string;
  locksAt: string;
}

/**
 * Games with a confirmed kickoff that lock more than `minDays` before it: in
 * practice a postponed game that keeps its original round's lock and
 * probabilities.
 */
export function earlyLocks(rounds: readonly ManifestRoundLike[], minDays = 1): EarlyLock[] {
  const out: EarlyLock[] = [];
  for (const r of rounds) {
    for (const f of r.fixtures ?? []) {
      // A placeholder kickoff (unscheduled round) is not a postponement.
      if (f.kickoff_confirmed === false) continue;
      const kickoff = parseKickoff(f.kickoff ?? null);
      const lock = parseKickoff(f.locks_at ?? null);
      if (kickoff === null || lock === null) continue;
      if (kickoff - lock > minDays * 86_400_000) {
        out.push({
          matchday: r.matchday,
          id: f.id ?? null,
          home: f.home,
          away: f.away,
          kickoff: f.kickoff as string,
          locksAt: f.locks_at as string,
        });
      }
    }
  }
  return out;
}
