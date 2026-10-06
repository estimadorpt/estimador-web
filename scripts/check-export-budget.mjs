#!/usr/bin/env node
/**
 * The static export's budget, checked after every build (npm "postbuild", so
 * CI runs it before deploying).
 *
 * Azure Static Web Apps takes at most 250 MB per environment on the Free
 * plan (500 MB on Standard) and refuses any single file over 100 MB; it also
 * caps the number of files (15,000 on Free). The population release alone writes
 * thousands of small files, and every played Liga match keeps its page (about
 * 0.4 MB for both locales), so the site can cross a limit without anyone
 * noticing until a deploy fails (SP2-02: about 237 MB projected by May 2027).
 * The budget sits under the Free plan's limits, with room for a deploy:
 *
 *   - the whole of out/          at most 220 MB (warned from 190 MB)
 *   - number of files            at most 13,000 (warned from 11,500)
 *   - any single file            at most 10 MB
 *
 * Each run also prints the size of the families that grow over a season (match
 * and player pages, the Liga data, the population release), so the growth is
 * visible in every CI log before it fails one. Moving to Standard: raise the
 * limits with the variables below.
 *
 * Any breach fails with the numbers and the largest offenders. Override the
 * limits with EXPORT_BUDGET_MB, EXPORT_BUDGET_FILES and EXPORT_BUDGET_FILE_MB
 * when a plan change makes room.
 *
 * It also lists, without failing, pages whose <title> or meta description
 * search results will cut (about 60 and 155 characters; warned past 70/160).
 *
 *   node scripts/check-export-budget.mjs [out-dir]
 */

import fs from 'node:fs';
import path from 'node:path';

const MB = 1024 * 1024;
const OUT = path.resolve(process.argv[2] ?? 'out');
const LIMITS = {
  totalBytes: Number(process.env.EXPORT_BUDGET_MB ?? 220) * MB,
  files: Number(process.env.EXPORT_BUDGET_FILES ?? 13_000),
  fileBytes: Number(process.env.EXPORT_BUDGET_FILE_MB ?? 10) * MB,
};
const META = { title: 70, description: 160 };
/** Where a warning starts: early enough to plan a slimmer page or a plan change. */
const WARN_SHARE = { totalBytes: 190 / 220, files: 11_500 / 13_000 };

/** The families that grow during a season or with a release, by path prefix. */
const FAMILIES = [
  ['match pages', /^(pt|en)\/desporto\/liga\/jogo\//],
  ['player pages', /^(pt|en)\/desporto\/liga\/jogador\//],
  ['club pages', /^(pt|en)\/desporto\/liga\/[a-z-]+\/index\.(html|txt)$/],
  ['Liga data', /^data\/football\//],
  ['population data', /^data\/population\//],
  ['geography', /^data\/population-geography\//],
  ['scripts and styles', /^_next\//],
];

/** Bytes and files per family, the rest as "other". */
function familyReport(files) {
  const totals = new Map([...FAMILIES.map(([name]) => [name, { bytes: 0, files: 0 }]), ['other', { bytes: 0, files: 0 }]]);
  for (const { file, bytes } of files) {
    const relative = path.relative(OUT, file).split(path.sep).join('/');
    const family = FAMILIES.find(([, pattern]) => pattern.test(relative))?.[0] ?? 'other';
    const total = totals.get(family);
    total.bytes += bytes;
    total.files += 1;
  }
  return totals;
}

const mb = bytes => `${(bytes / MB).toFixed(1)} MB`;

/** Every file under a directory, with its size. */
function walk(directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, found);
    else if (entry.isFile()) found.push({ file: full, bytes: fs.statSync(full).size });
  }
  return found;
}

const decode = text => text
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** Titles and descriptions past what a results page shows. */
function metaReport(files) {
  const long = [];
  for (const { file } of files) {
    if (!file.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');
    const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
    const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
    const issues = [];
    if (title.length > META.title) issues.push(`title ${title.length}`);
    if (description.length > META.description) issues.push(`description ${description.length}`);
    if (issues.length) long.push(`${path.relative(OUT, file)} (${issues.join(', ')})`);
  }
  return long;
}

function main() {
  if (!fs.existsSync(OUT)) {
    console.error(`export budget: ${OUT} does not exist; run the build first`);
    process.exit(1);
  }
  const files = walk(OUT);
  const total = files.reduce((sum, { bytes }) => sum + bytes, 0);
  const oversized = files.filter(({ bytes }) => bytes > LIMITS.fileBytes).sort((a, b) => b.bytes - a.bytes);
  const failures = [];
  if (total > LIMITS.totalBytes) failures.push(`total size ${mb(total)} is over ${mb(LIMITS.totalBytes)}`);
  if (files.length > LIMITS.files) failures.push(`${files.length} files is over ${LIMITS.files}`);
  for (const { file, bytes } of oversized) failures.push(`${path.relative(OUT, file)} is ${mb(bytes)}, over ${mb(LIMITS.fileBytes)}`);

  console.log(`export budget: ${files.length} files, ${mb(total)} (limits ${LIMITS.files} files, ${mb(LIMITS.totalBytes)}, ${mb(LIMITS.fileBytes)} per file)`);
  for (const [name, family] of familyReport(files)) {
    console.log(`  ${name.padEnd(20)} ${mb(family.bytes).padStart(9)}  ${String(family.files).padStart(6)} files`);
  }
  if (total > LIMITS.totalBytes * WARN_SHARE.totalBytes && total <= LIMITS.totalBytes) {
    console.warn(`export budget: ${mb(total)} is close to the ${mb(LIMITS.totalBytes)} limit; slim the match or player pages, or plan the Standard plan`);
  }
  if (files.length > LIMITS.files * WARN_SHARE.files && files.length <= LIMITS.files) {
    console.warn(`export budget: ${files.length} files is close to the ${LIMITS.files} limit`);
  }

  const long = metaReport(files);
  if (long.length) {
    console.warn(`export budget: ${long.length} pages with a title or description search results will truncate:`);
    for (const line of long.slice(0, 40)) console.warn(`  ${line}`);
    if (long.length > 40) console.warn(`  … and ${long.length - 40} more`);
  }

  if (failures.length) {
    console.error('export budget exceeded:');
    for (const failure of failures) console.error(`  ${failure}`);
    const largest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 10);
    console.error('largest files:');
    for (const { file, bytes } of largest) console.error(`  ${mb(bytes).padStart(9)}  ${path.relative(OUT, file)}`);
    process.exit(1);
  }
}

main();
