/**
 * The card designs themselves.
 *
 * Every card is the same object the site's pages are: an off-white stone
 * ground, a hairline masthead, one thing said loudly, and a dated footer. A
 * card that looks like a different product than the page it links to is a card
 * the reader does not trust, which is why there are no gradients here: the
 * ink, the paper and, on editorial covers only, the four surface pastels.
 */

import { readFileSync } from 'node:fs';
import { h, svg, rule, COLOR } from './og-render.mjs';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
const PAD = 64;
const ASIDE_WIDTH = 400;

/** The mark: the site's credible interval, one colour, at card scale. */
const geometry = JSON.parse(readFileSync(new URL('../../src/lib/brand/geometry.json', import.meta.url), 'utf8'));
const MARK_D = [geometry.MARK_LEFT, geometry.MARK_BAND, geometry.MARK_RIGHT].join(' ');
function mark(height = 28, color = COLOR.ink) {
  return svg('svg', { width: height * 2, height, viewBox: '0 0 48 24' }, svg('path', { d: MARK_D, fill: color }));
}

/** A thin ink rule where the old three-colour band was: the card is ours by its mark, not by stripes. */
function brandBand() {
  return h('div', { display: 'flex', height: 6, width: '100%', backgroundColor: COLOR.ink });
}

function logotype() {
  return h('div', { display: 'flex', alignItems: 'center' },
    mark(26, COLOR.ink),
    h('div', { display: 'flex', marginLeft: 12, fontSize: 29, fontWeight: 800, color: COLOR.ink, letterSpacing: -1 },
      h('div', {}, 'estimador'),
      h('div', { color: COLOR.faint }, '.pt')));
}

/**
 * The mosaic: four surface pastels in the site's small vocabulary (a quarter
 * circle is a share, a circle a person, a block a place). Only on the brand
 * card and on explainer covers; never beside a number.
 */
export function mosaic(size = 260) {
  const half = size / 2;
  const block = (backgroundColor, style = {}, child = null) => h('div', { width: half, height: half, backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }, child);
  return h('div', { display: 'flex', flexWrap: 'wrap', width: size, height: size, flexShrink: 0 },
    block(COLOR.mintSoft, { borderTopLeftRadius: size }),
    block(COLOR.mustardSoft, {}, h('div', { width: half * 0.46, height: half * 0.46, borderRadius: 999, backgroundColor: COLOR.ground })),
    block(COLOR.coralSoft, {}),
    block(COLOR.periwinkleSoft, { borderBottomRightRadius: size }));
}

/** The uppercase tracked micro-label the site uses above every section. */
export function eyebrow(text, color = COLOR.faint, style = {}) {
  return h('div', {
    fontSize: 15, fontWeight: 700, color, textTransform: 'uppercase',
    letterSpacing: 2.2, ...style,
  }, text);
}

/** A solid square-cornered tag — the register badge and the section label. */
export function badge(text, backgroundColor = COLOR.ink) {
  return h('div', {
    display: 'flex', backgroundColor, color: COLOR.paper, padding: '8px 14px 9px',
    fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2.2,
  }, text);
}

function footer(left, right) {
  return h('div', { display: 'flex', flexDirection: 'column' },
    rule(COLOR.rule),
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 18 },
      h('div', { fontSize: 20, color: COLOR.muted }, left),
      right ? h('div', { fontSize: 20, color: COLOR.faint }, right) : h('div', {})));
}

/**
 * The chrome every card shares. Exported because the matchday post card lives
 * in its own script but is the same publication.
 */
export function shell({ height = CARD_HEIGHT, headerRight, footerLeft = '', footerRight }, ...children) {
  return h('div', {
    width: CARD_WIDTH, height, display: 'flex', flexDirection: 'column',
    backgroundColor: COLOR.ground, fontFamily: 'Manrope',
  },
    brandBand(),
    h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, padding: `40px ${PAD}px 34px` },
      h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        logotype(), headerRight ?? h('div', {})),
      rule(COLOR.rule, { marginTop: 26 }),
      ...children,
      footer(footerLeft, footerRight)));
}

