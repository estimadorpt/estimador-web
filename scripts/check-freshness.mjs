#!/usr/bin/env node
// Is estimador.pt still updating?
//
// The site is a static export, so it only changes when a commit reaches `main`
// and its deploy succeeds. In October 2026 a data sync turned `npm run check`
// red and every deploy failed for eight days before anyone noticed; a stopped
// publishing job on the Mac would look the same from outside. This script asks
// three questions and fails loudly when the answer to any of them is no:
//
//   1. did the last push to `main` deploy?
//   2. after the Liga games that were played, did a new forecast arrive?
//   3. does the live site serve the forecasts `main` holds?
//
//   node scripts/check-freshness.mjs                       # https://estimador.pt
//   node scripts/check-freshness.mjs --base https://x.net   # another host
//   node scripts/check-freshness.mjs --app ''               # do not ask the app's own Azure address
//   node scripts/check-freshness.mjs --report report.md     # also write the report to a file
//
// Run it from a checkout of `main`: the Liga fixtures are read from disk. The
// rules, and their thresholds, are in scripts/lib/freshness.mjs.
//
// Exit codes: 0 the site is updating, 1 it has stopped (the report says why),
// 2 GitHub or the fixtures file could not be read, so nothing is known. In
// GitHub Actions it also writes `stale=true|false` to the step outputs and the
// report to the summary; .github/workflows/site-freshness.yml turns
// `stale=true` into an issue.

import fs from 'node:fs';
import path from 'node:path';
import {
  deployProblems,
  forecastProblems,
  latestPastKickoff,
  lisbonTime,
  liveProblems,
  report,
  seasonFolders,
} from './lib/freshness.mjs';
import { describeFailure } from './lib/reach.mjs';

const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? fallback : args[at + 1];
};

const BASE = readFlag('base', 'https://estimador.pt').replace(/\/+$/, '');
// The address Azure gave the Static Web App, which answers whatever happens to
// the custom domain. It is asked only when the homepage is not there, to tell a
// broken domain from a host that serves nothing (18 November 2026 was both).
const APP_BASE = readFlag(
  'app',
  process.env.FRESHNESS_APP_BASE ?? 'https://thankful-bush-04fd3f303.6.azurestaticapps.net',
).replace(/\/+$/, '');
const REPORT_FILE = readFlag('report', null);
const REPO = process.env.GITHUB_REPOSITORY || 'estimadorpt/estimador-web';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const DEPLOY_WORKFLOW = 'azure-static-web-apps.yml';
const FOOTBALL = 'public/data/football';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Three attempts, a few seconds apart: one dropped connection is not news. */
async function patiently(ask) {
  let failure;
  for (const wait of [0, 5_000, 15_000]) {
    if (wait) await pause(wait);
    try {
      return await ask();
    } catch (error) {
      failure = error;
    }
  }
  throw failure;
}

async function github(resource) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/${resource}`, {
    headers: {
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'estimador-freshness-check',
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${resource}`);
  return response.json();
}

/**
 * A host's answer for a path: its status, and its JSON when it sent some. A
 * null status means no HTTP answer, and `failure` then says why.
 */
async function live(pathname, base = BASE) {
  try {
    return await patiently(async () => {
      const response = await fetch(`${base}${pathname}`, {
        cache: 'no-store',
        redirect: 'follow',
        headers: { 'user-agent': 'estimador-freshness-check' },
        signal: AbortSignal.timeout(30_000),
      });
      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        // An HTML page, or an error body: the status is the answer.
      }
      return { status: response.status, json, failure: null };
    });
  } catch (error) {
    return { status: null, json: null, failure: describeFailure(error) };
  }
}

// The newest season that has its calendar: a new season's folder can be
// published before its fixtures file is.
const fixturesFile = name => path.join(process.cwd(), FOOTBALL, name, 'game_fixtures.json');
const season = seasonFolders(fs.readdirSync(path.join(process.cwd(), FOOTBALL))).find(name =>
  fs.existsSync(fixturesFile(name)),
);
if (!season) {
  console.error(`No liga-YYYY-YY folder with a game_fixtures.json under ${FOOTBALL}: run this from a checkout of main.`);
  process.exit(2);
}
let fixtures;
try {
  fixtures = JSON.parse(fs.readFileSync(fixturesFile(season), 'utf8'));
} catch (error) {
  console.error(`Could not read ${FOOTBALL}/${season}/game_fixtures.json, so nothing is known: ${error.message}`);
  process.exit(2);
}

const now = Date.now();
let commits;
let runs;
try {
  [commits, runs] = await Promise.all([
    patiently(() => github(`commits?sha=main&per_page=1&path=${encodeURIComponent(`${FOOTBALL}/${season}`)}`)),
    patiently(() => github(`actions/workflows/${DEPLOY_WORKFLOW}/runs?branch=main&event=push&per_page=1`)),
  ]);
} catch (error) {
  console.error(`Could not ask GitHub, so nothing is known: ${error.message}`);
  process.exit(2);
}

const lastDataCommit = commits[0]?.commit?.committer?.date ?? null;
const run = runs.workflow_runs?.[0] ?? null;
const [page, liveFixtures] = await Promise.all([
  live('/pt/'),
  live(`/data/football/${season}/game_fixtures.json`),
]);
const app = page.status !== 200 && APP_BASE && APP_BASE !== BASE ? await live('/pt/', APP_BASE) : null;
const answer = reply => reply.status ?? `no answer (${reply.failure?.text ?? 'unknown reason'})`;

const problems = [
  ...deployProblems({ run, now }),
  ...forecastProblems({ fixtures, lastDataCommit, now }),
  ...liveProblems({
    base: BASE,
    pageStatus: page.status,
    pageFailure: page.failure,
    fixturesStatus: liveFixtures.status,
    fixturesFailure: liveFixtures.failure,
    appBase: app ? APP_BASE : null,
    appStatus: app?.status ?? null,
    appFailure: app?.failure ?? null,
    mainGeneratedAt: fixtures.generated_at,
    liveGeneratedAt: liveFixtures.json?.generated_at ?? null,
    lastDataCommit,
    now,
  }),
];

const lastGame = latestPastKickoff(fixtures, now);
const facts = [
  run
    ? `Last deploy from \`main\`: run ${run.run_number}, ${run.conclusion ?? run.status}, ${lisbonTime(run.run_started_at ?? run.created_at)}.`
    : 'No deploy run for a push to `main` was found.',
  lastDataCommit
    ? `Newest forecast files on \`main\` (${season}): ${lisbonTime(lastDataCommit)}.`
    : `No commit touching ${FOOTBALL}/${season} was found on \`main\`.`,
  lastGame
    ? `Last game to kick off: ${lastGame.home} – ${lastGame.away}, ${lisbonTime(lastGame.at)}.`
    : 'No game of this season has kicked off yet.',
  `Live site (${BASE}): homepage ${answer(page)}, forecasts generated at ${liveFixtures.json?.generated_at ?? 'unknown'}.`,
  ...(app ? [`The app's own Azure address (${APP_BASE}): homepage ${answer(app)}.`] : []),
];

const text = report({ problems, facts, now });
console.log(text);
if (REPORT_FILE) fs.writeFileSync(REPORT_FILE, text);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `stale=${problems.length > 0}\n`);
process.exit(problems.length ? 1 : 0);
