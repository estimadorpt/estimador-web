/**
 * Where everything sits on the story's stage, in CSS pixels of the measured
 * stage (the SVG's viewBox is its own size, so 12 units of type are 12px).
 * Pure functions of the stage's size, so every position can be tested at a
 * phone's width and a desktop's. Houses stand in rows, each row centred, each
 * house's slot as wide as the house will ever get (the reweighting grows some),
 * so no two houses touch at any point of the story.
 */
import { ARRANGEMENTS, CANDIDATES, HOME_SIZES, KEPT, RESIDENTS, SAMPLE, WRITTEN, agesOf, ageBand } from '@/lib/population/method-example';
import type { BeatId } from './data';

export type Kind = 'wide' | 'compact';

/** The stage switches to the stacked drawing below this width. */
export const WIDE_FROM = 560;
export const kindFor = (width: number): Kind => (width >= WIDE_FROM ? 'wide' : 'compact');

/** A figure's spacing inside a house, in glyph units (the house glyph is drawn at scale 1, then scaled). */
export const FIGURE_STEP = 11;
export const HOUSE_HEIGHT = 46;
export const houseWidth = (people: number) => Math.max(2, people) * FIGURE_STEP + 14;
/** The care home: five residents, a wider building. */
export const CARE_WIDTH = 5 * FIGURE_STEP + 22;
/** The widest a weight bar gets under a house (wide stage only). */
export const BAR_MAX = 40;

/** The width of a house's ages written under it, at 11px tabular figures. */
export const agesWidth = (ages: number[]) => ages.join('').length * 6.4 + (ages.length - 1) * 5;

export type Box = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };
/** A house's or a figure's foot centre, its scale and its opacity. */
export type Spot = { x: number; y: number; s: number; o: number };

export type Frame = {
  kind: Kind;
  width: number;
  height: number;
  /** Where the houses stand. */
  field: Box;
  /** The parish's tables, under the houses. */
  tables: Box;
  /** Whether a house carries its ages and its weight under it (the wide drawing has room). */
  agesUnder: boolean;
};

export function frame(width: number, height: number): Frame {
  const kind = kindFor(width);
  const wide = kind === 'wide';
  const tablesH = wide ? 164 : 146;
  const gap = wide ? 18 : 8;
  return {
    kind,
    width,
    height,
    field: { x: 0, y: 2, w: width, h: Math.max(90, height - tablesH - gap - 2) },
    tables: { x: 0, y: height - tablesH, w: width, h: tablesH },
    agesUnder: wide,
  };
}

/** What a house carries under it: its ages (wide) and its weight bar (wide, while the weights move). */
const underHeight = (f: Frame) => (f.agesUnder ? 30 : 4);

type Item = {
  /** The house's width at scale 1. */
  w: number;
  /** The most the house is scaled beyond the grid's scale, at any point. */
  grow: number;
  /** What sits under the house and does not scale (its ages, its weight bar). */
  under: number;
};

type Rows = { k: number; cols: number; spots: Point[] };

/**
 * Items in rows of `cols`, each row centred in the box and the rows centred
 * vertically, at scale k: each item's foot centre, or null if they do not fit.
 */
function place(items: Item[], cols: number, box: Box, f: Frame, k: number, gap: number): Point[] | null {
  const rows: Item[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  const heights = rows.map(row => HOUSE_HEIGHT * k * Math.max(...row.map(it => it.grow)) + underHeight(f) + 8);
  const total = heights.reduce((a, b) => a + b, 0);
  if (total > box.h) return null;
  const spots: Point[] = [];
  let y = box.y + (box.h - total) / 2;
  for (const [r, row] of rows.entries()) {
    const widths = row.map(it => Math.max(it.w * k * it.grow, it.under));
    const width = widths.reduce((a, b) => a + b, 0) + gap * (row.length - 1);
    if (width > box.w) return null;
    let x = box.x + (box.w - width) / 2;
    const foot = y + HOUSE_HEIGHT * k * Math.max(...row.map(it => it.grow)) + 2;
    for (const w of widths) {
      spots.push({ x: x + w / 2, y: foot });
      x += w + gap;
    }
    y += heights[r];
  }
  return spots;
}

/** The largest scale (up to `max`) at which the items fit, trying each column count. */
function fit(items: Item[], box: Box, f: Frame, max: number, columns: number[]): Rows {
  const gap = f.kind === 'wide' ? 14 : 6;
  let best: Rows | null = null;
  for (const cols of columns) {
    let lo = 0.2;
    let hi = max;
    if (!place(items, cols, box, f, lo, gap)) continue;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (place(items, cols, box, f, mid, gap)) lo = mid; else hi = mid;
    }
    if (!best || lo > best.k + 1e-6) best = { k: lo, cols, spots: [] };
  }
  const chosen = best ?? { k: 0.2, cols: columns[columns.length - 1], spots: [] };
  return { ...chosen, spots: place(items, chosen.cols, box, f, chosen.k, gap) ?? items.map(() => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 })) };
}

