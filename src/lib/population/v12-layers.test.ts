import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import { GROUPS, parishGroups } from '@/components/population/parish/groups';
import { twinRows } from '@/components/population/twin-rows';
import type { CompactResponse, LayerRecipe, ParishRecord, PopulationMeta, PopulationRecipe, PortraitRecipe } from '@/types/population';
import { readCells } from './compact';
import {
  DIMENSION_LABEL,
  LAYER_RECIPES,
  MODELLED_ANCHOR,
  MODELLED_RECIPES,
  RECIPE_COPY,
  RECIPE_PROVENANCE,
  RECIPE_TABLE,
  VALUES,
  isPortraitRecipe,
  sourceLine,
} from './labels';

/**
 * The v1.2 parish questions (docs/population/v1.2-parish-questions.md), built
 * before the release exists. The fixture's values are synthetic and never
 * served; what these tests hold is that every question has its words, its
 * labels and its source, that a release without them changes nothing, and that
 * one with them shows them in their sections.
 */
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'v1.2-layers.json'), 'utf8')) as {
  data_status: string;
  parish: string;
  recipes: Record<LayerRecipe, PopulationRecipe>;
  responses: Record<LayerRecipe, CompactResponse>;
};
const dir = path.join(process.cwd(), 'public', 'data', POPULATION_DATA_DIR);
const json = <T,>(rel: string): T => JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8')) as T;
const meta = json<PopulationMeta>('meta.json');
const record = json<ParishRecord>(`parish/${fixture.parish}.json`);

describe('v1.2 parish questions: the words', () => {
  it('names every layer question once, with its copy, provenance and labels', () => {
    expect([...LAYER_RECIPES].sort()).toEqual(Object.keys(fixture.recipes).sort());
    for (const recipe of LAYER_RECIPES) {
      expect(isPortraitRecipe(recipe)).toBe(true);
      expect(RECIPE_COPY[recipe].short.pt, recipe).toBeTruthy();
      expect(RECIPE_COPY[recipe].population.en, recipe).toBeTruthy();
      expect(RECIPE_PROVENANCE[recipe], recipe).toBeDefined();
      for (const dimension of fixture.recipes[recipe].dimensions) expect(DIMENSION_LABEL[dimension], dimension).toBeDefined();
    }
    expect(isPortraitRecipe('vote')).toBe(false);
    // No dimension a card draws is left without words: a raw code never reaches a live card.
    for (const recipe of LAYER_RECIPES) for (const dimension of fixture.recipes[recipe].dimensions) expect(VALUES[dimension]?.length, dimension).toBeGreaterThan(0);
    expect(VALUES.income_band.find(entry => entry.value === '0')!.label.pt).not.toMatch(/sem rendimento/i);
  });

  it('gives every card a unique anchor that no section heading uses', () => {
    const anchors = Object.values(RECIPE_COPY).map(copy => copy.anchor);
    expect(new Set(anchors).size).toBe(anchors.length);
    const reserved = new Set([...GROUPS.map(group => group.id), 'partilhar', 'citar', 'outras', 'ler-title', 'main-content']);
    expect(anchors.filter(anchor => reserved.has(anchor))).toEqual([]);
  });

  it('puts every question in exactly one section, the modelled ones apart', () => {
    const placed = GROUPS.flatMap(group => group.recipes);
    expect(placed.sort()).toEqual(Object.keys(RECIPE_COPY).sort());
    const modelled = GROUPS.find(group => group.id === 'modelado')!;
    expect([...modelled.recipes].sort()).toEqual([...MODELLED_RECIPES].sort());
    for (const recipe of MODELLED_RECIPES) expect(RECIPE_PROVENANCE[recipe]).toBe('modelled');
    expect(modelled.lede?.pt).toMatch(/Nenhum quadro do INE fixa/);
  });

  it('says on each source line what fixes the figures', () => {
    for (const recipe of LAYER_RECIPES) {
      const provenance = RECIPE_PROVENANCE[recipe];
      for (const locale of ['pt', 'en'] as const) {
        const line = sourceLine(recipe, locale);
        if (provenance === 'modelled') {
          expect(line, recipe).toMatch(locale === 'pt' ? /modelado/ : /modelled/);
          expect(line, recipe).toContain(MODELLED_ANCHOR[recipe]![locale]);
        } else if (RECIPE_TABLE[recipe]) {
          expect(line, recipe).toContain(RECIPE_TABLE[recipe]![locale]);
        }
        if (provenance === 'tilted' || provenance === 'modelled') expect(line).toMatch(locale === 'pt' ? /média de cinco sorteios/ : /mean of five draws/);
      }
    }
    // Income is anchored to fiscal units per município, not to an INE table of persons; residence in 2019 has no anchor at any level.
    expect(sourceLine('income', 'pt')).toMatch(/ancorado às declarações de IRS de 2021 por concelho/);
    expect(sourceLine('income', 'pt')).not.toMatch(/quadro/);
    expect(sourceLine('residence_2019', 'en')).toMatch(/no INE table fixes it/);
  });
});

describe('v1.2 parish questions: against the fixture', () => {
  it('is a fixture, never a release', () => {
    expect(fixture.data_status).toBe('fixture');
  });

  it('knows every category code the fixture carries', () => {
    for (const recipe of LAYER_RECIPES) {
      const [dimension] = fixture.recipes[recipe].dimensions;
      const known = new Set(VALUES[dimension].map(entry => entry.value));
      const cells = fixture.responses[recipe].cells.map(cell => cell[0][0]);
      expect(cells.filter(code => !known.has(code)), recipe).toEqual([]);
      const read = readCells(fixture.responses[recipe], fixture.recipes[recipe], 'pt');
      expect(read.every(cell => cell.state === 'published'), recipe).toBe(true);
      expect(twinRows(recipe, read, 'pt').length, recipe).toBe(read.length);
    }
  });

  it('shows the v1.0.3 page unchanged when the release has no layer question', () => {
    const groups = parishGroups(meta.recipe_order, record, meta.recipes);
    expect(groups.map(group => group.id)).toEqual(['pessoas', 'casas']);
    expect(groups.flatMap(group => group.recipes)).toEqual([
      'elders_alone', 'who_lives_alone', 'age', 'employment', 'education',
      'multigenerational', 'household_size', 'household_type',
    ]);
  });

  it('shows the layer questions in their sections when the release carries them', () => {
    const order = [...meta.recipe_order, ...LAYER_RECIPES] as PortraitRecipe[];
    const recipes = { ...meta.recipes, ...fixture.recipes } as PopulationMeta['recipes'];
    const withLayers = { responses: { ...record.responses, ...fixture.responses } };
    const groups = parishGroups(order, withLayers, recipes);
    expect(groups.map(group => group.id)).toEqual(['pessoas', 'origem', 'trabalho-e-deslocacoes', 'casas', 'modelado']);
    expect(groups.find(group => group.id === 'trabalho-e-deslocacoes')!.recipes).toEqual(['sitprof', 'occupation', 'industry', 'work_place', 'transport']);
    // A question the release has no answer for in this parish is left out, and so is a section left empty.
    const partial = { responses: { ...record.responses, lived_abroad: fixture.responses.lived_abroad } };
    expect(parishGroups(order, partial, recipes).map(group => group.id)).toEqual(['pessoas', 'origem', 'casas']);
    // A recipe the site has no words for is never drawn.
    expect(parishGroups([...order, 'vote'], withLayers, recipes).flatMap(group => group.recipes)).not.toContain('vote');
  });
});
