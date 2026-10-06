import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR, POPULATION_DOWNLOADS, POPULATION_GAME_EPOCH, POPULATION_RELEASE } from '@/lib/config/population';
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
import { exactParishOption, fold, indexPlaces, nearestParish, regionSlug, searchNames, searchParishes, searchPlaces } from './places';

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
    const decisions: Record<string, number> = {};
    let zeros = 0;
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
        decisions[compact.decision] = (decisions[compact.decision] ?? 0) + 1;
        // From v1.0.1 every category of a question is present; nobody in it reads 0,0%, not a dash.
        const cells = readCells(compact, meta.recipes[name as PortraitRecipe], 'pt');
        expect(cells.filter(cell => cell.state !== 'published'), `${record.code} ${name}`).toEqual([]);
        zeros += compact.cells.filter(cell => cell[1] === 0).length;
        checked += 1;
      }
    }
    const national = json<NationalRecord>('national.json');
    const nationalResponse = rebuildResponse(national.response, meta.recipes.national_age, { level: 'national', code: 'PT', name: national.name }, meta);
    parsePublicResponse(nationalResponse, context);
    expect(hashQuery(nationalResponse.query)).toBe(national.response.id);
    decisions[national.response.decision] = (decisions[national.response.decision] ?? 0) + 1;
    expect(checked + 1).toBe(meta.counts.responses);
    expect(decisions).toEqual(meta.counts.decisions);
    // v1.0.3 (doc 206 §5-§7): every answer is the parish's own, nothing suppressed, zeros shown.
    // 8,723 zero categories (10,130 in v1.0.1, before "<NA>" left the household questions).
    expect(meta.counts.decisions).toEqual({ publish: 24737 });
    expect(meta.counts.suppressed_cells).toBe(0);
    expect(zeros).toBe(8723);
  });

  it('has words for every category value in the release', () => {
    for (const [dimension, values] of Object.entries(meta.coordinates)) {
      const known = new Set((VALUES[dimension] ?? []).map(entry => entry.value));
      expect(values.filter(value => !known.has(value)), dimension).toEqual([]);
    }
    expect(Object.keys(RECIPE_COPY).sort()).toEqual([...meta.recipe_order].sort());
  });

  it('asks the household questions of private households, and says so (v1.0.2 onwards)', () => {
    const PRIVATE = ['elders_alone', 'who_lives_alone', 'multigenerational', 'household_size', 'household_type'] as const;
    for (const name of PRIVATE) {
      expect(meta.recipes[name].filters, name).toContainEqual({ field: 'is_institutional', operator: 'eq', values: ['0'] });
      expect(RECIPE_COPY[name].population.pt, name).toMatch(/agregados? privados?/i);
      expect(RECIPE_COPY[name].population.en, name).toMatch(/private households?/i);
      expect(RECIPE_COPY[name].population.pt, name).not.toMatch(/conta como|Inclui os alojamentos/);
    }
    // The institutional "<NA>" household type is gone from the release and from the labels.
    expect(meta.coordinates.hh_type_top).toEqual(['1', '2', '3', '4']);
    expect(VALUES.hh_type_top.map(entry => entry.value)).toEqual(['1', '2', '3', '4']);
    const record = json<ParishRecord>('parish/010103.json');
    expect(readCells(record.responses.elders_alone, meta.recipes.elders_alone, 'pt').map(cell => cell.display)).toEqual(['18,0%', '82,0%']);
    expect(readCells(record.responses.elders_alone, meta.recipes.elders_alone, 'en').map(cell => cell.display)).toEqual(['18.0%', '82.0%']);
  });

  it('links downloads whose sizes match the release’s own package list', () => {
    const release = json<{ version: string; files: Array<{ path: string; bytes: number }> }>('release.json');
    expect(release.version).toBe(POPULATION_RELEASE);
    expect(meta.release_version).toBe(POPULATION_RELEASE);
    const packaged = new Map(release.files.map(file => [file.path, file.bytes]));
    const inPackage: Record<string, string> = {
      persons: 'national/persons.parquet',
      households: 'national/households.parquet',
      quality: 'quality/quality.csv',
      metadata: 'metadata.json',
    };
    for (const [key, packagePath] of Object.entries(inPackage)) {
      const file = POPULATION_DOWNLOADS.files.find(entry => entry.key === key)!;
      expect(file.bytes, key).toBe(packaged.get(packagePath));
      expect(file.url).toContain(`/releases/download/v${POPULATION_RELEASE}/`);
    }
    expect(POPULATION_DOWNLOADS.modelCard).toContain(`/blob/v${POPULATION_RELEASE}/`);
    expect(POPULATION_DOWNLOADS.errata).toContain(`/blob/v${POPULATION_RELEASE}/`);
  });

  it('agrees with the place list on tier and publication level', () => {
    const index = indexPlaces(places);
    for (const file of parishFiles) {
      const record = json<ParishRecord>(`parish/${file}`);
      const parish = index.byCode.get(record.code);
      expect(parish, record.code).toBeDefined();
      expect(parish!.tier).toBe(record.tier);
      expect(parish!.level).toBe(record.status === 'publish' ? 'parish' : 'municipality');
      expect(record.fallback === null).toBe(record.status === 'publish');
      // From v1.0.1 every parish answers with its own figures, tier C included.
      expect(record.status).toBe('publish');
      for (const response of Object.values(record.responses)) expect(response.resolved_tier).toBe(record.tier);
    }
  });

  it('offers every parish, of any tier, to the daily game, in curated order', () => {
    const game = json<GameIndex>('game/index.json');
    const entries: GameEntry[] = [];
    for (let n = 0; n < game.chunks; n += 1) entries.push(...json<GameEntry[]>(`game/chunk-${String(n).padStart(3, '0')}.json`));
    expect(entries).toHaveLength(game.candidates);
    expect(entries.map(entry => entry.order)).toEqual(entries.map((_, i) => i));
    const index = indexPlaces(places);
    expect(game.candidates).toBe(places.parishes.length);
    expect(new Set(entries.map(entry => entry.code)).size).toBe(places.parishes.length);
    for (const entry of entries) {
      expect(entry.tier).toBe(index.byCode.get(entry.code)?.tier);
      expect(index.byCode.get(entry.code)?.level).toBe('parish');
    }
    expect(entries.filter(entry => entry.tier === 'C')).toHaveLength(meta.counts.tiers.C);
    // Day 0 is the launch day, not the release date (see POPULATION_GAME_EPOCH).
    expect(game.epoch).toBe(POPULATION_GAME_EPOCH);
  });

  it('carries quality.csv’s worst table and typical error in every parish header (MR2-03, P202)', () => {
    let ageSingleInC500 = 0;
    for (const file of parishFiles) {
      const record = json<ParishRecord>(`parish/${file}`);
      const place = record.place;
      expect(place?.worst_constraint).toMatch(/^srmse_[a-z0-9_]+$/);
      expect(place?.worst_constraint_srmse).toBeGreaterThanOrEqual(0);
      expect(place?.person_srmse_median).toBeGreaterThanOrEqual(0);
      if (record.tier === 'C' && (place?.publication_population ?? 0) >= 500 && place?.worst_constraint === 'srmse_p_age_single') ageSingleInC500 += 1;
    }
    // The audit's count: 705 of the 728 tier C parishes of 500 or more have single-year age as their worst table.
    expect(ageSingleInC500).toBe(705);
  });

  it('decides every parish’s tier from its header with release.json’s policy, so the page can say why (P202)', () => {
    type Limits = { max_person_srmse_median: number; max_worst_srmse: number; min_population: number };
    const { A, B } = json<{ quality_tier_policy: { thresholds: { A: Limits; B: Limits } } }>('release.json').quality_tier_policy.thresholds;
    const meets = (limits: Limits, place: NonNullable<ParishRecord['place']>) =>
      place.person_srmse_median! <= limits.max_person_srmse_median
      && place.worst_constraint_srmse! <= limits.max_worst_srmse
      && place.publication_population >= limits.min_population;
    for (const file of parishFiles) {
      const record = json<ParishRecord>(`parish/${file}`);
      const place = record.place!;
      expect(meets(A, place) ? 'A' : meets(B, place) ? 'B' : 'C', record.code).toBe(record.tier);
    }
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
    // v1.0.2 onwards: the producer writes pt-PT decimals.
    expect(formatDisplay('17,2%', 'pt')).toBe('17,2%');
    expect(formatDisplay('17,2%', 'en')).toBe('17.2%');
    expect(formatDisplay('100,0%', 'en')).toBe('100.0%');
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

  it('lists a município typed by name first, then all of its parishes (P-H4: porto, lisboa)', () => {
    for (const [query, name] of [['porto', 'Porto'], ['lisboa', 'Lisboa'], ['Braga', 'Braga']] as const) {
      const { hits } = searchPlaces(index, query);
      expect(hits[0].kind).toBe('municipality');
      if (hits[0].kind !== 'municipality') continue;
      expect(hits[0].municipality.name).toBe(name);
      const own = index.parishes.filter(p => p.municipalityName === name);
      expect(hits[0].municipality.parishCount).toBe(own.length);
      const listed = hits.slice(1, 1 + own.length);
      expect(listed.every(hit => hit.kind === 'parish' && hit.underMunicipality && hit.parish.municipalityName === name)).toBe(true);
      // Every one of them, not a first page of twelve.
      expect(listed).toHaveLength(own.length);
    }
    // Porto Covo and friends still come, after the city's parishes.
    const porto = searchParishes(index, 'porto').map(hit => hit.parish.name);
    expect(porto).toContain('Porto Covo');
    expect(porto.indexOf('Porto Covo')).toBeGreaterThan(porto.indexOf('Bonfim'));
    // "braga" lists Braga's parishes before anything in Bragança.
    const braga = searchParishes(index, 'braga');
    const firstBraganca = braga.findIndex(hit => hit.parish.municipalityName === 'Bragança');
    const lastBraga = braga.map(hit => hit.parish.municipalityName).lastIndexOf('Braga');
    expect(firstBraganca === -1 || firstBraganca > lastBraga).toBe(true);
  });

  it('ranks an exact union member above a name that only starts with the query (sé)', () => {
    const first = searchParishes(index, 'sé')[0].parish;
    expect(searchNames(first.name).slice(1)).toContain('se');
    const seara = searchParishes(index, 'sé').findIndex(hit => fold(hit.parish.name).startsWith('seara'));
    expect(seara === -1 || seara > 0).toBe(true);
  });

  it('finds a member named in parentheses or after "União das freguesias da/do" (sé: Funchal, Angra, Lamego, Portalegre)', () => {
    const se = searchParishes(index, 'sé').map(hit => hit.parish.name);
    for (const name of ['Funchal (Sé)', 'Angra (Sé)', 'Lamego (Almacave e Sé)', 'União das freguesias da Sé e São Lourenço', 'União das freguesias de Faro (Sé e São Pedro)']) {
      expect(se).toContain(name);
    }
    // Exact members (rank 1) come before names that only start with "se" (Seara…).
    const seara = se.findIndex(name => fold(name).startsWith('seara'));
    expect(seara === -1 || seara > se.indexOf('Funchal (Sé)')).toBe(true);
    expect(searchNames('Funchal (Sé)')).toEqual(['funchal se', 'funchal', 'se']);
    expect(searchNames('União das freguesias do Bombarral e Vale Covo')).toEqual(['uniao das freguesias do bombarral e vale covo', 'bombarral', 'vale covo']);
    expect(searchNames('União de freguesias de Agrela e Serafão').slice(1)).toEqual(['agrela', 'serafao']);
    expect(searchNames('Aguada de Cima')).toEqual(['aguada de cima']);
  });

  it('puts the parish named like a município first among its parishes (MISS-01: viseu, vinhais, guarda)', () => {
    for (const name of ['Viseu', 'Vinhais', 'Guarda', 'Mértola']) {
      const { hits } = searchPlaces(index, name);
      expect(hits[0].kind).toBe('municipality');
      const first = hits[1];
      expect(first.kind === 'parish' && first.parish.name).toBe(name);
      // The rest follow by how well they match ("Coutos de Viseu" before "Abraveses"), then alphabetically.
      const rest = hits.slice(2).flatMap(hit => (hit.kind === 'parish' && hit.underMunicipality ? [hit] : []));
      const sorted = [...rest].sort((a, b) => (a.rank === b.rank ? a.parish.name.localeCompare(b.parish.name, 'pt') : a.rank - b.rank));
      expect(rest.map(hit => hit.parish.name)).toEqual(sorted.map(hit => hit.parish.name));
    }
  });

  it('lets Enter guess only a parish named exactly like the query (MISS-01)', () => {
    // "Viseu": one parish is called exactly that, so Enter may choose it.
    const viseu = searchPlaces(index, 'viseu').hits;
    const chosen = viseu[exactParishOption(viseu)];
    expect(chosen.kind === 'parish' && chosen.parish.name).toBe('Viseu');
    // "Mealhada": no parish is called exactly that (it is a union's member), so Enter chooses nothing.
    expect(exactParishOption(searchPlaces(index, 'mealhada').hits)).toBe(-1);
    // A partial name never picks for the player, nor does a name shared by several parishes.
    expect(exactParishOption(searchPlaces(index, 'abrav').hits)).toBe(-1);
    expect(exactParishOption(searchPlaces(index, 'santa maria maior').hits)).toBe(-1);
    // A code is exact.
    const code = searchPlaces(index, '030831').hits;
    expect(code[exactParishOption(code)]).toMatchObject({ kind: 'parish', parish: { code: '030831' } });
  });

  it('accepts a six-character code, digits or letters (030831, 0302fa)', () => {
    expect(searchParishes(index, '030831')[0].parish.code).toBe('030831');
    expect(searchParishes(index, '0302fa')[0].parish.code).toBe('0302FA');
  });

  it('matches every word, leaving out de/da/do/e (moreira conegos)', () => {
    const names = searchParishes(index, 'moreira conegos').map(hit => hit.parish.name);
    expect(names.some(name => fold(name).includes('moreira de conegos'))).toBe(true);
    // Across the parish and its município too.
    const across = searchParishes(index, 'aguada agueda').map(hit => hit.parish.name);
    expect(across.some(name => /Aguada/.test(name))).toBe(true);
  });

  it('ranks a parish whose words are all in the query above prefix matches (PUB3-01: "<concelho> Sé")', () => {
    const first = (query: string) => searchParishes(index, query)[0]?.parish;
    for (const query of ['Bragança Sé', 'Sé Bragança', 'Se Braganca', 'Bragança (Sé']) {
      expect(first(query)?.name, query).toBe('União das freguesias de Sé, Santa Maria e Meixedo');
    }
    expect(first('Porto Sé')?.name).toBe('União das freguesias de Cedofeita, Santo Ildefonso, Sé, Miragaia, São Nicolau e Vitória');
    expect(first('Braga Sé')?.name).toBe('União das freguesias de Braga (Maximinos, Sé e Cividade)');
    // Prefix-only matches still come, after the whole-word ones.
    const braganca = searchParishes(index, 'Bragança Sé').map(hit => hit.parish.name);
    expect(braganca.indexOf('Sendas')).toBeGreaterThan(0);
  });

  it('lists a parish named exactly like the query first in the game, above the concelhos of that name (UXM3-20: lagoa)', () => {
    const game = searchPlaces(index, 'Lagoa', 12, { exactFirst: true }).hits;
    expect(game[0]).toMatchObject({ kind: 'parish', parish: { code: '040516', name: 'Lagoa' } });
    expect(exactParishOption(game)).toBe(0);
    expect(game.filter(hit => hit.kind === 'municipality').map(hit => hit.kind === 'municipality' && hit.municipality.name)).toEqual(['Lagoa', 'Lagoa']);
    // Off the game, the concelhos still lead (choosing one opens its list).
    expect(searchPlaces(index, 'Lagoa').hits[0].kind).toBe('municipality');
    // With no parish named exactly like the concelho, nothing moves.
    expect(searchPlaces(index, 'porto', 12, { exactFirst: true }).hits[0].kind).toBe('municipality');
  });

  it('counts the matches outside a named concelho apart from its own parishes (PUB3-V02)', () => {
    const porto = searchPlaces(index, 'porto');
    const own = index.parishes.filter(p => p.municipalityName === 'Porto').length;
    expect(porto.total - porto.outside).toBe(own);
    expect(porto.outside).toBeGreaterThan(0);
    const shownOutside = porto.hits.filter(hit => hit.kind === 'parish' && !hit.underMunicipality).length;
    expect(shownOutside).toBeLessThan(porto.outside);
    // Without a named concelho every match is "outside".
    const se = searchPlaces(index, 'sé');
    expect(se.outside).toBe(se.total);
  });

  it('finds no parish for a location far from Portugal (25 km cap)', () => {
    expect(nearestParish(index, { lat: 48.8566, lon: 2.3522 })).toBeNull();
    expect(nearestParish(index, { lat: 38.7223, lon: -9.1393 })?.municipalityName).toBe('Lisboa');
  });
});

describe('region slugs', () => {
  it('are unique and URL-safe', () => {
    const slugs = places.regions.map(([, name]) => regionSlug(name));
    expect(new Set(slugs).size).toBe(20);
    expect(slugs).toContain('viana-do-castelo');
    expect(slugs).toContain('acores');
    expect(slugs.every(slug => /^[a-z-]+$/.test(slug))).toBe(true);
  });
});
