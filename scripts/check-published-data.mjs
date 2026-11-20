#!/usr/bin/env node
// Did this commit change a population release the site already serves?
//
// `/data/population/v*` is served immutable for a year, so a file of a
// published release must never change in place: readers who already hold it
// would keep the old bytes and no later deploy could reach them. For every
// release folder in the checkout this script makes two comparisons: the
// folder's files against its own `manifest.json` (the SHA-256 of every other
// file), and that manifest against the one the live site serves. The deploy
// workflow runs it before the build, so a commit that edits a published
// release stops there instead of shipping. The rule and its wording are in
// scripts/lib/published-data.mjs.
//
//   node scripts/check-published-data.mjs                        # against https://estimador.pt
//   node scripts/check-published-data.mjs --base https://x.net   # another host
//   node scripts/check-published-data.mjs --timeout 10           # seconds one request may take (default 20)
//
// Only on the owner's word, PUBLISHED_DATA_CHANGE_OK=<folder>@<hash> in this
// step's environment lets one change through: the line of the stopped run
// prints the value, which names the content it accepts and so opens nothing
// that comes later.
//
// Exit codes: 0 no published release was changed, or the site could not be
// asked (the output says which); 1 a release folder does not match its own
// manifest, or its manifest differs from the live one; 2 a bad flag. A release
// that is not on the site yet is new and passes. When the site does not answer
// only the first comparison is made and the deploy goes on: a site that is
// down is the smoke check's news, not this script's.

import fs from 'node:fs';
import path from 'node:path';
import {
  ALLOW_VARIABLE,
  PUBLISHED_PATH,
  PUBLISHED_ROOT,
  allowedChanges,
  folderDifference,
  manifestUrl,
  publishedReport,
  publishedVerdict,
  releaseFolders,
  sha256,
} from './lib/published-data.mjs';
import { describeFailure, reach } from './lib/reach.mjs';

const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? fallback : args[at + 1];
};

const BASE = (readFlag('base', 'https://estimador.pt') ?? '').replace(/\/+$/, '');
if (!/^https?:\/\/[^/]/.test(BASE)) {
  console.error('--base takes the address of a site, such as https://estimador.pt.');
  process.exit(2);
}
const TIMEOUT_MS = Number(readFlag('timeout', '20')) * 1000;
if (!Number.isFinite(TIMEOUT_MS) || TIMEOUT_MS <= 0) {
  console.error('--timeout takes a number of seconds.');
  process.exit(2);
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

/** The SHA-256 of every file under a folder, by its path from the folder, the manifest itself apart. */
function hashesOf(folder) {
  const hashes = {};
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else hashes[path.relative(folder, file).split(path.sep).join('/')] = sha256(fs.readFileSync(file));
    }
  };
  walk(folder);
  delete hashes['manifest.json'];
  return hashes;
}

/**
 * One file from the live site: `{ status, bytes }`, or `{ failure }` in words.
 * Asked a second time after no answer or a 5xx (a host between two deploys);
 * any other status is the answer.
 */
async function ask(url) {
  let last = { failure: 'it was never asked' };
  for (const wait of [0, 5_000]) {
    if (wait) await pause(wait);
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (response.status === 200) return { status: 200, bytes: new Uint8Array(await response.arrayBuffer()) };
      await response.body?.cancel?.().catch(() => {});
      last = { status: response.status, bytes: null };
      if (response.status < 500) return last;
    } catch (error) {
      last = { failure: describeFailure(error).text };
    }
  }
  return last;
}

/** Does the host serve its own files at all? Asked once, and only when a manifest is not there. */
let serving;
const hostServes = () =>
  (serving ??= reach(`${BASE}/robots.txt`, { attempts: 1, timeoutMs: TIMEOUT_MS }).then(answer => answer.ok && answer.status === 200));

const root = path.resolve(PUBLISHED_ROOT);
const folders = fs.existsSync(root) ? releaseFolders(fs.readdirSync(root)) : [];
if (folders.length === 0) {
  console.log(`No release folder under ${PUBLISHED_ROOT}: nothing to compare.`);
  process.exit(0);
}

const allowed = allowedChanges(process.env[ALLOW_VARIABLE]);
const verdicts = [];
for (const folder of folders) {
  const directory = path.join(root, folder);
  const file = path.join(directory, 'manifest.json');
  if (!fs.existsSync(file)) {
    verdicts.push({
      folder,
      state: 'inconsistent',
      line: `${PUBLISHED_PATH}/${folder}: no manifest.json in the checkout. Run the population sync again, or restore the folder.`,
    });
    continue;
  }
  const committed = fs.readFileSync(file);
  const local = folderDifference(committed.toString('utf8'), hashesOf(directory));
  // A folder that does not match its own manifest is settled without the network.
  const settled = publishedVerdict({ folder, committed, local, live: { failure: 'not asked' } });
  if (settled.state === 'inconsistent') {
    verdicts.push(settled);
    continue;
  }
  const live = await ask(manifestUrl(BASE, folder));
  verdicts.push(
    publishedVerdict({ folder, committed, local, live, hostServes: live.status === 404 ? await hostServes() : true, allowed }),
  );
}

const report = publishedReport(verdicts);
console.log(`Live site: ${BASE}\n${report.text}`);
if (process.env.GITHUB_ACTIONS) {
  // One annotation a line that matters, so the run's summary page says it without the log.
  for (const verdict of verdicts) {
    if (verdict.state === 'changed' || verdict.state === 'inconsistent') console.log(`::error title=Published population release::${verdict.line}`);
    else if (verdict.state === 'unknown' || verdict.state === 'allowed') console.log(`::warning title=Published population release::${verdict.line}`);
  }
}
process.exitCode = report.ok ? 0 : 1;
