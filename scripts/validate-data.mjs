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
