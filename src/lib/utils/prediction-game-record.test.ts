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

  it('finds a played postponed game by its kickoff after the next round began', () => {
    // Once played, the producer gives the game its real kickoff as locks_at.
    const early = earlyLocks([
      round(2, [
        { id: 'md02-a', kickoff: '2026-08-14T19:15:00Z', locks_at: '2026-08-14T19:15:00Z' },
        { id: 'md02-x', kickoff: '2026-10-19T19:15:00Z', locks_at: '2026-10-19T19:15:00Z' },
      ]),
      round(3, [{ id: 'md03-a', kickoff: '2026-08-22T14:30:00Z', locks_at: '2026-08-22T14:30:00Z' }]),
    ]);
    expect(early).toEqual([expect.objectContaining({
      id: 'md02-x', locksAt: null, roundLocksAt: '2026-08-14T19:15:00.000Z',
    })]);
  });

  it('does not take a Monday game of the same round for a postponement', () => {
    expect(earlyLocks([
      round(2, [
        { kickoff: '2026-08-14T19:15:00Z', locks_at: '2026-08-14T19:15:00Z' },
        { kickoff: '2026-08-17T19:15:00Z', locks_at: '2026-08-17T19:15:00Z' },
      ]),
      round(3, [{ kickoff: '2026-08-22T14:30:00Z', locks_at: '2026-08-22T14:30:00Z' }]),
    ])).toEqual([]);
  });

  it('does not take a Monday game for a postponement when the next round has a game brought forward', () => {
    expect(earlyLocks([
      round(2, [
        { kickoff: '2026-08-14T19:15:00Z', locks_at: '2026-08-14T19:15:00Z' },
        { kickoff: '2026-08-17T19:15:00Z', locks_at: '2026-08-17T19:15:00Z' },
      ]),
      round(3, [
        { kickoff: '2026-08-16T19:15:00Z', locks_at: '2026-08-16T19:15:00Z' },
        { kickoff: '2026-08-22T14:30:00Z', locks_at: '2026-08-22T14:30:00Z' },
        { kickoff: '2026-08-23T14:30:00Z', locks_at: '2026-08-23T14:30:00Z' },
      ]),
    ])).toEqual([]);
  });

  it('reads the next round from its confirmed kickoffs only', () => {
    const next = round(3, [
      { kickoff: '2026-08-16T00:00:00Z', locks_at: '2026-08-15T00:00:00Z' },
      { kickoff: '2026-08-16T00:00:00Z', locks_at: '2026-08-15T00:00:00Z' },
    ]);
    for (const f of next.fixtures) (f as Record<string, unknown>).kickoff_confirmed = false;
    expect(earlyLocks([
      round(2, [
        { kickoff: '2026-08-14T19:15:00Z', locks_at: '2026-08-14T19:15:00Z' },
        { kickoff: '2026-08-17T19:15:00Z', locks_at: '2026-08-17T19:15:00Z' },
      ]),
      next,
    ])).toEqual([]);
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

  it('has the three postponed leftovers closing with their rounds, Sp. Braga–Gil Vicente on 14 August', () => {
    // Pin only the audited rounds (all played, so their data should not
    // move again): a later postponement adds a row.
    const early = earlyLocks(manifest.matchdays).filter(e => e.matchday <= 7);
    expect(early.map(e => e.id)).toEqual([
      'md02-sc-braga-vs-gil-vicente',
      'md03-moreirense-vs-benfica',
      'md03-estrela-amadora-vs-sc-braga',
    ]);
    // The round's lock, not the game's own (audit FA2-05).
    expect(early[0].roundLocksAt).toBe('2026-08-14T19:15:00.000Z');
    expect(early[2].roundLocksAt).toBe('2026-08-22T14:30:00.000Z');
  });

  it('lists the rounds frozen before the previous one ended (audit FA2-04)', () => {
    // Pin only the audited rounds. Freezing the next forecast before a
    // Monday game is routine, so the list grows with the season (md09 did
    // on 10 October) and a full-list snapshot fails every weekend publish.
    const audited = frozenBeforePreviousRoundEnded(manifest.matchdays).filter(f => f.matchday <= 7);
    expect(audited.map(f => f.matchday)).toEqual([3, 5, 6, 7]);
    expect(audited.map(f => f.previous)).toEqual([2, 4, 5, 6]);
  });

  it('names matchdays 1 and 2 as the rounds with no probs_source', () => {
    expect(roundsWithoutSource(manifest.matchdays)).toEqual([1, 2]);
  });
});
