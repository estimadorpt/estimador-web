import { describe, expect, it } from 'vitest';
import { loadLigaHistorical, probabilityHistory } from './football-data-loader';

describe('probabilityHistory (SP-08)', () => {
  it('keeps every matchday and club with only the two probabilities the charts draw', async () => {
    const historical = await loadLigaHistorical();
    const trimmed = probabilityHistory(historical);
    expect(trimmed.map(md => md.matchday)).toEqual(historical.map(md => md.matchday));
    for (const [i, md] of trimmed.entries()) {
      expect(md.table).toHaveLength(historical[i].table.length);
      for (const row of md.table) expect(Object.keys(row).sort()).toEqual(['p_champion', 'p_relegation', 'team']);
    }
    expect(JSON.stringify(trimmed).length).toBeLessThan(JSON.stringify(historical).length / 3);
  });
});
