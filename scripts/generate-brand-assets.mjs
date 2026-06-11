#!/usr/bin/env node
/**
 * Generate brand assets for social media profiles.
 * Uses SVG → Sharp PNG conversion (same pattern as generate-og-images.mjs).
 *
 * Generates:
 *   - Profile picture: 400x400 PNG (works in circular crop)
 *   - Banner: 1500x500 PNG (Twitter/X safe zones respected)
 *
 * Usage:
 *   node scripts/generate-brand-assets.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'images', 'brand');

function generateProfilePictureSvg() {
  return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#18181b"/>
    </radialGradient>
    <radialGradient id="glow" cx="65%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#D4A000" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#D4A000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="400" height="400" fill="url(#bg)"/>
  <rect width="400" height="400" fill="url(#glow)"/>

  <!-- Three circles logo mark (ascending size) -->
  <circle cx="70" cy="200" r="40" fill="#4A6FA5"/>
  <circle cx="170" cy="200" r="54" fill="#0F766E"/>
  <circle cx="300" cy="200" r="70" fill="#D4A000"/>
</svg>`;
}

function generateBannerSvg() {
  return `<svg width="1500" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    </style>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="40%" stop-color="#222226"/>
      <stop offset="60%" stop-color="#1f1f23"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <radialGradient id="warmGlow" cx="55%" cy="42%" r="30%">
      <stop offset="0%" stop-color="#D4A000" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#D4A000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1500" height="500" fill="url(#bgGrad)"/>
  <rect width="1500" height="500" fill="url(#warmGlow)"/>

  <!-- Left decoration: abstract horizontal data bars -->
  <rect x="80" y="145" width="240" height="1.5" rx="0.75" fill="#4A6FA5" opacity="0.22"/>
  <rect x="80" y="185" width="360" height="1.5" rx="0.75" fill="#4A6FA5" opacity="0.16"/>
  <rect x="80" y="225" width="160" height="1.5" rx="0.75" fill="#0F766E" opacity="0.22"/>
  <rect x="80" y="265" width="300" height="1.5" rx="0.75" fill="#0F766E" opacity="0.16"/>
  <rect x="80" y="305" width="400" height="1.5" rx="0.75" fill="#D4A000" opacity="0.22"/>
  <rect x="80" y="345" width="220" height="1.5" rx="0.75" fill="#D4A000" opacity="0.16"/>

  <!-- Left decoration: ascending trend line -->
  <polyline points="100,360 200,325 320,275 440,195 540,145"
            stroke="#D4A000" stroke-width="1.5" fill="none" opacity="0.12"
            stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Trend data points -->
  <circle cx="100" cy="360" r="2.5" fill="#D4A000" opacity="0.22"/>
  <circle cx="200" cy="325" r="2.5" fill="#0F766E" opacity="0.22"/>
  <circle cx="320" cy="275" r="2.5" fill="#4A6FA5" opacity="0.22"/>
  <circle cx="440" cy="195" r="2.5" fill="#0F766E" opacity="0.22"/>
  <circle cx="540" cy="145" r="2.5" fill="#D4A000" opacity="0.22"/>

  <!-- Right decoration: faint vertical bars -->
  <rect x="1180" y="160" width="1.5" height="90" rx="0.75" fill="#4A6FA5" opacity="0.15"/>
  <rect x="1230" y="140" width="1.5" height="130" rx="0.75" fill="#0F766E" opacity="0.12"/>
  <rect x="1280" y="170" width="1.5" height="100" rx="0.75" fill="#D4A000" opacity="0.15"/>
  <rect x="1330" y="150" width="1.5" height="110" rx="0.75" fill="#4A6FA5" opacity="0.10"/>
  <rect x="1380" y="180" width="1.5" height="70" rx="0.75" fill="#0F766E" opacity="0.10"/>

  <!-- Logo: three circles (ascending size) -->
  <circle cx="774" cy="190" r="25" fill="#4A6FA5"/>
  <circle cx="840" cy="190" r="33" fill="#0F766E"/>
  <circle cx="922" cy="190" r="43" fill="#D4A000"/>

  <!-- Brand name -->
  <text x="850" y="300" font-size="72" text-anchor="middle" fill="#fafafa" font-weight="700">estimador<tspan fill="#71717a" font-weight="300">.pt</tspan></text>

  <!-- Editorial divider -->
  <line x1="770" y1="322" x2="930" y2="322" stroke="#3f3f46" stroke-width="0.5"/>

  <!-- Domain indicators -->
  <text x="850" y="352" fill="#52525b" font-size="14" font-weight="500" text-anchor="middle" letter-spacing="2.5">DESPORTO · ELEIÇÕES · ECONOMIA</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  // Profile picture
  const pfpSvg = generateProfilePictureSvg();
  const pfpPath = path.join(outDir, 'profile-400.png');
  await sharp(Buffer.from(pfpSvg))
    .resize(400, 400)
    .png()
    .toFile(pfpPath);
  console.log(`Generated: ${pfpPath}`);

  // Banner
  const bannerSvg = generateBannerSvg();
  const bannerPath = path.join(outDir, 'banner-1500x500.png');
  await sharp(Buffer.from(bannerSvg))
    .resize(1500, 500)
    .png()
    .toFile(bannerPath);
  console.log(`Generated: ${bannerPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