/** How much a weight grows or shrinks its house, from its ratio to the even start: area follows weight, within limits. */
export function weightScale(ratio: number): number {
  return Math.min(1.45, Math.max(0.5, Math.sqrt(ratio)));
}

/** Index in KEPT of each candidate, or -1 for the three the mask removes. */
export const KEPT_INDEX: number[] = CANDIDATES.map((_, id) => KEPT.findIndex(k => k.id === id));

export type Grids = {
  /** The houses' scale while they are candidates (steps 2's first scenes and the reweighting's start). */
  k: number;
  /** All 24 candidates. */
  all: Point[];
  /** The 21 the mask keeps, in KEPT order, with room for the reweighting's growth. */
  kept: Point[];
  /** The chosen households (in `chosen` order), then the care home. */
  parish: Point[];
  care: Point;
  /** The houses' scale once chosen. */
  bigger: number;
};

/**
 * Each house's place in every arrangement of the story. `after` is the
 * reweighting's solved weights and `prior` the even start (KEPT order).
 */
export function houseGrids(f: Frame, after: number[], prior: number, chosen: number[]): Grids {
  const wide = f.kind === 'wide';
  const label = (ages: number[]) => (wide ? Math.max(agesWidth(ages), BAR_MAX) + 4 : 0);
  const allItems: Item[] = CANDIDATES.map(ages => ({ w: houseWidth(ages.length), grow: 1, under: label(ages) }));
  const keptItems: Item[] = KEPT.map((c, i) => ({ w: houseWidth(c.ages.length), grow: Math.max(1, weightScale(after[i] / prior)), under: label(c.ages) }));
  const max = wide ? 1.6 : 1.25;
  const all = fit(allItems, f.field, f, max, [8, 6]);
  const kept = fit(keptItems, f.field, f, max, [7, 6]);
  const k = Math.min(all.k, kept.k);
  const gap = wide ? 14 : 6;
  const parishItems: Item[] = [
    ...chosen.map(i => ({ w: houseWidth(KEPT[i].ages.length), grow: 1, under: label(KEPT[i].ages) })),
    { w: CARE_WIDTH, grow: 1, under: 0 },
  ];
  const parish = fit(parishItems, f.field, f, Math.min(1.6, k * 1.5), wide ? [6, 4] : [4, 6]);
  return {
    k,
    all: place(allItems, all.cols, f.field, f, k, gap) ?? all.spots,
    kept: place(keptItems, kept.cols, f.field, f, k, gap) ?? kept.spots,
    parish: parish.spots.slice(0, chosen.length),
    care: parish.spots[chosen.length],
    bigger: parish.k,
  };
}

/** The room the opening keeps over its homes, for a line that names what they show. */
export const HEAD_ROOM = 26;

/**
 * The opening's parish: its ten homes in two rows of five, as large as the field allows under the head line, each
 * slot wide enough for the ages any arrangement writes under it.
 */
export function parishGrid(f: Frame): { k: number; spots: Point[] } {
  const wide = f.kind === 'wide';
  const box: Box = { ...f.field, y: f.field.y + HEAD_ROOM, h: f.field.h - HEAD_ROOM };
  const items: Item[] = HOME_SIZES.map((n, slot) => ({
    w: houseWidth(n),
    grow: 1,
    under: wide ? Math.max(...Object.values(ARRANGEMENTS).map(a => agesWidth(agesOf([a[slot]])[0]))) + 6 : 0,
  }));
  const rows = fit(items, box, f, wide ? 1.9 : 1.35, [5]);
  return { k: rows.k, spots: rows.spots };
}

/** The public sample's homes, small, in rows under the head line. */
export function sampleGrid(f: Frame): { k: number; spots: Point[] } {
  const wide = f.kind === 'wide';
  const box: Box = { ...f.field, y: f.field.y + HEAD_ROOM, h: f.field.h - HEAD_ROOM };
  const items: Item[] = SAMPLE.map(ages => ({ w: houseWidth(ages.length), grow: 1, under: 0 }));
  const rows = fit(items, box, f, wide ? 1.1 : 0.8, wide ? [10, 8] : [10, 8, 7, 6, 5]);
  return { k: rows.k, spots: rows.spots };
}

