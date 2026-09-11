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
import { h, rule, renderCard, ROOT_DIR, COLOR } from './lib/og-render.mjs';
import { shell, badge, eyebrow, rankedRow, CARD_WIDTH } from './lib/og-cards.mjs';
import { teamName, teamColor } from './lib/football-brand.mjs';

const CARD_HEIGHT = 675;
const CONTENDER_THRESHOLD = 0.001;

/** Movement worth colouring. Below this, a swing is model noise between rounds. */
const MEANINGFUL_SWING_PP = 1;
const UP = '#4e8056';
const DOWN = '#a3543a';

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

function formatPp(delta) {
  return `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1).replace('.', ',')}pp`;
}

function formatPct(value) {
  return `${(value * 100).toFixed(1).replace('.', ',')}%`;
}

/**
 * The headline is the reason to post at all: what moved this round. With no
 * previous file to compare against, it falls back to stating the position.
 */
function headlineFor(leader) {
  const rounded = Math.round(leader.pct);
  if (leader.delta !== null && leader.delta > 2) return `${leader.name} sobe para ${rounded}% pelo título`;
  if (leader.delta !== null && leader.delta < -2) return `${leader.name} desce para ${rounded}% pelo título`;
  return `${leader.name} a ${rounded}% pelo título`;
}

function buildCard(current, previous, scenarios) {
  const standings = Object.fromEntries((current.actual_standings ?? []).map(row => [row.team, row]));
  const previousTable = Object.fromEntries((previous?.table ?? []).map(row => [row.team, row]));

  const contenders = current.table
    .filter(team => team.p_champion > CONTENDER_THRESHOLD)
    .sort((a, b) => b.p_champion - a.p_champion)
    .slice(0, 5)
    .map(team => {
      const before = previousTable[team.team];
      const played = standings[team.team];
      return {
        name: teamName(team.team),
        probability: team.p_champion,
        pct: team.p_champion * 100,
        delta: before ? (team.p_champion - before.p_champion) * 100 : null,
        color: teamColor(team.team),
        note: played ? `${played.points} pts · ${played.played}J` : null,
      };
    });

  const leader = contenders[0];
  const decisive = scenarios?.decisive_matches?.[0];

  return shell({
    height: CARD_HEIGHT,
    headerRight: badge(`Jornada ${current.matchday} · ${current.season}`),
    footerLeft: decisive
      ? `Jogo decisivo: ${teamName(decisive.home_team)} vs ${teamName(decisive.away_team)} (J${decisive.matchday})`
      : `Liga Portugal ${current.season}`,
    footerRight: decisive ? `${(decisive.title_swing * 100).toFixed(1).replace('.', ',')}pp de oscilação` : 'estimador.pt',
  },
    h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, paddingTop: 28, paddingBottom: 24 },
      h('div', { fontSize: 52, fontWeight: 700, color: COLOR.ink, letterSpacing: -1.2, lineHeight: 1.1 }, headlineFor(leader)),
      // Centred in whatever is left: the contender list is four rows in
      // September and two in April, and a table pinned to the top leaves the
      // card looking unfinished once the race narrows.
      h('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' },
        eyebrow('Probabilidade de título', COLOR.faint, { marginTop: 22 }),
        rule(COLOR.ink, { marginTop: 10 }),
        ...contenders.map((team, index) => rankedRow({
          name: team.name,
          note: team.note,
          value: formatPct(team.probability),
          fraction: team.probability / leader.probability,
          color: team.color,
          trailing: team.delta === null ? null : {
            text: formatPp(team.delta),
            color: Math.abs(team.delta) < MEANINGFUL_SWING_PP ? COLOR.faint : (team.delta > 0 ? UP : DOWN),
          },
        }, index === 0)))));
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
