import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { CompactResponse, ParishRecord, PopulationMeta } from '@/types/population';
import { clampGuess, formatGuess, GUESS_BANDS, guessTarget, guessVerdict, VERDICT_COPY } from './guess';

const DIR = path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR);
const json = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as T;
const meta = json<PopulationMeta>('meta.json');

describe('clampGuess', () => {
  it('keeps whole percentages between 0 and 100', () => {
    expect(clampGuess(30)).toBe(30);
    expect(clampGuess(30.4)).toBe(30);
    expect(clampGuess(-5)).toBe(0);
    expect(clampGuess(140)).toBe(100);
    expect(clampGuess(Number.NaN)).toBe(50);
  });

  it('formats the guess as the reader set it', () => {
    expect(formatGuess(30)).toBe('30%');
    expect(formatGuess(7.6)).toBe('8%');
  });
});

describe('guessVerdict', () => {
  it('is very close within 3 points, inclusive', () => {
    expect(guessVerdict(17, 0.1715)).toBe('very_close');
    expect(guessVerdict(20, 0.17)).toBe('very_close');
    expect(guessVerdict(14, 0.17)).toBe('very_close');
  });

  it('is close within 10 points, inclusive', () => {
    expect(guessVerdict(21, 0.17)).toBe('close');
    expect(guessVerdict(27, 0.17)).toBe('close');
    expect(guessVerdict(7, 0.17)).toBe('close');
  });

  it('is far beyond 10 points, in either direction', () => {
    expect(guessVerdict(28, 0.17)).toBe('far');
    expect(guessVerdict(0, 0.5)).toBe('far');
    expect(guessVerdict(100, 0.025)).toBe('far');
  });

  it('uses the bands it documents', () => {
    expect(GUESS_BANDS).toEqual({ veryClose: 3, close: 10 });
  });

  it('never words the verdict as a number or a direction', () => {
    for (const copy of Object.values(VERDICT_COPY)) {
      for (const text of Object.values(copy)) {
        expect(text).not.toMatch(/\d/);
        expect(text).not.toMatch(/acima|abaixo|mais|menos|above|below|higher|lower|more|less/i);
      }
    }
  });
});

describe('guessTarget', () => {
  const parish = (code: string) => json<ParishRecord>(`parish/${code}.json`);

  it('measures against the published headline cell of a parish (tier A)', () => {
    const record = parish('010103');
    expect(guessTarget('elders_alone', record.responses.elders_alone, meta.recipes.elders_alone))
      .toEqual({ share: record.responses.elders_alone.cells.find(c => c[0][0] === 'yes')![1], display: '18,0%' });
    // The producer's own string (pt-PT from v1.0.2); GuessFirst formats it for the reader's locale.
    expect(guessTarget('multigenerational', record.responses.multigenerational, meta.recipes.multigenerational)?.display).toBe('2,5%');
  });

  it('offers a guess on a tier C parish’s own figures', () => {
    const record = parish('010122');
    expect(record.tier).toBe('C');
    expect(record.responses.elders_alone.decision).toBe('publish');
    const yes = record.responses.elders_alone.cells.find(c => c[0][0] === 'yes')!;
    expect(guessTarget('elders_alone', record.responses.elders_alone, meta.recipes.elders_alone)?.display).toBe(yes[2]);
  });

  it('still offers a guess on município figures (synthetic fallback; the card names them)', () => {
    const fallback: CompactResponse = { ...parish('010122').responses.elders_alone, decision: 'fallback', resolved: '010100' };
    const yes = fallback.cells.find(c => c[0][0] === 'yes')!;
    expect(guessTarget('elders_alone', fallback, meta.recipes.elders_alone)).toEqual({ share: yes[1], display: '16,1%' });
  });

  it('is not offered for a refused response, a suppressed headline, or another recipe', () => {
    const record = parish('010122');
    expect(guessTarget('who_lives_alone', record.responses.who_lives_alone, meta.recipes.who_lives_alone)).toBeNull();
    const refused: CompactResponse = { ...record.responses.elders_alone, decision: 'refuse', cells: [] };
    expect(guessTarget('elders_alone', refused, meta.recipes.elders_alone)).toBeNull();
    const suppressed: CompactResponse = {
      ...record.responses.elders_alone,
      cells: [[['no'], 0.9, '90.0%'], [['yes'], null, 'Suprimido', 'cell_below_minimum']],
    };
    expect(guessTarget('elders_alone', suppressed, meta.recipes.elders_alone)).toBeNull();
    expect(guessTarget('employment', record.responses.employment, meta.recipes.employment)).toBeNull();
  });
});
