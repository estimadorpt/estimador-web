import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR, POPULATION_RELEASE } from '@/lib/config/population';
import type { ParishRecord, PopulationMeta } from '@/types/population';
import { HONESTY } from './labels';
import { drawShareCard, parishQuestion, SHARE_CARD, SHARE_CARD_DIVIDER, shareCardModel, wrapLines } from './share-card';

const DIR = path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR);
const json = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as T;
const meta = json<PopulationMeta>('meta.json');
const parish = (code: string) => json<ParishRecord>(`parish/${code}.json`);

/**
 * No answer since v1.0.1 falls back to the município; the contract can still say so,
 * so the fallback wording is tested on a synthetic edit of a real record.
 */
function asFallback(record: ParishRecord, name: string): ParishRecord {
  return {
    ...record,
    status: 'fallback',
    fallback: { code: `${record.code.slice(0, 4)}00`, name },
    responses: Object.fromEntries(Object.entries(record.responses).map(([recipe, response]) => [recipe, { ...response, decision: 'fallback', resolved: `${record.code.slice(0, 4)}00` }])) as ParishRecord['responses'],
  };
}

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
      'Pessoas com 65+ em agregados privados que vivem sozinhas: 18,0%',
      'Agregados privados com criança e pessoa de 65+: 2,5%',
      'Agregados privados de uma só pessoa: 19,8%',
    ]);
    expect(model.scopeNote).toBeNull();
    expect(model.tierNote).toBe('Qualidade A · números da própria freguesia.');
    expect(model.honesty).toBe(HONESTY.synthetic.pt);
    expect(model.footer).toBe(`População sintética v${POPULATION_RELEASE} · 5 out. 2026 · estimador.pt`);
    expect(model.fileName).toBe('estimador-010103-aguada-de-cima.png');
  });

  it('carries the licence attribution, the publication date and the parish address (P-H3)', () => {
    const model = shareCardModel({ record: parish('010103'), recipes: meta.recipes, name: 'Aguada de Cima', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'pt', url: 'https://estimador.pt/pt/populacao/freguesia/010103/' });
    expect(model.attribution).toContain('Fonte: INE, Censos 2021');
    expect(model.attribution).toContain('informação modificada por estimador.pt');
    expect(model.attribution).toContain('CC BY 4.0');
    expect(model.attribution).toContain('estimador.pt/pt/populacao/dados');
    expect(model.footer).toBe(`População sintética v${POPULATION_RELEASE} · 5 out. 2026 · estimador.pt/pt/populacao/freguesia/010103`);
    const en = shareCardModel({ record: parish('010103'), recipes: meta.recipes, name: 'Aguada de Cima', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'en', url: 'https://estimador.pt/en/populacao/freguesia/010103/' });
    expect(en.attribution).toMatch(/^Source: INE, 2021 Census · information modified by estimador\.pt · CC BY 4\.0/);
    expect(en.footer).toContain('5 Oct 2026 · estimador.pt/en/populacao/freguesia/010103');
  });

  it('quotes a tier C parish’s own figures and says to read them with more care', () => {
    const record = parish('010122');
    expect(record.tier).toBe('C');
    const model = shareCardModel({ record, recipes: meta.recipes, name: 'União das freguesias de Barrô e Aguada de Baixo', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'pt' });
    expect(model.facts).toHaveLength(3);
    for (const fact of model.facts) {
      expect(fact.fallback).toBe(false);
      expect(fact.label).not.toContain('concelho');
    }
    expect(model.scopeNote).toBeNull();
    expect(model.tierNote).toBe('Qualidade C · números da própria freguesia, a ler com mais cuidado.');
    const en = shareCardModel({ record, recipes: meta.recipes, name: 'X', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'en' });
    expect(en.tierNote).toBe('Quality C · the parish’s own figures, to read with more care.');
  });

  it('names the município on every fact of a fallback record (synthetic)', () => {
    const model = shareCardModel({ record: asFallback(parish('010122'), 'Águeda'), recipes: meta.recipes, name: 'União das freguesias de Barrô e Aguada de Baixo', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'pt' });
    expect(model.facts).toHaveLength(3);
    expect(model.facts[0].text).toMatch(/^Pessoas com 65\+ em agregados privados que vivem sozinhas \(concelho de Águeda\): \d+,\d%$/);
    expect(model.tierNote).toBeNull();
    for (const fact of model.facts) {
      expect(fact.fallback).toBe(true);
      expect(fact.label).toContain('(concelho de Águeda)');
    }
    expect(model.scopeNote).toContain('Valores do concelho de Águeda');
  });

  it('writes English with a decimal point (the producer writes pt-PT commas)', () => {
    const model = shareCardModel({ record: parish('010103'), recipes: meta.recipes, name: 'Aguada de Cima', municipalityName: 'Águeda', regionName: 'Aveiro', locale: 'en' });
    expect(model.facts[0].text).toBe('People aged 65+ in private households living alone: 18.0%');
    expect(model.footer).toBe(`Synthetic population v${POPULATION_RELEASE} · 5 Oct 2026 · estimador.pt`);
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
    expect(all).toContain('Fonte: INE, Censos 2021');
    expect(all).toContain('CC BY 4.0');
    // Everything sits on the 630 px canvas.
    for (const call of calls) expect(call.y).toBeLessThanOrEqual(SHARE_CARD.height - 20);
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
      for (const record of [parish('010122'), asFallback(parish('010122'), 'Barcelos')]) {
      const model = shareCardModel({ record, recipes: meta.recipes, name, municipalityName: 'Barcelos', regionName: 'Braga', locale });
      calls.length = 0;
      drawShareCard(fakeContext() as unknown as CanvasRenderingContext2D, model);
      const leftColumn = calls.filter(c => c.x === 72 && c.y < SHARE_CARD_DIVIDER);
      expect(leftColumn.length).toBeGreaterThan(3);
      for (const call of leftColumn) expect(call.y).toBeLessThanOrEqual(SHARE_CARD_DIVIDER - 28);
      expect(leftColumn.some(c => c.text.endsWith('…'))).toBe(false);
      }
    }
  });
});
