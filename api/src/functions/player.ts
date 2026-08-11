/**
 * GET  /api/player — who the server thinks you are
 * POST /api/player — set (or claim, by creating) a display name
 *
 * Split out from /api/picks so a first-timer can choose a nickname before a
 * matchday is open, and so renaming does not have to pretend to be a pick.
 *
 * The only personal datum this endpoint writes is the name the player typed.
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
  queryValue,
  readJsonBody,
  unauthorized,
} from '../shared/http';
import { renamePlayer, resolvePlayer, sanitizeDisplayName } from '../shared/identity';
import { getStore } from '../shared/storage';

export const run = handle(async (_context: Context, req: HttpRequest) => {
  const store = getStore();
  if (!store) return notConfigured();

  const method = (req.method || 'GET').toUpperCase();
  const headers = headerMap(req);

  if (method === 'GET') {
    const season = queryValue(req, 'season') || defaultSeason();
    if (!season) return badRequest('missing_season');

    const resolution = await resolvePlayer(store, season, headers);
    if (resolution.badCredentials) return unauthorized('unknown_player');
    return ok({ season, player: resolution.player });
  }

  if (method !== 'POST') return methodNotAllowed();

  const body = readJsonBody(req) ?? {};
  const season = (typeof body.season === 'string' && body.season.trim()) || defaultSeason();
  if (!season) return badRequest('missing_season');
  if (typeof body.displayName !== 'string' || !body.displayName.trim()) {
    return badRequest('missing_display_name');
  }

  const resolution = await resolvePlayer(store, season, headers, {
    createWith: body.displayName,
  });
  if (resolution.badCredentials) return unauthorized('unknown_player');
  if (!resolution.player || !resolution.entity) return badRequest('no_player');

  // A brand-new player was just created with this name; renaming again would
  // be a pointless second write.
  const displayName = resolution.secret
    ? resolution.player.displayName
    : await renamePlayer(store, season, resolution.entity, body.displayName);

  return ok({
    season,
    player: { ...resolution.player, displayName },
    secret: resolution.secret,
    sanitized: displayName !== sanitizeDisplayName(body.displayName, resolution.player.id),
  });
});

export default run;
