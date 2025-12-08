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

// Generate SVG for OG image - modern gradient design
function generateOgSvg(locale, leadingCandidate, candidatesWithSupport, secondRoundProb) {
  const electionLabel = locale === 'pt' ? 'Presidenciais 2026' : 'Presidential 2026';
  const chanceLabel = locale === 'pt' ? 'prob. de ganhar a 1ª volta' : 'chance of winning 1st round';
  const supportLabel = locale === 'pt' ? 'Intenção de voto' : 'Voting intention';
  const tagline = locale === 'pt' ? 'Previsões Eleitorais' : 'Election Forecast';

  const top3 = candidatesWithSupport.slice(0, 3);
  
  // Improve readability - lighten dark colors for better contrast
  function getReadableColor(color, name) {
    // André Ventura's red (#ef4444) needs to be brighter
    if (name === 'André Ventura') return '#ff6b6b';
    // Make colors slightly more vibrant for dark backgrounds
    return color;
  }
  
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    </style>
    <!-- Subtle gradient background -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1c1917"/>
      <stop offset="50%" style="stop-color:#292524"/>
      <stop offset="100%" style="stop-color:#1c1917"/>
    </linearGradient>
    <!-- Accent glow -->
    <radialGradient id="accentGlow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" style="stop-color:${leadingCandidate.color};stop-opacity:0.08"/>
      <stop offset="100%" style="stop-color:${leadingCandidate.color};stop-opacity:0"/>
    </radialGradient>
  </defs>
  
  <!-- Background with gradient -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  <rect width="1200" height="630" fill="url(#accentGlow)"/>
  
  <!-- Subtle border -->
  <rect x="30" y="30" width="1140" height="570" rx="16" fill="none" stroke="#44403c" stroke-width="1" opacity="0.5"/>
  
  <!-- Header - centered -->
  <text x="600" y="75" fill="#fafaf9" font-size="32" font-weight="700" text-anchor="middle">estimador.pt</text>
  <text x="600" y="105" fill="#a8a29e" font-size="16" text-anchor="middle">${tagline} · ${electionLabel}</text>
  
  <!-- Main content - centered -->
  <!-- Candidate name -->
  <text x="600" y="195" fill="#fafaf9" font-size="48" font-weight="700" text-anchor="middle">${leadingCandidate.name}</text>
  
  <!-- Big probability - centered -->
  <text x="600" y="320" fill="${leadingCandidate.color}" font-size="140" font-weight="900" text-anchor="middle">${formatProbability(leadingCandidate.probability)}</text>
  
  <!-- Label below -->
  <text x="600" y="375" fill="#a8a29e" font-size="24" text-anchor="middle">${chanceLabel}</text>
  
  <!-- Divider -->
  <line x1="150" y1="420" x2="1050" y2="420" stroke="#44403c" stroke-width="1"/>
  
  <!-- Bottom section label -->
  <text x="600" y="460" fill="#78716c" font-size="14" font-weight="500" text-anchor="middle" letter-spacing="2">${supportLabel.toUpperCase()}</text>
  
  <!-- Bottom row - top 3 candidates with voting intentions -->
  ${top3.map((c, i) => {
    const xPos = 200 + i * 400;
    const readableColor = getReadableColor(c.color, c.name);
    // Format voting intention (mean support)
    const supportPct = `${(c.support * 100).toFixed(0)}%`;
    return `
    <rect x="${xPos - 90}" y="485" width="5" height="36" rx="2" fill="${readableColor}"/>
    <text x="${xPos - 75}" y="510" fill="#d6d3d1" font-size="18" font-weight="500">${c.name}</text>
    <text x="${xPos + 170}" y="510" fill="${readableColor}" font-size="22" font-weight="700" text-anchor="end">${supportPct}</text>`;
  }).join('')}
  
  <!-- Second round indicator -->
  <text x="600" y="585" fill="#57534e" font-size="14" text-anchor="middle">2ª volta: ${formatProbability(secondRoundProb)}</text>
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

