// Copy the self-hosted DuckDB-WASM bundles into public/duckdb/.
//
// The tabulator (/populacao/explorar) instantiates DuckDB-WASM from same-origin
// /duckdb/* URLs (no CDN — CSP- and offline-safe). Those bundles are ~75MB of
// binary wasm, so they are gitignored and regenerated deterministically here from
// the pinned @duckdb/duckdb-wasm dependency. Wired into `postinstall` and `build`.
//
// Defensive by design: if the source is missing it warns and exits 0 so it can
// never break `npm install`.
import { existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', '@duckdb', 'duckdb-wasm', 'dist');
const dest = join(root, 'public', 'duckdb');

const files = [
  'duckdb-eh.wasm',
  'duckdb-mvp.wasm',
  'duckdb-browser-eh.worker.js',
  'duckdb-browser-mvp.worker.js',
];

if (!existsSync(src)) {
  console.warn(`[copy-duckdb] source not found (${src}); skipping. Run \`npm install\` first.`);
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
let copied = 0;
for (const f of files) {
  const from = join(src, f);
  const to = join(dest, f);
  if (!existsSync(from)) {
    console.warn(`[copy-duckdb] missing ${f} in dist; skipping`);
    continue;
  }
  // Skip if an up-to-date copy already exists (same size).
  if (existsSync(to) && statSync(to).size === statSync(from).size) {
    copied++;
    continue;
  }
  copyFileSync(from, to);
  copied++;
}
console.log(`[copy-duckdb] ${copied}/${files.length} bundles ready in public/duckdb/`);
