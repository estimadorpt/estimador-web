import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { ParishRecord, PopulationMeta } from '@/types/population';
import { HONESTY } from './labels';
import { drawShareCard, parishQuestion, SHARE_CARD, shareCardModel, wrapLines } from './share-card';

const DIR = path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR);
const json = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as T;
const meta = json<PopulationMeta>('meta.json');
const parish = (code: string) => json<ParishRecord>(`parish/${code}.json`);

describe('parishQuestion', () => {
  it('asks the page question, with the contraction a União needs', () => {
    expect(parishQuestion('Aguada de Cima', 'pt')).toBe('Quem vive em Aguada de Cima?');
    expect(parishQuestion('União das freguesias de Barrô e Aguada de Baixo', 'pt')).toBe('Quem vive na União das freguesias de Barrô e Aguada de Baixo?');
    expect(parishQuestion('Mosteiro', 'en')).toBe('Who lives in Mosteiro?');
  });
});

describe('shareCardModel', () => {
  it('quotes up to three published cells with their population, in the reader’s number format (tier A)', () => {
    const model = shareCardModel({ record: parish('010103'), recipes: meta.recipes, name: 'Aguada de Cima', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'pt' });
    expect(model.title).toBe('Quem vive em Aguada de Cima?');
    expect(model.place).toBe('Águeda · Aveiro');
    expect(model.facts.map(f => f.text)).toEqual([
      'Pessoas com 65+ que vivem sozinhas: 17,2%',
      'Agregados com criança e pessoa de 65+: 2,5%',
      expect.stringMatching(/^Agregados de uma só pessoa: \d+,\d%$/),
    ]);
    expect(model.scopeNote).toBeNull();
    expect(model.honesty).toBe(HONESTY.synthetic.pt);
    expect(model.footer).toBe('estimador.pt · População sintética v1.0.0 · Censos 2021');
    expect(model.fileName).toBe('estimador-010103-aguada-de-cima.png');
  });

  it('names the município on every fact of a fallback parish (tier C)', () => {
    const model = shareCardModel({ record: parish('010122'), recipes: meta.recipes, name: 'União das freguesias de Barrô e Aguada de Baixo', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'pt' });
    expect(model.facts).toHaveLength(3);
    expect(model.facts[0].text).toBe('Pessoas com 65+ que vivem sozinhas (concelho de Águeda): 16,3%');
    for (const fact of model.facts) {
      expect(fact.fallback).toBe(true);
      expect(fact.label).toContain('(concelho de Águeda)');
    }
    expect(model.scopeNote).toContain('Valores do concelho de Águeda');
  });

  it('writes English with the producer’s own decimal point', () => {
    const model = shareCardModel({ record: parish('010103'), recipes: meta.recipes, name: 'Aguada de Cima', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'en' });
    expect(model.facts[0].text).toBe('People aged 65+ living alone: 17.2%');
    expect(model.footer).toBe('estimador.pt · Synthetic population v1.0.0 · 2021 Census');
  });

  it('skips suppressed, absent and refused cells instead of showing a zero', () => {
    const record = parish('010103');
    const edited: ParishRecord = {
      ...record,
      responses: {
        ...record.responses,
        elders_alone: { ...record.responses.elders_alone, cells: [[['no'], 0.9, '90.0%'], [['yes'], null, 'Suprimido', 'cell_below_minimum']] },
        multigenerational: { ...record.responses.multigenerational, decision: 'refuse', cells: [] },
        household_size: { ...record.responses.household_size, cells: record.responses.household_size.cells.filter(c => c[0][0] !== '1') },
      },
    };
    const model = shareCardModel({ record: edited, recipes: meta.recipes, name: 'Aguada de Cima', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'pt' });
    expect(model.facts.map(f => f.label)).toEqual(['Pessoas com ensino superior (todas as idades)', 'Pessoas empregadas (todas as idades)']);
    for (const fact of model.facts) expect(fact.value).toMatch(/^\d+,\d%$/);
  });

  it('only ever quotes values that appear verbatim in the parish file', () => {
    for (const code of ['010103', '010122', '0302FA', '480107']) {
      const record = parish(code);
      const displays = new Set(Object.values(record.responses).flatMap(r => r.cells.map(c => c[2].replace('.', ','))));
      const model = shareCardModel({ record, recipes: meta.recipes, name: code, municipalityName: 'X', regionName: 'Y', locale: 'pt' });
      expect(model.facts.length).toBeGreaterThan(0);
      for (const fact of model.facts) expect(displays.has(fact.value)).toBe(true);
    }
  });
});

