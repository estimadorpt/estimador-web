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

// The population release the site serves, read from its config so the probes
// follow a release bump, and the national query id read from that release.
const POPULATION_RELEASE = /POPULATION_RELEASE = '([^']+)'/.exec(
  fs.readFileSync(path.join(process.cwd(), 'src/lib/config/population.ts'), 'utf8'),
)?.[1];
if (!POPULATION_RELEASE) throw new Error('POPULATION_RELEASE not found in src/lib/config/population.ts');
const POPULATION_DATA = `/data/population/v${POPULATION_RELEASE}`;
const NATIONAL_QUERY = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public', POPULATION_DATA, 'national.json'), 'utf8'),
).response.id;

const EXPECTED_TYPES = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.ico': 'image/',
  '.js': 'javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.parquet': 'application/vnd.apache.parquet',
};

/**
 * The Liga club slugs, read from the config so only real clubs are grouped as
 * club pages (and capped by --sample); /desporto/liga/simulador, /jogadores
 * and the other section pages stay in the always-checked core.
 */
const CLUB_SLUGS = new Set(
  [...(/ligaTeamSlugs[^=]*=\s*\{([\s\S]*?)\};/.exec(
    fs.readFileSync(path.join(process.cwd(), 'src/lib/config/football.ts'), 'utf8'),
  )?.[1] ?? '').matchAll(/:\s*'([a-z0-9-]+)'/g)].map(match => match[1]),
);
if (!CLUB_SLUGS.size) throw new Error('ligaTeamSlugs not found in src/lib/config/football.ts');

/**
 * Every redirect the host config declares must answer with that status and
 * that Location, in one hop: the legacy URLs, the section URLs without a
 * locale (the share cards used to print them) and the bare root. Read from
 * staticwebapp.config.json, so a new redirect is checked without listing it
 * twice.
 */
const HOST_ROUTES = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'staticwebapp.config.json'), 'utf8')).routes;
const MUST_REDIRECT = HOST_ROUTES
  .filter(route => route.redirect && !route.route.includes('*'))
  .map(route => ({ route: route.route, expect: route.statusCode ?? 302, location: route.redirect }));

/**
 * Pages the export writes but the host answers 404 for (a bare
 * `"statusCode": 404` rule): the placeholders /artigos/sem-artigos/ and
 * /artigos/tema/sem-temas/ that a static export needs while nothing is
 * published, and /404/, which only exists as the not-found override. They
 * are probed for that 404 and left out of the 200 walk below.
 */
const HOST_404 = HOST_ROUTES.filter(route => route.statusCode === 404 && !route.redirect && !route.rewrite);
const answersNotFound = urlPath => HOST_404.some(({ route }) => {
  const strip = value => (value.length > 1 ? value.replace(/\/$/, '') : value);
  return route.endsWith('/*') ? urlPath.startsWith(route.slice(0, -1)) || strip(urlPath) === route.slice(0, -2) : strip(urlPath) === strip(route);
});

/** Routes that must answer 404 even after the routing repair. */
const MUST_404 = [
  '/pt/esta-pagina-nao-existe/',
  '/en/this-page-does-not-exist/',
  '/data/definitely-not-a-file.json',
  // The parish page tells an unknown code apart by this 404.
  `${POPULATION_DATA}/parish/ZZZZZZ.json`,
  // Every exact host 404 rule, with the trailing slash the export uses.
  ...HOST_404.filter(({ route }) => !route.includes('*')).map(({ route }) => `${route}/`),
];

/**
 * URLs that exist only through a host rewrite, so the export has no file at
 * that path and the walk below would never ask for them: the 3,092 parish
 * pages share one shell (/{locale}/populacao/freguesia/_/), and a shared query
 * link (/populacao/v/…) lands on the consultation page. A routing rule that
 * stops matching would 404 every one of them.
 */
const MUST_200 = [
  { route: '/pt/populacao/', type: 'text/html' },
  { route: '/pt/populacao/freguesia/010103/', type: 'text/html' },
  // Unslashed and lower-case: the rewrite answers 200 with the shell rather
  // than a 301 (SWA cannot redirect conditionally), and the shell's early
  // script writes the upper-case, trailing-slash canonical (SEO3V-M5; the
  // canonical itself is tested in src/lib/population/prefetch.test.ts).
  { route: '/pt/populacao/freguesia/0302fa', type: 'text/html' },
  { route: '/en/populacao/freguesia/0302FA/', type: 'text/html' },
  { route: `/populacao/v/${POPULATION_RELEASE}/q/${NATIONAL_QUERY}`, type: 'text/html' },
  // The localised share links ("Copiar link" copies the reader's locale).
  { route: `/pt/populacao/v/${POPULATION_RELEASE}/q/${NATIONAL_QUERY}`, type: 'text/html' },
  { route: `/en/populacao/v/${POPULATION_RELEASE}/q/q1_dc0bf3434c913975a9b6/`, type: 'text/html' },
  { route: `${POPULATION_DATA}/meta.json`, type: 'application/json' },
];

