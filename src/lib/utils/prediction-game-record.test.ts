import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { earlyLocks, frozenBeforePreviousRoundEnded, latePublications, roundsWithoutSource } from './prediction-game-record';

const round = (matchday: number, fixtures: Array<Record<string, string | null>>) => ({
  matchday,
  fixtures: fixtures.map((f, i) => ({ home: `H${i}`, away: `A${i}`, ...f })),
});

describe('latePublications', () => {
  it('flags a round published after some of its games locked', () => {
    const late = latePublications([
      round(1, [
        { locks_at: '2026-08-07T19:15:00Z', published_at: '2026-08-10T07:36:05Z' },
        { locks_at: '2026-08-10T19:15:00Z', published_at: '2026-08-10T07:36:05Z' },
      ]),
      round(2, [{ locks_at: '2026-08-14T19:15:00Z', published_at: '2026-08-10T21:33:52Z' }]),
    ]);
    expect(late).toEqual([{ matchday: 1, publishedAt: '2026-08-10T07:36:05.000Z', startedBefore: 1, total: 2 }]);
  });

  it('ignores rounds with no publication time', () => {
    expect(latePublications([round(9, [{ locks_at: '2026-10-23T19:45:00Z', published_at: null }])])).toEqual([]);
  });
});

describe('earlyLocks', () => {
  it('finds a postponed game that keeps its round lock', () => {
    const early = earlyLocks([
      round(2, [
        { id: 'md02-x', kickoff: '2026-10-19T19:15:00Z', locks_at: '2026-08-16T19:30:00Z' },
        { kickoff: '2026-08-16T19:30:00Z', locks_at: '2026-08-16T19:30:00Z' },
      ]),
    ]);
    expect(early.map(e => e.id)).toEqual(['md02-x']);
  });

  it('ignores placeholder kickoffs of rounds not yet scheduled', () => {
    const r = round(13, [{ id: 'md13-x', kickoff: '2026-12-06T00:00:00Z', locks_at: '2026-12-04T19:00:00Z' }]);
    (r.fixtures[0] as Record<string, unknown>).kickoff_confirmed = false;
    expect(earlyLocks([r])).toEqual([]);
  });
});

describe('the published 2026-27 manifest', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(process.cwd(), 'public/data/football/liga-2026-27/game_fixtures.json'), 'utf8'),
  );

  it('has matchday 1 as the only round published after kickoff (8 of 9 games)', () => {
    const late = latePublications(manifest.matchdays);
    expect(late.map(l => l.matchday)).toEqual([1]);
    expect(late[0].startedBefore).toBe(8);
    expect(late[0].total).toBe(9);
  });

  it('has the postponed Sp. Braga–Gil Vicente as an early lock, closed with its round on 14 August', () => {
    const early = earlyLocks(manifest.matchdays);
    expect(early.map(e => e.id)).toEqual(['md02-sc-braga-vs-gil-vicente']);
    // The round's lock, not the game's own (audit FA2-05).
    expect(early[0].roundLocksAt).toBe('2026-08-14T19:15:00.000Z');
  });

  it('lists the rounds frozen before the previous one ended (audit FA2-04)', () => {
    const frozen = frozenBeforePreviousRoundEnded(manifest.matchdays);
    expect(frozen.map(f => f.matchday)).toEqual([3, 5, 6, 7]);
    expect(frozen.map(f => f.previous)).toEqual([2, 4, 5, 6]);
  });

  it('names matchdays 1 and 2 as the rounds with no probs_source', () => {
    expect(roundsWithoutSource(manifest.matchdays)).toEqual([1, 2]);
  });
});
