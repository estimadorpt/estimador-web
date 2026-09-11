#!/usr/bin/env node
/**
 * The social kit: profile avatars, banners, covers and post templates, built
 * from the same renderer as the Open Graph cards so a timeline shows one
 * publication. Copy lives here with the OG copy for the same reason: no page
 * ever renders it.
 *
 *   node scripts/generate-social-kit.mjs
 *
 * Playful register: these are entrances, so the mosaic gets room. On paper
 * it uses the surface pastels; on forest the data pastels, which need the
 * extra chroma to read on a dark ground.
 */

import fs from 'node:fs';
import path from 'node:path';
import { h, svg, renderCard, ROOT_DIR, COLOR } from './lib/og-render.mjs';

const geometry = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src', 'lib', 'brand', 'geometry.json'), 'utf8'));
const MARK_D = [geometry.MARK_LEFT, geometry.MARK_BAND, geometry.MARK_RIGHT].join(' ');
const PASTEL = { mint: '#72c8b4', mustard: '#e5b958', coral: '#e29a83', periwinkle: '#a9b9ed' };

const COPY = {
  tagline: 'Dados para compreender Portugal.',
  descriptor: 'Previsões e análises com a incerteza à vista: economia, Liga Portugal, eleições e população.',
  url: 'estimador.pt',
};

function mark(height, color) {
  return svg('svg', { width: height * 2, height, viewBox: '0 0 48 24' }, svg('path', { d: MARK_D, fill: color }));
}

function lockup(size, dark) {
  const ink = dark ? COLOR.ground : COLOR.ink, muted = dark ? '#b7c2b9' : COLOR.faint;
  return h('div', { display: 'flex', alignItems: 'center' },
    mark(size, ink),
    h('div', { display: 'flex', marginLeft: Math.round(size * 0.42), fontSize: Math.round(size * 1.1), fontWeight: 800, color: ink, letterSpacing: -Math.round(size * 0.04) },
      h('div', {}, 'estimador'), h('div', { color: muted }, '.pt')));
}

/** Four blocks in the site's vocabulary: a share, a person, a place, a share. */
function mosaic(size, dark) {
  const half = size / 2, window = dark ? COLOR.forest : COLOR.ground;
  const c = dark ? [PASTEL.mint, PASTEL.mustard, PASTEL.coral, PASTEL.periwinkle] : [COLOR.mintSoft, COLOR.mustardSoft, COLOR.coralSoft, COLOR.periwinkleSoft];
  const block = (backgroundColor, style = {}, child = null) => h('div', { width: half, height: half, backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }, child);
  return h('div', { display: 'flex', flexWrap: 'wrap', width: size, height: size, flexShrink: 0 },
    block(c[0], { borderTopLeftRadius: size }),
    block(c[1], {}, h('div', { width: half * 0.46, height: half * 0.46, borderRadius: 999, backgroundColor: window })),
    block(c[2], {}),
    block(c[3], { borderBottomRightRadius: size }));
}

function ground(width, height, dark, children, style = {}) {
  return h('div', { width, height, display: 'flex', backgroundColor: dark ? COLOR.forest : COLOR.ground, fontFamily: 'Manrope', ...style }, ...children);
}

const text = (dark) => ({ ink: dark ? COLOR.ground : COLOR.ink, muted: dark ? '#b7c2b9' : COLOR.muted });

/** X and Bluesky header. The avatar overlaps the bottom-left, so the copy sits high and starts past it. */
function banner(width, height, dark) {
  const t = text(dark);
  return ground(width, height, dark, [
    h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, padding: `0 0 ${Math.round(height * 0.14)}px ${Math.round(width * 0.06)}px` },
      lockup(Math.round(height * 0.11), dark),
      h('div', { fontSize: Math.round(height * 0.105), fontWeight: 800, color: t.ink, letterSpacing: -2, lineHeight: 1.05, marginTop: Math.round(height * 0.07), maxWidth: width * 0.56 }, COPY.tagline),
      h('div', { fontSize: Math.round(height * 0.05), color: t.muted, marginTop: Math.round(height * 0.04), maxWidth: width * 0.52, lineHeight: 1.35 }, COPY.descriptor)),
    h('div', { display: 'flex', alignItems: 'center', paddingRight: Math.round(width * 0.06) }, mosaic(Math.round(height * 0.68), dark)),
  ]);
}

