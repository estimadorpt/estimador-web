import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ARRANGEMENTS, CANDIDATES, CANDIDATE_SEX, CARE_HOME, ELDERS_ALONE_RANGE, HOME_SIZES, KEPT, RESIDENTS, SAMPLE, TARGET, TARGET_HOUSEHOLDS, TARGET_PEOPLE,
  agesOf, countsOf, distance, eldersAlone, methodExample, weightsAt,
} from '@/lib/population/method-example';
import { BEATS, BEAT_STEP, FIELDS, READOUT, WRITE, tokensWritten } from './data';
import {
  CARE_WIDTH, HEAD_ROOM, HOME_MARK, HOUSE_HEIGHT, RESIDENT_MARK, WRITTEN, frame, houseGrids, houseWidth, learnLayout, parishGrid, sampleGrid, tally,
  weightScale, wrap,
} from './layout';

const root = process.cwd();
const mdx = (locale: string) => readFileSync(path.join(root, 'src/content/population-methodology', `${locale}.mdx`), 'utf8');
const ex = methodExample();
const prior = ex.before[0];
/** The opening question's answers: in the parish as it was, in the synthetic population, and what the tables allow. */
const real = eldersAlone(agesOf(ARRANGEMENTS.real));
const generated = eldersAlone(ex.chosen.map(i => KEPT[i].ages));
const { lo, hi } = ELDERS_ALONE_RANGE;

