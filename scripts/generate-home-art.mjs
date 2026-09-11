// Responsive derivatives of the homepage illustrations, cut to the shape each
// placement needs. Masters live in docs/design/homepage-claude-handoff/assets
// (1448 × 1086, cream field). Crops trim the field, never the subject: the
// lead keeps the whole cutaway house, the wide rail keeps the whole stadium,
// and the square supports keep the scene's centre. Browsers pick a width
// through <picture> in src/components/home/HomeArt.tsx.
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const src = new URL('../docs/design/homepage-claude-handoff/assets/', import.meta.url);
const out = new URL('../public/images/home/', import.meta.url);
mkdirSync(out, { recursive: true });
const path = u => fileURLToPath(u);

/** Crops as [left, top, width, height] on the 1448 × 1086 masters. */
export const SHAPES = {
  lead:   { region: [300, 0, 850, 1086], widths: [600, 1000] },    // 0.78: the house, balconies included
  wide:   { region: [0, 110, 1448, 850], widths: [480, 960] },    // 1.70: the whole stadium
  square: { region: [181, 0, 1086, 1086], widths: [400, 800] },   // 1.00: the scene's centre
};
const plan = { population: ['lead', 'square'], football: ['wide', 'square'], economy: ['square'], elections: ['lead', 'square'] };

for (const [name, shapes] of Object.entries(plan)) {
  for (const shape of shapes) {
    const { region: [left, top, width, height], widths } = SHAPES[shape];
    const cut = sharp(path(new URL(`${name}.png`, src))).extract({ left, top, width, height });
    for (const w of widths) {
      const base = cut.clone().resize({ width: w, withoutEnlargement: true });
      await base.clone().webp({ quality: 82, effort: 6 }).toFile(path(new URL(`${name}-${shape}-${w}.webp`, out)));
      await base.clone().avif({ quality: 58, effort: 6 }).toFile(path(new URL(`${name}-${shape}-${w}.avif`, out)));
    }
    const kb = f => Math.round(statSync(path(new URL(f, out))).size / 1024);
    console.log(`${name.padEnd(11)} ${shape.padEnd(7)} ${width}×${height}  webp ${widths.map(w => kb(`${name}-${shape}-${w}.webp`)).join('/')} KB  avif ${widths.map(w => kb(`${name}-${shape}-${w}.avif`)).join('/')} KB`);
  }
}
