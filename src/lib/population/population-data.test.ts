import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type {
  GameEntry,
  GameIndex,
  NationalRecord,
  ParishRecord,
  PopulationMeta,
  PopulationPlaces,
  PortraitRecipe,
} from '@/types/population';
import { canonicalQuery, formatDisplay, isWhole, readCells, rebuildResponse } from './compact';
import { parsePublicResponse } from './contract';
import { RECIPE_COPY, VALUES } from './labels';
import { indexPlaces, searchParishes } from './places';

const DIR = path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR);
const json = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as T;

const meta = json<PopulationMeta>('meta.json');
const places = json<PopulationPlaces>('places.json');
const parishFiles = fs.readdirSync(path.join(DIR, 'parish')).filter(name => name.endsWith('.json'));
const context = { releaseVersion: meta.release_version, dataVintage: meta.data_vintage, dataStatus: meta.data_status };

const hashQuery = (query: Parameters<typeof canonicalQuery>[0]) =>
  `q1_${createHash('sha256').update(canonicalQuery(query), 'utf8').digest('hex').slice(0, 20)}`;

describe('population release files', () => {
  it('is release data under contract 1.0', () => {
    expect(meta.data_status).toBe('release');
    expect(meta.contract_version).toBe('1.0');
    expect(meta.counts.parishes).toBe(3092);
    expect(parishFiles).toHaveLength(3092);
    expect(places.parishes).toHaveLength(3092);
  });

  it('rebuilds every parish response as a valid contract-v1 response whose query hashes to its id', () => {
    let checked = 0;
    const decisions = { publish: 0, fallback: 0, refuse: 0 };
    for (const file of parishFiles) {
      const record = json<ParishRecord>(`parish/${file}`);
      expect(Object.keys(record.responses)).toEqual(meta.recipe_order);
      for (const [name, compact] of Object.entries(record.responses)) {
        const response = rebuildResponse(compact, meta.recipes[name as PortraitRecipe], {
          level: 'freguesia',
          code: record.code,
          name: record.caop_name,
        }, meta);
        parsePublicResponse(response, context);
        expect(hashQuery(response.query)).toBe(compact.id);
        if (compact.decision === 'fallback') expect(compact.resolved).toBe(record.fallback?.code);
        decisions[compact.decision] += 1;
        checked += 1;
      }
    }
    const national = json<NationalRecord>('national.json');
    const nationalResponse = rebuildResponse(national.response, meta.recipes.national_age, { level: 'national', code: 'PT', name: national.name }, meta);
    parsePublicResponse(nationalResponse, context);
    expect(hashQuery(nationalResponse.query)).toBe(national.response.id);
    decisions[national.response.decision] += 1;
    expect(checked + 1).toBe(meta.counts.responses);
    expect(decisions).toEqual(meta.counts.decisions);
  });

  it('has words for every category value in the release', () => {
    for (const [dimension, values] of Object.entries(meta.coordinates)) {
      const known = new Set((VALUES[dimension] ?? []).map(entry => entry.value));
      expect(values.filter(value => !known.has(value)), dimension).toEqual([]);
    }
    expect(Object.keys(RECIPE_COPY).sort()).toEqual([...meta.recipe_order].sort());
  });

  it('agrees with the place list on tier and publication level', () => {
    const index = indexPlaces(places);
    for (const file of parishFiles) {
      const record = json<ParishRecord>(`parish/${file}`);
      const parish = index.byCode.get(record.code);
      expect(parish, record.code).toBeDefined();
      expect(parish!.tier).toBe(record.tier);
      expect(parish!.level).toBe(record.status === 'publish' ? 'parish' : 'municipality');
      expect(record.fallback === null).toBe(record.tier !== 'C');
    }
  });

  it('offers only published A/B parishes to the daily game, in curated order', () => {
    const game = json<GameIndex>('game/index.json');
    const entries: GameEntry[] = [];
    for (let n = 0; n < game.chunks; n += 1) entries.push(...json<GameEntry[]>(`game/chunk-${String(n).padStart(3, '0')}.json`));
    expect(entries).toHaveLength(game.candidates);
    expect(entries.map(entry => entry.order)).toEqual(entries.map((_, i) => i));
    const index = indexPlaces(places);
    for (const entry of entries) {
      expect(['A', 'B']).toContain(entry.tier);
      expect(index.byCode.get(entry.code)?.level).toBe('parish');
    }
    expect(game.epoch).toBe(meta.published);
  });

  it('maps every permalink query id to a parish response', () => {
    const ids = new Set<string>();
    for (const bucket of '0123456789abcdef') {
      const file = path.join(DIR, 'q', `${bucket}.json`);
      if (!fs.existsSync(file)) continue;
      for (const [id, [code, recipe]] of Object.entries(json<Record<string, [string, string]>>(`q/${bucket}.json`))) {
        ids.add(id);
        if (code === 'PT') continue;
        expect(json<ParishRecord>(`parish/${code}.json`).responses[recipe as PortraitRecipe].id).toBe(id);
      }
    }
    expect(ids.size).toBe(meta.counts.responses);
  });
});

describe('reading cells', () => {
  const recipeAge = meta.recipes.age;

  it('orders ages numerically and keeps suppressed and absent cells non-numeric', () => {
    const cells = readCells({
      id: 'q1_x', decision: 'publish', requested_tier: 'A', resolved_tier: 'A', reasons: [],
      cells: [
        [['10 - 14 anos'], 0.1, '10.0%'],
        [['5 - 9 anos'], null, 'Suprimido', 'cell_below_minimum'],
        [['0 - 4 anos'], 0.05, '5.0%'],
      ],
    }, recipeAge, 'pt');
    expect(cells.slice(0, 3).map(cell => cell.values[0])).toEqual(['0 - 4 anos', '5 - 9 anos', '10 - 14 anos']);
    expect(cells[0].display).toBe('5,0%');
    expect(cells[1]).toMatchObject({ state: 'suppressed', share: null, display: 'Suprimido' });
    expect(cells[3]).toMatchObject({ state: 'absent', share: null, display: '—' });
  });

  it('never treats a response with a suppressed cell as a whole', () => {
    const base = { id: 'q1_x', decision: 'publish' as const, requested_tier: 'A' as const, resolved_tier: 'A' as const, reasons: [] };
    expect(isWhole({ ...base, cells: [[['yes'], 0.2, '20.0%'], [['no'], 0.8, '80.0%']] })).toBe(true);
    expect(isWhole({ ...base, cells: [[['yes'], null, 'Suprimido', 'cell_below_minimum'], [['no'], 0.95, '95.0%']] })).toBe(false);
    expect(isWhole({ ...base, decision: 'refuse', cells: [] })).toBe(false);
  });

  it('formats the producer’s display value without re-rounding', () => {
    expect(formatDisplay('17.2%', 'pt')).toBe('17,2%');
    expect(formatDisplay('17.2%', 'en')).toBe('17.2%');
    expect(formatDisplay('Suprimido', 'en')).toBe('Suppressed');
  });
});

describe('parish search', () => {
  const index = indexPlaces(places);

  it('ignores accents and case, and finds members of a parish union', () => {
    const names = searchParishes(index, 'barro').map(hit => hit.parish.name);
    expect(names).toContain('União das freguesias de Barrô e Aguada de Baixo');
    expect(searchParishes(index, 'SANTA MARIA MAIOR').length).toBeGreaterThan(0);
  });

  it('finds the Barcelos parishes with letter codes', () => {
    expect(index.byCode.get('0302FA')?.municipalityName).toBe('Barcelos');
  });
});
