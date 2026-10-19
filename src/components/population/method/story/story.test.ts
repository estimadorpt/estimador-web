import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CANDIDATES, CANDIDATE_SEX, CARE_HOME, KEPT, TARGET, TARGET_HOUSEHOLDS, TARGET_PEOPLE, countsOf, distance, methodExample, weightsAt,
} from '@/lib/population/method-example';
import { BEATS, BEAT_STEP, FIELDS, READOUT, WRITE, tokensWritten } from './data';
import { CARE_WIDTH, HOUSE_HEIGHT, WRITTEN, frame, houseGrids, houseWidth, learnLayout, weightScale, wrap } from './layout';

const root = process.cwd();
const mdx = (locale: string) => readFileSync(path.join(root, 'src/content/population-methodology', `${locale}.mdx`), 'utf8');
const ex = methodExample();
const prior = ex.before[0];

describe('the story’s beats in the methodology', () => {
  for (const locale of ['pt', 'en']) {
    const text = mdx(locale);
    it(`${locale}: has every scene once, in order, inside one <MethodStory>`, () => {
      const story = text.slice(text.indexOf('<MethodStory>'), text.indexOf('</MethodStory>'));
      expect([...story.matchAll(/^<Beat at="([a-z]+)">$/gm)].map(m => m[1])).toEqual([...BEATS]);
      expect(story.match(/^<\/Beat>$/gm)?.length).toBe(BEATS.length);
      expect(text).toContain('<MethodDrawings />');
    });
    it(`${locale}: opens each step with its heading, in the step’s first scene`, () => {
      for (const n of [1, 2, 3, 4, 5]) {
        const first = BEATS.find(b => BEAT_STEP[b] === n)!;
        const beat = text.slice(text.indexOf(`<Beat at="${first}">`));
        expect(beat.split('\n').filter(Boolean)[1]).toMatch(new RegExp(`^### ${n}\\. `));
      }
    });
    it(`${locale}: gives the example’s own counts`, () => {
      const pt = locale === 'pt';
      const story = text.slice(text.indexOf('## '), text.indexOf('</MethodStory>'));
      const rest = TARGET.sizes[4];
      expect(rest).toBe(0);
      for (const phrase of pt
        ? [`${CANDIDATES.length} agregados candidatos`, `${TARGET_HOUSEHOLDS} agregados`, `${TARGET_PEOPLE} pessoas`, `${CANDIDATES.length - KEPT.length} candidatos ficam de fora`, `${TARGET_HOUSEHOLDS} dos ${KEPT.length} candidatos`, `${CARE_HOME.length} pessoas num lar`, `${TARGET_PEOPLE + CARE_HOME.length} residentes`]
        : [`${CANDIDATES.length} candidate households`, `${TARGET_HOUSEHOLDS} households`, `${TARGET_PEOPLE} people`, `${CANDIDATES.length - KEPT.length} candidates are left out`, `${TARGET_HOUSEHOLDS} of the ${KEPT.length} candidates`, `${CARE_HOME.length} people in a care home`, `${TARGET_PEOPLE + CARE_HOME.length} residents`]) {
        expect(story).toContain(phrase);
      }
    });
  }

  it('says the same counts in the stage’s captions', () => {
    for (const locale of ['pt', 'en'] as const) {
      const r = READOUT[locale];
      expect(r.candidates).toContain(String(CANDIDATES.length));
      expect(r.mask).toContain(String(CANDIDATES.length - KEPT.length));
      expect(r.tables).toContain(String(TARGET_HOUSEHOLDS));
      expect(r.tables).toContain(String(TARGET_PEOPLE));
      expect(r.collective).toContain(String(CARE_HOME.length));
      for (const line of Object.values(r)) expect(line.length).toBeLessThanOrEqual(96);
    }
  });
});

