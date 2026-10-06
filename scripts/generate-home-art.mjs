// Responsive derivatives of the homepage's population house, cut to the shape
// each placement needs. The master lives in docs/design/homepage-claude-handoff/assets
// (1448 × 1086, cream field; git-ignored, described in manifest.json there): the
// 13 September refinement, docs/design/original-illustration-refinement/03-people-v2.png,
// copied as population.png. Browsers pick a width through <picture> in
// src/components/home/HomeArt.tsx, whose SHAPES mirror the sizes below.
//
// The refined master is a street, not a lone house: a tree, garden walls and a
// neighbour's corner on the left, a cypress, a wall and another neighbour on the
// right, all touching the house. No straight crop line misses them, and on the
// panel's cream a cut through foliage reads as a line floating in the card. So:
// - the lead (a portrait box) keeps the house alone: below the eaves, everything
//   outside its two walls is veiled to cream, along the walls' own painted edges;
// - the square keeps the scene whole (tree, house, cypress), padded to a square
//   with cream, and only the garden walls running off its sides fade out.
//
// The other homepage panels use the section scenes (SectionIllustration,
// public/images/sections), so the 12 September football, economy and elections
// masters are no longer cut.
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const src = new URL('../docs/design/homepage-claude-handoff/assets/', import.meta.url);
const out = new URL('../public/images/home/', import.meta.url);
mkdirSync(out, { recursive: true });
const path = u => fileURLToPath(u);

const smooth = t => t * t * (3 - 2 * t);
/** 0 below `from`, 1 above `to`, smooth in between. */
const ramp = (value, from, to) => smooth(Math.min(1, Math.max(0, (value - from) / (to - from))));

// Measured on the master: the tree's crown ends at x 327 and the house's left
// wall starts at 329; the right wall ends at 1116 and the cypress starts at 1117.
// Above y 560 nothing stands beside the house (the tree tops out at 609, the
// cypress at 698), so the eaves and window plants are never veiled. The tree
// spans x 114–330 and the cypress 1117–1205; left of the tree a neighbour's roof
// reaches x 111, right of the cypress a hedge starts at 1218, and the garden
// walls run under all of them.
const WALLS = [329, 1116];

/**
 * Crops as [left, top, width, height] on the 1448 × 1086 master; `square` pads
 * the cut to a square with cream; `veil(x, y)` (master pixels) is how much
 * cream covers that pixel, 0 to 1.
 */
export const SHAPES = {
  // 300 for the 90px phone thumbnail at up to 3x (SEO3-14); 600 and 880 for the desktop column.
  lead: {   // 0.81: the house alone, roof overhang included
    region: [280, 0, 880, 1086], widths: [300, 600, 880],
    veil: (x, y) => (x < WALLS[0] || x > WALLS[1] ? ramp(y, 560, 600) : 0),
  },
  square: { // 1.00: tree, house and cypress, the scene's centre
    region: [100, 0, 1160, 1086], square: true, widths: [400, 800],
    veil: x => Math.max(1 - ramp(x, 100, 128), ramp(x, 1212, 1259)),
  },
};
const plan = { population: ['lead', 'square'] };

// The refined master's ground is #fefdf9 (measured: the mean above the roof and
// beside the house), a shade lighter than the panel's cream (#fcfbf5), which
// left a faint pale tile around the contained house. Scaling each channel puts
// the ground on cream and moves every other colour by under 2%; HomeArt's
// ART_FIELD is that cream, and so is the veil.
const GROUND = [254, 253, 249], CREAM = [252, 251, 245];
const TONE = GROUND.map((value, i) => CREAM[i] / value);

// The masters are git-ignored, so a checkout can hold the 12 September house
// under the same name, or none at all. Cut only the file manifest.json describes.
const manifest = JSON.parse(readFileSync(path(new URL('manifest.json', src)), 'utf8'));
for (const name of Object.keys(plan)) {
  const entry = manifest.find(item => item.section === name);
  const master = path(new URL(`${name}.png`, src));
  const bytes = existsSync(master) ? statSync(master).size : 0;
  if (!entry || bytes !== entry.bytes) {
    console.error(entry
      ? `${master} ${bytes ? `is ${bytes} bytes, not the ${entry.bytes} of the master manifest.json describes` : 'is missing'}. Copy the master in, from the repository root:\n  cp ${entry.from} docs/design/homepage-claude-handoff/assets/${entry.file}`
      : `manifest.json has no entry for ${name}`);
    process.exit(1);
  }
}

/** The crop, toned onto cream, veiled and (for a square) padded: a lossless buffer to resize from. */
async function cutOut(master, { region: [left, top, width, height], veil, square }) {
  const toned = await sharp(master).extract({ left, top, width, height }).linear(TONE, [0, 0, 0]).png().toBuffer();
  const cover = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      cover.set(CREAM, i);
      cover[i + 3] = Math.round(255 * veil(left + x, top + y));
    }
  }
  const veiled = await sharp(toned).composite([{ input: cover, raw: { width, height, channels: 4 } }]).png().toBuffer();
  if (!square || width === height) return veiled;
  const side = Math.max(width, height), padY = side - height, padX = side - width;
  const [r, g, b] = CREAM;
  return sharp(veiled)
    .extend({ top: padY >> 1, bottom: padY - (padY >> 1), left: padX >> 1, right: padX - (padX >> 1), background: { r, g, b } })
    .png().toBuffer();
}

for (const [name, shapes] of Object.entries(plan)) {
  for (const shape of shapes) {
    const cut = await cutOut(path(new URL(`${name}.png`, src)), SHAPES[shape]);
    const { width, height } = await sharp(cut).metadata();
    const { widths } = SHAPES[shape];
    for (const w of widths) {
      const base = sharp(cut).resize({ width: w, withoutEnlargement: true });
      await base.clone().webp({ quality: 82, effort: 6 }).toFile(path(new URL(`${name}-${shape}-${w}.webp`, out)));
      await base.clone().avif({ quality: 58, effort: 6 }).toFile(path(new URL(`${name}-${shape}-${w}.avif`, out)));
    }
    const kb = f => Math.round(statSync(path(new URL(f, out))).size / 1024);
    console.log(`${name.padEnd(11)} ${shape.padEnd(7)} ${width}×${height}  webp ${widths.map(w => kb(`${name}-${shape}-${w}.webp`)).join('/')} KB  avif ${widths.map(w => kb(`${name}-${shape}-${w}.avif`)).join('/')} KB`);
  }
}
