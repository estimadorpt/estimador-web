/**
 * The card designs, in the site's instrument grammar.
 *
 * A card is the page it links to, read at a glance: ink on white, the logo,
 * the instrument's name and the reading's date over an ink rule, the finding
 * as the headline, the figures with their marks, and a footer with the key to
 * the marks and the address. The three marks mean what they mean on the site:
 * a black square is what already happened, a yellow band between ink caps
 * with a median tick is the model's margin (90%), a lone tick on a short ruler
 * is one model run with no margin. No pills, no uppercase kickers, no mosaic,
 * and never the owner's name.
 */

import { readFileSync } from 'node:fs';
import { h, svg, rule, COLOR, FONT_FAMILY } from './og-render.mjs';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
const PAD_X = 64;

const geometry = JSON.parse(readFileSync(new URL('../../src/lib/brand/geometry.json', import.meta.url), 'utf8'));
const wordmark = JSON.parse(readFileSync(new URL('../../src/lib/brand/wordmark-paths.json', import.meta.url), 'utf8'));
export const MARK_D = [geometry.MARK_LEFT, geometry.MARK_BAND, geometry.MARK_RIGHT].join(' ');
export const MARK_SMALL_D = geometry.MARK_SMALL;

/** Ink and secondary colours for a ground: white by default, ink for the dark social kit. */
export function tones(dark = false) {
  return dark
    ? { ground: COLOR.inkGround, ink: COLOR.onInk, muted: COLOR.onInkMuted, rule: COLOR.onInkRule, grid: COLOR.onInkRule }
    : { ground: COLOR.ground, ink: COLOR.ink, muted: COLOR.muted, rule: COLOR.rule, grid: COLOR.grid };
}

/** The mark alone, in its 48×24 box. */
export function mark(height = 24, color = COLOR.ink) {
  return svg('svg', { width: height * 2, height, viewBox: '0 0 48 24' }, svg('path', { d: MARK_D, fill: color }));
}

/**
 * The signature as published (public/brand/estimador-logo.svg): the mark and
 * the outlined wordmark from src/lib/brand, so a card never depends on a font
 * to spell the name.
 */
export function logo(height = 30, { dark = false } = {}) {
  const t = tones(dark);
  const W = wordmark.WORDMARK_WIDTH, H = wordmark.WORDMARK_HEIGHT;
  return svg('svg', { width: Math.round((height * W) / H), height, viewBox: `0 0 ${W} ${H}` },
    svg('path', { d: MARK_D, fill: t.ink }),
    svg('g', { transform: `translate(${wordmark.WORDMARK_X} ${wordmark.WORDMARK_BASELINE})` },
      svg('path', { d: wordmark.WORDMARK_NAME, fill: t.ink }),
      svg('path', { d: wordmark.WORDMARK_TLD, fill: t.muted })));
}

/* --------------------------------------------------------------- marks ---- */

/** What already happened: a black square. */
export function nowGlyph(size = 14, { dark = false } = {}) {
  return h('div', { width: size, height: size, backgroundColor: tones(dark).ink, flexShrink: 0 });
}

/** The model's margin: the yellow band between thin caps, with its median tick. */
export function bandGlyph(width = 44, height = 20, { dark = false } = {}) {
  const ink = tones(dark).ink, band = Math.round(height * 0.5), top = (height - band) / 2;
  return svg('svg', { width, height, viewBox: `0 0 ${width} ${height}` },
    svg('rect', { x: 1, y: top, width: width - 2, height: band, fill: COLOR.signal }),
    svg('rect', { x: 0, y: height * 0.1, width: 1.5, height: height * 0.8, fill: ink }),
    svg('rect', { x: width - 1.5, y: height * 0.1, width: 1.5, height: height * 0.8, fill: ink }),
    svg('rect', { x: width / 2 - 1.25, y: 0, width: 2.5, height, fill: ink }));
}

/** One model run, no margin: a lone tick on a short ruler. */
export function tickGlyph(width = 34, height = 20, { dark = false } = {}) {
  const ink = tones(dark).ink, base = height * 0.72;
  return svg('svg', { width, height, viewBox: `0 0 ${width} ${height}` },
    svg('rect', { x: 0, y: base, width, height: 1.5, fill: ink }),
    svg('rect', { x: 0, y: base - height * 0.2, width: 1.5, height: height * 0.22, fill: ink }),
    svg('rect', { x: width - 1.5, y: base - height * 0.2, width: 1.5, height: height * 0.22, fill: ink }),
    svg('rect', { x: width / 2 - 1.25, y: 0, width: 2.5, height: base + 1.5, fill: ink }));
}