describe('the story’s beats in the methodology', () => {
  for (const locale of ['pt', 'en']) {
    const text = mdx(locale);
    it(`${locale}: has every scene once, in order, inside one <MethodStory>`, () => {
      const story = text.slice(text.indexOf('<MethodStory>'), text.indexOf('</MethodStory>'));
      expect([...story.matchAll(/^<Beat at="([a-z]+)">$/gm)].map(m => m[1])).toEqual([...BEATS]);
      expect(story.match(/^<\/Beat>$/gm)?.length).toBe(BEATS.length);
      expect(text).toContain('<MethodDrawings />');
    });
    it(`${locale}: opens the why and each step with its heading, in the part’s first scene`, () => {
      const opening = (beat: string) => text.slice(text.indexOf(`<Beat at="${beat}">`)).split('\n').filter(Boolean).slice(1, 3);
      expect(opening(BEATS[0])[0]).toMatch(/^## /);
      for (const n of [1, 2, 3, 4, 5]) {
        const [first, second] = opening(BEATS.find(b => BEAT_STEP[b] === n)!);
        // Step 1 opens the "how" too: its "## " comes just before its "### 1.".
        expect(n === 1 ? second : first).toMatch(new RegExp(`^### ${n}\\. `));
        if (n === 1) expect(first).toMatch(/^## /);
      }
    });
    it(`${locale}: gives the example’s own counts`, () => {
      const pt = locale === 'pt';
      const story = text.slice(text.indexOf('## '), text.indexOf('</MethodStory>'));
      const rest = TARGET.sizes[4];
      expect(rest).toBe(0);
      for (const phrase of pt
        ? [`${TARGET_HOUSEHOLDS} casas e ${TARGET_PEOPLE} pessoas`, `${TARGET.sizes[0]} pessoas vivem sozinhas e ${TARGET.ages[3]} têm 65 ou mais anos`, `${CANDIDATES.length} agregados candidatos`, `${TARGET_HOUSEHOLDS} agregados`, `${TARGET_PEOPLE} pessoas`, `${CANDIDATES.length - KEPT.length} candidatos ficam de fora`, `${TARGET_HOUSEHOLDS} dos ${KEPT.length} candidatos`, `${generated} das ${TARGET.ages[3]} pessoas com 65 ou mais anos vivem sozinhas`, `entre ${lo} e ${hi}`, `eram ${real}`, `${CARE_HOME.length} pessoas num lar`, `${TARGET_PEOPLE + CARE_HOME.length} residentes`]
        : [`${TARGET_HOUSEHOLDS} homes and ${TARGET_PEOPLE} people`, `${TARGET.sizes[0]} people live alone and ${TARGET.ages[3]} are aged 65 or over`, `${CANDIDATES.length} candidate households`, `${TARGET_HOUSEHOLDS} households`, `${TARGET_PEOPLE} people`, `${CANDIDATES.length - KEPT.length} candidates are left out`, `${TARGET_HOUSEHOLDS} of the ${KEPT.length} candidates`, `${generated} of the ${TARGET.ages[3]} people aged 65 or over live alone`, `between ${lo} and ${hi}`, `it was ${real}`, `${CARE_HOME.length} people in a care home`, `${TARGET_PEOPLE + CARE_HOME.length} residents`]) {
        expect(story).toContain(phrase);
      }
    });
  }

  it('says the same counts in the stage’s captions', () => {
    for (const locale of ['pt', 'en'] as const) {
      const r = READOUT[locale];
      expect(r.candidates).toContain(String(CANDIDATES.length));
      expect(r.mask).toContain(String(CANDIDATES.length - KEPT.length));
      expect(r.census).toContain(`${TARGET_HOUSEHOLDS} `);
      expect(r.census).toContain(`${TARGET_PEOPLE} `);
      expect(r.candidates).toContain(`${TARGET_HOUSEHOLDS} `);
      expect(r.candidates).toContain(`${TARGET_PEOPLE} `);
      expect(r.question).toContain(`${TARGET.ages[3]} `);
      expect(r.ambiguity).toContain(`${eldersAlone(agesOf(ARRANGEMENTS.none))} ou ${eldersAlone(agesOf(ARRANGEMENTS.three))}`.replace(' ou ', locale === 'pt' ? ' ou ' : ' or '));
      expect(r.answer).toContain(`${generated} `);
      expect(r.answer).toMatch(new RegExp(`${real}\\.$`));
      expect(r.collective).toContain(String(CARE_HOME.length));
      for (const line of Object.values(r)) expect(line.length).toBeLessThanOrEqual(96);
    }
  });
});

describe('the opening’s parish', () => {
  it('is 10 homes and 23 people, the same in every arrangement, each giving the parish’s two tables', () => {
    expect(HOME_SIZES.length).toBe(TARGET_HOUSEHOLDS);
    expect(RESIDENTS.length).toBe(TARGET_PEOPLE);
    for (const homes of Object.values(ARRANGEMENTS)) {
      expect(homes.map(h => h.length)).toEqual(HOME_SIZES);
      expect(homes.flat().sort((a, b) => a - b)).toEqual(RESIDENTS.map((_, i) => i));
      expect(countsOf(agesOf(homes))).toEqual({ sizes: [...TARGET.sizes], ages: [...TARGET.ages] });
    }
  });
  it('answers the question differently in each arrangement, and the two ends reach what the tables allow', () => {
    expect([eldersAlone(agesOf(ARRANGEMENTS.none)), real, eldersAlone(agesOf(ARRANGEMENTS.three))]).toEqual([lo, 2, hi]);
    expect([lo, hi]).toEqual([0, 3]);
    // The synthetic population lands inside the range, and not on the parish's own answer: the story's point.
    expect(generated).toBeGreaterThanOrEqual(lo);
    expect(generated).toBeLessThanOrEqual(hi);
    expect(generated).not.toBe(real);
  });
  it('fills each tally row once, one mark per resident and per home', () => {
    const key = (m: { row: number; j: number }) => `${m.row}:${m.j}`;
    expect(new Set(RESIDENT_MARK.map(key)).size).toBe(RESIDENTS.length);
    TARGET.ages.forEach((n, row) => expect(RESIDENT_MARK.filter(m => m.row === row).map(m => m.j).sort()).toEqual([...Array(n).keys()]));
    TARGET.sizes.forEach((n, row) => expect(HOME_MARK.filter(m => m.row === row).map(m => m.j).sort()).toEqual([...Array(n).keys()]));
  });
  it('keeps the public sample invented and parish-free: households only, of the sizes a table counts', () => {
    expect(SAMPLE.length).toBeGreaterThanOrEqual(20);
    for (const ages of SAMPLE) {
      expect(ages.length).toBeGreaterThanOrEqual(1);
      for (const age of ages) expect(Number.isInteger(age) && age >= 0 && age < 100).toBe(true);
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

/** Houses (foot at y, centred on x) inside a frame's field, none touching another or what is written under it. */
function checkIn(f: ReturnType<typeof frame>, spots: Array<{ x: number; y: number }>, widths: number[], heights: number[], under: number) {
  spots.forEach((s, i) => {
    expect(s.x - widths[i] / 2).toBeGreaterThanOrEqual(-0.5);
    expect(s.x + widths[i] / 2).toBeLessThanOrEqual(f.width + 0.5);
    expect(s.y - heights[i]).toBeGreaterThanOrEqual(f.field.y - 0.5);
    expect(s.y).toBeLessThanOrEqual(f.field.y + f.field.h + 0.5);
    for (let j = 0; j < i; j++) {
      const o = spots[j];
      const apartX = Math.abs(s.x - o.x) >= (widths[i] + widths[j]) / 2 - 0.5;
      const [upper, lower, lowerH] = s.y > o.y ? [o, s, heights[i]] : [s, o, heights[j]];
      expect(apartX || lower.y - lowerH >= upper.y + under - 0.5, `houses ${j} and ${i} touch at ${f.width}×${f.height}`).toBe(true);
    }
  });
}

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
    it(`${w}×${h}: the opening’s homes and the sample fit under the head line, apart`, () => {
      const p = parishGrid(f);
      const ages = Object.values(ARRANGEMENTS).map(a => agesOf(a));
      const under = f.agesUnder ? 16 : 0;
      const wides = HOME_SIZES.map((n, slot) => Math.max(houseWidth(n) * p.k, ...(f.agesUnder ? ages.map(a => a[slot].join('  ').length * 6.4) : [0])));
      const inField = { ...f, field: { ...f.field, y: f.field.y + HEAD_ROOM, h: f.field.h - HEAD_ROOM - under } };
      checkIn(inField, p.spots, wides, HOME_SIZES.map(() => HOUSE_HEIGHT * p.k), under);
      expect(p.k).toBeGreaterThan(0.75);
      const sm = sampleGrid(f);
      checkIn({ ...f, field: { ...f.field, y: f.field.y + HEAD_ROOM, h: f.field.h - HEAD_ROOM } }, sm.spots, SAMPLE.map(a => houseWidth(a.length) * sm.k), SAMPLE.map(() => HOUSE_HEIGHT * sm.k), 0);
      expect(sm.k).toBeGreaterThan(0.4);
    });
    it(`${w}×${h}: the tally’s longest row ends before its count`, () => {
      const T = tally(f);
      const longest = Math.max(...TARGET.ages, ...TARGET.sizes);
      for (const table of [0, 1]) {
        const last = T.mark(table, 0, longest - 1);
        expect(last.x + T.size / 2).toBeLessThanOrEqual(T.x0(table) + T.colW - T.valueW + 0.5);
      }
      expect(T.x0(1) + T.colW).toBeLessThanOrEqual(w + 0.5);
      expect(T.rowY(TARGET.sizes.length - 1) + T.rowH).toBeLessThanOrEqual(f.tables.y + f.tables.h);
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