/** LinkedIn cover: the profile photo covers the bottom-left corner, so nothing lives there. */
function cover(width, height, dark) {
  const t = text(dark);
  return ground(width, height, dark, [
    h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, padding: `0 0 ${Math.round(height * 0.12)}px ${Math.round(width * 0.27)}px` },
      lockup(Math.round(height * 0.12), dark),
      h('div', { fontSize: Math.round(height * 0.11), fontWeight: 800, color: t.ink, letterSpacing: -2, lineHeight: 1.05, marginTop: Math.round(height * 0.07) }, COPY.tagline),
      h('div', { fontSize: Math.round(height * 0.052), color: t.muted, marginTop: Math.round(height * 0.035), maxWidth: width * 0.42, lineHeight: 1.35 }, COPY.descriptor)),
    h('div', { display: 'flex', alignItems: 'center', paddingRight: Math.round(width * 0.05) }, mosaic(Math.round(height * 0.7), dark)),
  ]);
}

/** Square post: the announcement template. Headline copy is the tagline unless a headline is passed. */
function post(size, dark, headline = COPY.tagline, standfirst = COPY.descriptor) {
  const t = text(dark), pad = Math.round(size * 0.075);
  return ground(size, size, dark, [
    h('div', { display: 'flex', flexDirection: 'column', width: '100%', padding: pad },
      h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, lockup(Math.round(size * 0.04), dark), h('div', { fontSize: Math.round(size * 0.024), color: t.muted }, COPY.url)),
      h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingTop: Math.round(size * 0.05) },
        h('div', { fontSize: Math.round(size * 0.085), fontWeight: 800, color: t.ink, letterSpacing: -3, lineHeight: 1.05, maxWidth: size * 0.8 }, headline),
        h('div', { fontSize: Math.round(size * 0.032), color: t.muted, marginTop: Math.round(size * 0.035), maxWidth: size * 0.72, lineHeight: 1.4 }, standfirst)),
      h('div', { display: 'flex', justifyContent: 'flex-end' }, mosaic(Math.round(size * 0.3), dark))),
  ], { flexDirection: 'column' });
}

/** Story: mosaic on top, the message in the middle, the address at the bottom. */
function story(width, height, dark) {
  const t = text(dark), pad = Math.round(width * 0.09);
  return ground(width, height, dark, [
    h('div', { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: `${Math.round(height * 0.12)}px ${pad}px ${Math.round(height * 0.1)}px` },
      h('div', { display: 'flex', justifyContent: 'center' }, mosaic(Math.round(width * 0.56), dark)),
      h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' },
        lockup(Math.round(width * 0.05), dark),
        h('div', { fontSize: Math.round(width * 0.085), fontWeight: 800, color: t.ink, letterSpacing: -3, lineHeight: 1.05, marginTop: Math.round(width * 0.06) }, COPY.tagline),
        h('div', { fontSize: Math.round(width * 0.036), color: t.muted, marginTop: Math.round(width * 0.04), lineHeight: 1.4 }, COPY.descriptor)),
      h('div', { fontSize: Math.round(width * 0.03), fontWeight: 700, color: t.ink }, COPY.url)),
  ]);
}

/** Avatar: the compact mark on a tile, the same drawing as the app icon. */
function avatar(size, dark) {
  const tile = dark ? COLOR.forest : COLOR.ground, ink = dark ? COLOR.ground : COLOR.ink;
  return h('div', { width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: tile },
    svg('svg', { width: size * 0.78, height: size * 0.78, viewBox: '0 0 32 32' }, svg('path', { d: geometry.MARK_SMALL, fill: ink })));
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
