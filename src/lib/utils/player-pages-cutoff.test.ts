import { describe, expect, it } from 'vitest';
import {
  formatShortDate,
  nextSeason,
  playerDataCutoffLabel,
  playerDataCutoffSentence,
  sortAppearancesNewestFirst,
} from './player-pages';
import { withPublishedGoalsRanks, rankMovement, normaliseRatings } from './player-ratings';

describe('player data cut-off (audit F-H6)', () => {
  it('formats the cut-off in pt-PT and en-GB', () => {
    expect(formatShortDate('2026-05-16', 'pt')).toBe('16 mai. 2026');
    expect(formatShortDate('2026-05-16', 'en')).toBe('16 May 2026');
    expect(formatShortDate(null, 'pt')).toBeNull();
    expect(playerDataCutoffLabel('2026-05-16', ['2023-24', '2024-25', '2025-26'], 'pt')).toBe(
      'Dados até 16 mai. 2026 (fim da época 2025-26)',
    );
    expect(playerDataCutoffLabel(undefined, ['2025-26'], 'pt')).toBeNull();
  });

  it('says the current season is not in the fit', () => {
    expect(nextSeason('2025-26')).toBe('2026-27');
    expect(nextSeason('2099-00')).toBe('2100-01');
    const s = playerDataCutoffSentence('2026-05-16', ['2023-24', '2025-26'], 'pt')!;
    expect(s).toContain('16 de maio de 2026, o fim da época 2025-26');
    expect(s).toContain('jogos de 2026-27');
  });

  it('orders appearances newest first across seasons (Tiago Gouveia)', () => {
    const sorted = sortAppearancesNewestFirst([
      { season: '2024-25', matchday: 34, date: '2025-05-17' },
      { season: '2025-26', matchday: 2, date: '2025-08-16' },
      { season: '2023-24', matchday: 34, date: '2024-05-17' },
      { season: '2026-27', matchday: 1, date: null },
    ]);
    expect(sorted.map((r) => r.date)).toEqual([null, '2025-08-16', '2025-05-17', '2024-05-17']);
  });
});

describe('contribution movement against the published list (audit F5)', () => {
  it('counts places in the published goals list, not the model universe', () => {
    const block = normaliseRatings(
      {
        players: [
          { player: 'Pedro Gonçalves', value: 0.57, rank: 1, rank_goals_only: 4, rank_change_vs_goals_only: 2 },
          { player: 'Rodrigo Zalazar', value: 0.4, rank: 8, rank_goals_only: 38, rank_change_vs_goals_only: 26 },
          { player: 'Not Listed', value: 0.3, rank: 9, rank_goals_only: 90 },
        ],
      },
      'contrib',
    )!;
    const published = { 'Pedro Gonçalves': 3, 'Rodrigo Zalazar': 21 };
    const moves = withPublishedGoalsRanks(block.players, published).map((e) => rankMovement(e));
    expect(moves).toEqual([2, 13, null]);
  });
});
