/**
 * Who is playing.
 *
 * Two ways in, on purpose:
 *
 *  - **Anonymous.** The first POST mints `{playerId, secret}`. The browser
 *    keeps both; the server keeps the id and a sha256 of the secret. A
 *    first-timer plays without an account and without handing us anything.
 *  - **Signed in.** Static Web Apps' built-in auth puts a base64 principal in
 *    `x-ms-client-principal`. We take the opaque provider user id, hash it, and
 *    store only the hash — never the GitHub login, never an email address.
 *
 * `POST /api/claim` welds the two together, which is how a player carries an
 * anonymous season onto a second device.
 *
 * What is persisted per player, in full: a random id, a chosen display name,
 * sha256 of the anonymous secret, sha256 of `provider|userId` once claimed, the
 * provider name, and two timestamps. Nothing else.
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { GameStore, PlayerEntity } from './storage';
import { safeKey, seasonKey, tryGetEntity } from './storage';

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails?: string;
  userRoles?: string[];
}

export interface Player {
  id: string;
  displayName: string;
  authenticated: boolean;
  authProvider?: string;
}

export const PLAYER_ID_HEADER = 'x-game-player-id';
export const PLAYER_SECRET_HEADER = 'x-game-secret';
export const ADMIN_TOKEN_HEADER = 'x-game-admin-token';

export const MAX_NAME_LENGTH = 24;

/* --------------------------------------------------------------- primitives */

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function newPlayerId(): string {
  return randomBytes(12).toString('hex');
}

export function newSecret(): string {
  return randomBytes(24).toString('base64url');
}

/** Constant-time string compare that tolerates unequal lengths. */
export function secretsMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    // Still burn a comparison so the failure is not measurably faster.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/** Stable, non-reversible handle for a signed-in identity. */
export function authHashOf(provider: string, userId: string): string {
  return sha256(`${provider.trim().toLowerCase()}|${userId.trim()}`);
}

/* ------------------------------------------------------------ display names */

const FALLBACK_PREFIX = 'Jogador';

/**
 * Names are shown on a public leaderboard, so they are trimmed to something
 * printable and short. An unusable name becomes `Jogador 4f2a` rather than
 * being rejected — nobody should lose a pick over a nickname.
 */
export function sanitizeDisplayName(raw: unknown, playerId = ''): string {
  const text = typeof raw === 'string' ? raw : '';
  let out = '';
  for (const ch of text.normalize('NFC')) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) continue;
    out += ch;
  }
  out = out.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH).trim();
  if (out) return out;
  return `${FALLBACK_PREFIX} ${(playerId || newPlayerId()).slice(0, 4)}`;
}

/* --------------------------------------------------------------- principal */

/** Decode the Static Web Apps principal header. Never throws. */
export function readPrincipal(header: string | undefined | null): ClientPrincipal | null {
  if (!header) return null;
  try {
    const json = Buffer.from(header, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const provider = parsed.identityProvider;
    const userId = parsed.userId;
    if (typeof provider !== 'string' || !provider) return null;
    if (typeof userId !== 'string' || !userId) return null;
    return {
      identityProvider: provider,
      userId,
      userDetails: typeof parsed.userDetails === 'string' ? parsed.userDetails : undefined,
      userRoles: Array.isArray(parsed.userRoles)
        ? parsed.userRoles.filter((r): r is string => typeof r === 'string')
        : undefined,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- persistence */

function toPlayer(entity: PlayerEntity): Player {
  return {
    id: entity.rowKey,
    displayName: entity.displayName,
    authenticated: !!entity.authHash,
    authProvider: entity.authProvider,
  };
}

export async function loadPlayer(
  store: GameStore,
  season: string,
  playerId: string,
): Promise<PlayerEntity | null> {
  return tryGetEntity<PlayerEntity>(store.table('players'), seasonKey(season), safeKey(playerId));
}

export async function findPlayerByAuth(
  store: GameStore,
  season: string,
  authHash: string,
): Promise<PlayerEntity | null> {
  const link = await tryGetEntity<{ playerId: string }>(
    store.table('authLinks'),
    seasonKey(season),
    authHash,
  );
  if (!link?.playerId) return null;
  return loadPlayer(store, season, link.playerId);
}

export async function createPlayer(
  store: GameStore,
  season: string,
  displayName: unknown,
  principal: ClientPrincipal | null,
): Promise<{ entity: PlayerEntity; secret: string }> {
  const now = new Date().toISOString();
  const id = newPlayerId();
  const secret = newSecret();

  const entity: PlayerEntity = {
    partitionKey: seasonKey(season),
    rowKey: id,
    displayName: sanitizeDisplayName(displayName, id),
    secretHash: sha256(secret),
    createdAt: now,
    updatedAt: now,
  };
  if (principal) {
    entity.authHash = authHashOf(principal.identityProvider, principal.userId);
    entity.authProvider = principal.identityProvider;
  }

  await store.ensure('players');
  await store.table('players').upsertEntity(entity, 'Merge');

  if (principal && entity.authHash) {
    await store.ensure('authLinks');
    await store.table('authLinks').upsertEntity(
      {
        partitionKey: seasonKey(season),
        rowKey: entity.authHash,
        playerId: id,
        createdAt: now,
      },
      'Merge',
    );
  }

  return { entity, secret };
}

export interface Resolution {
  player: Player | null;
  entity: PlayerEntity | null;
  /** Returned once, on creation. The server can never show it again. */
  secret?: string;
  /** Anonymous credentials were sent but did not match anything. */
  badCredentials: boolean;
}

/**
 * Identify the caller.
 *
 * A valid signed-in principal wins over anonymous credentials, because that is
 * the identity that survives a cleared browser. Anonymous credentials that do
 * not resolve are reported rather than silently replaced with a new player —
 * quietly minting a second account would look, to the player, like their season
 * had been deleted.
 */
export async function resolvePlayer(
  store: GameStore,
  season: string,
  headers: Record<string, string | undefined>,
  options: { createWith?: unknown } = {},
): Promise<Resolution> {
  const principal = readPrincipal(headers['x-ms-client-principal']);

  if (principal) {
    const linked = await findPlayerByAuth(
      store,
      season,
      authHashOf(principal.identityProvider, principal.userId),
    );
    if (linked) {
      return { player: toPlayer(linked), entity: linked, badCredentials: false };
    }
  }

  const playerId = (headers[PLAYER_ID_HEADER] || '').trim();
  const secret = (headers[PLAYER_SECRET_HEADER] || '').trim();

  if (playerId && secret) {
    const entity = await loadPlayer(store, season, playerId);
    if (entity && secretsMatch(entity.secretHash, sha256(secret))) {
      return { player: toPlayer(entity), entity, badCredentials: false };
    }
    return { player: null, entity: null, badCredentials: true };
  }

  if (options.createWith !== undefined) {
    const { entity, secret: fresh } = await createPlayer(
      store,
      season,
      options.createWith,
      principal,
    );
    return { player: toPlayer(entity), entity, secret: fresh, badCredentials: false };
  }

  return { player: null, entity: null, badCredentials: false };
}

export async function renamePlayer(
  store: GameStore,
  season: string,
  entity: PlayerEntity,
  displayName: unknown,
): Promise<string> {
  const next = sanitizeDisplayName(displayName, entity.rowKey);
  if (next === entity.displayName) return entity.displayName;
  await store.table('players').upsertEntity(
    {
      partitionKey: entity.partitionKey,
      rowKey: entity.rowKey,
      displayName: next,
      updatedAt: new Date().toISOString(),
    },
    'Merge',
  );
  return next;
}

export { toPlayer };
