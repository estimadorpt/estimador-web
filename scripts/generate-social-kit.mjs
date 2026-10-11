#!/usr/bin/env node
/**
 * The social kit: profile avatars, banners, covers and post templates, built
 * from the same renderer and the same pieces as the Open Graph cards
 * (scripts/lib/og-cards.mjs), so a timeline shows one publication. Copy lives
 * here with the OG copy for the same reason: no page ever renders it.
 *
 *   node scripts/generate-social-kit.mjs
 *
 * The instrument's grammar: ink on white (or white on ink for the dark
 * versions), the logo, the line, the descriptor, and the reading rule, the
 * three marks the whole site is read by. No mosaic, no one's name.
 */

import fs from 'node:fs';
import path from 'node:path';
import { h, svg, renderCard, ROOT_DIR, FONT_FAMILY } from './lib/og-render.mjs';
import { logo, readingKey, tones, MARK_SMALL_D } from './lib/og-cards.mjs';

// The line and the descriptor are written once, in src/lib/brand/descriptor.json,
// and read here the same way the app imports them (descriptor.test.ts holds it).
const BRAND_COPY = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src', 'lib', 'brand', 'descriptor.json'), 'utf8'));
const COPY = {
  tagline: BRAND_COPY.line.pt,
  descriptor: BRAND_COPY.descriptor.pt,
  url: 'estimador.pt',
};

function ground(width, height, dark, children, style = {}) {
  const t = tones(dark);
  return h('div', { width, height, display: 'flex', backgroundColor: t.ground, color: t.ink, fontFamily: FONT_FAMILY, ...style }, ...children);
}

const line = (size, dark, style = {}) => h('div', { fontSize: size, fontWeight: 700, color: tones(dark).ink, letterSpacing: -size * 0.025, lineHeight: 1.04, ...style }, COPY.tagline);
const descriptor = (size, dark, style = {}) => h('div', { fontSize: size, color: tones(dark).muted, lineHeight: 1.38, ...style }, COPY.descriptor);
const key = (size, dark, direction = 'column') => readingKey(['now', 'band', 'tick'], 'pt', { fontSize: size, dark, direction, gap: Math.round(size * (direction === 'column' ? 0.9 : 1.4)) });

/** X and Bluesky header. The avatar overlaps the bottom-left, so the copy sits high and starts past it. */
function banner(width, height, dark) {
  return ground(width, height, dark, [
    h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, padding: `0 0 ${Math.round(height * 0.14)}px ${Math.round(width * 0.06)}px` },
      logo(Math.round(height * 0.085), { dark }),
      line(Math.round(height * 0.12), dark, { marginTop: Math.round(height * 0.07), maxWidth: width * 0.56 }),
      descriptor(Math.round(height * 0.05), dark, { marginTop: Math.round(height * 0.04), maxWidth: width * 0.5 })),
    h('div', { display: 'flex', alignItems: 'center', paddingRight: Math.round(width * 0.06), paddingBottom: Math.round(height * 0.08) }, key(Math.round(height * 0.05), dark)),
  ]);
}

/**
 * LinkedIn cover: the profile photo covers the bottom-left corner, so nothing
 * lives there; too shallow for the reading rule beside the line, so the cover
 * carries the line and the descriptor only.
 */
function cover(width, height, dark) {
  return ground(width, height, dark, [
    h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, padding: `0 ${Math.round(width * 0.06)}px ${Math.round(height * 0.1)}px ${Math.round(width * 0.27)}px` },
      logo(Math.round(height * 0.09), { dark }),
      line(Math.round(height * 0.13), dark, { marginTop: Math.round(height * 0.07) }),
      descriptor(Math.round(height * 0.05), dark, { marginTop: Math.round(height * 0.035), maxWidth: width * 0.5 })),
  ]);
}

