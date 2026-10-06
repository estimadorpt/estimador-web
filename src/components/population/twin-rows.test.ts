import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import { readCells } from '@/lib/population/compact';
import type { ParishRecord, PopulationMeta } from '@/types/population';
import { NOBODY_ALONE, twinRows } from './twin-rows';

const DIR = path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR);
const json = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as T;
const meta = json<PopulationMeta>('meta.json');

describe('table twin rows (POP3-ACC-07)', () => {
  it('gives an age band with nobody living alone one row, not three zeros under “each band adds up to 100%” (Mosteiro, 480107)', () => {
    const record = json<ParishRecord>('parish/480107.json');
    for (const locale of ['pt', 'en'] as const) {
      const cells = readCells(record.responses.who_lives_alone, meta.recipes.who_lives_alone, locale);
      const rows = twinRows('who_lives_alone', cells, locale);
      const band = locale === 'pt' ? '65 ou mais anos' : '65 or over';
      expect(rows.filter(row => row[0] === band)).toEqual([[band, NOBODY_ALONE[locale], '—']]);
      // The other bands keep the producer's cells, one row each.
      expect(rows.filter(row => row[0] !== band).every(row => row[2] !== '—')).toBe(true);
      expect(rows.every(row => row.length === 3)).toBe(true);
    }
  });

  it('leaves every other question’s rows as the producer’s cells', () => {
    const record = json<ParishRecord>('parish/480107.json');
    const cells = readCells(record.responses.elders_alone, meta.recipes.elders_alone, 'pt');
    expect(twinRows('elders_alone', cells, 'pt')).toEqual(cells.map(cell => [...cell.labels, cell.display]));
  });
});