/**
 * Group a route so `--sample` can cap the long dynamic families. The cap is
 * per locale (a family's PT pages are not used up by its EN ones), and only
 * the families that really are long are grouped; everything else is core and
 * always checked.
 */
function group(route) {
  const parts = route.split('/').filter(Boolean);
  const locale = parts[0] ?? '';
  if (parts[1] === 'artigos' && parts[2]) return `${locale}:artigos`;
  if (parts[1] === 'desporto' && parts[2] === 'liga' && parts[3] === 'jogo' && parts[4]) return `${locale}:jogo`;
  if (parts[1] === 'desporto' && parts[2] === 'liga' && parts[3] === 'jogador' && parts[4]) return `${locale}:jogador`;
  if (parts[1] === 'desporto' && parts[2] === 'liga' && parts.length === 4 && CLUB_SLUGS.has(parts[3])) return `${locale}:equipa`;
  if (parts[1] === 'populacao' && (parts[2] === 'regiao' || parts[2] === 'freguesia') && parts[3]) return `${locale}:populacao`;
  return 'core';
}

function collect(dir, prefix, routes, assets) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // The build's chunks and the data tree are checked through a sample below.
      if (prefix === '' && (entry.name === '_next' || entry.name === 'data')) {
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

/**
 * A few files from every directory of a tree, not the first few of the whole
 * walk: the data tree holds football, elections, economics and population
 * side by side, and a routing rule can hide any one of them.
 */
function sampleTree(name, perDirectory) {
  const found = [];
  const walk = dir => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let taken = 0;
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (taken < perDirectory) {
        found.push('/' + path.relative(OUT_DIR, full).split(path.sep).join('/'));
        taken += 1;
      }
    }
  };
  const root = path.join(OUT_DIR, name);
  if (fs.existsSync(root)) walk(root);
  return found;
}

async function head(url, { follow = true, hops = 0 } = {}) {
  // Some CDNs treat HEAD differently from GET; use GET and drop the body.
  const response = await fetch(url, { redirect: 'manual' });
  const type = response.headers.get('content-type') ?? '';
  if (response.body) await response.arrayBuffer().catch(() => {});
  // The host may answer a route with a redirect (Azure sends / to /pt/);
  // what matters is where it lands, so follow one hop.
  const location = response.headers.get('location');
  if (follow && [301, 302, 307, 308].includes(response.status) && location && hops < 1) {
    return head(new URL(location, url).toString(), { follow, hops: hops + 1 });
  }
  return { status: response.status, type, location };
}

async function runAll(checks) {
  const failures = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, checks.length) }, async () => {
    while (index < checks.length) {
      const check = checks[index++];
      try {
        const isRedirect = Boolean(check.location);
        const { status, type, location } = await head(`${BASE}${check.route}`, { follow: !isRedirect });
        const statusOk = check.expect === 404 ? status === 404 : status === check.expect;
        const typeOk = !check.type || type.toLowerCase().includes(check.type);
        // Compare the path only: the host may answer with an absolute URL.
        const landed = location ? new URL(location, BASE).pathname : null;
        const locationOk = !isRedirect || landed === check.location;
        if (!statusOk || !typeOk || !locationOk) {
          const detail = [
            check.type && !typeOk ? `content-type "${type}", expected ${check.type}` : null,
            isRedirect && !locationOk ? `Location ${landed ?? 'none'}, expected ${check.location}` : null,
            isRedirect && !statusOk ? `expected ${check.expect}` : null,
          ].filter(Boolean).join('; ');
          failures.push({ check, message: `${status} ${check.route}${detail ? ` (${detail})` : ''}` });
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

const pageRoutes = sampledRoutes.filter(route => route !== '/404.html' && !answersNotFound(route));
const checks = [
  // 404.html is the host's not-found override, never served at its own path.
  ...pageRoutes.map(route => ({ route, expect: 200, type: 'text/html' })),
  // The RSC payload a client-side navigation fetches instead of the HTML.
  ...pageRoutes
    .filter(route => route !== '/' && fs.existsSync(path.join(OUT_DIR, route, 'index.txt')))
    .map(route => ({ route: `${route}index.txt`, expect: 200, type: 'text/plain' })),
  ...assets.files.filter(route => !answersNotFound(route))
    .map(route => ({ route, expect: 200, type: EXPECTED_TYPES[path.extname(route)] })),
  ...assets.sampleDirs.flatMap(name => sampleTree(name, 2).map(route => ({
    route,
    expect: 200,
    type: EXPECTED_TYPES[path.extname(route)],
  }))),
  ...MUST_200.map(check => ({ ...check, expect: 200 })),
  ...MUST_404.map(route => ({ route, expect: 404 })),
  ...MUST_REDIRECT,
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
