#!/usr/bin/env node
/** Regenerate the current identity, including compatibility filenames. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const write = (name, data) => writeFileSync(new URL(name, root), data);
const geometry = JSON.parse(read('src/lib/brand/geometry.json'));
const full = [geometry.MARK_LEFT, geometry.MARK_BAND, geometry.MARK_RIGHT].join(' ');
const ink = '#234c40', paper = '#f5f3ea', forest = '#122f2c';
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const mark = (small, color) => `<path d="${small ? geometry.MARK_SMALL : full}" fill="${color}"/>`;
const icon = (color, ground) => svg(32, 32, `<rect width="32" height="32" rx="7" fill="${ground}"/>${mark(true, color)}`);
const png = async (name, source, width) => sharp(Buffer.from(source)).resize({ width }).png().toFile(fileURLToPath(new URL(name, root)));
for (const dir of ['public/brand', 'public/branding', 'public/images/brand']) mkdirSync(new URL(dir, root), { recursive: true });

// Preserve the approved outlined Manrope wordmark; only the mark geometry changes.
const logos = {};
for (const [suffix, color] of [['', ink], ['-paper', paper]]) {
  const name = `public/brand/estimador-logo${suffix}.svg`;
  logos[suffix] = read(name).replace(/<path d="[^"]+" fill="[^"]+"\s*\/>/, mark(false, color));
  write(name, logos[suffix]);
  await png(name.replace('.svg', '@4x.png'), logos[suffix], 880);
  write(`public/brand/estimador-mark${suffix}.svg`, svg(48, 24, mark(false, color)));
}
const compact = svg(32, 32, mark(true, ink));
const app = icon(paper, forest), favicon = icon(ink, paper);
write('public/brand/estimador-mark-small.svg', compact);
write('public/brand/estimador-app-icon.svg', app);
await png('public/brand/estimador-mark@4x.png', svg(48, 24, mark(false, ink)), 192);
await png('public/brand/estimador-app-icon-512.png', app, 512);
for (const name of ['public/favicon.svg', 'src/app/icon.svg']) write(name, favicon);
write('public/logo.svg', svg(48, 24, mark(false, ink)));
write('public/logo-light.svg', svg(48, 24, mark(false, paper)));
for (const [name, size, source] of [
  ['public/favicon-16x16.png',16,favicon], ['public/favicon-32x32.png',32,favicon],
  ['public/favicon.png',32,favicon], ['src/app/icon.png',512,favicon],
  ['public/apple-touch-icon.png',180,app], ['public/icon-192.png',192,app],
  ['public/icon-512.png',512,app], ['public/logo.png',512,app],
]) await png(name,source,size);
// ICO directory with actual PNG payloads, rather than a renamed PNG.
const frames = await Promise.all([16,32,48].map(size => sharp(Buffer.from(favicon)).resize(size,size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(1,2); header.writeUInt16LE(frames.length,4);
let offset = header.length;
frames.forEach((frame,i) => {
  const p = 6 + i * 16; header[p] = header[p+1] = [16,32,48][i];
  header.writeUInt16LE(1,p+4); header.writeUInt16LE(32,p+6);
  header.writeUInt32LE(frame.length,p+8); header.writeUInt32LE(offset,p+12); offset += frame.length;
});
write('public/favicon.ico',Buffer.concat([header,...frames]));
const inner = source => source.trim().replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
const lockup = (w,h,dark=false) => {
  const width = w * 0.72, scale = width/220;
  return svg(w,h,`<rect width="${w}" height="${h}" fill="${dark ? forest : paper}"/><g transform="translate(${(w-width)/2} ${(h-24*scale)/2}) scale(${scale})">${inner(logos[dark ? '-paper' : ''])}</g>`);
};
const sources = {
  'logo-icon-large': app,
  'logo-stacked': lockup(400,400),
  'logo-stacked-dark': lockup(400,400,true),
  'logo-horizontal': logos[''],
};
for (const [name,source] of Object.entries(sources)) write(`public/branding/${name}.svg`,source);
for (const [name,sizes] of Object.entries({
  'logo-icon-large':[256,512,1024,2048], 'logo-stacked':[400,800,1200],
  'logo-stacked-dark':[400,800,1200], 'logo-horizontal':[300,600,1200],
})) for (const size of sizes) await png(`public/branding/${name}-${size}w.png`,sources[name],size);
console.log('Updated website logos, downloads and app icons. Social assets come from generate-social-kit.mjs.');
