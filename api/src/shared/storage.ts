/**
 * Azure Table Storage access for the prediction game.
 *
 * Every entry point here is written so that a missing connection string is a
 * normal, expected state rather than a crash: `getStore()` returns null and the
 * HTTP layer answers "not configured", which the site treats as "stay in
 * local-only mode". The live site must never break because a storage account
 * has not been provisioned yet.
 */

import { TableClient, odata, RestError } from '@azure/data-tables';

/** The one app setting that turns the whole backend on. */
export const CONNECTION_SETTING = 'GAME_STORAGE_CONNECTION_STRING';

const TABLE_NAMES = {
  players: 'gamePlayers',
  authLinks: 'gameAuthLinks',
  picks: 'gamePicks',
  scores: 'gameScores',
  standings: 'gameStandings',
  manifest: 'gameManifest',
} as const;

export type TableName = keyof typeof TABLE_NAMES;

export interface GameStore {
  table(name: TableName): TableClient;
  ensure(name: TableName): Promise<void>;
}

function connectionString(): string | null {
  const value =
    process.env[CONNECTION_SETTING] ||
    process.env.TABLES_CONNECTION_STRING ||
    '';
  return value.trim() ? value.trim() : null;
}

export function isConfigured(): boolean {
  return connectionString() !== null;
}

const clients = new Map<TableName, TableClient>();
const ensured = new Map<TableName, Promise<void>>();

/**
 * A store handle, or null when storage is not configured.
 *
 * Clients are cached per process — a cold start pays the construction cost
 * once and warm invocations reuse the underlying HTTPS agent.
 */
export function getStore(): GameStore | null {
  const conn = connectionString();
  if (!conn) return null;

  const table = (name: TableName): TableClient => {
    let client = clients.get(name);
    if (!client) {
      client = TableClient.fromConnectionString(conn, TABLE_NAMES[name], {
        allowInsecureConnection: conn.includes('http://'),
      });
      clients.set(name, client);
    }
    return client;
  };

  const ensure = (name: TableName): Promise<void> => {
    let pending = ensured.get(name);
    if (!pending) {
      pending = table(name)
        .createTable()
        .then(() => undefined)
        .catch((error: unknown) => {
          // A table that already exists is the happy path on every call but
          // the first, and a 409 must not surface as a request failure.
          if (error instanceof RestError && (error.statusCode === 409 || error.statusCode === 204)) {
            return;
          }
          if (isConflict(error)) return;
          throw error;
        });
      ensured.set(name, pending);
    }
    return pending;
  };

  return { table, ensure };
}

function isConflict(error: unknown): boolean {
  const code = (error as { code?: string; statusCode?: number })?.code;
  return code === 'TableAlreadyExists' || (error as { statusCode?: number })?.statusCode === 409;
}

export function isNotFound(error: unknown): boolean {
  return (error as { statusCode?: number })?.statusCode === 404;
}

/* --------------------------------------------------------------- key hygiene */

/**
 * Table Storage rejects `/ \ # ?` and control characters in keys. Everything we
 * use as a key is server-generated or a season/matchday label, but this is the
 * one place a malformed value could reach the wire, so it is scrubbed anyway.
 */
export function safeKey(value: string): string {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) continue;
    out += ch === '/' || ch === '\\' || ch === '#' || ch === '?' ? '-' : ch;
  }
  return out.slice(0, 512);
}

export function seasonKey(season: string): string {
  return safeKey(season.trim());
}

/** `2026-27_02` — one partition per matchday keeps a scoring run to one query. */
export function roundKey(season: string, matchday: number): string {
  return `${seasonKey(season)}_${String(matchday).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ entities */

export interface PlayerEntity {
  partitionKey: string;
  rowKey: string;
  displayName: string;
  /** sha256 of the anonymous secret. The secret itself is never stored. */
  secretHash: string;
  /** sha256 of `provider|userId` once the player signs in. Absent while anon. */
  authHash?: string;
  authProvider?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthLinkEntity {
  partitionKey: string;
  rowKey: string;
  playerId: string;
  createdAt: string;
}

export interface PicksEntity {
  partitionKey: string;
  rowKey: string;
  matchday: number;
  /** JSON: `{ fixtureId: [pHome, pDraw, pAway] }`. */
  picks: string;
  /** JSON: remembered UI state, opaque to the server. */
  meta?: string;
  displayName: string;
  updatedAt: string;
}

export interface ScoreEntity {
  partitionKey: string;
  rowKey: string;
  matchday: number;
  matches: number;
  userTotal: number;
  modelTotal: number;
  beatModel: boolean;
  scoredAt: string;
}

export interface StandingEntity {
  partitionKey: string;
  rowKey: string;
  displayName: string;
  matches: number;
  matchdays: number;
  userTotal: number;
  modelTotal: number;
  userMean: number | null;
  modelMean: number | null;
  roundsWon: number;
  roundsCounted: number;
  edge: number;
  isModel: boolean;
  updatedAt: string;
}

export interface ManifestEntity {
  partitionKey: string;
  rowKey: string;
  matchday: number;
  /** JSON of the matchday block exactly as the model repo published it. */
  fixtures: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ queries */

/**
 * All rows of one partition.
 *
 * A table that has never been written to is an empty partition, not an error —
 * the first scoring run happens before anybody has submitted a pick, and it
 * must not fail on the way to reporting that nobody played.
 */
export async function listPartition<T extends object>(
  client: TableClient,
  partitionKey: string,
): Promise<T[]> {
  const rows: T[] = [];
  try {
    const iterator = client.listEntities<T>({
      queryOptions: { filter: odata`PartitionKey eq ${partitionKey}` },
    });
    for await (const entity of iterator) {
      rows.push(entity as unknown as T);
    }
  } catch (error) {
    if (isTableNotFound(error)) return [];
    throw error;
  }
  return rows;
}

export function isTableNotFound(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  const status = (error as { statusCode?: number })?.statusCode;
  return code === 'TableNotFound' || code === 'ResourceNotFound' || status === 404;
}

export async function tryGetEntity<T extends object>(
  client: TableClient,
  partitionKey: string,
  rowKey: string,
): Promise<T | null> {
  try {
    return (await client.getEntity<T>(partitionKey, rowKey)) as unknown as T;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
