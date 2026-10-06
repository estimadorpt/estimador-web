// Responsive derivatives of the homepage's population house, cut to the shape
// each placement needs. The master lives in docs/design/homepage-claude-handoff/assets
// (1448 × 1086, cream field; git-ignored, described in manifest.json there): the
// 13 September refinement, docs/design/original-illustration-refinement/03-people-v2.png,
// copied as population.png. Crops trim the field, never the subject: the lead
// keeps the whole cutaway house, the square keeps the scene's centre. Browsers
// pick a width through <picture> in src/components/home/HomeArt.tsx.
//
// The other homepage panels use the section scenes (SectionIllustration,
// public/images/sections), so the 12 September football, economy and elections
// masters are no longer cut.
import sharp from 'sharp';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const src = new URL('../docs/design/homepage-claude-handoff/assets/', import.meta.url);
const out = new URL('../public/images/home/', import.meta.url);
mkdirSync(out, { recursive: true });
const path = u => fileURLToPath(u);

/** Crops as [left, top, width, height] on the 1448 × 1086 master. */
export const SHAPES = {
  lead:   { region: [300, 0, 850, 1086], widths: [600, 1000] },    // 0.78: the house, balconies included
  square: { region: [181, 0, 1086, 1086], widths: [400, 800] },   // 1.00: the scene's centre
};
const plan = { population: ['lead', 'square'] };

// The refined master's ground is #fefdf9 (measured: the mean above the roof and
// beside the house), a shade lighter than the panel's cream (#fcfbf5), which
// left a faint pale tile around the contained house. Scaling each channel puts
// the ground on cream and moves every other colour by under 2%; HomeArt's
// ART_FIELD is that cream.
const GROUND = [254, 253, 249], CREAM = [252, 251, 245];
const TONE = GROUND.map((value, i) => CREAM[i] / value);

// The masters are git-ignored, so a checkout can still hold the 12 September
// house under the same name. Cut only the file manifest.json describes.
const manifest = JSON.parse(readFileSync(path(new URL('manifest.json', src)), 'utf8'));
for (const name of Object.keys(plan)) {
  const entry = manifest.find(item => item.section === name);
  const master = path(new URL(`${name}.png`, src));
  const bytes = statSync(master).size;
  if (!entry || bytes !== entry.bytes) {
    console.error(entry
      ? `${master} is ${bytes} bytes, not the ${entry.bytes} of the master manifest.json describes. Source: ${entry.source}`
      : `manifest.json has no entry for ${name}`);
    process.exit(1);
  }
}

for (const [name, shapes] of Object.entries(plan)) {
  for (const shape of shapes) {
    const { region: [left, top, width, height], widths } = SHAPES[shape];
    const cut = sharp(path(new URL(`${name}.png`, src))).extract({ left, top, width, height }).linear(TONE, [0, 0, 0]);
    for (const w of widths) {
      const base = cut.clone().resize({ width: w, withoutEnlargement: true });
      await base.clone().webp({ quality: 82, effort: 6 }).toFile(path(new URL(`${name}-${shape}-${w}.webp`, out)));
      await base.clone().avif({ quality: 58, effort: 6 }).toFile(path(new URL(`${name}-${shape}-${w}.avif`, out)));
    }
    const kb = f => Math.round(statSync(path(new URL(f, out))).size / 1024);
    console.log(`${name.padEnd(11)} ${shape.padEnd(7)} ${width}×${height}  webp ${widths.map(w => kb(`${name}-${shape}-${w}.webp`)).join('/')} KB  avif ${widths.map(w => kb(`${name}-${shape}-${w}.avif`)).join('/')} KB`);
  }
}
