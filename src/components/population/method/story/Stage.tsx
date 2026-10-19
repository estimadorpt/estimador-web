'use client';

import { useId, type CSSProperties, type ReactNode, type SVGProps } from 'react';
import { BRAND, FONT_STACK } from '@/lib/brand';
import { DEEMPHASIS, SERIES } from '@/components/viz/theme';
import {
  CANDIDATES, CANDIDATE_SEX, CARE_HOME, KEPT, TARGET, ageBand, countsOf, distance, weightsAt, type Counts,
} from '@/lib/population/method-example';
import { BEATS, WRITE, FIELDS, tokensWritten, type BeatId } from './data';
import {
  BAR_MAX, CARE_WIDTH, FIGURE_STEP, HOUSE_HEIGHT, KEPT_INDEX, SHOWS, WRITTEN, frame, houseGrids, houseWidth, learnLayout,
  publishTable, weightScale, wrap, type Frame, type Spot,
} from './layout';

type Locale = 'pt' | 'en';

/** What the server hands the stage: the example's solved weights and choice, the release's column letters and tiers. */
export type StoryData = {
  /** Even starting weight and solved weight of each kept candidate (KEPT order). */
  before: number[];
  after: number[];
  /** The chosen households, as indices into KEPT. */
  chosen: number[];
  /** Provenance letters of the published columns the drawing shows, from release.json. */
  provenance: { synthetic_hh_id: string; hh_size: string; age: string; age_5y: string; sex: string; is_institutional: string };
  tiers: {
    release: string;
    /** Residents a parish needs for tier B, and for tier A. */
    minB: number;
    minA: number;
    /** Highest typical error for tier A, and for tier B. */
    maxA: number;
    maxB: number;
    counts: { A: number; B: number; C: number };
  };
};

const INK = BRAND.ink;
const GRAPHITE = BRAND.muted;
const RULE = BRAND.line;
const PAPER = BRAND.paper;
const FIELD = BRAND.parchment;
const CROSS = BRAND.terracotta;

const LINE = { stroke: INK, strokeWidth: 1, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const };

const one = (v: number, locale: Locale) => {
  const rounded = Math.round(v * 10) / 10;
  const text = Math.abs(rounded - Math.round(rounded)) < 1e-9 ? String(Math.round(rounded)) : rounded.toFixed(1);
  return locale === 'pt' ? text.replace('.', ',') : text;
};
/** Grouped from four digits, with a no-break space in Portuguese (formatCount's rule, without the module). */
const grouped = (n: number, locale: Locale) => {
  const text = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'pt' ? ' ' : ',');
  return n < 1000 ? String(n) : text;
};
const decimal = (v: number, locale: Locale) => (locale === 'pt' ? v.toFixed(2).replace('.', ',') : v.toFixed(2));

function Lines({ x, y, lines, step, ...props }: { x: number; y: number; lines: string[]; step: number } & SVGProps<SVGTextElement>) {
  return (
    <text x={x} y={y} {...props}>
      {lines.map((l, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : step}>{l}</tspan>)}
    </text>
  );
}

/** A transform and an opacity that the stage's CSS moves smoothly (and instantly under reduced motion). */
function spotStyle(spot: { x: number; y: number; s?: number; o?: number }, delay = 0): CSSProperties {
  const s = spot.s ?? 1;
  return {
    transform: `translate(${Math.round(spot.x * 10) / 10}px, ${Math.round(spot.y * 10) / 10}px)${s === 1 ? '' : ` scale(${Math.round(s * 1000) / 1000})`}`,
    opacity: spot.o ?? 1,
    '--delay': `${delay}ms`,
  } as CSSProperties;
}

