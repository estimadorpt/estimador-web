/**
 * GET  /api/picks?season=&matchday=   — what the server holds for you
 * POST /api/picks                     — submit picks for one matchday
 *
 * The deadline is never taken from the request. Every fixture is checked
 * against `locks_at` in the manifest and the server's own clock, and the
 * response says exactly which picks were stored and which were refused.
 */

import type { Context, HttpRequest } from '@azure/functions';
import {
  defaultSeason,
  fixtureViews,
  listPlayerPicks,
  loadAllMatchdays,
  loadMatchday,
  loadPicks,
  mergePicks,
  parseStoredPicks,
  savePicks,
  currentMatchday,
  deadlineFor,
  validatePicks,
  type PickRecord,
} from '../shared/game';
import { fixtureIsOpen } from '../shared/manifest';
import {
  badRequest,
  handle,
  headerMap,
  methodNotAllowed,
  notConfigured,
  notFound,
  ok,
  queryInt,
  queryValue,
  readJsonBody,
  unauthorized,
} from '../shared/http';
import { renamePlayer, resolvePlayer } from '../shared/identity';
import { getStore, type GameStore } from '../shared/storage';

export const run = handle(async (_context: Context, req: HttpRequest) => {
  const store = getStore();
  if (!store) return notConfigured();

  const method = (req.method || 'GET').toUpperCase();
  if (method === 'GET') return getPicks(store, req);
  if (method === 'POST') return postPicks(store, req);
  return methodNotAllowed();
});

/* -------------------------------------------------------------------- GET */

async function getPicks(store: GameStore, req: HttpRequest) {
  const season = queryValue(req, 'season') || defaultSeason();
  if (!season) return badRequest('missing_season');

  const headers = headerMap(req);
  const resolution = await resolvePlayer(store, season, headers);
  if (resolution.badCredentials) return unauthorized('unknown_player');

  const now = Date.now();
  const matchdays = await loadAllMatchdays(store, season);
  const open = currentMatchday(matchdays, now);

  const requested = queryInt(req, 'matchday');
  const target = requested ?? open;

  const base = {
    season,
    serverTime: new Date(now).toISOString(),
    player: resolution.player,
    openMatchday: open,
    deadline: open === null ? null : deadlineFor(matchdays, open),
  };

  const played: Record<number, PickRecord> = resolution.player
    ? await listPlayerPicks(store, season, resolution.player.id)
    : {};

  if (target === null) {
    // Nothing open and nothing asked for: hand back the season history so the
    // site can show a played-rounds view without a request per matchday.
    return ok({ ...base, matchday: null, picks: {}, history: played });
  }

  const md = matchdays.find(m => m.matchday === target);
  if (!md) return notFound('unknown_matchday');

  return ok({
    ...base,
    matchday: target,
    locked: !md.fixtures.some(f => fixtureIsOpen(f, now)),
    fixtures: fixtureViews(md, now),
    picks: played[target] ?? {},
    history: played,
  });
}

/* ------------------------------------------------------------------- POST */

async function postPicks(store: GameStore, req: HttpRequest) {
  const body = readJsonBody(req);
  if (!body) return badRequest('invalid_body');

  const season = (typeof body.season === 'string' && body.season.trim()) || defaultSeason();
  if (!season) return badRequest('missing_season');

  const matchday = Number(body.matchday);
  if (!Number.isFinite(matchday) || matchday <= 0) return badRequest('invalid_matchday');

  const headers = headerMap(req);
  // A first-timer has no credentials: creating a player here is what lets them
  // play immediately, without an account and without a sign-in detour.
  const resolution = await resolvePlayer(store, season, headers, {
    createWith: body.displayName,
  });
  if (resolution.badCredentials) return unauthorized('unknown_player');
  if (!resolution.player || !resolution.entity) return badRequest('no_player');

  const md = await loadMatchday(store, season, Math.trunc(matchday));
  if (!md) return notFound('unknown_matchday');

  const now = Date.now();
  const { accepted, rejected } = validatePicks(md, body.picks, now);

  const existing = await loadPicks(store, season, md.matchday, resolution.player.id);
  const stored = parseStoredPicks(existing);
  const merged = mergePicks(md, stored, accepted);

  let displayName = resolution.player.displayName;
  if (typeof body.displayName === 'string' && body.displayName.trim() && !resolution.secret) {
    displayName = await renamePlayer(store, season, resolution.entity, body.displayName);
  }

  if (Object.keys(accepted).length > 0 || !existing) {
    await savePicks(
      store,
      season,
      md.matchday,
      resolution.player.id,
      merged,
      displayName,
      body.meta,
    );
  }

  return ok({
    season,
    matchday: md.matchday,
    serverTime: new Date(now).toISOString(),
    player: { ...resolution.player, displayName },
    // Returned exactly once, at creation. Losing it means losing the anonymous
    // season, which is precisely why signing in and claiming exists.
    secret: resolution.secret,
    accepted: Object.keys(accepted),
    rejected,
    picks: merged,
    deadline: md.fixtures.reduce<string | null>(
      (earliest, f) => (!earliest || f.locks_at < earliest ? f.locks_at : earliest),
      null,
    ),
  });
}

export default run;
