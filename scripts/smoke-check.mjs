#!/usr/bin/env node
// Deployed-site smoke check.
//
// A successful local preview proves nothing about the host: Azure Static Web
// Apps applies staticwebapp.config.json, and a routing rule can hide files that
// exist perfectly well in out/. This script asks the real host for every route
// and asset the export produced, and fails when one is missing or served with
// the wrong content type. It also checks that an unknown URL still 404s — the
// fix for over-blocking must not turn into a catch-all that answers everything.
//
//   node scripts/smoke-check.mjs                       # https://estimador.pt
//   node scripts/smoke-check.mjs --base https://x.net   # a preview environment
//   node scripts/smoke-check.mjs --sample 20            # cap per dynamic group
//
// Exits non-zero on the first failing check, after reporting all of them.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? fallback : args[at + 1];
};

const BASE = (readFlag('base', process.env.SMOKE_BASE_URL || 'https://estimador.pt')).replace(/\/+$/, '');
const SAMPLE = Number(readFlag('sample', '0')) || Infinity;
const CONCURRENCY = Number(readFlag('concurrency', '8'));
const OUT_DIR = path.join(process.cwd(), readFlag('out', 'out'));

const EXPECTED_TYPES = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/',
  '.wasm': 'application/wasm',
  '.parquet': 'application/vnd.apache.parquet',
};

/** Routes that must answer 404 even after the routing repair. */
const MUST_404 = [
  '/pt/esta-pagina-nao-existe/',
  '/en/this-page-does-not-exist/',
  '/data/definitely-not-a-file.json',
];

/** Group a route so `--sample` can cap the long dynamic families. */
function group(route) {
  const parts = route.split('/').filter(Boolean);
  if (parts[1] === 'artigos' && parts[2]) return 'artigos';
  if (parts[1] === 'desporto' && parts[3] === 'jogo') return 'jogo';
  if (parts[1] === 'desporto' && parts[3] === 'jogador') return 'jogador';
  if (parts[1] === 'desporto' && parts.length === 4) return 'equipa';
  return 'core';
}

function collect(dir, prefix, routes, assets) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Vendored binaries and the data tree are checked through a sample below.
      if (prefix === '' && (entry.name === '_next' || entry.name === 'data' || entry.name === 'duckdb')) {
        assets.sampleDirs.push(entry.name);
        continue;
      }
      collect(full, `${prefix}/${entry.name}`, routes, assets);
    } else if (entry.name === 'index.html') {
      routes.push(prefix === '' ? '/' : `${prefix}/`);
    } else if (entry.name !== 'index.txt') {
      assets.files.push(`${prefix}/${entry.name}`);
    }
  }
}

function sampleTree(name, limit) {
  const found = [];
  const walk = dir => {
    if (found.length >= limit) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (found.length >= limit) return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else found.push('/' + path.relative(OUT_DIR, full).split(path.sep).join('/'));
    }
  };
  const root = path.join(OUT_DIR, name);
  if (fs.existsSync(root)) walk(root);
  return found;
}

async function head(url, hops = 0) {
  // Some CDNs treat HEAD differently from GET; use GET and drop the body.
  const response = await fetch(url, { redirect: 'manual' });
  const type = response.headers.get('content-type') ?? '';
  if (response.body) await response.arrayBuffer().catch(() => {});
  // The host may answer a route with a redirect (Azure sends / to /pt/);
  // what matters is where it lands, so follow one hop.
  const location = response.headers.get('location');
  if ([301, 302, 307, 308].includes(response.status) && location && hops < 1) {
    return head(new URL(location, url).toString(), hops + 1);
  }
  return { status: response.status, type };
}

async function runAll(checks) {
  const failures = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, checks.length) }, async () => {
    while (index < checks.length) {
      const check = checks[index++];
      try {
        const { status, type } = await head(`${BASE}${check.route}`);
        const statusOk = check.expect === 404 ? status === 404 : status === check.expect;
        const typeOk = !check.type || type.toLowerCase().includes(check.type);
        if (!statusOk || !typeOk) {
          failures.push({ check, message: `${status} ${check.route}${check.type && !typeOk ? ` (content-type "${type}", expected ${check.type})` : ''}` });
        }
      } catch (error) {
        failures.push({ check, message: `ERR ${check.route} — ${error.message}` });
      }
    }
  });
  await Promise.all(workers);
  return failures;
}

if (!fs.existsSync(OUT_DIR)) {
  console.error(`No export at ${OUT_DIR}. Run "npm run build" first.`);
  process.exit(2);
}

const routes = [];
const assets = { files: [], sampleDirs: [] };
collect(OUT_DIR, '', routes, assets);

const perGroup = new Map();
const sampledRoutes = routes.filter(route => {
  const key = group(route);
  const seen = (perGroup.get(key) ?? 0) + 1;
  perGroup.set(key, seen);
  return key === 'core' || seen <= SAMPLE;
});

const checks = [
  // 404.html is the host's not-found override, never served at its own path.
  ...sampledRoutes.filter(route => route !== '/404.html').map(route => ({ route, expect: 200, type: 'text/html' })),
  ...assets.files.map(route => ({ route, expect: 200, type: EXPECTED_TYPES[path.extname(route)] })),
  ...assets.sampleDirs.flatMap(name => sampleTree(name, 5).map(route => ({
    route,
    expect: 200,
    type: EXPECTED_TYPES[path.extname(route)],
  }))),
  ...MUST_404.map(route => ({ route, expect: 404 })),
];

const RETRIES = Number(readFlag('retry', '2'));
console.log(`Checking ${checks.length} URLs against ${BASE} …`);
let failures = await runAll(checks);
// A fresh deployment can lag behind the host's edge for a moment, so the
// URLs that did not answer get a couple more chances before this fails.
for (let attempt = 1; failures.length && attempt <= RETRIES; attempt++) {
  console.log(`${failures.length} not answering as expected yet; retrying in 15s (${attempt}/${RETRIES}) …`);
  await new Promise(resolve => setTimeout(resolve, 15000));
  failures = await runAll(failures.map(failure => failure.check));
}

if (failures.length) {
  console.error(`\n${failures.length} failed:`);
  for (const message of failures.map(failure => failure.message).sort()) console.error(`  ${message}`);
  process.exit(1);
}
console.log(`All ${checks.length} URLs answered as expected.`);