/** The share of the way through a scrubbed scene, eased and held at both ends. */
function eased(p: number, from = 0.08, to = 0.82): number {
  const t = Math.min(1, Math.max(0, (p - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/** A house in ink lines, its foot centre at 0,0: a pitched roof for a home, a flat one for the care home. */
function HouseShape({ people, chosen, collective }: { people: number; chosen?: boolean; collective?: boolean }) {
  const w = collective ? CARE_WIDTH : houseWidth(people);
  const body = 28;
  const roofFill = chosen ? INK : FIELD;
  return (
    <>
      {collective
        ? <rect x={-w / 2 + 1.5} y={-body - 9} width={w - 3} height={9} fill={INK} {...LINE} />
        : <path className="ms-roof" d={`M${-w / 2 + 1.5} ${-body} L0 ${-HOUSE_HEIGHT + 2} L${w / 2 - 1.5} ${-body} Z`} fill={roofFill} {...LINE} />}
      <rect x={-w / 2 + 3.5} y={-body} width={w - 7} height={body - 1} fill={PAPER} {...LINE} />
    </>
  );
}

/** A person, feet at 0,0: an ink head and legs, the body in the colour of the age group; children are shorter. */
function Figure({ age }: { age: number }) {
  const band = ageBand(age);
  const t = band === 0 ? 0.68 : 1;
  const top = -20 * t;
  return (
    <>
      <circle cx={0} cy={top + 2.6 * t} r={2.6 * t} fill={INK} />
      <rect x={-2.8} y={top + 5.6 * t} width={5.6} height={8.4 * t} fill={SERIES[band]} />
      <path d={`M-1.4 ${top + 14 * t} L-2 -0.5 M1.4 ${top + 14 * t} L2 -0.5`} stroke={INK} strokeWidth={1.2} fill="none" vectorEffect="non-scaling-stroke" />
    </>
  );
}

type Person = { key: string; age: number; sex: 'H' | 'M'; candidate: number | 'care'; member: number };

const PEOPLE: Person[] = [
  ...CANDIDATES.flatMap((ages, candidate) => ages.map((age, member) => ({ key: `c${candidate}-${member}`, age, sex: CANDIDATE_SEX[candidate][member], candidate, member }))),
  ...CARE_HOME.map((r, member) => ({ key: `care-${member}`, age: r.age, sex: r.sex, candidate: 'care' as const, member })),
];

/** The 5-year band a published row carries: '35–39', and '90 ou mais' at the top. */
function band5(age: number, locale: Locale): string {
  if (age >= 90) return locale === 'pt' ? '90 ou mais' : '90 or over';
  const lo = Math.floor(age / 5) * 5;
  return `${lo}–${lo + 4}`;
}

const zero = (): Counts => ({ sizes: TARGET.sizes.map(() => 0), ages: TARGET.ages.map(() => 0) });

/**
 * The story's stage: one invented parish drawn in a single SVG whose houses,
 * figures, tables and rows persist from scene to scene and move between
 * them. The scene and, in a scrubbed scene, the reader's progress through it
 * set every position; the CSS moves things (or, under reduced motion, puts
 * them). Decorative: the scene's text is in the page and its caption.
 */
export function Stage({ locale, beat, progress, width, height, data, scrub }: {
  locale: Locale;
  beat: BeatId;
  progress: number;
  width: number;
  height: number;
  data: StoryData;
  /** Whether the scroll is playing a scrubbed scene (moves follow it closely) rather than switching scenes. */
  scrub: boolean;
}) {
  const pt = locale === 'pt';
  const id = `ms${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const f = frame(width, height);
  const wide = f.kind === 'wide';
  const index = BEATS.indexOf(beat);
  const past = (b: BeatId) => index > BEATS.indexOf(b);
  const from = (b: BeatId) => index >= BEATS.indexOf(b);

  const prior = data.before[0];
  const grids = houseGrids(f, data.after, prior, data.chosen);
  const learn = learnLayout(f);
  const chosenSet = new Set(data.chosen);
  const k = grids.k;

  // The weights: even until the reweighting, along its path inside it, solved after it.
  const tiltT = beat === 'tilt' ? eased(progress) : past('tilt') ? 1 : 0;
  const weights = weightsAt(data.before, data.after, tiltT);
  const evenAll = CANDIDATES.map(() => 10 / CANDIDATES.length);
  const keptAges = KEPT.map(c => c.ages);

  const counts: Counts = beat === 'tables' || beat === 'learn'
    ? zero()
    : beat === 'candidates'
      ? countsOf(CANDIDATES, evenAll)
      : from('choose')
        ? countsOf(data.chosen.map(i => keptAges[i]))
        : countsOf(keptAges, weights);
  const gap = distance(counts);
  const scale = (() => {
    const states = [countsOf(CANDIDATES, evenAll), countsOf(keptAges, data.before), { sizes: [...TARGET.sizes], ages: [...TARGET.ages] }];
    return {
      sizes: Math.max(...states.flatMap(s => s.sizes)) * 1.08,
      ages: Math.max(...states.flatMap(s => s.ages)) * 1.08,
    };
  })();

  // Step 1: how far the household is written.
  const written = beat === 'learn' ? tokensWritten(progress) : WRITE.length;

  /** Each candidate's house: where it stands in this scene. */
  function houseSpot(candidate: number): Spot & { chosen: boolean; masked: boolean; delay: number } {
    const kept = KEPT_INDEX[candidate];
    const masked = kept < 0;
    const isChosen = !masked && chosenSet.has(kept);
    const all = grids.all[candidate];
    const base = { chosen: false, masked, delay: 0 };
    if (beat === 'learn') {
      if (candidate !== WRITTEN) return { ...all, s: k * 0.6, o: 0, ...base };
      return { ...learn.house, o: 1, ...base };
    }
    if (beat === 'tables') {
      if (candidate !== WRITTEN) return { ...all, s: k * 0.6, o: 0, ...base };
      return { x: f.field.x + f.field.w / 2, y: f.field.y + f.field.h / 2 + HOUSE_HEIGHT * 0.6, s: Math.min(1.8, grids.bigger * 1.25), o: 1, ...base };
    }
    if (beat === 'candidates') return { ...all, s: k, o: 1, ...base, delay: candidate === WRITTEN ? 0 : 140 + candidate * 30 };
    if (beat === 'mask') return { ...all, s: k, o: masked ? 0.4 : 1, ...base, delay: masked ? 500 : 0 };
    if (masked) return { ...all, y: all.y + 14, s: k * 0.8, o: 0, ...base };
    const keptSpot = grids.kept[kept];
    if (beat === 'tilt') return { ...keptSpot, s: k * weightScale(weights[kept] / prior), o: 1, ...base };
    if (!isChosen) return { ...keptSpot, s: k * weightScale(data.after[kept] / prior), o: 0, ...base };
    const slot = data.chosen.indexOf(kept);
    const o = beat === 'publish' || beat === 'tier' ? 0 : 1;
    return { ...grids.parish[slot], s: grids.bigger, o, ...base, chosen: true, delay: beat === 'choose' ? 250 + slot * 45 : 0 };
  }

  const careShown = beat === 'collective';
  const careSpot: Spot = careShown
    ? { ...grids.care, s: grids.bigger, o: 1 }
    : { ...grids.care, y: grids.care.y + 18, s: grids.bigger * 0.85, o: 0 };

  // Step 5's rows: the chosen households in order, then the care home.
  const rows: Person[] = [
    ...data.chosen.flatMap(i => PEOPLE.filter(p => p.candidate === KEPT[i].id)),
    ...PEOPLE.filter(p => p.candidate === 'care'),
  ];
  const table = publishTable(f, rows.length);
  const rowOf = new Map(rows.map((p, i) => [p.key, i]));
  const householdNumber = (p: Person) => (p.candidate === 'care' ? data.chosen.length + 1 : data.chosen.indexOf(KEPT_INDEX[p.candidate as number]) + 1);
  const householdSize = (p: Person) => (p.candidate === 'care' ? CARE_HOME.length : CANDIDATES[p.candidate as number].length);

  function homeOf(p: Person): Spot & { delay: number } {
    if (p.candidate === 'care') {
      const n = CARE_HOME.length;
      return { x: careSpot.x + (p.member - (n - 1) / 2) * FIGURE_STEP * careSpot.s, y: careSpot.y - 3 * careSpot.s, s: careSpot.s, o: careSpot.o, delay: careShown ? 450 + p.member * 60 : 0 };
    }
    const h = houseSpot(p.candidate);
    const n = CANDIDATES[p.candidate].length;
    return { x: h.x + (p.member - (n - 1) / 2) * FIGURE_STEP * h.s, y: h.y - 3 * h.s, s: h.s, o: h.o, delay: h.delay };
  }

  /** Each person: beside the others in their house or, in step 5, at the start of their row. */
  function personSpot(p: Person): Spot & { delay: number } {
    if (beat === 'publish') {
      const r = rowOf.get(p.key);
      if (r === undefined || r >= table.shown) return { ...homeOf(p), o: 0, delay: 0 };
      return { x: table.figureX, y: table.top + table.rowH * (r + 1) + 2, s: wide ? 0.62 : 0.55, o: 1, delay: 60 + r * 24 };
    }
    if (beat === 'tier') return { ...homeOf(p), o: 0, delay: 0 };
    const home = homeOf(p);
    // Step 1: a person appears when their age is written.
    if (beat === 'learn' && p.candidate === WRITTEN) {
      const ageToken = WRITE.findIndex(t => t.member === p.member && t.field === 'age');
      return { ...home, o: written > ageToken ? 1 : 0 };
    }
    return home;
  }

  const labelled = f.agesUnder && ['candidates', 'mask', 'tilt', 'choose', 'collective'].includes(beat);
  const maxW = Math.max(...data.after);

  return (
    <svg
      className="ms-stage"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      data-scene={beat}
      data-scrub={scrub ? 'on' : 'off'}
      fontFamily={FONT_STACK}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={`${id}-b`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={BRAND.faint} strokeWidth="1" />
        </pattern>
        <pattern id={`${id}-c`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={BRAND.faint} strokeWidth="1" />
          <line x1="0" y1="0" x2="6" y2="0" stroke={BRAND.faint} strokeWidth="1" />
        </pattern>
        <marker id={`${id}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L8 4 L0 8 Z" fill={GRAPHITE} />
        </marker>
      </defs>

      {/* Step 1: the household written token by token, and the odds of the token being written. */}
      <Fade show={SHOWS.learn.has(beat)}>
        <Learn f={f} locale={locale} written={written} arrow={`${id}-arrow`} />
      </Fade>

      {/* The household step 1 wrote, named while it waits alone in the field. */}
      <Fade show={beat === 'tables'} delay={beat === 'tables' ? 500 : 0}>
        <text x={f.field.x + f.field.w / 2} y={f.field.y + f.field.h / 2 + HOUSE_HEIGHT * 0.6 + 22} textAnchor="middle" fontSize={12} fill={GRAPHITE}>
          {pt ? 'o agregado escrito no passo 1' : 'the household written in step 1'}
        </text>
      </Fade>

      {/* The weights under the houses while they move (wide stage), each with the even start as a tick. */}
      <g>
        {KEPT.map((c, kept) => {
          const h = houseSpot(c.id);
          const show = wide && beat === 'tilt';
          return (
            <g key={c.id} className="ms-t" style={spotStyle({ x: h.x - BAR_MAX / 2, y: h.y + 20, o: show ? 1 : 0 })}>
              <rect className="ms-bar" x={0} y={0} width={1} height={5} fill={INK} style={{ transform: `scaleX(${Math.max(1, (weights[kept] / maxW) * BAR_MAX)})` }} />
              <line x1={(prior / maxW) * BAR_MAX} x2={(prior / maxW) * BAR_MAX} y1={-3} y2={8} stroke={GRAPHITE} strokeWidth={1.5} />
            </g>
          );
        })}
      </g>

      {/* The houses. */}
      <g>
        {CANDIDATES.map((ages, candidate) => {
          const h = houseSpot(candidate);
          const show = SHOWS.houses.has(beat);
          return (
            <g key={candidate} className="ms-t" style={spotStyle({ ...h, o: show ? h.o : 0 }, h.delay)}>
              <HouseShape people={ages.length} chosen={h.chosen && from('choose')} />
              {h.masked && from('mask') && (
                <path className="ms-cross" d="M-20 -40 L20 2 M20 -40 L-20 2" stroke={CROSS} strokeWidth={2.5} strokeLinecap="square" fill="none" vectorEffect="non-scaling-stroke" pathLength={1} />
              )}
            </g>
          );
        })}
        <g className="ms-t" style={spotStyle(careSpot, careShown ? 250 : 0)}>
          <HouseShape people={CARE_HOME.length} collective />
        </g>
        <g className="ms-t" style={spotStyle({ x: careSpot.x, y: careSpot.y - HOUSE_HEIGHT * careSpot.s + 2, o: careSpot.o }, careShown ? 250 : 0)}>
          <text x={0} y={-4} textAnchor="middle" fontSize={12} fontWeight={600} fill={INK}>{pt ? 'Lar' : 'Care home'}</text>
        </g>
      </g>

      {/* The ages under each house (wide stage). */}
      <g>
        {CANDIDATES.map((ages, candidate) => {
          const h = houseSpot(candidate);
          const show = labelled && h.o > 0 && !(beat === 'tilt' && h.masked);
          const out = h.masked && from('mask');
          return (
            <text key={candidate} className="ms-t tnum" style={spotStyle({ x: h.x, y: h.y + 13, o: show ? (out ? 0.6 : 1) : 0 }, h.delay)} textAnchor="middle" fontSize={11} fill={out ? GRAPHITE : INK}>
              {ages.join(' ')}
            </text>
          );
        })}
      </g>

      {/* The people, in their houses or, in step 5, in their rows. */}
      <g>
        {PEOPLE.map(p => {
          const s = personSpot(p);
          const show = SHOWS.houses.has(beat) && !(p.candidate === 'care' && beat !== 'collective' && beat !== 'publish');
          return (
            <g key={p.key} className="ms-t" style={spotStyle({ ...s, o: show ? s.o : 0 }, s.delay)}>
              <Figure age={p.age} />
            </g>
          );
        })}
      </g>

      {/* The parish's tables: what INE counted (squares) and what the candidates add up to (bars). */}
      <Fade show={SHOWS.tables.has(beat)} delay={beat === 'tables' ? 300 : 0}>
        <Tables f={f} locale={locale} counts={counts} beat={beat} gap={gap} scale={scale} />
      </Fade>

      {/* Step 5: one row per person. */}
      <Fade show={SHOWS.publish.has(beat)} delay={beat === 'publish' ? 250 : 0}>
        <Rows f={f} locale={locale} rows={rows} table={table} data={data} householdNumber={householdNumber} householdSize={householdSize} />
      </Fade>

      {/* Step 5: the tier the parish gets. */}
      <Fade show={SHOWS.tier.has(beat)} delay={beat === 'tier' ? 200 : 0}>
        <Tiers f={f} locale={locale} data={data} hatch={{ B: `url(#${id}-b)`, C: `url(#${id}-c)` }} residents={rows.length} />
      </Fade>
    </svg>
  );
}

function Fade({ show, delay = 0, children }: { show: boolean; delay?: number; children: ReactNode }) {
  return (
    <g className="ms-fade" data-show={show ? 'on' : 'off'} style={{ opacity: show ? 1 : 0, visibility: show ? 'visible' : 'hidden', '--delay': `${show ? delay : 0}ms` } as CSSProperties}>
      {children}
    </g>
  );
}

/** Step 1: the household's rows, the token being written, and its odds. */
function Learn({ f, locale, written, arrow }: { f: Frame; locale: Locale; written: number; arrow: string }) {
  const pt = locale === 'pt';
  const wide = f.kind === 'wide';
  const L = learnLayout(f);
  const panel = L.panel;
  const current = Math.max(0, Math.min(WRITE.length - 1, written - 1));
  const token = WRITE[current];
  const showing = written > 0;
  const boxOf = (t: number) => {
    const tok = WRITE[t];
    const col = FIELDS.indexOf(tok.field);
    return { x: L.xs[col], y: L.rows[tok.member] - L.boxH + 7, w: L.widths[col], h: L.boxH };
  };
  const qSize = wide ? 14 : 13;
  const given = showing && token.given ? wrap(token.given[locale], panel.w, 12) : [];
  const labelW = wide ? 92 : 88;
  const barMax = Math.max(40, Math.min(220, panel.w - labelW - 40));
  const rowH = wide ? 24 : 19;
  const top = panel.y + (wide ? 34 : 28) + given.length * 15 + (given.length ? 6 : 0);
  const sources = showing ? token.looksAt ?? [] : [];
  const fieldName: Record<string, { pt: string; en: string }> = {
    sex: { pt: 'Sexo', en: 'Sex' }, age: { pt: 'Idade', en: 'Age' }, education: { pt: 'Escolaridade', en: 'Education' }, work: { pt: 'Trabalho', en: 'Work' },
  };

  /** A line from a token the current one depends on: over the row within a person, down the column from an earlier person. */
  const arc = (src: number, j: number) => {
    const a = boxOf(src);
    const b = boxOf(current);
    const spread = (j - (sources.length - 1) / 2) * 8;
    if (WRITE[src].member === token.member) {
      const ax = a.x + a.w / 2;
      const bx = b.x + b.w / 2 + spread;
      return `M${ax} ${a.y} C${ax} ${a.y - 15} ${bx} ${b.y - 15} ${bx} ${b.y - 1}`;
    }
    const ax = a.x + a.w / 2 + spread;
    const bx = b.x + b.w / 2 + spread;
    const ay = a.y + a.h;
    const by = b.y - 1;
    if (Math.abs(ax - bx) < 0.5) return `M${ax} ${ay} L${bx} ${by}`;
    const mid = (ay + by) / 2;
    return `M${ax} ${ay} C${ax} ${mid} ${bx} ${mid} ${bx} ${by}`;
  };

  return (
    <g>
      <text x={0} y={L.titleY} fontSize={wide ? 16 : 14} fontWeight={600} fill={INK}>
        {pt ? 'Um agregado de 3 pessoas' : 'A household of 3 people'}
      </text>
      {wide && (
        <text x={0} y={L.titleY + 19} fontSize={12} fill={GRAPHITE}>
          {pt ? 'Quatro atributos por pessoa; o modelo escreve mais' : 'Four attributes a person; the model writes more'}
        </text>
      )}
      {/* The column heads. */}
      {FIELDS.map((field, col) => (
        <text key={field} x={L.xs[col]} y={L.rows[0] - L.boxH} fontSize={11} fill={GRAPHITE}>{fieldName[field][locale]}</text>
      ))}
      {[0, 1, 2].map(m => (
        <text key={m} x={0} y={L.rows[m]} fontSize={12} fill={GRAPHITE}>{pt ? `Pessoa ${m + 1}` : `Person ${m + 1}`}</text>
      ))}
      {/* What the token being written depends on, under the boxes. */}
      {sources.map((src, j) => (
        <path key={`${current}-${src}`} className="ms-draw" d={arc(src, j)} fill="none" stroke={GRAPHITE} strokeWidth={1.2} markerEnd={`url(#${arrow})`} pathLength={1} />
      ))}
      {WRITE.map((t, i) => {
        const b = boxOf(i);
        const done = i < written;
        const now = showing && i === current;
        const source = sources.includes(i);
        return (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={now ? FIELD : PAPER} stroke={done ? INK : RULE} strokeWidth={now ? 2 : source ? 1.5 : 1} strokeDasharray={done ? undefined : '3 3'} vectorEffect="non-scaling-stroke" />
            <text className="ms-token" x={b.x + 6} y={b.y + b.h - (wide ? 8 : 6)} fontSize={wide ? 13 : 12} fontWeight={now ? 600 : 400} fill={INK} style={{ opacity: done ? 1 : 0 }}>
              {t.value[locale]}
            </text>
          </g>
        );
      })}

      {/* The same household as the generator reads it: one sequence, each value written after all the ones before it. */}
      {L.side && <Sequence f={f} locale={locale} written={written} />}

      {/* The odds of the token being written. */}
      <g key={showing ? current : 'none'}>
        <line x1={panel.x} x2={panel.x + panel.w} y1={panel.y} y2={panel.y} stroke={INK} strokeWidth={1} />
        <text x={panel.x} y={panel.y + (wide ? 20 : 17)} fontSize={qSize} fontWeight={600} fill={INK}>
          {showing ? token.question[locale] : (pt ? 'O gerador escolhe um valor de cada vez' : 'The generator picks one value at a time')}
        </text>
        {given.length > 0 && (
          <Lines x={panel.x} y={panel.y + (wide ? 38 : 33)} lines={given} step={15} fontSize={12} fill={GRAPHITE} />
        )}
        {showing && token.choices.map((ch, i) => {
          const y = top + i * rowH;
          const picked = i === token.picked;
          return (
            <g key={i} className="ms-choice" style={{ '--i': i } as CSSProperties}>
              <text x={panel.x} y={y + 9} fontSize={12} fontWeight={picked ? 600 : 400} fill={ch.impossible ? GRAPHITE : INK} textDecoration={ch.impossible ? 'line-through' : undefined}>{ch.label[locale]}</text>
              {ch.impossible ? (
                <>
                  <path d={`M${panel.x + labelW} ${y} l8 8 M${panel.x + labelW + 8} ${y} l-8 8`} stroke={CROSS} strokeWidth={1.6} />
                  <text x={panel.x + labelW + 14} y={y + 9} fontSize={11} fill={GRAPHITE}>{pt ? 'impossível' : 'impossible'}</text>
                </>
              ) : (
                <>
                  <rect className="ms-grow" x={panel.x + labelW} y={y} width={Math.max(1, ch.p * barMax)} height={10} fill={picked ? INK : DEEMPHASIS} />
                  <text x={panel.x + labelW + ch.p * barMax + 5} y={y + 9} fontSize={11} fill={picked ? INK : GRAPHITE} className="tnum">{Math.round(ch.p * 100)}%</text>
                </>
              )}
            </g>
          );
        })}
      </g>
    </g>
  );
}

/** Step 1's tokens in one line, people separated by a rule, wrapping at the stage's width. */
function Sequence({ f, locale, written }: { f: Frame; locale: Locale; written: number }) {
  const pt = locale === 'pt';
  const chips: Array<{ x: number; y: number; w: number; i: number; rule: boolean }> = [];
  let x = 0;
  let y = f.height - 34;
  WRITE.forEach((t, i) => {
    const rule = i > 0 && t.member !== WRITE[i - 1].member;
    if (rule) x += 10;
    const w = t.value[locale].length * 8 + 12;
    if (x + w > f.width) { x = 0; y += 26; }
    chips.push({ x, y, w, i, rule });
    x += w + 4;
  });
  const lines = new Set(chips.map(c => c.y)).size;
  const shift = (lines - 1) * 26;
  return (
    <g>
      <text x={0} y={f.height - 46 - shift} fontSize={11.5} fill={GRAPHITE}>
        {pt ? 'Como o gerador o lê: uma sequência, cada valor escrito depois dos anteriores' : 'As the generator reads it: one sequence, each value written after the ones before'}
      </text>
      {chips.map(c => {
        const done = c.i < written;
        const now = c.i === written - 1;
        return (
          <g key={c.i} transform={`translate(0 ${-shift})`}>
            {c.rule && <line x1={c.x - 7} x2={c.x - 7} y1={c.y - 2} y2={c.y + 22} stroke={INK} strokeWidth={1} />}
            <rect x={c.x} y={c.y} width={c.w} height={20} fill={now ? FIELD : PAPER} stroke={done ? INK : RULE} strokeWidth={now ? 2 : 1} strokeDasharray={done ? undefined : '3 3'} vectorEffect="non-scaling-stroke" />
            <text className="ms-token" x={c.x + 6} y={c.y + 14} fontSize={12} fontWeight={now ? 600 : 400} fill={INK} style={{ opacity: done ? 1 : 0 }}>{WRITE[c.i].value[locale]}</text>
          </g>
        );
      })}
    </g>
  );
}

/** The two tables under the houses, and the care home's line in step 4. */
function Tables({ f, locale, counts, beat, gap, scale }: { f: Frame; locale: Locale; counts: Counts; beat: BeatId; gap: number; scale: { sizes: number; ages: number } }) {
  const pt = locale === 'pt';
  const wide = f.kind === 'wide';
  const colGap = wide ? 32 : 14;
  const colW = (f.tables.w - colGap) / 2;
  const labelW = wide ? 76 : 60;
  const valueW = wide ? 34 : 24;
  const rowH = wide ? 18 : 16;
  const integer = BEATS.indexOf(beat) >= BEATS.indexOf('choose');
  const sizeLabels = wide
    ? (pt ? ['1 pessoa', '2 pessoas', '3 pessoas', '4 pessoas', '5 ou mais'] : ['1 person', '2 people', '3 people', '4 people', '5 or more'])
    : ['1', '2', '3', '4', '5+'];
  const ageLabels = wide
    ? (pt ? ['0–14 anos', '15–24 anos', '25–64 anos', '65 ou mais'] : ['Ages 0–14', 'Ages 15–24', 'Ages 25–64', 'Ages 65+'])
    : ['0–14', '15–24', '25–64', '65+'];
  const tables = [
    { title: pt ? (wide ? 'Agregados por número de pessoas' : 'Agregados por pessoas') : 'Households by size', labels: sizeLabels, values: counts.sizes, targets: TARGET.sizes, max: scale.sizes },
    { title: pt ? 'Pessoas por idade' : 'People by age', labels: ageLabels, values: counts.ages, targets: TARGET.ages, max: scale.ages },
  ];
  const top = f.tables.y;
  const collective = beat === 'collective';
  return (
    <g>
      <line x1={0} x2={f.width} y1={top} y2={top} stroke={INK} strokeWidth={1} />
      {tables.map((t, ti) => {
        const x0 = f.tables.x + ti * (colW + colGap);
        const barX = x0 + labelW;
        const barMax = colW - labelW - valueW - 6;
        const rows = t.labels.map((label, i) => ({ label, v: t.values[i], target: t.targets[i], strong: beat === 'mask' && ti === 0 && i === 4 }));
        // Step 4: the people INE counts in collective quarters, under the people table, on its scale.
        if (ti === 1) rows.push({ label: pt ? 'Coletivos' : 'Collective', v: collective ? CARE_HOME.length : 0, target: CARE_HOME.length, strong: collective });
        return (
          <g key={ti}>
            <text x={x0} y={top + 18} fontSize={wide ? 13 : 12} fontWeight={600} fill={INK}>{t.title}</text>
            {rows.map((r, i) => {
              const extra = ti === 1 && i === 4;
              const y = top + 28 + i * rowH + (extra ? 6 : 0);
              return (
                <g key={i} className={extra ? 'ms-fade' : undefined} data-show={extra ? (collective ? 'on' : 'off') : undefined} style={extra ? ({ opacity: collective ? 1 : 0, '--delay': collective ? '600ms' : '0ms' } as CSSProperties) : undefined}>
                  {extra && <line x1={x0} x2={x0 + colW} y1={y - 3} y2={y - 3} stroke={RULE} strokeWidth={1} />}
                  {/* The people table's labels carry the figures' colours, so it is the drawing's key too. */}
                  {ti === 1 && !extra && <rect x={x0} y={y + 0.5} width={5.6} height={9} fill={SERIES[i]} />}
                  <text x={x0 + (ti === 1 && !extra ? 9 : 0)} y={y + 9} fontSize={11.5} fontWeight={r.strong ? 600 : 400} fill={INK}>{r.label}</text>
                  <rect className="ms-bar" x={0} y={0} width={1} height={9} fill={INK} style={{ transform: `translate(${barX}px, ${y + 1}px) scaleX(${Math.max(0.001, (r.v / t.max) * barMax)})`, '--delay': extra && collective ? '700ms' : '0ms' } as CSSProperties} />
                  <rect x={barX + (r.target / t.max) * barMax - 4} y={y + 1.5} width={8} height={8} fill={INK} stroke={PAPER} strokeWidth={1.5} />
                  <text x={x0 + colW} y={y + 9} fontSize={11.5} fill={INK} textAnchor="end" className="tnum">{integer || beat === 'tables' || extra ? String(Math.round(r.v)) : one(r.v, locale)}</text>
                </g>
              );
            })}
          </g>
        );
      })}
      {/* The key, and how far the sums are from the tables. */}
      <g>
        <rect x={0} y={f.height - 12} width={8} height={8} fill={INK} />
        <text x={12} y={f.height - 4} fontSize={11.5} fill={GRAPHITE}>{pt ? (wide ? 'contagem do INE' : 'INE') : (wide ? 'INE’s count' : 'INE')}</text>
        <rect x={wide ? 118 : 42} y={f.height - 11} width={16} height={6} fill={INK} />
        <text x={(wide ? 118 : 42) + 20} y={f.height - 4} fontSize={11.5} fill={GRAPHITE}>{pt ? 'soma dos agregados' : 'sum of the households'}</text>
      </g>
      <text x={f.width} y={f.height - 4} fontSize={11.5} fill={INK} textAnchor="end" fontWeight={600} className="tnum">
        {beat === 'tables' ? '' : `${pt ? (wide ? 'Diferença para as tabelas' : 'Diferença') : (wide ? 'Gap to the tables' : 'Gap')}: ${one(gap, locale)}`}
      </text>
    </g>
  );
}

/** Step 5: the published rows, a figure at the start of each. */
function Rows({ f, locale, rows, table, data, householdNumber, householdSize }: {
  f: Frame; locale: Locale; rows: Person[]; table: ReturnType<typeof publishTable>; data: StoryData;
  householdNumber: (p: Person) => number; householdSize: (p: Person) => number;
}) {
  const pt = locale === 'pt';
  const wide = f.kind === 'wide';
  const letter = (v: string) => (v === 'key' ? (pt ? 'chave' : 'key') : v === 'flag' ? (pt ? 'indicador' : 'flag') : v);
  const heads = [
    { name: pt ? 'Agregado' : 'Household', p: data.provenance.synthetic_hh_id },
    { name: pt ? 'Pessoas' : 'People', p: data.provenance.hh_size },
    { name: pt ? 'Idade' : 'Age', p: data.provenance.age },
    { name: pt ? 'Grupo' : 'Band', p: data.provenance.age_5y },
    { name: pt ? 'Sexo' : 'Sex', p: data.provenance.sex },
    { name: pt ? 'Coletivo' : 'Collective', p: data.provenance.is_institutional },
  ];
  const fs = wide ? 12 : 11.5;
  const legend = wrap(pt
    ? 'G gerada pelo modelo, D derivada de outra coluna, C tornada coerente depois de gerada'
    : 'G generated by the model, D derived from another column, C made consistent after generation', f.width, 11.5);
  return (
    <g>
      <text x={0} y={wide ? 18 : 15} fontSize={wide ? 14 : 13} fontWeight={600} fill={INK}>{pt ? `${rows.length} registos de pessoas, um por linha` : `${rows.length} person records, one per row`}</text>
      {heads.map((h, i) => (
        <g key={i}>
          <text x={table.cols[i]} y={table.top - 16} fontSize={fs} fontWeight={600} fill={INK}>{h.name}</text>
          <text x={table.cols[i]} y={table.top - 3} fontSize={11} fill={GRAPHITE}>{letter(h.p)}</text>
        </g>
      ))}
      <line x1={0} x2={f.width} y1={table.top + 2} y2={table.top + 2} stroke={INK} strokeWidth={1} />
      {rows.slice(0, table.shown).map((p, r) => {
        const y = table.top + table.rowH * (r + 1);
        const cells = [
          String(householdNumber(p)), String(householdSize(p)), String(p.age), band5(p.age, locale), p.sex, p.candidate === 'care' ? '1' : '0',
        ];
        return (
          <g key={p.key} className="ms-row" style={{ '--i': r } as CSSProperties}>
            {cells.map((cell, i) => <text key={i} x={table.cols[i]} y={y} fontSize={fs} fill={INK} className="tnum">{cell}</text>)}
            <line x1={table.cols[0]} x2={f.width} y1={y + 4} y2={y + 4} stroke={BRAND.grid} strokeWidth={1} />
          </g>
        );
      })}
      {rows.length > table.shown && (
        <text className="ms-row" style={{ '--i': table.shown } as CSSProperties} x={table.cols[0]} y={table.top + table.rowH * (table.shown + 1)} fontSize={11.5} fill={GRAPHITE}>
          {pt ? `e mais ${rows.length - table.shown} linhas` : `and ${rows.length - table.shown} more rows`}
        </text>
      )}
      <Lines x={0} y={f.height - 4 - (legend.length - 1) * 14} lines={legend} step={14} fontSize={11.5} fill={GRAPHITE} />
    </g>
  );
}

/** Step 5: the tier grid, with the invented parish placed on it. */
function Tiers({ f, locale, data, hatch, residents }: { f: Frame; locale: Locale; data: StoryData; hatch: { B: string; C: string }; residents: number }) {
  const pt = locale === 'pt';
  const wide = f.kind === 'wide';
  const t = data.tiers;
  const labelW = wide ? 120 : 80;
  const headH = wide ? 44 : 40;
  const top = wide ? 40 : 32;
  const gridW = Math.min(f.width, wide ? 640 : f.width) - labelW;
  const cellW = gridW / 3;
  const below = [
    pt ? `A freguesia inventada: ${residents} residentes, nível C.` : `The invented parish: ${residents} residents, tier C.`,
    pt
      ? `Na versão ${t.release}: ${grouped(t.counts.A, locale)} freguesias no nível A, ${grouped(t.counts.B, locale)} no B e ${grouped(t.counts.C, locale)} no C.`
      : `In release ${t.release}: ${grouped(t.counts.A, locale)} parishes in tier A, ${grouped(t.counts.B, locale)} in B and ${grouped(t.counts.C, locale)} in C.`,
  ].map(s => wrap(s, Math.min(f.width, 640), 12));
  const belowH = 14 + below.reduce((n, l) => n + l.length * 16 + 4, 0);
  const cellH = Math.max(28, Math.min(wide ? 66 : 50, (f.height - top - headH - belowH) / 3));
  const cols = pt
    ? [`menos de ${grouped(t.minB, locale)}`, `${grouped(t.minB, locale)} a ${grouped(t.minA - 1, locale)}`, `${grouped(t.minA, locale)} ou mais`]
    : [`under ${grouped(t.minB, locale)}`, `${grouped(t.minB, locale)} to ${grouped(t.minA - 1, locale)}`, `${grouped(t.minA, locale)} or more`];
  const rows = pt
    ? [`até ${decimal(t.maxA, locale)}`, `${decimal(t.maxA, locale)} a ${decimal(t.maxB, locale)}`, `mais de ${decimal(t.maxB, locale)}`]
    : [`up to ${decimal(t.maxA, locale)}`, `${decimal(t.maxA, locale)} to ${decimal(t.maxB, locale)}`, `over ${decimal(t.maxB, locale)}`];
  const tierOf = (row: number, col: number) => (col === 0 || row === 2 ? 'C' : col === 1 || row === 1 ? 'B' : 'A');
  const gy = top + headH;
  let y = gy + cellH * 3 + 22;
  return (
    <g>
      <text x={0} y={wide ? 18 : 15} fontSize={wide ? 14 : 13} fontWeight={600} fill={INK}>{pt ? 'O nível de qualidade da freguesia' : 'The parish’s quality tier'}</text>
      <text x={labelW} y={top + 14} fontSize={11.5} fill={GRAPHITE}>{pt ? 'Residentes' : 'Residents'}</text>
      {cols.map((c, i) => <text key={i} x={labelW + cellW * i + 5} y={top + 32} fontSize={wide ? 12 : 11} fill={INK} className="tnum">{c}</text>)}
      <text x={0} y={gy - 6} fontSize={11.5} fill={GRAPHITE}>{pt ? 'Erro típico' : 'Typical error'}</text>
      {rows.map((r, row) => (
        <g key={row}>
          <text x={0} y={gy + cellH * row + cellH / 2 + 4} fontSize={wide ? 12 : 11} fill={INK} className="tnum">{r}</text>
          {[0, 1, 2].map(col => {
            const tier = tierOf(row, col);
            const x = labelW + cellW * col;
            const cy = gy + cellH * row;
            return (
              <g key={col}>
                <rect x={x} y={cy} width={cellW} height={cellH} fill={tier === 'A' ? PAPER : hatch[tier]} stroke={RULE} strokeWidth={1} />
                <rect x={x + cellW / 2 - 12} y={cy + cellH / 2 - 12} width={24} height={24} fill={PAPER} />
                <text x={x + cellW / 2} y={cy + cellH / 2 + 6} textAnchor="middle" fontSize={wide ? 18 : 16} fontWeight={700} fill={INK}>{tier}</text>
              </g>
            );
          })}
        </g>
      ))}
      {/* The invented parish: under B's floor, the whole first column is C, whatever its error. */}
      <rect className="ms-mark" x={labelW + 1.5} y={gy + 1.5} width={cellW - 3} height={cellH * 3 - 3} fill="none" stroke={INK} strokeWidth={3} pathLength={1} />
      {below.map((lines, i) => {
        const el = <Lines key={i} x={0} y={y} lines={lines} step={16} fontSize={12} fontWeight={i === 0 ? 600 : 400} fill={i === 0 ? INK : GRAPHITE} />;
        y += lines.length * 16 + 4;
        return el;
      })}
    </g>
  );
}