const RULE_WORDS = {
  pt: { now: 'o que já aconteceu', band: 'a margem do modelo, 90%', tick: 'uma corrida do modelo, sem margem' },
  en: { now: 'what has already happened', band: 'the model’s margin, 90%', tick: 'one model run, no margin' },
};

/**
 * The reading rule as a key: the marks a card uses, each with its words. The
 * Liga card says "points today" for the square, so its words can be passed.
 */
export function readingKey(marks, locale = 'pt', { fontSize = 19, dark = false, words = {}, direction = 'row', gap = 30 } = {}) {
  const t = tones(dark), w = { ...(RULE_WORDS[locale] ?? RULE_WORDS.pt), ...words };
  const glyph = { now: () => nowGlyph(Math.round(fontSize * 0.7), { dark }), band: () => bandGlyph(Math.round(fontSize * 2.2), Math.round(fontSize * 1.05), { dark }), tick: () => tickGlyph(Math.round(fontSize * 1.7), Math.round(fontSize * 1.05), { dark }) };
  return h('div', { display: 'flex', flexDirection: direction, alignItems: direction === 'row' ? 'center' : 'flex-start' },
    ...marks.map((m, i) => h('div', {
      display: 'flex', alignItems: 'center',
      [direction === 'row' ? 'marginLeft' : 'marginTop']: i === 0 ? 0 : gap,
    },
      glyph[m](),
      h('div', { fontSize, color: t.muted, marginLeft: Math.round(fontSize * 0.55) }, w[m]))));
}

/**
 * An interval on its row's own scale, as the site draws it (.iv in
 * globals.css): a grid line, the band from lo to hi between ink caps, the
 * median tick, and the square of what already happened.
 */
export function intervalBand({ lo, md, hi, min = 0, max = 100, now = null, width = 420, height = 26, low = false }) {
  const x = v => ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * width;
  const mid = height / 2, band = 10;
  return svg('svg', { width, height, viewBox: `0 0 ${width} ${height}` },
    svg('rect', { x: 0, y: mid - 0.5, width, height: 1, fill: COLOR.grid }),
    svg('rect', { x: x(lo), y: mid - band / 2, width: Math.max(3, x(hi) - x(lo)), height: band, fill: low ? COLOR.signalLow : COLOR.signal }),
    svg('rect', { x: x(lo) - 0.75, y: mid - 8, width: 1.5, height: 16, fill: COLOR.ink }),
    svg('rect', { x: x(hi) - 0.75, y: mid - 8, width: 1.5, height: 16, fill: COLOR.ink }),
    svg('rect', { x: x(md) - 1.25, y: mid - 10, width: 2.5, height: 20, fill: COLOR.ink }),
    now == null ? null : svg('rect', { x: x(now) - 6, y: mid - 6, width: 12, height: 12, fill: COLOR.ink, stroke: COLOR.paper, strokeWidth: 1.5 }));
}

/** The scale printed above a column of bands: same min and max as the bands below it. */
export function ruler({ min = 0, max = 100, ticks = [0, 25, 50, 75, 100], width = 420, fontSize = 15 }) {
  const x = v => ((v - min) / (max - min)) * width;
  return h('div', { display: 'flex', flexDirection: 'column', width },
    h('div', { display: 'flex', position: 'relative', height: fontSize + 4, width },
      ...ticks.map((v, i) => {
        const place = i === 0 ? { left: 0 } : i === ticks.length - 1 ? { right: 0 } : { left: x(v) - 20, width: 40, justifyContent: 'center' };
        return h('div', { position: 'absolute', top: 0, display: 'flex', fontSize, color: COLOR.muted, ...place }, String(v));
      })),
    svg('svg', { width, height: 8, viewBox: `0 0 ${width} 8` },
      svg('rect', { x: 0, y: 7, width, height: 1, fill: COLOR.scale }),
      ...ticks.map(v => svg('rect', { x: Math.min(width - 1, Math.max(0, x(v) - 0.5)), y: 2, width: 1, height: 6, fill: COLOR.scale }))));
}

