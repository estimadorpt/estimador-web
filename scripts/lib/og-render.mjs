/**
 * Rendering toolkit for every social card the site ships.
 *
 * Cards used to be SVG strings concatenated by hand, which meant guessing where
 * a line would wrap: a long Portuguese headline ran off the canvas and nobody
 * saw it until it was on X. Satori lays the card out with flexbox and real font
 * metrics, so wrapping, ellipsis and vertical centring are measured rather than
 * estimated.
 *
 * Fonts come from the vendored `@fontsource/inter` files, never from the
 * network: the generator has to produce byte-identical output offline.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export const ROOT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The site's stone palette and brand accents, mirroring src/app/globals.css. */
export const COLOR = {
  ground: '#f5f3ea',
  paper: '#fcfbf5',
  ink: '#234c40',
  inkSoft: '#434d48',
  muted: '#5f7062',
  faint: '#7f9284',
  rule: '#dadccf',
  navy: '#234c40',
  teal: '#245c68',
  gold: '#c49536',
  forest: '#122f2c',
  // Surface pastels, for the mosaic on brand and explainer covers only.
  mintSoft: '#9dcec1',
  mustardSoft: '#e3c994',
  coralSoft: '#dcafa1',
  periwinkleSoft: '#bdc7e7',
};

const FONT_FILES = [
  [400, 'manrope-latin-400-normal.woff'],
  [500, 'manrope-latin-500-normal.woff'],
  [600, 'manrope-latin-600-normal.woff'],
  [700, 'manrope-latin-700-normal.woff'],
  [800, 'manrope-latin-800-normal.woff'],
];

let fontCache = null;

function loadFonts() {
  if (fontCache) return fontCache;
  const dir = path.join(ROOT_DIR, 'node_modules', '@fontsource', 'manrope', 'files');
  fontCache = FONT_FILES.map(([weight, file]) => ({
    name: 'Manrope',
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

/** A 1px stone rule — the divider the whole site is built out of. */
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

/** Formats a probability the way the site does: no false precision at the tails. */
export function formatPercent(value) {
  const pct = value * 100;
  if (pct >= 99.5) return '>99';
  if (pct > 0 && pct < 1) return '<1';
  return String(Math.round(pct));
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

/** "2026Q2" as the site writes it: 2026 T2 in Portuguese, 2026 Q2 in English. */
export function formatQuarter(quarter, locale = 'pt') {
  const match = /^(\d{4})Q([1-4])$/.exec(quarter ?? '');
  if (!match) return quarter ?? '';
  return `${match[1]} ${locale === 'pt' ? 'T' : 'Q'}${match[2]}`;
}