/**
 * Headlines are set as large as they can be without spilling: satori measures
 * the text, but the step-down keeps a 120-character title from arriving as six
 * cramped lines while a six-word one floats in white space.
 */
function headlineSize(text) {
  if (text.length <= 46) return 66;
  if (text.length <= 72) return 58;
  if (text.length <= 104) return 50;
  return 43;
}

/**
 * Satori only honours the line clamp when an ellipsis is asked for as well, and
 * without the clamp a pathological headline pushes the footer off the canvas.
 */
function clampedText(text, { fontSize, lines, ...style }) {
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

const REGISTER = {
  nota: { pt: 'Nota', en: 'Note', color: COLOR.ink },
  explicador: { pt: 'Explicador', en: 'Explainer', color: COLOR.teal },
};

/**
 * An article card carries the piece itself: the headline at reading size, the
 * register, and the date. The old card showed a logo, which told a reader
 * scrolling X nothing about what they were being offered.
 */
export function articleCard({ title, excerpt, kind, dateLabel, byline, readTime, locale = 'pt' }) {
  const register = REGISTER[kind] ?? REGISTER.explicador;
  const playful = kind === 'explicador';
  return shell({
    headerRight: badge(register[locale] ?? register.pt, register.color),
    footerLeft: byline ? `${dateLabel} · ${byline}` : dateLabel,
    footerRight: readTime,
  },
    h('div', { display: 'flex', flexGrow: 1, alignItems: 'center', paddingTop: 30, paddingBottom: 30 },
      h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, flexShrink: 1, minWidth: 0, paddingRight: playful ? 48 : 0 },
        clampedText(title, {
          fontSize: playful ? Math.min(headlineSize(title), 58) : headlineSize(title), lines: 4, fontWeight: 800, color: COLOR.ink,
          lineHeight: 1.12, letterSpacing: -1.4,
        }),
        excerpt ? clampedText(excerpt, {
          fontSize: 25, lines: 3, color: COLOR.muted, lineHeight: 1.45, marginTop: 24,
        }) : null),
      playful ? mosaic(240) : null));
}

/**
 * A ranked row — name, proportional bar, value. Used for the title race, where
 * the second and third numbers are the story as much as the first.
 */
export function rankedRow({ name, value, note, fraction, color, trailing }, isLead = false) {
  return h('div', { display: 'flex', flexDirection: 'column', marginTop: 16 },
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
      h('div', { display: 'flex', alignItems: 'baseline' },
        h('div', { fontSize: 21, fontWeight: isLead ? 700 : 500, color: isLead ? COLOR.ink : COLOR.inkSoft }, name),
        note ? h('div', { fontSize: 16, color: COLOR.faint, marginLeft: 10 }, note) : null),
      h('div', { display: 'flex', alignItems: 'baseline' },
        h('div', { fontSize: 21, fontWeight: 700, color: isLead ? COLOR.ink : COLOR.muted }, value),
        trailing ? h('div', { fontSize: 17, fontWeight: 500, color: trailing.color, marginLeft: 12 }, trailing.text) : null)),
    h('div', { display: 'flex', height: 10, marginTop: 7, backgroundColor: COLOR.rule },
      h('div', { width: `${Math.max(1.5, fraction * 100)}%`, backgroundColor: color })));
}

/**
 * A single-path sparkline. Satori lays out an <svg> child as a layout node, so
 * one path per element is the whole budget — enough for a trend line, which is
 * all the context a headline number needs on a card.
 */
function sparkline(values, { width, height, color }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 0.0001);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - (value / max) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return h('div', { display: 'flex', flexDirection: 'column' },
    svg('svg', { width, height, viewBox: `0 0 ${width} ${height}` },
      svg('polyline', {
        points: points.join(' '), fill: 'none', stroke: color,
        strokeWidth: 2.5, strokeLinejoin: 'round',
      })),
    h('div', { height: 1, width, backgroundColor: COLOR.ink }));
}