/** An ink bar on a 0–100 ruler, no grey track (ProbBar). */
export function probBar(p, { width = 260, height = 12 } = {}) {
  return svg('svg', { width, height: height + 6, viewBox: `0 0 ${width} ${height + 6}` },
    svg('rect', { x: 0, y: 0, width: Math.max(2, p * width), height, fill: COLOR.ink }),
    svg('rect', { x: 0, y: height + 5, width, height: 1, fill: COLOR.scale }),
    ...[0, 0.25, 0.5, 0.75, 1].map(v => svg('rect', { x: Math.min(width - 1, v * width), y: height + 2, width: 1, height: 4, fill: COLOR.scale })));
}

/* --------------------------------------------------------------- chrome --- */

/**
 * An instrument's head: its name in bold, an optional serial ("J8",
 * "v1.0.3"), the reading's date on the right, over an ink rule (ChannelHead).
 */
export function channelHead({ title, serial, aside, dark = false, fontSize = 26 }) {
  const t = tones(dark);
  return h('div', { display: 'flex', flexDirection: 'column' },
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
      h('div', { display: 'flex', alignItems: 'baseline' },
        h('div', { fontSize, fontWeight: 700, color: t.ink, letterSpacing: -0.3 }, title),
        serial ? h('div', { fontSize: Math.round(fontSize * 0.7), fontWeight: 600, color: t.ink, marginLeft: 12 }, serial) : null),
      aside ? h('div', { fontSize: Math.round(fontSize * 0.74), color: t.muted }, aside) : h('div', {})),
    rule(t.ink, { marginTop: 10, height: 2 }));
}

/** A label in sentence case: 12px graphite on the site, scaled for a card. */
export function label(text, style = {}) {
  return h('div', { fontSize: 18, color: COLOR.muted, ...style }, text);
}

function footer(left, right) {
  return h('div', { display: 'flex', flexDirection: 'column' },
    rule(COLOR.ink),
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, minHeight: 40 },
      typeof left === 'string' ? h('div', { fontSize: 19, color: COLOR.muted }, left) : (left ?? h('div', {})),
      right ? h('div', { fontSize: 21, fontWeight: 600, color: COLOR.ink }, right) : h('div', {})));
}

/**
 * The chrome every card shares: the logo, then the instrument, then the
 * footer. Exported because the matchday post lives in its own script but is
 * the same publication.
 */
export function shell({ height = CARD_HEIGHT, head, footerLeft, footerRight, headerRight }, ...children) {
  return h('div', {
    width: CARD_WIDTH, height, display: 'flex', flexDirection: 'column',
    backgroundColor: COLOR.ground, fontFamily: FONT_FAMILY, color: COLOR.ink,
    padding: `40px ${PAD_X}px 30px`,
  },
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
      logo(28),
      headerRight ? h('div', { fontSize: 19, color: COLOR.muted }, headerRight) : h('div', {})),
    head ? h('div', { display: 'flex', flexDirection: 'column', marginTop: 30 }, channelHead(head)) : null,
    h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }, ...children),
    footer(footerLeft, footerRight));
}

/**
 * Satori only honours the line clamp when an ellipsis is asked for as well, and
 * without the clamp a pathological headline pushes the footer off the canvas.
 */
export function clampedText(text, { fontSize, lines, ...style }) {
  return h('div', {
    fontSize,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    ...style,
  }, text);
}

/** A finding, set as large as it can be without spilling. */
export function headline(text, { lines = 2, size } = {}) {
  const fontSize = size ?? (text.length <= 40 ? 64 : text.length <= 60 ? 56 : text.length <= 90 ? 48 : 42);
  return clampedText(text, { fontSize, lines, fontWeight: 700, color: COLOR.ink, lineHeight: 1.06, letterSpacing: -1.2 });
}

/* ---------------------------------------------------------------- cards --- */

const REGISTER = {
  nota: { pt: 'Nota', en: 'Note' },
  explicador: { pt: 'Explicador', en: 'Explainer' },
};

/**
 * An article card carries the piece itself: the register and the date as the
 * instrument's head, the headline at reading size, the excerpt, the reading
 * time. No byline: the cards carry no one's name.
 */
