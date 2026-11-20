#!/usr/bin/env node
/**
 * The Liga Portugal matchday post image — the one that goes out with a tweet
 * after a round, not the card a scraper picks up from a page.
 *
 * The card itself lives in lib/liga-social-card.mjs, which social-post.mjs
 * also uses. It is deliberately built from the same shell as the Open Graph cards: a
 * timeline shows both, and two visual identities from one publication reads as
 * two publications.
 *
 * Usage:
 *   node scripts/generate-social-images.mjs               # latest matchday
 *   node scripts/generate-social-images.mjs --matchday 25
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadForecast, renderMatchdayCard } from './lib/liga-social-card.mjs';

async function main() {
  const args = process.argv.slice(2);
  const flagIndex = args.indexOf('--matchday');
  const requested = flagIndex === -1 ? null : Number(args[flagIndex + 1]);

  const forecast = loadForecast(requested);
  const png = await renderMatchdayCard(forecast);
  const outDir = path.join(forecast.dir, 'social');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `md${String(forecast.matchday).padStart(2, '0')}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Generated: ${outPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
