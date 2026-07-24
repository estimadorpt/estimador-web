'use client';

// DuckDB-WASM cross-tab engine for the L1 tabulator (Builder A3).
//
// STATIC-EXPORT SAFE: DuckDB-WASM is dynamic-imported *inside* init() (never at
// module top-level), and the bundles are SELF-HOSTED from /public/duckdb/ — no
// CDN, no eval, works offline and under a strict CSP. The parquet slice
// (Aveiro district=01 persons + households) is fetched as an ArrayBuffer and
// registered as an in-WASM file, then queried with read_parquet(). All of this
// runs only in the browser, after the component mounts.
//
// The result shape (TabResult) is IDENTICAL to the pre-baked featured JSON, so
// the static-fallback table and the live table render through one component and
// carry the same numbers. Row-normalised shares for >=2 dims, share-of-total for
// 1 dim; min_cell suppression blanks small cells so no <10 count is ever shown.

import type * as duckdb from '@duckdb/duckdb-wasm';
import type { TabQuery, PopulacaoManifest } from '@/types/populacao';

// ---- result types (owned here; imported by the tabulator components) --------

export interface TabCell {
  count: number | null;
  share: number | null;
  suppressed: boolean;
}

export interface TabResult {
  dims: string[];
  entity: 'person' | 'household' | 'mixed';
  measure: 'count' | 'share';
  minCell: number;
  rowDim: string;
  colDims: string[];
  rowKeys: string[];
  colKeys: string[][]; // each col = tuple aligned to colDims ([] => single total column)
  matrix: TabCell[][];
  rowTotals: number[];
  colTotals: number[];
  grandTotal: number;
  suppressedCells: number;
  source: 'duckdb' | 'static';
}

// Lightweight schema the engine needs to order/route dims consistently with the
// pre-baked JSON. Built once from the manifest by manifestToSchema().
export interface TabSchema {
  entityById: Record<string, 'person' | 'household'>;
  orderById: Record<string, string[]>;
  minCell: number;
}

export function manifestToSchema(manifest: PopulacaoManifest): TabSchema {
  const entityById: Record<string, 'person' | 'household'> = {};
  const orderById: Record<string, string[]> = {};
  for (const v of manifest.variables ?? []) {
    entityById[v.id] = v.entity;
    orderById[v.id] = (v.categories ?? []).map((c) => c.code);
  }
  return { entityById, orderById, minCell: manifest.min_cell ?? 10 };
}

const PERSONS_URL = '/data/demographics/release/persons/district=01/part-0.parquet';
const HOUSEHOLDS_URL = '/data/demographics/release/households/district=01/part-0.parquet';

// ---- DuckDB lifecycle (singleton, lazy) -------------------------------------

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

async function initDb(): Promise<duckdb.AsyncDuckDB> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const duckdb = await import('@duckdb/duckdb-wasm');

    // Self-hosted manual bundles (no CDN). selectBundle picks the eh (exception
    // handling) build when the browser supports it, else the mvp fallback.
    const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
      mvp: {
        mainModule: '/duckdb/duckdb-mvp.wasm',
        mainWorker: '/duckdb/duckdb-browser-mvp.worker.js',
      },
      eh: {
        mainModule: '/duckdb/duckdb-eh.wasm',
        mainWorker: '/duckdb/duckdb-browser-eh.worker.js',
      },
    };
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    if (!bundle.mainWorker) throw new Error('duckdb: no worker bundle selected');
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    // Register the two parquet slices as in-WASM files (Aveiro is small).
    const [pBuf, hBuf] = await Promise.all([
      fetch(PERSONS_URL).then((r) => {
        if (!r.ok) throw new Error(`fetch persons parquet: ${r.status}`);
        return r.arrayBuffer();
      }),
      fetch(HOUSEHOLDS_URL).then((r) => {
        if (!r.ok) throw new Error(`fetch households parquet: ${r.status}`);
        return r.arrayBuffer();
      }),
    ]);
    await db.registerFileBuffer('persons.parquet', new Uint8Array(pBuf));
    await db.registerFileBuffer('households.parquet', new Uint8Array(hBuf));
    return db;
  })();
  return dbPromise;
}

// Optional warm-up the page can call after mount; failures are swallowed so the
// static fallback simply stays on screen.
export async function warmUp(): Promise<boolean> {
  try {
    await initDb();
    return true;
  } catch {
    return false;
  }
}

// ---- query building ---------------------------------------------------------

function sqlLit(v: string): string {
  return `'${v.replace(/'/g, "''")}'`;
}

function geoWhere(alias: string, q: TabQuery): string[] {
  const clauses: string[] = [];
  if (q.geo && (q.geoLevel === 'municipio')) clauses.push(`${alias}municipio = ${sqlLit(q.geo)}`);
  if (q.geo && (q.geoLevel === 'freguesia')) clauses.push(`${alias}freguesia = ${sqlLit(q.geo)}`);
  // 'nacional' and 'distrito' span the whole loaded slice (Aveiro district=01).
  return clauses;
}