export function articleCard({ title, excerpt, kind, dateLabel, readTime, url, locale = 'pt' }) {
  const register = REGISTER[kind] ?? REGISTER.explicador;
  return shell({
    head: { title: register[locale] ?? register.pt, aside: dateLabel },
    footerLeft: readTime,
    footerRight: url,
  },
    h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingTop: 18, paddingBottom: 22 },
      headline(title, { lines: 3 }),
      excerpt ? clampedText(excerpt, { fontSize: 24, lines: 3, color: COLOR.muted, lineHeight: 1.4, marginTop: 22 }) : null));
}

/**
 * The Liga card: the finding, the count of seasons behind it, and the
 * contenders on one 0–100 points ruler (title share, today's points as a
 * square, the final-points band), as the homepage's Liga instrument draws them.
 */
export function ligaCard({ head, finding, standfirst, rows, footerLeft, footerRight, locale = 'pt' }) {
  const pt = locale !== 'en';
  const BAND_W = 400;
  const col = { name: 250, share: 150, band: BAND_W, final: 150 };
  const headRow = h('div', { display: 'flex', alignItems: 'flex-end', paddingBottom: 8 },
    h('div', { width: col.name, fontSize: 16, color: COLOR.muted }, pt ? 'Clube' : 'Club'),
    h('div', { width: col.share, fontSize: 16, color: COLOR.muted, display: 'flex', justifyContent: 'flex-end', paddingRight: 30 }, pt ? 'Título' : 'Title'),
    h('div', { display: 'flex', flexDirection: 'column', width: col.band },
      h('div', { fontSize: 16, color: COLOR.muted, marginBottom: 2 }, pt ? 'Pontos, agora e no fim' : 'Points, now and at the end'),
      ruler({ width: col.band, fontSize: 14 })),
    h('div', { flexGrow: 1, fontSize: 16, color: COLOR.muted, display: 'flex', justifyContent: 'flex-end' }, pt ? 'No fim, 90%' : 'At the end, 90%'));
  const row = (r, i) => h('div', { display: 'flex', alignItems: 'center', height: 52, borderTop: i === 0 ? `2px solid ${COLOR.ink}` : `1px solid ${COLOR.grid}` },
    h('div', { width: col.name, display: 'flex', alignItems: 'center' },
      h('div', { width: 15, height: 15, backgroundColor: r.color, marginRight: 14 }),
      h('div', { fontSize: 29, fontWeight: 600 }, r.name)),
    h('div', { width: col.share, display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', paddingRight: 30 },
      h('div', { fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }, r.share),
      h('div', { fontSize: 19, fontWeight: 600, marginLeft: 2 }, '%')),
    h('div', { width: col.band, display: 'flex' }, r.band ? intervalBand({ ...r.band, width: col.band }) : null),
    h('div', { flexGrow: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline' },
      r.band ? h('div', { fontSize: 25, fontWeight: 700 }, String(r.band.md)) : null,
      r.band ? h('div', { fontSize: 21, color: COLOR.muted, marginLeft: 8 }, `${r.band.lo}–${r.band.hi}`) : null));
  return shell({ head, footerLeft, footerRight },
    h('div', { display: 'flex', flexDirection: 'column', marginTop: 20 },
      headline(finding, { lines: 2, size: 52 }),
      standfirst ? clampedText(standfirst, { fontSize: 22, lines: 1, color: COLOR.muted, marginTop: 8 }) : null),
    h('div', { display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: 16, paddingTop: 14 },
      headRow,
      ...rows.map(row)));
}

/**
 * The population card: what the release is, the counter-sign of a single run
 * and the release's own caveat before any figure, then its counts as a
 * register. Every figure is a release count; nothing is computed.
 */
export function populationCard({ head, statement, caveat, register, footerLeft, footerRight }) {
  return shell({ head, footerLeft, footerRight },
    h('div', { display: 'flex', flexDirection: 'column', marginTop: 22 },
      headline(statement, { lines: 2, size: 56 }),
      h('div', { display: 'flex', alignItems: 'flex-start', marginTop: 16 },
        h('div', { display: 'flex', marginTop: 4 }, tickGlyph(34, 20)),
        clampedText(caveat, { fontSize: 19, lines: 2, color: COLOR.muted, lineHeight: 1.35, marginLeft: 12, flexShrink: 1 }))),
    h('div', { display: 'flex', marginTop: 'auto', marginBottom: 22 },
      ...register.map((item, i) => h('div', {
        display: 'flex', flexDirection: 'column', flexBasis: 0, flexGrow: 1,
        marginLeft: i === 0 ? 0 : 28, borderTop: `1px solid ${COLOR.rule}`, paddingTop: 10,
      },
        label(item.label, { fontSize: 18 }),
        h('div', { fontSize: 40, fontWeight: 700, letterSpacing: -0.6, marginTop: 4 }, item.value),
        item.note ? label(item.note, { fontSize: 16, marginTop: 2 }) : null))));
}

/**
 * A single-path sparkline in ink over a baseline. Satori lays out an <svg>
 * child as a layout node, so one path per element is the whole budget.
 */
function sparkline(values, { width, height }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 0.0001);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - (value / max) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return svg('svg', { width, height: height + 2, viewBox: `0 0 ${width} ${height + 2}` },
    svg('polyline', { points: points.join(' '), fill: 'none', stroke: COLOR.ink, strokeWidth: 2.5, strokeLinejoin: 'round' }),
    svg('rect', { x: 0, y: height + 1, width, height: 1, fill: COLOR.scale }));
}

/**
 * A section that publishes one headline number (the economy, once it
 * publishes): the number, what it is of, and its trend, dated in the head.
 */
export function figureCard({ head, labelText, value, unit, subject, caption, spark, footerLeft, footerRight }) {
  return shell({ head, footerLeft, footerRight },
    h('div', { display: 'flex', flexGrow: 1, alignItems: 'center' },
      h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, flexShrink: 1, minWidth: 0, paddingRight: 48 },
        label(labelText, { fontSize: 20 }),
        h('div', { display: 'flex', alignItems: 'baseline', marginTop: 6 },
          h('div', { fontSize: 132, fontWeight: 700, lineHeight: 1, letterSpacing: -4 }, value),
          unit ? h('div', { fontSize: 52, fontWeight: 600, marginLeft: 6 }, unit) : null),
        h('div', { fontSize: 32, fontWeight: 600, marginTop: 10 }, subject),
        caption ? clampedText(caption, { fontSize: 20, lines: 3, color: COLOR.muted, lineHeight: 1.4, marginTop: 12 }) : null),
      spark ? h('div', { display: 'flex', flexDirection: 'column', width: 400, flexShrink: 0 },
        label(spark.label),
        h('div', { display: 'flex', marginTop: 14 }, sparkline(spark.values, { width: 400, height: 130 })),
        label(spark.caption, { fontSize: 16, marginTop: 8 })) : null));
}