describe('the household step 1 writes', () => {
  it('is the example’s candidate, written person by person in the fields’ order', () => {
    expect(WRITE.map(t => t.field)).toEqual([0, 1, 2].flatMap(() => FIELDS));
    expect(WRITE.map(t => t.member)).toEqual([0, 1, 2].flatMap(m => FIELDS.map(() => m)));
    const ages = WRITE.filter(t => t.field === 'age').map(t => Number(t.value.pt));
    expect(ages).toEqual(CANDIDATES[WRITTEN]);
    expect(WRITE.filter(t => t.field === 'sex').map(t => (t.value.pt === 'Homem' ? 'H' : 'M'))).toEqual(CANDIDATE_SEX[WRITTEN]);
    expect(ex.chosen.map(i => KEPT[i].id)).toContain(WRITTEN);
  });
  it('writes each value from options whose odds add up to one', () => {
    WRITE.forEach((t, i) => {
      expect(t.choices.reduce((s, c) => s + c.p, 0)).toBeCloseTo(1, 9);
      expect(t.choices[t.picked].impossible).toBeFalsy();
      for (const c of t.choices) if (c.impossible) expect(c.p).toBe(0);
      for (const j of t.looksAt ?? []) expect(j).toBeLessThan(i);
    });
  });
  it('is written as the scroll goes, whole before the scene ends', () => {
    expect(tokensWritten(0)).toBe(0);
    expect(tokensWritten(0.9)).toBe(WRITE.length);
    for (let p = 0; p < 1; p += 0.01) expect(tokensWritten(p + 0.01)).toBeGreaterThanOrEqual(tokensWritten(p));
  });
  it('names a sex for every candidate’s people', () => {
    expect(CANDIDATE_SEX.map(s => s.length)).toEqual(CANDIDATES.map(a => a.length));
  });
});

describe('the reweighting the stage plays', () => {
  it('starts even and ends on the tables', () => {
    const kept = KEPT.map(k => k.ages);
    expect(weightsAt(ex.before, ex.after, 0)).toEqual(ex.before);
    expect(distance(countsOf(kept, weightsAt(ex.before, ex.after, 1)))).toBe(0);
    let last = Infinity;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const d = distance(countsOf(kept, weightsAt(ex.before, ex.after, t)));
      expect(d).toBeLessThanOrEqual(last);
      last = d;
    }
  });
});

/** The stage sizes the story meets: small and large phones, tablets, laptops, wide screens. */
const SIZES = [[328, 290], [358, 400], [598, 420], [736, 520], [600, 440], [816, 600], [848, 640]];

describe('the stage’s layout', () => {
  for (const [w, h] of SIZES) {
    const f = frame(w, h);
    const g = houseGrids(f, ex.after, prior, ex.chosen);
    const check = (spots: Array<{ x: number; y: number }>, widths: number[], heights: number[]) => {
      spots.forEach((s, i) => {
        expect(s.x - widths[i] / 2).toBeGreaterThanOrEqual(-0.5);
        expect(s.x + widths[i] / 2).toBeLessThanOrEqual(w + 0.5);
        expect(s.y - heights[i]).toBeGreaterThanOrEqual(f.field.y - 0.5);
        expect(s.y).toBeLessThanOrEqual(f.field.y + f.field.h + 0.5);
        for (let j = 0; j < i; j++) {
          const o = spots[j];
          const apartX = Math.abs(s.x - o.x) >= (widths[i] + widths[j]) / 2 - 0.5;
          // One above the other: the lower house's roof clears the upper one's foot and what is written under it.
          const [upper, lower, lowerH] = s.y > o.y ? [o, s, heights[i]] : [s, o, heights[j]];
          const apartY = lower.y - lowerH >= upper.y + (f.agesUnder ? 16 : 0) - 0.5;
          expect(apartX || apartY, `houses ${j} and ${i} touch at ${w}×${h}`).toBe(true);
        }
      });
    };
    it(`${w}×${h}: no two houses touch, among the candidates, the kept (at their largest) and the chosen`, () => {
      check(g.all, CANDIDATES.map(a => houseWidth(a.length) * g.k), CANDIDATES.map(() => HOUSE_HEIGHT * g.k));
      const grow = KEPT.map((_, i) => Math.max(1, weightScale(ex.after[i] / prior)));
      check(g.kept, KEPT.map((c, i) => houseWidth(c.ages.length) * g.k * grow[i]), KEPT.map((_, i) => HOUSE_HEIGHT * g.k * grow[i]));
      check([...g.parish, g.care], [...ex.chosen.map(i => houseWidth(KEPT[i].ages.length) * g.bigger), CARE_WIDTH * g.bigger], [...ex.chosen.map(() => HOUSE_HEIGHT * g.bigger), HOUSE_HEIGHT * g.bigger]);
      expect(g.k).toBeGreaterThan(0.45);
    });
    it(`${w}×${h}: step 1’s rows fit the stage`, () => {
      const L = learnLayout(f);
      expect(L.rowsRight).toBeLessThanOrEqual(w);
      expect(L.panel.y + 40 + 5 * 19).toBeLessThanOrEqual(h);
      if (!L.side) expect(L.house.x + houseWidth(3) * L.house.s / 2).toBeLessThanOrEqual(w);
    });
  }
});

describe('wrap', () => {
  it('breaks on spaces within the width', () => {
    const lines = wrap('Ao lado de um casal de 38 e 36, o mais provável é uma criança', 200, 12);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe('Ao lado de um casal de 38 e 36, o mais provável é uma criança');
  });
});
