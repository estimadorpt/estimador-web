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

// Get probabilities from snapshot data (computed from joint posterior)
function getLeadingProbabilitiesAtCutoff(snapshotProbabilities, cutoffDate) {
  if (!snapshotProbabilities?.dates || !cutoffDate) {
    // Fallback to election day probabilities
    return Object.entries(snapshotProbabilities?.candidates || {})
      .filter(([name]) => name !== 'Others')
      .map(([name, data]) => ({
        name,
        probability: data.leading_probability?.[data.leading_probability.length - 1] ?? 0,
        color: data.color,
      }))
      .sort((a, b) => b.probability - a.probability);
  }

  const cutoff = new Date(cutoffDate);
  const idx = snapshotProbabilities.dates.findIndex(d => new Date(d) > cutoff);
  const cutoffIndex = idx === -1 ? snapshotProbabilities.dates.length - 1 : Math.max(0, idx - 1);

  return Object.entries(snapshotProbabilities.candidates)
    .filter(([name]) => name !== 'Others')
    .map(([name, data]) => ({
      name,
      probability: data.leading_probability[cutoffIndex],
      color: data.color,
    }))
    .sort((a, b) => b.probability - a.probability);
}

function formatProbability(value) {
  const pct = value * 100;
  if (pct >= 99.5) return '>99%';
  if (pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
}

// Generate generic SVG for OG image (no forecast data)
function generateGenericOgSvg(locale) {
  const tagline = locale === 'pt'
    ? 'Previsões Eleitorais para Portugal'
    : 'Portuguese Election Forecast';
  const subtitle = locale === 'pt'
    ? 'Modelo Bayesiano de Sondagens'
    : 'Bayesian Polling Model';

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    </style>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b"/>
      <stop offset="50%" style="stop-color:#334155"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>

  <!-- Logo circles - centered and larger -->
  <g transform="translate(600, 220)">
    <circle cx="-120" cy="0" r="45" fill="#4A6FA5"/>
    <circle cx="0" cy="0" r="60" fill="#0F766E"/>
    <circle cx="140" cy="0" r="75" fill="#D4A000"/>
  </g>

  <!-- Logo text -->
  <text x="600" y="370" fill="#fafafa" font-size="72" font-weight="700" text-anchor="middle">estimador</text>

  <!-- Tagline -->
  <text x="600" y="440" fill="#94a3b8" font-size="32" font-weight="400" text-anchor="middle">${tagline}</text>

  <!-- Subtitle -->
  <text x="600" y="490" fill="#64748b" font-size="24" font-weight="400" text-anchor="middle">${subtitle}</text>

  <!-- URL -->
  <text x="600" y="580" fill="#475569" font-size="22" font-weight="500" text-anchor="middle">estimador.pt</text>
</svg>`;
}

// Generate SVG for OG image with logo
function generateOgSvg(locale, leadingCandidate, candidatesWithSupport, secondRoundProb) {
  const chanceLabel = locale === 'pt' ? 'probabilidade de ganhar a 1ª volta' : 'chance of winning 1st round';
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

  <!-- Header with logo -->
  <g transform="translate(480, 35)">
    <!-- Logo circles -->
    <circle cx="15" cy="25" r="8" fill="#4A6FA5"/>
    <circle cx="42" cy="25" r="12" fill="#0F766E"/>
    <circle cx="78" cy="25" r="16" fill="#D4A000"/>
    <!-- Logo text -->
    <text x="105" y="33" fill="#fafafa" font-size="28" font-weight="700">estimador</text>
  </g>

  <!-- Candidate name -->
  <text x="600" y="140" fill="#fafafa" font-size="60" font-weight="700" text-anchor="middle">${leadingCandidate.name}</text>

  <!-- Big probability -->
  <text x="600" y="340" fill="${leadingCandidate.color}" font-size="180" font-weight="900" text-anchor="middle">${formatProbability(leadingCandidate.probability)}</text>

  <!-- Label -->
  <text x="600" y="400" fill="#a1a1aa" font-size="32" text-anchor="middle">${chanceLabel}</text>

  <!-- Second round pill -->
  <rect x="470" y="430" width="260" height="50" rx="25" fill="#3f3f46"/>
  <text x="600" y="463" fill="#e4e4e7" font-size="24" font-weight="600" text-anchor="middle">${secondRoundLabel}: ${formatProbability(secondRoundProb)}</text>

  <!-- Bottom bar with key stats -->
  <rect x="0" y="505" width="1200" height="125" fill="#18181b" opacity="0.85"/>

  <!-- Three candidates -->
  ${top3.map((c, i) => {
    const xPos = 200 + i * 400;
    const readableColor = getReadableColor(c.color, c.name);
    const supportPct = `${(c.support * 100).toFixed(0)}%`;
    let displayName = c.name;
    if (c.name === 'André Ventura') displayName = 'Ventura';
    return `
    <text x="${xPos}" y="555" fill="#e4e4e7" font-size="26" font-weight="500" text-anchor="middle">${displayName}</text>
    <text x="${xPos}" y="600" fill="${readableColor}" font-size="40" font-weight="800" text-anchor="middle">${supportPct}</text>`;
  }).join('')}
</svg>`;
}

async function main() {
  const isGeneric = process.argv.includes('--generic');

  if (isGeneric) {
    console.log('🖼️  Generating generic Open Graph images...');

    // Generate short hash for cache busting
    const version = Date.now().toString(36).slice(-6);

    // Generate for each locale with versioned filename
    for (const locale of ['pt', 'en']) {
      const svg = generateGenericOgSvg(locale);

      // Convert to PNG using sharp with versioned filename
      const filename = `og-image-${locale}-${version}.png`;
      const pngPath = path.join(rootDir, 'public', filename);
      await sharp(Buffer.from(svg))
        .resize(1200, 630)
        .png()
        .toFile(pngPath);
      console.log(`   ✅ Generated: ${filename}`);

      // Also create unversioned copy for backwards compatibility
      const unversionedPath = path.join(rootDir, 'public', `og-image-${locale}.png`);
      fs.copyFileSync(pngPath, unversionedPath);
    }

    // Write manifest with version for filename-based cache busting
    const manifest = {
      generatedAt: new Date().toISOString(),
      version: version,
      files: {
        pt: `og-image-pt-${version}.png`,
        en: `og-image-en-${version}.png`
      }
    };
    const manifestPath = path.join(rootDir, 'public', 'og-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`   ✅ Manifest: og-manifest.json (version: ${version})`);

    console.log('✅ Generic Open Graph images generated!');
    return;
  }

  console.log('🖼️  Generating Open Graph images...');

  // Load data
  const winProbabilities = loadJsonData('presidential_win_probabilities.json');
  const trends = loadJsonData('presidential_trends.json');
  const polls = loadJsonData('presidential_polls.json');
  const snapshotProbabilities = loadJsonData('presidential_snapshot_probabilities.json');

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

  // Get probabilities from snapshot data (computed from joint posterior)
  const cutoffProbabilities = getLeadingProbabilitiesAtCutoff(snapshotProbabilities, lastPollDate);
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

  // Generate short hash for cache busting
  const version = Date.now().toString(36).slice(-6);

  // Generate for each locale with versioned filename
  for (const locale of ['pt', 'en']) {
    const svg = generateOgSvg(locale, leadingCandidate, candidatesWithSupport, secondRoundProb);

    // Convert to PNG using sharp with versioned filename
    const filename = `og-image-${locale}-${version}.png`;
    const pngPath = path.join(rootDir, 'public', filename);
    await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .png()
      .toFile(pngPath);
    console.log(`   ✅ Generated: ${filename}`);

    // Also create unversioned copy for backwards compatibility
    const unversionedPath = path.join(rootDir, 'public', `og-image-${locale}.png`);
    fs.copyFileSync(pngPath, unversionedPath);
  }

  // Write manifest with version for filename-based cache busting
  const manifest = {
    generatedAt: new Date().toISOString(),
    version: version,
    files: {
      pt: `og-image-pt-${version}.png`,
      en: `og-image-en-${version}.png`
    }
  };
  const manifestPath = path.join(rootDir, 'public', 'og-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`   ✅ Manifest: og-manifest.json (version: ${version})`);

  console.log('✅ Open Graph images generated!');
  console.log(`\n📋 To force social media refresh after deploy:`);
  console.log(`   Facebook: https://developers.facebook.com/tools/debug/?q=https://estimador.pt/pt`);
  console.log(`   Twitter:  https://cards-dev.twitter.com/validator`);
  console.log(`   LinkedIn: https://www.linkedin.com/post-inspector/`);
}

main().catch(console.error);
