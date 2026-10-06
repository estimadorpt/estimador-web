import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compareNextMatchdays,
  nextMatchdayDriftSentence,
  nextMatchdayPartialSentence,
  type MatchdayFileNext,
} from './football-next-matchday';

const dir = path.join(process.cwd(), 'public/data/football/liga-2026-27');
const read = (name: string) => JSON.parse(readFileSync(path.join(dir, name), 'utf8'));

describe('next_matchday against the game record (audit FA3-06)', () => {
  it('compares four-decimal odds and ignores a postponed game from another round', () => {
    const rows = compareNextMatchdays(
      [
        { file: 'md01.json', next_matchday: { matchday: 2, matches: [
          { home: 'A', away: 'B', p_home: 0.5, p_draw: 0.3, p_away: 0.2 },
          { home: 'X', away: 'Y', p_home: 0.1, p_draw: 0.1, p_away: 0.8 },
        ] } },
        { file: 'md02.json', next_matchday: { matchday: 3, matches: [
          { home: 'C', away: 'D', p_home: 0.4, p_draw: 0.3, p_away: 0.3 },
        ] } },
      ],
      [
        { matchday: 2, fixtures: [{ home: 'A', away: 'B', p_home: 0.5022, p_draw: 0.2978, p_away: 0.2 }] },
        { matchday: 3, fixtures: [{ home: 'C', away: 'D', p_home: 0.4, p_draw: 0.3, p_away: 0.3 }, { home: 'E', away: 'F' }] },
      ],
    );
    expect(rows[0]).toMatchObject({ file: 'md01.json', listed: 1, total: 1 });
    expect(rows[0].maxDiff).toBeCloseTo(0.0022, 6);
    expect(rows[1]).toMatchObject({ maxDiff: 0, listed: 1, total: 2 });
    expect(nextMatchdayDriftSentence(rows, 'pt')).toBe(
      'O next_matchday de md01 difere do registo do jogo (game_fixtures.json) em até 0,2 pp; nos outros coincide. O registo do jogo é o que conta.',
    );
    expect(nextMatchdayPartialSentence(rows, 'pt')).toBe('Nem sempre traz a jornada inteira: md02 traz 1 dos 2 jogos.');
  });

  it('says what the published 2026-27 files show, never "frozen at the first version"', () => {
    const files: MatchdayFileNext[] = readdirSync(dir)
      .filter(f => /^md\d+\.json$/.test(f))
      .map(f => ({ file: f, next_matchday: read(f).next_matchday }));
    const rows = compareNextMatchdays(files, read('game_fixtures.json').matchdays);
    const drift = nextMatchdayDriftSentence(rows, 'pt')!;
    expect(drift).not.toMatch(/congelad/);
    for (const r of rows) {
      if (r.maxDiff > 0.00005) expect(drift).toContain(r.file.replace('.json', ''));
      expect(r.maxDiff).toBeLessThan(0.01);
    }
    expect(nextMatchdayDriftSentence(rows, 'en')).toMatch(/^The next_matchday of /);
  });
});
