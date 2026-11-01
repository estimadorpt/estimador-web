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
  /**
   * The game's own original lock (its original kickoff), when the manifest
   * still carries it: only while the game is unplayed. Once it is played the
   * producer gives it its real kickoff as locks_at (`merge_preserving_probs`
   * in estimador-football), so this is null.
   */
  locksAt: string | null;
  /** When its round closed (the round's earliest lock): the game's real lock. */
  roundLocksAt: string;
}

/**
 * Postponed games: a confirmed kickoff after the middle of the next round
 * (a postponed leftover; the median, so one of its games brought forward
 * does not turn this round's Monday game into one), or a lock more than `minDays` before the
 * kickoff (an unplayed postponed game that keeps its original lock). Either
 * way the game closed with its round, as a round locks as a unit, and is
 * scored on the probabilities published for that round.
 *
 * The kickoff test is what finds a postponed game after it is played: the
 * producer then rewrites its locks_at to the real kickoff, so the lock alone
 * no longer shows it (Sp. Braga–Gil Vicente, matchday 2, from the 24 October
 * sync on). It is a workaround: it misses a leftover played before the middle
 * of the next round, and any in the season's last round. Drop it once a
 * passed lock stops moving (producer ask 12).
 */
export function earlyLocks(rounds: readonly ManifestRoundLike[], minDays = 1): EarlyLock[] {
  const out: EarlyLock[] = [];
  for (const r of rounds) {
    const roundLock = roundLockAt(r);
    const next = rounds.find(x => x.matchday === r.matchday + 1);
    // A placeholder kickoff (unscheduled round) says nothing about when the
    // next round is played.
    const nextKickoffs = (next?.fixtures ?? [])
      .filter(f => f.kickoff_confirmed !== false)
      .map(f => parseKickoff(f.kickoff ?? null))
      .filter((ms): ms is number => ms !== null)
      .sort((a, b) => a - b);
    const nextMiddle = nextKickoffs.length ? nextKickoffs[Math.floor(nextKickoffs.length / 2)] : null;
    for (const f of r.fixtures ?? []) {
      // A placeholder kickoff (unscheduled round) is not a postponement.
      if (f.kickoff_confirmed === false) continue;
      const kickoff = parseKickoff(f.kickoff ?? null);
      if (kickoff === null) continue;
      const lock = parseKickoff(f.locks_at ?? null);
      const keptLock = lock !== null && kickoff - lock > minDays * 86_400_000;
      const afterNextRound = nextMiddle !== null && kickoff > nextMiddle;
      if (!keptLock && !afterNextRound) continue;
      const closedAt = roundLock ?? f.locks_at;
      if (!closedAt) continue;
      out.push({
        matchday: r.matchday,
        id: f.id ?? null,
        home: f.home,
        away: f.away,
        kickoff: f.kickoff as string,
        locksAt: keptLock ? (f.locks_at as string) : null,
        roundLocksAt: closedAt,
      });
    }
  }
  return out;
}

export interface FrozenMidRound {
  matchday: number;
  /** When this round's probabilities were frozen (earliest published_at). */
  publishedAt: string;
  /** The previous round, still being played at that moment. */
  previous: number;
  /** Kickoff of the previous round's last game played before this round. */
  previousLastKickoff: string;
}

/**
 * Rounds whose probabilities were frozen before the previous round's last
 * game (audit FA2-04, FRESH-02): in 2026-27, matchdays 3, 5, 6 and 7, so
 * their odds miss up to half of the round before. A postponed leftover
 * played weeks later does not count as the previous round's end: only its
 * games that kicked off before this round began do.
 */
export function frozenBeforePreviousRoundEnded(rounds: readonly ManifestRoundLike[]): FrozenMidRound[] {
  const out: FrozenMidRound[] = [];
  for (const r of rounds) {
    const fixtures = r.fixtures ?? [];
    const published = fixtures
      .map(f => (f.published_at ? Date.parse(f.published_at) : NaN))
      .filter(Number.isFinite);
    if (!published.length) continue;
    const publishedMs = Math.min(...published);
    const firstKickoff = Math.min(...fixtures.map(f => parseKickoff(f.kickoff ?? null) ?? Infinity));
    const previous = rounds.find(x => x.matchday === r.matchday - 1);
    if (!previous) continue;
    const before = (previous.fixtures ?? [])
      .map(f => parseKickoff(f.kickoff ?? null))
      .filter((ms): ms is number => ms !== null && ms < firstKickoff);
    if (!before.length) continue;
    const lastMs = Math.max(...before);
    if (publishedMs < lastMs) {
      out.push({
        matchday: r.matchday,
        publishedAt: new Date(publishedMs).toISOString(),
        previous: previous.matchday,
        previousLastKickoff: new Date(lastMs).toISOString(),
      });
    }
  }
  return out.sort((a, b) => a.matchday - b.matchday);
}

/** Rounds with published probabilities but no probs_source on any game. */
export function roundsWithoutSource(rounds: readonly ManifestRoundLike[]): number[] {
  return rounds
    .filter(r => (r.fixtures ?? []).some(f => f.published_at) && !(r.fixtures ?? []).some(f => f.probs_source))
    .map(r => r.matchday)
    .sort((a, b) => a - b);
}

/** The instant a round closes in the game: its earliest lock (audit FA2-05). */
export function roundLockAt(round: ManifestRoundLike): string | null {
  const locks = (round.fixtures ?? [])
    .map(f => parseKickoff(f.locks_at ?? null))
    .filter((ms): ms is number => ms !== null);
  return locks.length ? new Date(Math.min(...locks)).toISOString() : null;
}