/** The tables drawn as counts of marks: where the rows sit, and each mark's place in its row. */
export function tally(f: Frame) {
  const wide = f.kind === 'wide';
  const colGap = wide ? 32 : 14;
  const colW = (f.tables.w - colGap) / 2;
  const labelW = wide ? 76 : 60;
  const valueW = wide ? 34 : 24;
  const rowH = wide ? 18 : 16;
  const top = f.tables.y;
  const longest = 9;
  const room = colW - labelW - valueW - 4;
  const step = Math.min(wide ? 14 : 10, room / longest);
  const size = Math.min(wide ? 10 : 8, step - 1.5);
  const x0 = (table: number) => f.tables.x + table * (colW + colGap);
  const rowY = (row: number) => top + 28 + row * rowH;
  /** The centre of mark j in a row of a table (0: households by size, 1: people by age). */
  const mark = (table: number, row: number, j: number): Point => ({
    x: x0(table) + labelW + j * step + size / 2,
    y: rowY(row) + 1 + 9 / 2,
  });
  return { colW, colGap, labelW, valueW, rowH, top, size, step, x0, rowY, mark };
}

/** Each resident's mark in the age table (its row's j-th, in RESIDENTS order) and each home's in the size table. */
export const RESIDENT_MARK: Array<{ row: number; j: number }> = RESIDENTS.map((r, i) => ({
  row: ageBand(r.age),
  j: RESIDENTS.slice(0, i).filter(o => ageBand(o.age) === ageBand(r.age)).length,
}));
export const HOME_MARK: Array<{ row: number; j: number }> = HOME_SIZES.map((n, slot) => ({
  row: Math.min(n, 5) - 1,
  j: HOME_SIZES.slice(0, slot).filter(m => Math.min(m, 5) === Math.min(n, 5)).length,
}));

/** Step 1's drawing: the rows of the written household, its house and the odds panel. */
export function learnLayout(f: Frame) {
  const wide = f.kind === 'wide';
  const side = wide && f.width >= 720;
  const label = wide ? 76 : 58;
  const widths = wide ? [70, 38, 92, 98] : [54, 28, 74, 84];
  const colGap = wide ? 8 : 4;
  const xs: number[] = [];
  let x = label;
  for (const w of widths) { xs.push(x); x += w + colGap; }
  const rowsRight = x - colGap;
  const boxH = wide ? 26 : 20;
  const rowH = wide ? 38 : 26;
  const first = wide ? 84 : 55;
  const rows = [0, 1, 2].map(i => first + i * rowH);
  const rowsBottom = rows[2] + 7;
  const house = side
    ? (() => {
      // As large as the space between the rows and the sequence (the stage's last 72px) allows, in the middle of it.
      const room = f.height - 72 - rowsBottom;
      const s = Math.max(1, Math.min(3, (room - 40) / HOUSE_HEIGHT));
      return { x: rowsRight / 2 + label / 2, y: rowsBottom + room / 2 + (HOUSE_HEIGHT * s) / 2, s };
    })()
    : wide
      ? { x: rowsRight + (f.width - rowsRight) / 2, y: rowsBottom - 2, s: 1.3 }
      // A phone: under the odds when the stage is tall enough (the odds end by 290px), else small beside the title.
      : f.height >= 334
        ? { x: f.width / 2, y: f.height - 6, s: Math.min(1.8, (f.height - 298) / HOUSE_HEIGHT) }
        : { x: f.width - houseWidth(3) * 0.35 - 2, y: 36, s: 0.7 };
  const panelX = side ? Math.max(rowsRight + 40, f.width * 0.55) : 0;
  const panelY = side ? 24 : rowsBottom + (wide ? 26 : 14);
  const panel: Box = { x: panelX, y: panelY, w: f.width - panelX, h: f.height - panelY };
  return { side, label, widths, xs, rows, boxH, rowsRight, house, panel, titleY: wide ? 24 : 16 };
}

/** The published rows (step 5): the columns' x and the rows' baselines; rows that do not fit are counted, not drawn. */
export function publishTable(f: Frame, rows: number) {
  const wide = f.kind === 'wide';
  const rowH = wide ? 17 : 15;
  const top = wide ? 58 : 50;
  const fit = Math.max(4, Math.floor((f.height - top - 34) / rowH));
  const shown = rows <= fit ? rows : fit - 1;
  const cols = wide ? [34, 112, 190, 250, 330, 400] : [22, 92, 138, 170, 230, 262];
  return { rowH, top, shown, cols, figureX: wide ? 12 : 9 };
}

/** Greedy line breaks for SVG text, from an average glyph width (IBM Plex Sans runs about 0.53em). */
export function wrap(text: string, width: number, fontSize: number): string[] {
  const max = Math.max(8, Math.floor(width / (fontSize * 0.56)));
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** The scenes in which each kind of thing is on the stage. */
export const SHOWS = {
  learn: new Set<BeatId>(['learn']),
  houses: new Set<BeatId>(['learn', 'candidates', 'mask', 'tilt', 'choose', 'answer', 'collective', 'publish']),
  tables: new Set<BeatId>(['candidates', 'mask', 'tilt', 'choose', 'collective']),
  tally: new Set<BeatId>(['count', 'question', 'ambiguity', 'sample']),
  answer: new Set<BeatId>(['answer']),
  publish: new Set<BeatId>(['publish']),
  tier: new Set<BeatId>(['tier']),
};

export { WRITTEN };