describe('text fitting', () => {
  const measure = (size: number) => (text: string) => text.length * size * 0.5;

  it('wraps greedily and ellipsises the last allowed line', () => {
    expect(wrapLines('um dois três quatro', 50, measure(10))).toEqual(['um dois', 'três', 'quatro']);
    const two = wrapLines('um dois três quatro cinco seis', 50, measure(10), 2);
    expect(two).toHaveLength(2);
    expect(two[1].endsWith('…')).toBe(true);
  });

});

describe('drawShareCard', () => {
  const calls: Array<{ text: string; font: string; x: number; y: number }> = [];
  const original = (globalThis as { Path2D?: unknown }).Path2D;
  beforeEach(() => {
    calls.length = 0;
    (globalThis as { Path2D?: unknown }).Path2D = class { constructor(public d: string) {} };
  });
  afterEach(() => { (globalThis as { Path2D?: unknown }).Path2D = original; });

  function fakeContext() {
    const ctx = {
      font: '10px sans-serif', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: 'left', textBaseline: 'alphabetic',
      save() {}, restore() {}, translate() {}, scale() {}, fill() {}, fillRect() {}, beginPath() {}, roundRect() {}, rect() {},
      moveTo() {}, lineTo() {}, stroke() {},
      measureText(text: string) { const size = Number(/(\d+)px/.exec(ctx.font)?.[1] ?? 10); return { width: text.length * size * 0.55 }; },
      fillText(text: string, x: number, y: number) { calls.push({ text, font: ctx.font, x, y }); },
    };
    return ctx;
  }

  it('draws the question, every fact, the honesty line and the source, at 20px or more', () => {
    const model = shareCardModel({ record: parish('010122'), recipes: meta.recipes, name: 'União das freguesias de Barrô e Aguada de Baixo', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'pt' });
    drawShareCard(fakeContext() as unknown as CanvasRenderingContext2D, model);
    const all = calls.map(c => c.text).join(' ');
    expect(all).toContain('Quem vive na');
    for (const fact of model.facts) expect(all).toContain(fact.value);
    expect(calls.some(c => c.text === HONESTY.synthetic.pt)).toBe(true);
    expect(calls.some(c => c.text === model.footer)).toBe(true);
    for (const call of calls) expect(Number(/(\d+)px/.exec(call.font)?.[1])).toBeGreaterThanOrEqual(20);
    // No emoji anywhere on the card.
    expect(all).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(SHARE_CARD).toEqual({ width: 1200, height: 630 });
  });

  it('keeps a long União name, the place and the município note above the bottom rule', () => {
    const names = [
      'União das freguesias de Milhazes, Vilar de Figos e Faria',
      // The longest name in places.json (070107).
      'União das freguesias de Alandroal (Nossa Senhora da Conceição), São Brás dos Matos (Mina do Bugalho) e Juromenha (Nossa Senhora do Loreto)',
    ];
    for (const [name, locale] of names.flatMap(n => (['pt', 'en'] as const).map(l => [n, l] as const))) {
      calls.length = 0;
      const model = shareCardModel({ record: parish('010122'), recipes: meta.recipes, name, municipalityName: 'Barcelos', regionName: 'Braga', locale });
      drawShareCard(fakeContext() as unknown as CanvasRenderingContext2D, model);
      const leftColumn = calls.filter(c => c.x === 72 && c.text !== model.honesty && c.text !== model.footer);
      expect(leftColumn.length).toBeGreaterThan(3);
      for (const call of leftColumn) expect(call.y).toBeLessThanOrEqual(SHARE_CARD.height - 102 - 28);
      expect(leftColumn.some(c => c.text.endsWith('…'))).toBe(false);
    }
  });
});
