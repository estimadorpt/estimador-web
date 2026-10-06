import { describe, expect, it } from 'vitest';
import { probabilityHistoryTable } from './probability-history-table';
import type { LigaProbabilityHistory } from '@/types/football';

const history: LigaProbabilityHistory = [
  {
    matchday: 1,
    timestamp: '2026-08-10T20:00:00Z',
    table: [
      { team: 'Benfica', p_champion: 0.4, p_relegation: 0 },
      { team: 'Porto', p_champion: 0.35, p_relegation: 0 },
    ],
  },
  {
    matchday: 2,
    timestamp: '2026-08-17T20:00:00Z',
    table: [
      { team: 'Benfica', p_champion: 0.45, p_relegation: 0 },
      { team: 'Porto', p_champion: 0.3, p_relegation: 0 },
    ],
  },
  {
    matchday: 3,
    timestamp: '2026-08-24T20:00:00Z',
    table: [
      { team: 'Benfica', p_champion: 0.5, p_relegation: 0 },
      { team: 'Porto', p_champion: 0.25, p_relegation: 0.001 },
    ],
  },
];

describe('probabilityHistoryTable', () => {
  it('puts the newest forecast beside the club column', () => {
    const { columns, rows } = probabilityHistoryTable(history, ['Benfica', 'Porto'], 'p_champion', 'pt');
    expect(columns).toEqual(['Equipa', 'J3 · 24 ago.', 'J2 · 17 ago.', 'J1 · 10 ago.']);
    expect(rows[0]).toEqual(['Benfica', '50%', '45%', '40%']);
    expect(rows[1]).toEqual(['Porto', '25%', '30%', '35%']);
  });

  it('labels English columns and reads the field it is given', () => {
    const { columns, rows } = probabilityHistoryTable(history, ['Porto'], 'p_relegation', 'en');
    expect(columns[0]).toBe('Team');
    expect(columns[1]).toBe('MD3 · 24 Aug');
    expect(rows).toEqual([['Porto', '0.1%', '0%', '0%']]);
  });

  it('keeps the rows in the order given and leaves a missing club blank', () => {
    const { rows } = probabilityHistoryTable(history, ['Sporting', 'Benfica'], 'p_champion', 'pt');
    expect(rows.map(r => r[0])).toEqual(['Sporting', 'Benfica']);
    expect(rows[0].slice(1)).toEqual(['', '', '']);
  });

  it('does not reorder the history it was given', () => {
    const copy = history.map(md => md.matchday);
    probabilityHistoryTable(history, ['Benfica'], 'p_champion', 'pt');
    expect(history.map(md => md.matchday)).toEqual(copy);
  });

  it('omits the date when a forecast has none', () => {
    const { columns } = probabilityHistoryTable([{ matchday: 0, table: [] }], [], 'p_champion', 'pt');
    expect(columns).toEqual(['Equipa', 'J0']);
  });
});
