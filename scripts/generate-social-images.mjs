#!/usr/bin/env node
/**
 * Generate social media card images for Liga Portugal matchday posts.
 * Uses SVG → Sharp PNG conversion (same pattern as generate-og-images.mjs).
 *
 * Usage:
 *   node scripts/generate-social-images.mjs              # auto-detect latest
 *   node scripts/generate-social-images.mjs --matchday 25 # specify matchday
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'public', 'data', 'football', 'liga-2025-26');

// Team colors (matching src/lib/config/football.ts)
const teamColors = {
  'Porto': '#003893',
  'Sporting CP': '#006B3F',
  'Benfica': '#E20E1B',
  'SC Braga': '#C41E3A',
  'Famalicao': '#1B3A6B',
  'Moreirense': '#006838',
  'Estoril': '#FFD700',
  'Santa Clara': '#C8102E',
  'Vitoria SC': '#000000',
  'Casa Pia': '#1C3E6E',
  'Rio Ave': '#006338',
  'Nacional': '#000000',
  'Arouca': '#FFD100',
  'Estrela Amadora': '#E30613',
  'AVS': '#1D428A',
  'Tondela': '#006B3E',
  'Alverca': '#D4121F',
  'Gil Vicente': '#D4121F',
  'Boavista': '#000000',
};

// Display names (matching src/lib/config/football.ts)
const displayNames = {
  'Porto': 'Porto',
  'Sporting CP': 'Sporting',
  'Benfica': 'Benfica',
  'SC Braga': 'Sp. Braga',
  'Gil Vicente': 'Gil Vicente',
  'Famalicao': 'Famalicão',
  'Moreirense': 'Moreirense',
  'Estoril': 'Estoril',
  'Santa Clara': 'Santa Clara',
  'Vitoria SC': 'Vitória',
  'Casa Pia': 'Casa Pia',
  'Rio Ave': 'Rio Ave',
  'Nacional': 'Nacional',
  'Arouca': 'Arouca',
  'Estrela Amadora': 'Estrela',
  'AVS': 'AVS',
  'Boavista': 'Boavista',
  'Tondela': 'Tondela',
  'Alverca': 'Alverca',
};

// Brightened colors for visibility on dark backgrounds
const readableColors = {
  '#003893': '#4A8BFF',  // Porto blue
  '#006B3F': '#00B36B',  // Sporting green
  '#1B3A6B': '#4A7ACD',  // Famalicão navy
  '#006838': '#00B060',  // Moreirense green
  '#1C3E6E': '#4A7ACD',  // Casa Pia navy
  '#006338': '#00B060',  // Rio Ave green
  '#1D428A': '#4A8BFF',  // AVS blue
  '#006B3E': '#00B36B',  // Tondela green
  '#C41E3A': '#FF4D6A',  // Braga crimson
  '#C8102E': '#FF4D6A',  // Santa Clara red
  '#E30613': '#FF6B6B',  // Estrela red
  '#D4121F': '#FF5C5C',  // Gil Vicente / Alverca red
  '#000000': '#d4d4d8',  // Black → light zinc
};

function loadJson(filepath) {
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function findMatchdays() {
  const files = fs.readdirSync(dataDir);
  const matchdays = [];
  for (const f of files) {
    const m = f.match(/^md(\d+)\.json$/);
    if (m) matchdays.push(parseInt(m[1]));
  }
  return matchdays.sort((a, b) => a - b);
}

function getDisplayName(team) {
  return displayNames[team] || team;
}

function getBarColor(team) {
  const raw = teamColors[team] || '#71717a';
  return readableColors[raw] || raw;
}

function formatDelta(delta) {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}pp`;
}

function generateHeadline(contenderData) {
  const leader = contenderData[0];
  const pctRound = Math.round(leader.pct);
  if (leader.delta !== null && leader.delta > 2) {
    return `${leader.displayName} sobe para ${pctRound}%`;
  }
  if (leader.delta !== null && leader.delta < -2) {
    return `${leader.displayName} desce para ${pctRound}%`;
  }
  return `${leader.displayName} a ${pctRound}% pelo título`;
}

function generateSocialSvg(current, previous, scenarios) {
  const matchday = current.matchday;
  const season = current.season;
  const W = 1200;
  const H = 675;
  const margin = 60;

  // Championship contenders (p_champion > 0.1%)
  const contenders = current.table
    .filter(t => t.p_champion > 0.001)
    .sort((a, b) => b.p_champion - a.p_champion)
    .slice(0, 5);

  // Actual standings for context (not available in older matchday files)
  const standingsMap = current.actual_standings
    ? Object.fromEntries(current.actual_standings.map(t => [t.team, t]))
    : {};

  // Compute deltas from previous matchday
  const prevTable = previous
    ? Object.fromEntries(previous.table.map(t => [t.team, t]))
    : {};

  const contenderData = contenders.map(t => {
    const prev = prevTable[t.team];
    const pct = t.p_champion * 100;
    const delta = prev ? (t.p_champion - prev.p_champion) * 100 : null;
    const s = standingsMap[t.team];
    return {
      displayName: getDisplayName(t.team),
      pct,
      delta,
      color: getBarColor(t.team),
      points: s?.points ?? null,
      played: s?.played ?? null,
    };
  });

  const headline = generateHeadline(contenderData);

  // Most decisive upcoming match
  let decisiveMatch = null;
  if (scenarios?.decisive_matches?.length > 0) {
    const dm = scenarios.decisive_matches[0];
    decisiveMatch = {
      home: getDisplayName(dm.home_team),
      away: getDisplayName(dm.away_team),
      matchday: dm.matchday,
      titleSwing: (dm.title_swing * 100).toFixed(1),
    };
  }

  // Bar layout
  const barStartX = 200;
  const barMaxWidth = 480;
  const numBars = contenderData.length;
  const barHeight = numBars <= 3 ? 56 : 48;
  const rowHeight = numBars <= 3 ? 88 : 76;
  const maxPct = Math.max(...contenderData.map(c => c.pct), 1);

  // Fixed number column positions (aligned for scannability)
  const pctX = barStartX + barMaxWidth + 20;
  const deltaX = pctX + 130;

  // Vertical sections
  const headlineY = 118;
  const sectionLabelY = 165;
  const footerLineY = H - 68;
  const footerTextY = H - 40;

  // Center bars vertically between section label and footer
  const barsZoneTop = sectionLabelY + 22;
  const barsZoneBottom = footerLineY - 15;
  const totalBarsHeight = numBars * barHeight + (numBars - 1) * (rowHeight - barHeight);
  const barsStartY = barsZoneTop + (barsZoneBottom - barsZoneTop - totalBarsHeight) / 2;

  // Build bars
  const barsSvg = contenderData.map((c, i) => {
    const rowTop = barsStartY + i * rowHeight;
    const barW = Math.max(c.pct / maxPct * barMaxWidth, 30);

    // Vertical positions within row
    const nameY = rowTop + barHeight / 2 + 1;
    const standingsY = nameY + 19;
    const pctTextY = rowTop + barHeight / 2 + 12;
    const deltaTextY = rowTop + barHeight / 2 + 7;

    // Standings context
    const standingsText = c.points !== null ? `${c.points} pts · ${c.played}J` : '';

    // Delta with neutral color for trivial changes
    let deltaSvg = '';
    if (c.delta !== null) {
      const deltaLabel = formatDelta(c.delta);
      let deltaColor;
      if (Math.abs(c.delta) < 1) {
        deltaColor = '#71717a';
      } else {
        deltaColor = c.delta >= 0 ? '#4ade80' : '#f87171';
      }
      deltaSvg = `<text x="${deltaX}" y="${deltaTextY}" fill="${deltaColor}" font-size="20" font-weight="500">${deltaLabel}</text>`;
    }

    return `
    <text x="${barStartX - 18}" y="${nameY}" fill="#e4e4e7" font-size="26" font-weight="700" text-anchor="end">${c.displayName}</text>
    <text x="${barStartX - 18}" y="${standingsY}" fill="#52525b" font-size="14" font-weight="400" text-anchor="end">${standingsText}</text>
    <rect x="${barStartX}" y="${rowTop}" width="${barW}" height="${barHeight}" rx="3" fill="${c.color}"/>
    <text x="${pctX}" y="${pctTextY}" fill="#fafafa" font-size="34" font-weight="700">${c.pct.toFixed(1)}%</text>
    ${deltaSvg}`;
  }).join('');

  // Compact footer (one line, LinkedIn-safe positioning)
  let footerSvg = '';
  if (decisiveMatch) {
    footerSvg = `
    <line x1="${margin}" y1="${footerLineY}" x2="${W - margin}" y2="${footerLineY}" stroke="#3f3f46" stroke-width="1"/>
    <text x="${margin}" y="${footerTextY}" fill="#a1a1aa" font-size="18">Jogo decisivo: ${decisiveMatch.home} vs ${decisiveMatch.away} (J${decisiveMatch.matchday})</text>
    <text x="${W - margin}" y="${footerTextY}" fill="#fbbf24" font-size="18" font-weight="600" text-anchor="end">${decisiveMatch.titleSwing}pp de oscilação</text>`;
  }

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    </style>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#18181b"/>
      <stop offset="50%" style="stop-color:#27272a"/>
      <stop offset="100%" style="stop-color:#18181b"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgGradient)"/>

  <!-- Header: logo + matchday label -->
  <g transform="translate(${margin}, 28)">
    <circle cx="15" cy="25" r="10" fill="#4A6FA5"/>
    <circle cx="44" cy="25" r="14" fill="#0F766E"/>
    <circle cx="84" cy="25" r="18" fill="#D4A000"/>
    <text x="115" y="35" fill="#fafafa" font-size="28" font-weight="700">estimador</text>
  </g>
  <text x="${W - margin}" y="53" fill="#a1a1aa" font-size="20" font-weight="400" text-anchor="end">Jornada ${matchday} · Liga Portugal ${season}</text>

  <!-- Headline -->
  <text x="${margin}" y="${headlineY}" fill="#fafafa" font-size="44" font-weight="700">${headline}</text>

  <!-- Section label -->
  <text x="${margin}" y="${sectionLabelY}" fill="#71717a" font-size="13" font-weight="600" letter-spacing="1.5">PROBABILIDADE DE TÍTULO</text>

  <!-- Probability bars -->
  ${barsSvg}

  <!-- Footer -->
  ${footerSvg}

  <!-- URL branding -->
  <text x="${W - margin}" y="${H - 16}" fill="#3f3f46" font-size="14" font-weight="500" text-anchor="end">estimador.pt</text>
</svg>`;
}

async function main() {
  const args = process.argv.slice(2);
  let matchday = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--matchday' && args[i + 1]) {
      matchday = parseInt(args[i + 1]);
      i++;
    }
  }

  const available = findMatchdays();
  if (available.length === 0) {
    console.error('Error: no matchday files found');
    process.exit(1);
  }

  if (matchday && !available.includes(matchday)) {
    console.error(`Error: md${matchday}.json not found. Available: ${available.join(', ')}`);
    process.exit(1);
  }

  const currentMd = matchday || available[available.length - 1];
  const idx = available.indexOf(currentMd);
  const previousMd = idx > 0 ? available[idx - 1] : null;

  console.log(`Matchday: ${currentMd} (previous: ${previousMd || 'none'})`);

  // Load data
  const current = loadJson(path.join(dataDir, `md${currentMd}.json`));
  const previous = previousMd
    ? loadJson(path.join(dataDir, `md${previousMd}.json`))
    : null;

  let scenarios = null;
  const scenariosPath = path.join(dataDir, `md${currentMd}_scenarios.json`);
  if (fs.existsSync(scenariosPath)) {
    scenarios = loadJson(scenariosPath);
  }

  // Generate SVG and convert to PNG
  const svg = generateSocialSvg(current, previous, scenarios);

  const outDir = path.join(dataDir, 'social');
  fs.mkdirSync(outDir, { recursive: true });

  const pngPath = path.join(outDir, `md${currentMd}.png`);
  await sharp(Buffer.from(svg))
    .resize(1200, 675)
    .png()
    .toFile(pngPath);

  console.log(`Generated: ${pngPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
