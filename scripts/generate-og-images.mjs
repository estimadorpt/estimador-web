#!/usr/bin/env node
/**
 * Generate static Open Graph images for social media sharing.
 * Run this script before build to create static PNG files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load data
function loadJsonData(filename) {
  const filePath = path.join(rootDir, 'public', 'data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Simple seeded random for reproducibility
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Box-Muller transform for normal distribution
function normalRandom(mean, std, seed) {
  const u1 = seededRandom(seed);
  const u2 = seededRandom(seed + 1);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

// Compute probabilities at cutoff
function computeLeadingProbabilitiesAtCutoff(trends, winProbabilities, cutoffDate, numSimulations = 5000) {
  if (!cutoffDate) {
    return winProbabilities.candidates.map(c => ({
      name: c.name,
      probability: c.leading_probability,
      color: c.color,
    }));
  }
  
  const cutoff = new Date(cutoffDate);
  const idx = trends.dates.findIndex(d => new Date(d) > cutoff);
  const cutoffIndex = idx === -1 ? trends.dates.length - 1 : idx - 1;
  
  const candidates = Object.entries(trends.candidates)
    .filter(([name]) => name !== 'Others')
    .map(([name, data]) => {
      const mean = data.mean[cutoffIndex];
      const std = (data.ci_95[cutoffIndex] - data.ci_05[cutoffIndex]) / 3.92;
      const wpData = winProbabilities.candidates.find(c => c.name === name);
      return {
        name,
        mean,
        std: Math.max(std, 0.001),
        color: wpData?.color || '#888888',
      };
    });
  
  const wins = {};
  candidates.forEach(c => { wins[c.name] = 0; });
  
  for (let sim = 0; sim < numSimulations; sim++) {
    let maxValue = -Infinity;
    let winner = '';
    
    candidates.forEach((c, i) => {
      const value = normalRandom(c.mean, c.std, sim * candidates.length + i);
      if (value > maxValue) {
        maxValue = value;
        winner = c.name;
      }
    });
    
    if (winner) wins[winner]++;
  }
  
  return candidates
    .map(c => ({
      name: c.name,
      probability: wins[c.name] / numSimulations,
      color: c.color,
    }))
    .sort((a, b) => b.probability - a.probability);
}

function formatProbability(value) {
  const pct = value * 100;
  if (pct >= 99.5) return '>99%';
  if (pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

// Generate SVG for OG image - centered layout for social media cropping
function generateOgSvg(locale, leadingCandidate, cutoffProbabilities, secondRoundProb) {
  const electionLabel = locale === 'pt' ? 'Presidenciais 2026' : 'Presidential 2026';
  const chanceLabel = locale === 'pt' ? 'prob. de ganhar a 1ª volta' : 'chance of winning 1st round';
  const tagline = locale === 'pt' ? 'Previsões Eleitorais' : 'Election Forecast';

  const top3 = cutoffProbabilities.slice(0, 3);
  
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="#292524"/>
  
  <!-- Header - centered -->
  <text x="600" y="70" fill="#fafaf9" font-size="36" font-weight="700" text-anchor="middle">estimador.pt</text>
  <text x="600" y="100" fill="#a8a29e" font-size="18" text-anchor="middle">${tagline} · ${electionLabel}</text>
  
  <!-- Main content - centered -->
  <!-- Candidate name -->
  <text x="600" y="200" fill="#fafaf9" font-size="56" font-weight="800" text-anchor="middle">${leadingCandidate.name}</text>
  
  <!-- Big probability - centered -->
  <text x="600" y="340" fill="${leadingCandidate.color}" font-size="150" font-weight="900" text-anchor="middle">${formatProbability(leadingCandidate.probability)}</text>
  
  <!-- Label below -->
  <text x="600" y="400" fill="#a8a29e" font-size="28" text-anchor="middle">${chanceLabel}</text>
  
  <!-- Bottom row - top 3 candidates -->
  <line x1="100" y1="460" x2="1100" y2="460" stroke="#44403c" stroke-width="1"/>
  
  ${top3.map((c, i) => {
    const xPos = 200 + i * 400;
    return `
    <rect x="${xPos - 80}" y="490" width="6" height="40" rx="3" fill="${c.color}"/>
    <text x="${xPos - 60}" y="520" fill="#e7e5e3" font-size="22" font-weight="500">${c.name}</text>
    <text x="${xPos + 180}" y="520" fill="${c.color}" font-size="26" font-weight="700" text-anchor="end">${formatProbability(c.probability)}</text>`;
  }).join('')}
  
  <!-- Second round indicator -->
  <text x="600" y="590" fill="#78716c" font-size="18" text-anchor="middle">2ª volta: ${formatProbability(secondRoundProb)}</text>
</svg>`;
}

async function main() {
  console.log('🖼️  Generating Open Graph images...');
  
  // Load data
  const winProbabilities = loadJsonData('presidential_win_probabilities.json');
  const trends = loadJsonData('presidential_trends.json');
  const polls = loadJsonData('presidential_polls.json');
  
  // Calculate last poll date
  let lastPollDate = null;
  if (polls.polls.length > 0) {
    lastPollDate = polls.polls[0].date;
    for (const poll of polls.polls) {
      if (poll.date > lastPollDate) {
        lastPollDate = poll.date;
      }
    }
  }
  
  // Compute probabilities
  const cutoffProbabilities = computeLeadingProbabilitiesAtCutoff(trends, winProbabilities, lastPollDate);
  const leadingCandidate = cutoffProbabilities[0];
  const secondRoundProb = winProbabilities.second_round_probability;
  
  console.log(`   Leading: ${leadingCandidate.name} (${formatProbability(leadingCandidate.probability)})`);
  console.log(`   Second round: ${formatProbability(secondRoundProb)}`);
  
  // Generate for each locale
  for (const locale of ['pt', 'en']) {
    const svg = generateOgSvg(locale, leadingCandidate, cutoffProbabilities, secondRoundProb);
    
    // Save SVG
    const svgPath = path.join(rootDir, 'public', `og-image-${locale}.svg`);
    fs.writeFileSync(svgPath, svg);
    console.log(`   ✅ Generated SVG: ${svgPath}`);
    
    // Convert to PNG using sharp
    const pngPath = path.join(rootDir, 'public', `og-image-${locale}.png`);
    await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .png()
      .toFile(pngPath);
    console.log(`   ✅ Generated PNG: ${pngPath}`);
  }
  
  console.log('✅ Open Graph images generated!');
}

main().catch(console.error);

