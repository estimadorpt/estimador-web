#!/usr/bin/env node
/**
 * The Liga Portugal matchday post image — the one that goes out with a tweet
 * after a round, not the card a scraper picks up from a page.
 *
 * It is deliberately built from the same shell as the Open Graph cards: a
 * timeline shows both, and two visual identities from one publication reads as
 * two publications.
 *
 * Usage:
 *   node scripts/generate-social-images.mjs               # latest matchday
 *   node scripts/generate-social-images.mjs --matchday 25
 */

import fs from 'node:fs';
import path from 'node:path';
import { h, renderCard, ROOT_DIR, COLOR, formatPercent, formatCount, formatReadingTime } from './lib/og-render.mjs';
import { shell, headline, probBar, label, CARD_WIDTH } from './lib/og-cards.mjs';
import { teamName, teamColor, titleFinding, titleSeasons } from './lib/football-brand.mjs';

const CARD_HEIGHT = 675;
const CONTENDER_THRESHOLD = 0.0005;

function seasonDir() {
  const footballDir = path.join(ROOT_DIR, 'public', 'data', 'football');
  const seasons = fs.readdirSync(footballDir).filter(name => /^liga-\d{4}-\d{2}$/.test(name)).sort();
  if (!seasons.length) throw new Error('No Liga season directory found');
  return path.join(footballDir, seasons[seasons.length - 1]);
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function availableMatchdays(dir) {
  return fs.readdirSync(dir)
    .map(file => /^md(\d+)\.json$/.exec(file))
    .filter(Boolean)
    .map(match => Number(match[1]))
    .sort((a, b) => a - b);
}

/** A change in percentage points, signed with U+2212 as the site prints it. */
function formatPp(delta) {
  return `${delta >= 0 ? '+' : '\u2212'}${Math.abs(delta).toFixed(1).replace('.', ',')} pp`;
}

/**
 * The matchday post: the finding as the headline (the homepage's words), the
 * count behind it, and the contenders' title shares as ink bars on a 0–100
 * ruler with their change since the previous forecast. Changes are words in
 * graphite with their sign; colour belongs to the clubs' swatches.
 */
function buildCard(current, previous, scenarios) {
  const standings = Object.fromEntries((current.actual_standings ?? []).map(row => [row.team, row]));
  const previousTable = Object.fromEntries((previous?.table ?? []).map(row => [row.team, row]));

  const contenders = current.table
    .filter(team => team.p_champion >= CONTENDER_THRESHOLD)
    .sort((a, b) => b.p_champion - a.p_champion)
    .slice(0, 5)
    .map(team => {
      const before = previousTable[team.team];
      const played = standings[team.team];
      return {
        team: team.team,
        name: teamName(team.team),
        probability: team.p_champion,
        delta: before ? (team.p_champion - before.p_champion) * 100 : null,
        color: teamColor(team.team),
        note: played ? `${played.points} pontos em ${played.played} jogos` : null,
      };
    });

  const leader = contenders[0];
  const seasons = titleSeasons(leader.team, leader.probability, current.n_sims, scenarios?.victory_paths);
  const decisive = scenarios?.decisive_matches?.[0];
  const when = formatReadingTime(current.timestamp, 'pt');

  return shell({
    height: CARD_HEIGHT,
    head: { title: 'Liga Portugal', serial: `J${current.matchday}`, aside: when ? `previsão de ${when}` : current.season },
    footerLeft: decisive
      ? `Jogo decisivo: ${teamName(decisive.home_team)} \u2013 ${teamName(decisive.away_team)} (J${decisive.matchday}), ${(decisive.title_swing * 100).toFixed(1).replace('.', ',')} pp no título`
      : `Liga Portugal ${current.season}`,
    footerRight: 'estimador.pt/pt/desporto/liga',
  },
    h('div', { display: 'flex', flexDirection: 'column', marginTop: 20 },
      headline(titleFinding(leader.team, leader.probability, 'pt'), { lines: 2, size: 50 }),
      current.n_sims ? label(`Em ${formatCount(seasons)} de ${formatCount(current.n_sims)} épocas simuladas.`, { fontSize: 21, marginTop: 8 }) : null),
    // Centred in whatever is left: the contender list is five rows in
    // September and two in April.
    h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingTop: 10, paddingBottom: 14 },
      h('div', { display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${COLOR.ink}`, paddingBottom: 6 },
        label('Probabilidade de título, em 0–100%', { fontSize: 16 }),
        label('Desde a previsão anterior', { fontSize: 16 })),
      ...contenders.map(team => h('div', { display: 'flex', alignItems: 'center', height: 50, borderBottom: `1px solid ${COLOR.grid}` },
        h('div', { display: 'flex', alignItems: 'center', width: 380 },
          h('div', { width: 14, height: 14, backgroundColor: team.color, marginRight: 12 }),
          h('div', { fontSize: 25, fontWeight: 600 }, team.name),
          team.note ? label(team.note, { fontSize: 16, marginLeft: 12 }) : null),
        h('div', { display: 'flex', width: 120, justifyContent: 'flex-end', alignItems: 'baseline', paddingRight: 24 },
          h('div', { fontSize: 28, fontWeight: 700 }, formatPercent(team.probability)),
          h('div', { fontSize: 16, fontWeight: 600, marginLeft: 2 }, '%')),
        h('div', { display: 'flex', width: 360 }, probBar(team.probability, { width: 360 })),
        h('div', { display: 'flex', flexGrow: 1, justifyContent: 'flex-end', fontSize: 19, color: COLOR.muted }, team.delta === null ? '' : formatPp(team.delta))))));
}

async function main() {
  const args = process.argv.slice(2);
  const flagIndex = args.indexOf('--matchday');
  const requested = flagIndex === -1 ? null : Number(args[flagIndex + 1]);

  const dir = seasonDir();
  const available = availableMatchdays(dir);
  if (!available.length) {
    console.error(`No matchday files in ${dir}`);
    process.exit(1);
  }
  if (requested !== null && !available.includes(requested)) {
    console.error(`md${requested} not found. Available: ${available.join(', ')}`);
    process.exit(1);
  }

  const matchday = requested ?? available[available.length - 1];
  const index = available.indexOf(matchday);
  const pad = (value) => String(value).padStart(2, '0');

  const current = loadJson(path.join(dir, `md${pad(matchday)}.json`));
  const previous = index > 0 ? loadJson(path.join(dir, `md${pad(available[index - 1])}.json`)) : null;
  const scenariosPath = path.join(dir, `md${pad(matchday)}_scenarios.json`);
  const scenarios = fs.existsSync(scenariosPath) ? loadJson(scenariosPath) : null;

  const png = await renderCard(buildCard(current, previous, scenarios), { width: CARD_WIDTH, height: CARD_HEIGHT });
  const outDir = path.join(dir, 'social');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `md${pad(matchday)}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Generated: ${outPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
