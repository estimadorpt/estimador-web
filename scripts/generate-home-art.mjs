// Responsive derivatives of the homepage illustrations.
// Masters live in docs/design/homepage-claude-handoff/assets (1448 × 1086, cream
// field). The site ships WebP and AVIF at two widths; browsers pick by width
// through <picture> in src/components/home/HomeArt.tsx.
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const src = new URL('../docs/design/homepage-claude-handoff/assets/', import.meta.url);
const out = new URL('../public/images/home/', import.meta.url);
mkdirSync(out, { recursive: true });
const sizes = [480, 960];
for (const name of ['population', 'football', 'economy', 'elections']) {
  const master = sharp(fileURLToPath(new URL(`${name}.png`, src)));
  const { data } = await master.clone().raw().extract({ left: 4, top: 4, width: 1, height: 1 }).toBuffer({ resolveWithObject: true });
  const corner = `#${[...data.slice(0, 3)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  for (const width of sizes) {
    const base = master.clone().resize({ width, withoutEnlargement: true });
    await base.clone().webp({ quality: 82, effort: 6 }).toFile(fileURLToPath(new URL(`${name}-${width}.webp`, out)));
    await base.clone().avif({ quality: 58, effort: 6 }).toFile(fileURLToPath(new URL(`${name}-${width}.avif`, out)));
  }
  const kb = f => Math.round(statSync(new URL(f, out)).size / 1024);
  console.log(`${name.padEnd(11)} corner ${corner}  webp ${kb(`${name}-480.webp`)}/${kb(`${name}-960.webp`)} KB  avif ${kb(`${name}-480.avif`)}/${kb(`${name}-960.avif`)} KB`);
}