/**
 * The card for every page without one of its own: the line as the headline,
 * the descriptor, the reading rule, and the sections over ink rules, in the
 * order of what is live.
 */
export function brandCard({ headline: line, standfirst, columns, locale = 'pt', footerRight }) {
  return h('div', {
    width: CARD_WIDTH, height: CARD_HEIGHT, display: 'flex', flexDirection: 'column',
    backgroundColor: COLOR.ground, fontFamily: FONT_FAMILY, color: COLOR.ink,
    padding: `46px ${PAD_X}px 30px`,
  },
    logo(40),
    h('div', { display: 'flex', flexDirection: 'column', marginTop: 30 },
      clampedText(line, { fontSize: 74, lines: 2, fontWeight: 700, lineHeight: 1.04, letterSpacing: -1.8 }),
      clampedText(standfirst, { fontSize: 25, lines: 3, color: COLOR.muted, lineHeight: 1.4, marginTop: 16, maxWidth: 1000 })),
    h('div', { display: 'flex', marginTop: 'auto' }, readingKey(['now', 'band', 'tick'], locale, { fontSize: 20, gap: 34 })),
    h('div', { display: 'flex', marginTop: 26, marginBottom: 24 },
      ...columns.map((column, index) => h('div', {
        display: 'flex', flexDirection: 'column', flexBasis: 0, flexGrow: 1,
        marginLeft: index === 0 ? 0 : 28, borderTop: `2px solid ${COLOR.ink}`, paddingTop: 10,
      },
        h('div', { fontSize: 22, fontWeight: 700 }, column.name),
        h('div', { fontSize: 17, color: COLOR.muted, marginTop: 5, lineHeight: 1.35 }, column.blurb)))),
    footer(null, footerRight));
}
