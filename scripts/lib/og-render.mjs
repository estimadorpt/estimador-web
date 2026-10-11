/**
 * Rendering toolkit for every social card the site ships.
 *
 * Cards used to be SVG strings concatenated by hand, which meant guessing where
 * a line would wrap: a long Portuguese headline ran off the canvas and nobody
 * saw it until it was on X. Satori lays the card out with flexbox and real font
 * metrics, so wrapping, ellipsis and vertical centring are measured rather than
 * estimated.
 *
 * The face is IBM Plex Sans, the site's own, from the vendored
 * `@fontsource/ibm-plex-sans` files (static weights: satori reads neither
 * woff2 nor variable fonts), never from the network: the generator has to
 * produce byte-identical output offline.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export const ROOT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * The instrument's palette, mirroring the tokens in src/app/globals.css and
 * BRAND in src/lib/brand: ink on white, graphite for secondary words, the
 * scale grey for ticks only, two rules, and the signal yellow, which means the
 * model's margin and nothing else.
 */
export const COLOR = {
  ground: '#ffffff',
  paper: '#ffffff',
  ink: '#111111',
  muted: '#5e5e5e',
  scale: '#8a8a8a',
  rule: '#d9d9d9',
  grid: '#ececec',
  field: '#f4f4f4',
  signal: '#ffd400',
  signalLow: '#fff1b3',
  positive: '#15803d',
  negative: '#b91c1c',
  // On an ink ground (the dark social kit).
  inkGround: '#111111',
  onInk: '#ffffff',
  onInkMuted: '#a8a8a8',
  onInkRule: '#3a3a3a',
};

export const FONT_FAMILY = 'IBM Plex Sans';

const FONT_FILES = [
  [400, 'ibm-plex-sans-latin-400-normal.woff'],
  [500, 'ibm-plex-sans-latin-500-normal.woff'],
  [600, 'ibm-plex-sans-latin-600-normal.woff'],
  [700, 'ibm-plex-sans-latin-700-normal.woff'],
];

let fontCache = null;

function loadFonts() {
  if (fontCache) return fontCache;
  const dir = path.join(ROOT_DIR, 'node_modules', '@fontsource', 'ibm-plex-sans', 'files');
  fontCache = FONT_FILES.map(([weight, file]) => ({
    name: FONT_FAMILY,
    weight,
    style: 'normal',
    data: fs.readFileSync(path.join(dir, file)),
  }));
  return fontCache;
}

/**
 * Element helper. Satori takes React-shaped objects, and the generator has no
 * JSX step, so this is the whole component model: `h(tag, style, ...children)`.
 */
export function h(type, style, ...children) {
  const kids = children.flat(Infinity).filter(child => child !== null && child !== undefined && child !== false);
  // An empty array reads to satori as several children rather than none, and it
  // then refuses the node for not declaring a display mode.
  if (kids.length === 0) return { type, props: { style } };
  return { type, props: { style, children: kids.length === 1 ? kids[0] : kids } };
}

/**
 * SVG nodes take attributes, not CSS: satori reads `viewBox`, `points` and the
 * rest straight off props, so they cannot go through `h`'s style slot.
 */
export function svg(type, attributes, ...children) {
  const kids = children.flat(Infinity).filter(child => child !== null && child !== undefined && child !== false);
  if (kids.length === 0) return { type, props: attributes };
  return { type, props: { ...attributes, children: kids.length === 1 ? kids[0] : kids } };
}

/** A 1px rule, the divider the whole site is built out of. */
export function rule(color = COLOR.rule, style = {}) {
  return h('div', { height: 1, backgroundColor: color, ...style });
}

/**
 * Renders at 2x so the card stays sharp where timelines show it at full width
 * on a retina display, then hands back a PNG.
 */
export async function renderCard(node, { width = 1200, height = 630, scale = 2 } = {}) {
  const svg = await satori(node, { width, height, fonts: loadFonts() });
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * scale },
    font: { loadSystemFonts: false },
  }).render().asPng();
  return png;
}

/**
 * Content-hashed filenames are what make the immutable cache header in
 * staticwebapp.config.json safe, and hashing the bytes (rather than stamping a
 * timestamp) means an unchanged card keeps its URL — social platforms cache
 * scrapes hard, so a stable URL for stable content is the point.
 */
export function contentHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 8);
}

/**
 * A share of simulations the way the site prints it (formatPercent in
 * src/lib/football-format.ts): whole numbers from 10%, one decimal below,
 * "<0,1" and ">99" at the ends. Without the % sign, which cards set smaller.
 */
export function formatPercent(value, locale = 'pt') {
  if (!Number.isFinite(value)) return '—';
  if (value <= 0) return '0';
  if (value >= 1) return '100';
  if (value < 0.0005) return locale === 'en' ? '<0.1' : '<0,1';
  if (value >= 0.995) return '>99';
  const pct = value * 100;
  if (pct < 9.95) return pct.toFixed(1).replace('.', locale === 'en' ? '.' : ',');
  return String(Math.round(pct));
}

/** Counts grouped from four digits, with a no-break space in Portuguese ("3 092"), like formatCount. */
export function formatCount(value, locale = 'pt') {
  const text = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'pt-PT', { useGrouping: 'always' }).format(value);
  return locale === 'en' ? text : text.replace(/[\s\u202f]/g, '\u00a0');
}

const MONTHS = {
  pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** Long-form date, matching what the article page prints under the headline. */
export function formatDate(isoDate, locale = 'pt') {
  const [year, month, day] = isoDate.split('-').map(Number);
  const name = (MONTHS[locale] ?? MONTHS.pt)[month - 1];
  return locale === 'pt' ? `${day} de ${name} de ${year}` : `${day} ${name} ${year}`;
}

const SHORT_MONTHS = {
  pt: ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
};

/**
 * The calendar day of a timestamp in Lisbon ("2026-09-25T23:30:00Z" is the
 * 26th there in summer), or a plain YYYY-MM-DD as given.
 */
export function lisbonDay(isoDateOrTimestamp) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDateOrTimestamp)) return isoDateOrTimestamp;
  const date = new Date(isoDateOrTimestamp);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Short date for a card footer: "25 set. 2026", "25 Sept 2026". */
export function formatShortDate(isoDateOrTimestamp, locale = 'pt') {
  const day = lisbonDay(isoDateOrTimestamp);
  if (!day) return null;
  const [year, month, date] = day.split('-').map(Number);
  return `${date} ${(SHORT_MONTHS[locale] ?? SHORT_MONTHS.pt)[month - 1]} ${year}`;
}

/** "2026Q2" as the site writes it: 2026 T2 in Portuguese, 2026 Q2 in English. */
export function formatQuarter(quarter, locale = 'pt') {
  const match = /^(\d{4})Q([1-4])$/.exec(quarter ?? '');
  if (!match) return quarter ?? '';
  return `${match[1]} ${locale === 'pt' ? 'T' : 'Q'}${match[2]}`;
}

/**
 * A reading's date and time in Lisbon, as the site prints it beside an
 * instrument (formatReadingTime in src/lib/football-format.ts): "11 out.
 * 2026, 00:11", "11 Oct 2026, 00:11".
 */
export function formatReadingTime(iso, locale = 'pt') {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Lisbon', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(part => [part.type, part.value]));
  const month = Number(parts.month);
  const name = locale === 'en'
    ? new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'Europe/Lisbon' }).format(date)
    : SHORT_MONTHS.pt[month - 1];
  return `${Number(parts.day)} ${name} ${parts.year}, ${parts.hour}:${parts.minute}`;
}
