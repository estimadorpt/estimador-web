#!/usr/bin/env node
// Required-data gate.
//
// The site is a static export: a missing or malformed feed does not crash the
// build, it silently produces a page with a fallback or an empty chart. That is
// acceptable while developing and not acceptable for a public release, so this
// check runs before the release build and fails loudly instead.
//
//   node scripts/validate-data.mjs            # every required feed must be valid
//   node scripts/validate-data.mjs --warn     # report, exit 0 (local development)
//
// Optional feeds are reported but never fail the run.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const WARN_ONLY = process.argv.includes('--warn');
const DATA = path.join(process.cwd(), 'public/data');
const problems = [];
const notes = [];

function read(relative) {
  const file = path.join(DATA, relative);
  if (!fs.existsSync(file)) return { missing: true };
  try {
    return { value: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (error) {
    return { invalid: error.message };
  }
}

/**
 * @param {string} relative     path under public/data
 * @param {(value: unknown) => string | null} check returns a problem, or null
 * @param {{ required?: boolean }} options
 */
function feed(relative, check, { required = true } = {}) {
  const result = read(relative);
  const report = message => (required ? problems : notes).push(`${relative}: ${message}`);
  if (result.missing) return report('missing');
  if (result.invalid) return report(`not valid JSON — ${result.invalid}`);
  const problem = check(result.value);
  if (problem) report(problem);
}

const isObject = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const nonEmptyArray = value => Array.isArray(value) && value.length > 0;

// ---- economics -------------------------------------------------------------

feed('economics/dashboard.json', value => {
  if (!isObject(value)) return 'expected an object';
  if (typeof value.vintage_date !== 'string') return 'no vintage_date — the dashboard cannot be dated';
  if (!isObject(value.tiles) || Object.keys(value.tiles).length === 0) return 'no tiles';
  return null;
});

feed('economics/stories.json', value => (isObject(value) && isObject(value.modules) ? null : 'no modules'), { required: false });

// ---- football --------------------------------------------------------------

const ligaDir = path.join(DATA, 'football/liga-2026-27');
const matchdays = fs.existsSync(ligaDir)
  ? fs.readdirSync(ligaDir).filter(name => /^md\d+\.json$/.test(name)).sort()
  : [];

if (matchdays.length === 0) {
  problems.push('football/liga-2026-27: no md*.json matchday files');
} else {
  const latest = matchdays[matchdays.length - 1];
  feed(`football/liga-2026-27/${latest}`, value => {
    if (!isObject(value)) return 'expected an object';
    if (!nonEmptyArray(value.table)) return 'no forecast table rows';
    if (typeof value.matchday !== 'number') return 'no matchday number';
    if (typeof value.model !== 'string') return 'no model identifier — forecasts must name the model that produced them';
    return null;
  });
}

// ---- football: content checks ----------------------------------------------
// The per-matchday publish refreshes the md files; the game manifest, the
// server's copy of it and the player feeds are refreshed by separate steps
// that have fallen behind before (site review, 5 October 2026). These checks
// fail the build when the feeds disagree, instead of publishing the
// disagreement.

const readLiga = name => read(`football/liga-2026-27/${name}`).value;
const manifest = readLiga('game_fixtures.json');

if (matchdays.length > 0 && !isObject(manifest)) {
  problems.push('football/liga-2026-27/game_fixtures.json: missing or not valid JSON — the prediction game and the kickoff dates read it');
} else if (matchdays.length > 0) {
  const where = 'football/liga-2026-27/game_fixtures.json';
  const pair = (home, away) => `${home}|${away}`;
  const manifestFixtures = new Map();
  for (const md of manifest.matchdays ?? []) {
    for (const fx of md.fixtures ?? []) manifestFixtures.set(pair(fx.home, fx.away), { ...fx, matchday: md.matchday });
  }

  // 1. Every published result is in the manifest, with the same score.
  const mdFiles = matchdays.map(name => ({ name, value: readLiga(name) })).filter(f => isObject(f.value));
  const missing = [];
  const differing = [];
  for (const { name, value } of mdFiles) {
    for (const r of value.matchday_results ?? []) {
      if (typeof r.home_goals !== 'number' || typeof r.away_goals !== 'number') continue;
      const fx = manifestFixtures.get(pair(r.home, r.away));
      if (!fx) missing.push(`${r.home}–${r.away} (${name})`);
      else if (fx.home_goals !== r.home_goals || fx.away_goals !== r.away_goals) {
        differing.push(`${r.home}–${r.away} ${r.home_goals}-${r.away_goals} in ${name}, ${fx.home_goals}-${fx.away_goals} in the manifest`);
      }
    }
  }
  if (missing.length) problems.push(`${where}: ${missing.length} published result(s) not in the manifest: ${missing.slice(0, 5).join(', ')}`);
  if (differing.length) problems.push(`${where}: ${differing.length} result(s) with a different score: ${differing.slice(0, 5).join('; ')}`);

  // 2. Per club, the manifest holds one result per game played. A postponed
  //    game is neither played nor scored, so it drops out of both sides.
  const latest = mdFiles[mdFiles.length - 1]?.value;
  const resultsPerTeam = new Map();
  for (const fx of manifestFixtures.values()) {
    if (typeof fx.home_goals !== 'number' || typeof fx.away_goals !== 'number') continue;
    for (const team of [fx.home, fx.away]) resultsPerTeam.set(team, (resultsPerTeam.get(team) ?? 0) + 1);
  }
  const countMismatch = (latest?.actual_standings ?? [])
    .filter(s => (resultsPerTeam.get(s.team) ?? 0) !== s.played)
    .map(s => `${s.team} ${resultsPerTeam.get(s.team) ?? 0} results for ${s.played} played`);
  if (countMismatch.length) problems.push(`${where}: result counts disagree with actual_standings in ${mdFiles[mdFiles.length - 1].name}: ${countMismatch.join('; ')}`);

  // 3. The open round (the first one with no result at all) is priced, so
  //    the server can accept picks for it.
  const rounds = [...(manifest.matchdays ?? [])].sort((a, b) => a.matchday - b.matchday);
  const open = rounds.find(md => (md.fixtures ?? []).every(fx => typeof fx.home_goals !== 'number'));
  const priced = fx => [fx.p_home, fx.p_draw, fx.p_away].every(p => typeof p === 'number' && Number.isFinite(p));
  if (open && latest && open.matchday <= (latest.next_matchday?.matchday ?? latest.matchday + 1)) {
    const unpriced = (open.fixtures ?? []).filter(fx => !priced(fx));
    if (unpriced.length) problems.push(`${where}: open matchday ${open.matchday} has ${unpriced.length} fixture(s) without model probabilities — every pick would be refused as not_priced`);
  }

  // 4. The manifest is at least as new as the newest forecast.
  const newest = latest?.timestamp ? Date.parse(latest.timestamp) : NaN;
  const generated = Date.parse(manifest.generated_at ?? '');
  if (Number.isFinite(newest) && (!Number.isFinite(generated) || generated < newest)) {
    problems.push(`${where}: generated_at ${manifest.generated_at ?? '(none)'} is older than ${mdFiles[mdFiles.length - 1].name} (${latest.timestamp}) — re-export the manifest with the forecast`);
  }

  // 5. The game server scores against its own copy, which must be the same file.
  const apiCopy = path.join(process.cwd(), 'api/data/game_fixtures.json');
  const publicCopy = path.join(DATA, 'football/liga-2026-27/game_fixtures.json');
  if (!fs.existsSync(apiCopy)) {
    problems.push('api/data/game_fixtures.json: missing — the game server has no manifest');
  } else if (!fs.readFileSync(apiCopy).equals(fs.readFileSync(publicCopy))) {
    problems.push('api/data/game_fixtures.json: differs from public/data/football/liga-2026-27/game_fixtures.json — copy the published manifest to the API');
  }
}

// The player pages read players_detail.json and /jogadores reads players.json;
// from different model runs they contradict each other (ranks, clubs, form).
{
  const ranking = readLiga('players.json');
  const detail = readLiga('players_detail.json');
  if (isObject(ranking) && isObject(detail)) {
    const a = JSON.stringify(ranking.generated_from ?? null);
    const b = JSON.stringify(detail.generated_from ?? null);
    if (a !== b) {
      problems.push(`football/liga-2026-27/players_detail.json: generated_from differs from players.json (${b} vs ${a}) — export both player files from the same run`);
    }
  }
}

feed('football/liga-2026-27/ask.json', value => (isObject(value) ? null : 'expected an object'), { required: false });
feed('football/liga-2026-27/market_scorecard.json', value => {
  if (!isObject(value)) return 'expected an object';
  if (typeof value.model !== 'string') return 'no model identifier — the evaluated model must be named';
  return null;
}, { required: false });

// ---- elections (archives; they must keep resolving) ------------------------

for (const name of ['seat_forecast_simulations.json', 'national_trends.json', 'district_forecast.json']) {
  feed(`elections/parliamentary-2025/${name}`, value => (nonEmptyArray(value) ? null : 'empty'));
}
feed('elections/parliamentary-2025/contested_summary.json', value =>
  isObject(value) && isObject(value.districts) ? null : 'no districts');

for (const name of ['presidential_forecast.json', 'presidential_trends.json', 'presidential_win_probabilities.json']) {
  feed(`elections/presidential-2026/${name}`, value =>
    nonEmptyArray(value) || isObject(value) ? null : 'empty');
}
// The first-round archive dates itself by its last poll, so the polls file is
// required: without it the page could not say what the forecast had seen.
feed('elections/presidential-2026/presidential_polls.json', value =>
  isObject(value) && nonEmptyArray(value.polls) ? null : 'no polls');
// The runoff archive (the page's default view). The page summarises the
// trajectories on the server; a missing or empty file must fail the release
// rather than render a runoff with no simulations.
for (const name of ['second_round_forecast.json', 'second_round_valid_votes.json']) {
  feed(`elections/presidential-2026/${name}`, value =>
    isObject(value) && nonEmptyArray(value.candidates) && typeof value.updated_at === 'string' ? null : 'no candidates or no updated_at');
}
feed('elections/presidential-2026/second_round_win_probability.json', value =>
  isObject(value) && nonEmptyArray(value.candidates) ? null : 'no candidates');
feed('elections/presidential-2026/second_round_trends.json', value =>
  isObject(value) && nonEmptyArray(value.dates) && isObject(value.candidates) ? null : 'no dates');
feed('elections/presidential-2026/second_round_trajectories.json', value => {
  if (!isObject(value) || !isObject(value.candidates)) return 'no candidates';
  const runoff = Object.keys(value.candidates).filter(name => name !== 'Blank/Null');
  if (runoff.length !== 2) return `expected two runoff candidates, found ${runoff.length}`;
  return runoff.every(name => nonEmptyArray(value.candidates[name].trajectories)) ? null : 'empty trajectories';
});
feed('elections/presidential-2026/second_round_blank_null.json', value =>
  isObject(value) && typeof value.mean === 'number' ? null : 'no mean');

// ---- population (synthetic population release) ----------------------------
// The compact files from scripts/sync-population.py. Every file must match the
// hash the sync recorded, so a hand edit or a half-finished sync fails here;
// fixture or draft data can never reach a release build.

const POPULATION_RELEASE = '1.0.1';
const populationDir = `population/v${POPULATION_RELEASE}`;
feed(`${populationDir}/manifest.json`, manifest => {
  if (!isObject(manifest) || !isObject(manifest.files)) return 'no file list';
  if (manifest.release_version !== POPULATION_RELEASE) return `release ${manifest.release_version}, site expects ${POPULATION_RELEASE}`;
  if (manifest.data_status !== 'release') return `data_status "${manifest.data_status}" cannot be published`;
  if (!String(manifest.contract_version).startsWith('1.')) return `unsupported contract ${manifest.contract_version}`;
  let bad = 0;
  for (const [relative, digest] of Object.entries(manifest.files)) {
    const file = path.join(DATA, populationDir, relative);
    if (!fs.existsSync(file) || createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== digest) bad += 1;
  }
  return bad ? `${bad} file(s) missing or changed since the sync` : null;
});
feed(`${populationDir}/meta.json`, meta => {
  if (!isObject(meta) || !isObject(meta.counts)) return 'no counts';
  if (meta.counts.parishes !== 3092) return `${meta.counts.parishes} parishes, expected 3092`;
  return null;
});
feed(`${populationDir}/scorecard.json`, card => (isObject(card) && card.status === 'ok' ? null : 'scorecard status is not ok'));

// ---- report ----------------------------------------------------------------

for (const note of notes) console.warn(`optional  ${note}`);

if (problems.length === 0) {
  console.log('Required launch data present and parseable.');
  process.exit(0);
}

console.error(`\n${problems.length} required feed problem(s):`);
for (const problem of problems) console.error(`  ${problem}`);
if (WARN_ONLY) {
  console.error('\n--warn given: not failing.');
  process.exit(0);
}
process.exit(1);
