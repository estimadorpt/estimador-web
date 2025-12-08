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

// Generate SVG for OG image - professional election forecast design
function generateOgSvg(locale, leadingCandidate, candidatesWithSupport, secondRoundProb) {
  const electionLabel = locale === 'pt' ? 'Presidenciais 2026' : 'Presidential 2026';
  const chanceLabel = locale === 'pt' ? 'prob. de ganhar a 1ª volta' : 'chance of winning 1st round';
  const supportLabel = locale === 'pt' ? 'Intenção de voto' : 'Voting intention';
  const secondRoundLabel = locale === 'pt' ? '2ª volta' : '2nd round';
  const tagline = locale === 'pt' ? 'Previsões Eleitorais' : 'Election Forecast';

  const top3 = candidatesWithSupport.slice(0, 3);
  
  // Improve readability - ensure WCAG compliant contrast on dark backgrounds
  function getReadableColor(color, name) {
    // André Ventura's red needs to be brighter for accessibility
    if (name === 'André Ventura') return '#ff6b6b';
    // Gouveia e Melo's blue needs to be lighter
    if (name === 'Gouveia e Melo') return '#60a5fa';
    return color;
  }
  
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    </style>
    <!-- Subtle gradient background -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#18181b"/>
      <stop offset="50%" style="stop-color:#27272a"/>
      <stop offset="100%" style="stop-color:#18181b"/>
    </linearGradient>
    <!-- Accent glow -->
    <radialGradient id="accentGlow" cx="50%" cy="35%" r="45%">
      <stop offset="0%" style="stop-color:${leadingCandidate.color};stop-opacity:0.12"/>
      <stop offset="100%" style="stop-color:${leadingCandidate.color};stop-opacity:0"/>
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  <rect width="1200" height="630" fill="url(#accentGlow)"/>
  
  <!-- Header -->
  <text x="600" y="65" fill="#fafafa" font-size="30" font-weight="700" text-anchor="middle">estimador.pt</text>
  <text x="600" y="95" fill="#a1a1aa" font-size="15" text-anchor="middle">${tagline} · ${electionLabel}</text>
  
  <!-- Main content -->
  <text x="600" y="175" fill="#fafafa" font-size="44" font-weight="700" text-anchor="middle">${leadingCandidate.name}</text>
  
  <!-- Big probability -->
  <text x="600" y="295" fill="${leadingCandidate.color}" font-size="130" font-weight="900" text-anchor="middle">${formatProbability(leadingCandidate.probability)}</text>
  
  <!-- Label -->
  <text x="600" y="345" fill="#a1a1aa" font-size="22" text-anchor="middle">${chanceLabel}</text>
  
  <!-- Second round pill badge - positioned prominently -->
  <rect x="505" y="365" width="190" height="32" rx="16" fill="#3f3f46"/>
  <text x="600" y="387" fill="#e4e4e7" font-size="14" font-weight="600" text-anchor="middle">${secondRoundLabel}: ${formatProbability(secondRoundProb)}</text>
  
  <!-- Divider -->
  <line x1="100" y1="430" x2="1100" y2="430" stroke="#3f3f46" stroke-width="1"/>
  
  <!-- Bottom section label -->
  <text x="600" y="465" fill="#71717a" font-size="12" font-weight="600" text-anchor="middle" letter-spacing="2">${supportLabel.toUpperCase()}</text>
  
  <!-- Bottom row - top 3 candidates with voting intentions -->
  ${top3.map((c, i) => {
    const xPos = 200 + i * 400;
    const readableColor = getReadableColor(c.color, c.name);
    const supportPct = `${(c.support * 100).toFixed(0)}%`;
    return `
    <rect x="${xPos - 95}" y="490" width="4" height="32" rx="2" fill="${readableColor}"/>
    <text x="${xPos - 80}" y="512" fill="#d4d4d8" font-size="17" font-weight="500">${c.name}</text>
    <text x="${xPos + 165}" y="512" fill="${readableColor}" font-size="20" font-weight="700" text-anchor="end">${supportPct}</text>`;
  }).join('')}
  
  <!-- Footer branding line -->
  <rect x="0" y="560" width="1200" height="70" fill="#18181b" opacity="0.6"/>
  <text x="600" y="600" fill="#52525b" font-size="13" text-anchor="middle">estimador.pt — Modelo bayesiano de previsão eleitoral</text>
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
  
  // Get voting intentions (mean support) at cutoff date for bottom section
  const cutoffDate = lastPollDate ? new Date(lastPollDate) : null;
  const cutoffIndex = cutoffDate 
    ? trends.dates.findIndex(d => new Date(d) > cutoffDate) - 1 
    : trends.dates.length - 1;
  const safeIndex = Math.max(0, cutoffIndex === -1 ? trends.dates.length - 1 : cutoffIndex);
  
  // Combine probabilities with voting intentions
  const candidatesWithSupport = cutoffProbabilities.map(c => {
    const trendData = trends.candidates[c.name];
    const support = trendData ? trendData.mean[safeIndex] : 0;
    return { ...c, support };
  });
  
  console.log(`   Leading: ${leadingCandidate.name} (${formatProbability(leadingCandidate.probability)})`);
  console.log(`   Second round: ${formatProbability(secondRoundProb)}`);
  console.log(`   Voting intentions:`, candidatesWithSupport.slice(0, 3).map(c => `${c.name}: ${(c.support * 100).toFixed(1)}%`).join(', '));
  
  // Generate for each locale
  for (const locale of ['pt', 'en']) {
    const svg = generateOgSvg(locale, leadingCandidate, candidatesWithSupport, secondRoundProb);
    
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