/**
 * A section card leads with the number the section exists to publish. The
 * subject and the as-of line are not decoration: a probability with no date
 * next to it is the thing a screenshot turns into a false claim.
 */
export function figureCard({
  sectionLabel, sectionColor = COLOR.ink, label, value, unit, subject, caption,
  rows, spark, footerLeft, footerRight,
}) {
  // The aside never yields width: without this the left column's caption pushes
  // the ranked list off the right edge of the card, where nobody would see it.
  const asideStyle = { display: 'flex', flexDirection: 'column', width: ASIDE_WIDTH, flexShrink: 0 };
  const aside = rows?.length
    ? h('div', asideStyle,
      rule(COLOR.ink),
      ...rows.map((row, index) => rankedRow(row, index === 0)))
    : spark
      ? h('div', asideStyle,
        eyebrow(spark.label, COLOR.faint),
        h('div', { display: 'flex', marginTop: 20 }, sparkline(spark.values, { width: ASIDE_WIDTH, height: 130, color: spark.color ?? COLOR.navy })),
        h('div', { fontSize: 17, color: COLOR.faint, marginTop: 12 }, spark.caption))
      : null;

  return shell({ headerRight: badge(sectionLabel, sectionColor), footerLeft, footerRight },
    h('div', { display: 'flex', flexGrow: 1, paddingTop: 30, paddingBottom: 26, alignItems: 'center' },
      h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, flexShrink: 1, minWidth: 0, paddingRight: 56 },
        eyebrow(label),
        // The unit is set small and on the baseline: at 140px Inter's percent
        // glyph is nearly as wide as the number and stops reading as a unit.
        h('div', { display: 'flex', alignItems: 'baseline', marginTop: 12 },
          h('div', { fontSize: 142, fontWeight: 800, color: COLOR.ink, lineHeight: 1.05, letterSpacing: -5 }, value),
          unit ? h('div', { fontSize: 58, fontWeight: 700, color: COLOR.ink, marginLeft: 8, letterSpacing: -1 }, unit) : null),
        h('div', { fontSize: 36, fontWeight: 600, color: COLOR.ink, marginTop: 12, letterSpacing: -0.6 }, subject),
        caption ? clampedText(caption, { fontSize: 21, lines: 3, color: COLOR.muted, lineHeight: 1.4, marginTop: 14 }) : null),
      aside));
}

/**
 * The fallback card, used by every page without a card of its own. It replaces
 * a navy gradient whose tagline still called the site an election forecast, two
 * sections after that stopped being true.
 */
export function brandCard({ headline, standfirst, columns, footerLeft, footerRight }) {
  return shell({ footerLeft, footerRight },
    h('div', { display: 'flex', flexGrow: 1, alignItems: 'center', paddingTop: 24, paddingBottom: 28 },
      h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, flexShrink: 1, minWidth: 0, paddingRight: 56 },
        h('div', { fontSize: 62, fontWeight: 800, color: COLOR.ink, letterSpacing: -2, lineHeight: 1.08 }, headline),
        h('div', { fontSize: 26, color: COLOR.muted, marginTop: 20, lineHeight: 1.4 }, standfirst)),
      mosaic(250)),
    h('div', { display: 'flex', marginBottom: 30 },
      ...columns.map((column, index) => h('div', {
        display: 'flex', flexDirection: 'column', flexBasis: 0, flexGrow: 1,
        marginLeft: index === 0 ? 0 : 32,
      },
        rule(COLOR.ink),
        eyebrow(column.name, COLOR.ink, { marginTop: 12 }),
        h('div', { fontSize: 19, color: COLOR.muted, marginTop: 7, lineHeight: 1.35 }, column.blurb)))));
}