/** Square post: the announcement template. Headline copy is the line unless a headline is passed. */
function post(size, dark, headline = COPY.tagline, standfirst = COPY.descriptor) {
  const t = tones(dark), pad = Math.round(size * 0.075);
  return ground(size, size, dark, [
    h('div', { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: pad },
      h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, logo(Math.round(size * 0.032), { dark }), h('div', { fontSize: Math.round(size * 0.022), color: t.muted }, COPY.url)),
      h('div', { height: 2, backgroundColor: t.ink, marginTop: Math.round(size * 0.025) }),
      h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingBottom: Math.round(size * 0.04) },
        h('div', { fontSize: Math.round(size * 0.08), fontWeight: 700, color: t.ink, letterSpacing: -Math.round(size * 0.002), lineHeight: 1.04, maxWidth: size * 0.82 }, headline),
        h('div', { fontSize: Math.round(size * 0.03), color: t.muted, marginTop: Math.round(size * 0.035), maxWidth: size * 0.74, lineHeight: 1.4 }, standfirst)),
      h('div', { height: 1, backgroundColor: t.ink, marginBottom: Math.round(size * 0.025) }),
      key(Math.round(size * 0.022), dark)),
  ], { flexDirection: 'column' });
}

/** Story: the message in the upper middle, the reading rule below it, the address at the bottom. */
function story(width, height, dark) {
  const t = tones(dark), pad = Math.round(width * 0.09);
  return ground(width, height, dark, [
    h('div', { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: `${Math.round(height * 0.1)}px ${pad}px ${Math.round(height * 0.08)}px` },
      logo(Math.round(width * 0.055), { dark }),
      h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' },
        line(Math.round(width * 0.105), dark),
        descriptor(Math.round(width * 0.038), dark, { marginTop: Math.round(width * 0.045) }),
        h('div', { height: 2, backgroundColor: t.ink, marginTop: Math.round(width * 0.09), marginBottom: Math.round(width * 0.05) }),
        key(Math.round(width * 0.036), dark)),
      h('div', { fontSize: Math.round(width * 0.034), fontWeight: 700, color: t.ink }, COPY.url)),
  ]);
}

/** Avatar: the compact mark on a square tile, the same drawing as the app icon. */
function avatar(size, dark) {
  const t = tones(dark);
  return h('div', { width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.ground },
    svg('svg', { width: size * 0.78, height: size * 0.78, viewBox: '0 0 32 32' }, svg('path', { d: MARK_SMALL_D, fill: t.ink })));
}

const OUT = [
  ['public/images/brand/banner-1500x500.png', () => banner(1500, 500, false), 1500, 500],
  ['public/branding/banner-1500x500-dark.png', () => banner(1500, 500, true), 1500, 500],
  ['public/branding/linkedin-cover-dark.png', () => cover(1584, 396, true), 1584, 396],
  ['public/branding/linkedin-cover-light.png', () => cover(1584, 396, false), 1584, 396],
  ['public/branding/linkedin-post-light.png', () => post(1200, false), 1200, 1200],
  ['public/branding/linkedin-post-dark.png', () => post(1200, true), 1200, 1200],
  ['public/branding/post-1600x900-light.png', () => h('div', { width: 1600, height: 900, display: 'flex' }, banner(1600, 900, false)), 1600, 900],
  ['public/branding/story-1080x1920-light.png', () => story(1080, 1920, false), 1080, 1920],
  ['public/branding/story-1080x1920-dark.png', () => story(1080, 1920, true), 1080, 1920],
  ['public/branding/avatar-1024-forest.png', () => avatar(1024, true), 1024, 1024],
  ['public/branding/avatar-1024-paper.png', () => avatar(1024, false), 1024, 1024],
  ['public/images/brand/profile-400.png', () => avatar(400, true), 400, 400],
];

for (const [file, node, width, height] of OUT) {
  const png = await renderCard(node(), { width, height, scale: 1 });
  fs.mkdirSync(path.dirname(path.join(ROOT_DIR, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT_DIR, file), png);
  console.log(`${file} · ${width}×${height} · ${Math.round(png.length / 1024)} kB`);
}
