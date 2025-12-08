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

// Generate SVG for OG image - optimized for mobile display (300-500px width)
// At 300px display: 130px→32px, 60px→15px, 36px→9px minimum readable
function generateOgSvg(locale, leadingCandidate, candidatesWithSupport, secondRoundProb) {
  const chanceLabel = locale === 'pt' ? 'prob. de ganhar a 1ª volta' : 'chance of winning 1st round';
  const secondRoundLabel = locale === 'pt' ? '2ª volta' : '2nd round';

  const top3 = candidatesWithSupport.slice(0, 3);
  
  // Ensure readable colors on dark backgrounds
  function getReadableColor(color, name) {
    if (name === 'André Ventura') return '#ff6b6b';
    if (name === 'Gouveia e Melo') return '#60a5fa';
    return color;
  }
  
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    </style>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#18181b"/>
      <stop offset="50%" style="stop-color:#27272a"/>
      <stop offset="100%" style="stop-color:#18181b"/>
    </linearGradient>
    <radialGradient id="accentGlow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" style="stop-color:${leadingCandidate.color};stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:${leadingCandidate.color};stop-opacity:0"/>
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  <rect width="1200" height="630" fill="url(#accentGlow)"/>
  
  <!-- Header - larger for mobile readability (40px→10px at 300px) -->
  <text x="600" y="70" fill="#fafafa" font-size="40" font-weight="700" text-anchor="middle">estimador.pt</text>
  
  <!-- Candidate name - LARGE (60px→15px at 300px = readable) -->
  <text x="600" y="170" fill="#fafafa" font-size="60" font-weight="700" text-anchor="middle">${leadingCandidate.name}</text>
  
  <!-- Big probability - HERO SIZE (180px→45px at 300px = very readable) -->
  <text x="600" y="340" fill="${leadingCandidate.color}" font-size="180" font-weight="900" text-anchor="middle">${formatProbability(leadingCandidate.probability)}</text>
  
  <!-- Label - larger (32px→8px at 300px = borderline but acceptable) -->
  <text x="600" y="400" fill="#a1a1aa" font-size="32" text-anchor="middle">${chanceLabel}</text>
  
  <!-- Second round pill - larger text (24px→6px visible as badge) -->
  <rect x="470" y="430" width="260" height="50" rx="25" fill="#3f3f46"/>
  <text x="600" y="463" fill="#e4e4e7" font-size="24" font-weight="600" text-anchor="middle">${secondRoundLabel}: ${formatProbability(secondRoundProb)}</text>
  
  <!-- Bottom bar with key stats - stacked layout for clarity -->
  <rect x="0" y="505" width="1200" height="125" fill="#18181b" opacity="0.85"/>
  
  <!-- Three candidates - name on top, percentage below -->
  ${top3.map((c, i) => {
    const xPos = 200 + i * 400;
    const readableColor = getReadableColor(c.color, c.name);
    const supportPct = `${(c.support * 100).toFixed(0)}%`;
    // Use last name for cleaner display
    const displayName = c.name.split(' ').slice(-1)[0];
    return `
    <rect x="${xPos - 4}" y="525" width="8" height="80" rx="4" fill="${readableColor}"/>
    <text x="${xPos + 20}" y="555" fill="#e4e4e7" font-size="26" font-weight="500">${displayName}</text>
    <text x="${xPos + 20}" y="600" fill="${readableColor}" font-size="40" font-weight="800">${supportPct}</text>`;
  }).join('')}
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

