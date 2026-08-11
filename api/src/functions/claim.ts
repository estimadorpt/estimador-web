/**
 * POST /api/claim — attach an anonymous season to a signed-in identity.
 *
 * The documented path off local-only play:
 *
 *  1. Play anonymously. The browser holds `{playerId, secret}`.
 *  2. Sign in at `/.auth/login/github`.
 *  3. The site POSTs here with both the principal (added by Static Web Apps)
 *     and the anonymous credentials.
 *  4. The anonymous player becomes the signed-in player. From then on any
 *     device that signs in resolves to the same season, secret or no secret.
 *
 * If the identity is already linked to a different player the existing one
 * wins and is returned untouched — silently merging two seasons would destroy
 * one of them, and only the human can say which was meant.
 */

import type { Context, HttpRequest } from '@azure/functions';
import { defaultSeason } from '../shared/game';
import {
  badRequest,
  handle,
  headerMap,
  methodNotAllowed,
  notConfigured,
  ok,
  readJsonBody,
  unauthorized,
} from '../shared/http';
import {
  authHashOf,
  createPlayer,
  findPlayerByAuth,
  loadPlayer,
  readPrincipal,
  renamePlayer,
  secretsMatch,
  sha256,
  toPlayer,
  PLAYER_ID_HEADER,
  PLAYER_SECRET_HEADER,
} from '../shared/identity';
import { getStore, seasonKey } from '../shared/storage';

export const run = handle(async (_context: Context, req: HttpRequest) => {
  const store = getStore();
  if (!store) return notConfigured();
  if ((req.method || 'POST').toUpperCase() !== 'POST') return methodNotAllowed();

  const headers = headerMap(req);
  const principal = readPrincipal(headers['x-ms-client-principal']);
  if (!principal) return unauthorized('not_signed_in');

  const body = readJsonBody(req) ?? {};
  const season = (typeof body.season === 'string' && body.season.trim()) || defaultSeason();
  if (!season) return badRequest('missing_season');

  const authHash = authHashOf(principal.identityProvider, principal.userId);
  const existing = await findPlayerByAuth(store, season, authHash);

  const anonId = (headers[PLAYER_ID_HEADER] || '').trim();
  const anonSecret = (headers[PLAYER_SECRET_HEADER] || '').trim();

  /* ---------------------------------------------- already a claimed season */

  if (existing) {
    const alsoAnon = anonId && anonId !== existing.rowKey;
    return ok({
      season,
      player: toPlayer(existing),
      claimed: false,
      alreadyLinked: true,
      // The browser should switch to this player. Its anonymous season is
      // still on the server, untouched, should it ever want it back.
      supersededPlayerId: alsoAnon ? anonId : null,
    });
  }

  /* -------------------------------------------------- claim the anon season */

  if (anonId && anonSecret) {
    const entity = await loadPlayer(store, season, anonId);
    if (!entity || !secretsMatch(entity.secretHash, sha256(anonSecret))) {
      return unauthorized('unknown_player');
    }

    const now = new Date().toISOString();
    await store.ensure('players');
    await store.table('players').upsertEntity(
      {
        partitionKey: entity.partitionKey,
        rowKey: entity.rowKey,
        authHash,
        authProvider: principal.identityProvider,
        updatedAt: now,
      },
      'Merge',
    );
    await store.ensure('authLinks');
    await store.table('authLinks').upsertEntity(
      { partitionKey: seasonKey(season), rowKey: authHash, playerId: entity.rowKey, createdAt: now },
      'Merge',
    );

    let displayName = entity.displayName;
    if (typeof body.displayName === 'string' && body.displayName.trim()) {
      displayName = await renamePlayer(store, season, entity, body.displayName);
    }

    return ok({
      season,
      player: { ...toPlayer(entity), displayName, authenticated: true },
      claimed: true,
      alreadyLinked: false,
      supersededPlayerId: null,
    });
  }

  /* ------------------------------------- signed in with no season to claim */

  const { entity, secret } = await createPlayer(store, season, body.displayName, principal);
  return ok({
    season,
    player: toPlayer(entity),
    secret,
    claimed: false,
    created: true,
    alreadyLinked: false,
    supersededPlayerId: null,
  });
});

export default run;
