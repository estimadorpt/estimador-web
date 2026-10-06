#!/usr/bin/env node
/**
 * The static export's budget, checked after every build (npm "postbuild", so
 * CI runs it before deploying).
 *
 * Azure Static Web Apps (Standard) takes at most 250 MB per environment and
 * refuses any single file over 100 MB; the free plan, 15,000 files. The
 * population release alone writes thousands of small files, so the site can
 * cross a limit without anyone noticing until a deploy fails. The budget here
 * sits under the host's limits, with room for the next release:
 *
 *   - the whole of out/          at most 230 MB
 *   - number of files            at most 14,000
 *   - any single file            at most 10 MB
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
  totalBytes: Number(process.env.EXPORT_BUDGET_MB ?? 230) * MB,
  files: Number(process.env.EXPORT_BUDGET_FILES ?? 14_000),
  fileBytes: Number(process.env.EXPORT_BUDGET_FILE_MB ?? 10) * MB,
};
const META = { title: 70, description: 160 };

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
