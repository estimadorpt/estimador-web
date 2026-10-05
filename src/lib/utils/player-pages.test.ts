import { describe, expect, it } from 'vitest';
import { reconcilePlayerPages } from '@/lib/utils/player-ratings';
import type { PlayerDetailData, PlayerDetailEntry } from '@/components/charts/football/PlayerProfile';
import type { PlayerSkillData, PlayerSkillEntry } from '@/components/charts/football/PlayerSkillRanking';
import { loadLigaData, loadLigaPlayers, loadLigaPlayersDetail } from '@/lib/utils/football-data-loader';

const detailEntry = (rank: number, player: string, team: string): PlayerDetailEntry => ({
  slug: player.toLowerCase().replace(/\s+/g, '-'),
  rank,
  player,
  player_id: rank,
  team,
  position: 'F',
  minutes: 100,
  matches: 1,
  goals: 0,
  goals_per_90: 0,
  sar: 0.1,
  sar_sd: 0.1,
  skill_lo: 0,
  skill_hi: 0.2,
  xg_skill_per_90: null,
  p_above_replacement: null,
  last_season: '2026-27',
  seasons: [],
  skill_change: null,
  recent: [],
});

const rankingEntry = (rank: number, player: string, team: string, sar: number): PlayerSkillEntry => ({
  rank,
  player,
  team,
  position: 'F',
  minutes: 2000,
  matches: 25,
  goals: 15,
  goals_per_90: 0.6,
  sar,
  skill_lo: sar - 0.1,
  skill_hi: sar + 0.1,
});

const detail = (players: PlayerDetailEntry[]): PlayerDetailData => ({
  season: '2026-27',
  model: 'soccer_factor_model',
  metric: 'sar',
  metric_label: 'x',
  generated_from: {},
  n_players: players.length,
  players,
});

const ranking = (players: PlayerSkillEntry[]) => ({ players }) as unknown as PlayerSkillData;

describe('reconcilePlayerPages', () => {
  const current = new Set(['Porto', 'Benfica', 'Sporting CP']);

  it('keeps only ranked players, at the ranking rank and with its headline numbers', () => {
    const result = reconcilePlayerPages(
      detail([
        detailEntry(1, 'Luis Javier Suárez', 'Sporting CP'),
        detailEntry(2, 'Samu Aghehowa', 'Porto'),
        detailEntry(3, 'Vangelis Pavlidis', 'Benfica'),
      ]),
      ranking([
        rankingEntry(1, 'Samu Aghehowa', 'Porto', 0.5),
        rankingEntry(2, 'Vangelis Pavlidis', 'Benfica', 0.4),
      ]),
      current,
    )!;
    expect(result.players.map(p => [p.rank, p.player])).toEqual([
      [1, 'Samu Aghehowa'],
      [2, 'Vangelis Pavlidis'],
    ]);
    expect(result.players[0].sar).toBe(0.5);
    expect(result.players[0].minutes).toBe(2000);
    expect(result.n_players).toBe(2);
  });

  it('drops players whose club is not in the current table', () => {
    const result = reconcilePlayerPages(
      detail([detailEntry(1, 'Nenê', 'AVS'), detailEntry(2, 'Samu Aghehowa', 'Porto')]),
      null,
      current,
    )!;
    expect(result.players.map(p => p.player)).toEqual(['Samu Aghehowa']);
  });

  it('returns null when nothing is left', () => {
    expect(reconcilePlayerPages(detail([detailEntry(1, 'Nenê', 'AVS')]), null, current)).toBeNull();
    expect(reconcilePlayerPages(null, null, current)).toBeNull();
  });
});

describe('player pages over the published data', () => {
  it('agree with the /jogadores ranking on every rank and club, and only list current clubs', async () => {
    const [pages, players, { prediction }] = await Promise.all([
      loadLigaPlayersDetail(),
      loadLigaPlayers(),
      loadLigaData(),
    ]);
    if (!pages || !players) return;
    const ranked = new Map(players.players.map(p => [p.player, p]));
    const clubs = new Set((prediction?.table ?? []).map(r => r.team));
    for (const p of pages.players) {
      expect(ranked.get(p.player)?.rank, p.player).toBe(p.rank);
      expect(clubs.has(p.team), p.team).toBe(true);
    }
  });
});