function buildSql(q: TabQuery, schema: TabSchema): { sql: string; entity: 'person' | 'household' | 'mixed' } {
  const dims = q.dims;
  const entities = new Set(dims.map((d) => schema.entityById[d]));
  const dimCols = dims.map((d) => `CAST(${d} AS VARCHAR) AS ${d}`);
  const notNull = dims.map((d) => `${d} IS NOT NULL`);

  // filters (permalink-complete; the UI does not set these yet)
  const filterClauses = Object.entries(q.filters ?? {}).map(
    ([k, v]) => `CAST(${k} AS VARCHAR) = ${sqlLit(v)}`,
  );

  let from: string;
  let alias = '';
  let entity: 'person' | 'household' | 'mixed';
  if (entities.size === 1 && entities.has('household')) {
    from = `read_parquet('households.parquet')`;
    entity = 'household';
  } else if (entities.size === 1 && entities.has('person')) {
    from = `read_parquet('persons.parquet')`;
    entity = 'person';
  } else {
    // mixed: person rows carry their household attributes (person-weighted)
    from = `read_parquet('persons.parquet') p LEFT JOIN read_parquet('households.parquet') h ON p.freguesia = h.freguesia AND p.synthetic_hh_id = h.synthetic_hh_id`;
    alias = 'p.';
    entity = 'mixed';
  }

  const where = [...geoWhere(alias, q), ...notNull, ...filterClauses];
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const groupCols = dims.join(', ');
  const sql = `SELECT ${dimCols.join(', ')}, COUNT(*) AS n FROM ${from} ${whereSql} GROUP BY ${groupCols}`;
  return { sql, entity };
}

// ---- pivot (pure; shared shape with the pre-baked JSON) ----------------------

function pivot(
  q: TabQuery,
  schema: TabSchema,
  counts: Map<string, number>,
  entity: 'person' | 'household' | 'mixed',
  source: 'duckdb' | 'static',
): TabResult {
  const dims = q.dims;
  const rowDim = dims[0];
  const colDims = dims.slice(1);
  const minCell = schema.minCell;

  const parse = (key: string): string[] => JSON.parse(key) as string[];

  const rowOrder = schema.orderById[rowDim] ?? [];
  const presentRows = new Set<string>();
  for (const key of counts.keys()) presentRows.add(parse(key)[0]);
  const rowKeys = rowOrder.filter((c) => presentRows.has(c));
  for (const r of [...presentRows].sort()) if (!rowKeys.includes(r)) rowKeys.push(r);

  let colKeys: string[][];
  if (colDims.length) {
    const seen = new Map<string, string[]>();
    for (const key of counts.keys()) {
      const parts = parse(key).slice(1);
      seen.set(JSON.stringify(parts), parts);
    }
    const sortKey = (t: string[]) =>
      t.map((val, i) => {
        const ord = schema.orderById[colDims[i]] ?? [];
        const idx = ord.indexOf(val);
        return idx < 0 ? 999 : idx;
      });
    colKeys = [...seen.values()].sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
      return 0;
    });
  } else {
    colKeys = [[]];
  }

  let grandTotal = 0;
  for (const v of counts.values()) grandTotal += v;

  const rowTotals: number[] = [];
  const colTotals: number[] = new Array(colKeys.length).fill(0);
  const matrix: TabCell[][] = [];
  let suppressedCells = 0;

  for (const rk of rowKeys) {
    let rowTotal = 0;
    for (const [key, v] of counts) if (parse(key)[0] === rk) rowTotal += v;
    rowTotals.push(rowTotal);
    const cells: TabCell[] = [];
    colKeys.forEach((ck, ci) => {
      const full = JSON.stringify([rk, ...ck]);
      const cnt = counts.get(full) ?? 0;
      colTotals[ci] += cnt;
      if (cnt > 0 && cnt < minCell) {
        suppressedCells += 1;
        cells.push({ count: null, share: null, suppressed: true });
      } else if (cnt === 0) {
        cells.push({ count: 0, share: 0, suppressed: false });
      } else {
        const share = colDims.length
          ? rowTotal
            ? cnt / rowTotal
            : 0
          : grandTotal
            ? cnt / grandTotal
            : 0;
        cells.push({ count: cnt, share, suppressed: false });
      }
    });
    matrix.push(cells);
  }

  return {
    dims,
    entity,
    measure: q.measure,
    minCell,
    rowDim,
    colDims,
    rowKeys,
    colKeys,
    matrix,
    rowTotals,
    colTotals,
    grandTotal,
    suppressedCells,
    source,
  };
}

// ---- public API -------------------------------------------------------------

/** Run a cross-tab live in DuckDB-WASM. Throws if WASM init/query fails. */
export async function runCrossTab(q: TabQuery, schema: TabSchema): Promise<TabResult> {
  if (!q.dims?.length) throw new Error('runCrossTab: query has no dims');
  const db = await initDb();
  const conn = await db.connect();
  try {
    const { sql, entity } = buildSql(q, schema);
    const table = await conn.query(sql);
    const counts = new Map<string, number>();
    for (const row of table.toArray()) {
      const obj = row.toJSON() as Record<string, unknown>;
      const key = q.dims.map((d) => String(obj[d]));
      counts.set(JSON.stringify(key), Number(obj.n));
    }
    return pivot(q, schema, counts, entity, 'duckdb');
  } finally {
    await conn.close();
  }
}

/** Fetch a pre-baked featured cross-tab (instant first paint / WASM fallback). */
export async function fetchFeaturedResult(slug: string): Promise<TabResult | null> {
  try {
    const res = await fetch(`/data/demographics/featured/${slug}.json`);
    if (!res.ok) return null;
    const payload = (await res.json()) as { result: TabResult };
    return payload.result ?? null;
  } catch {
    return null;
  }
}
