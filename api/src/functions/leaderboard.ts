/**
 * GET /api/leaderboard?season=2026-27
 *
 * Public. Season total RPS, mean RPS, matchdays played, "beat the model in N
 * of M rounds" — and a row for the model itself, sorted in among the humans so
 * you can see whether you are above or below it.
 */

import type { Context, HttpRequest } from '@azure/functions';
import { defaultSeason, readLeaderboard } from '../shared/game';
import { badRequest, handle, headerMap, notConfigured, ok, queryValue } from '../shared/http';
import { resolvePlayer } from '../shared/identity';
import { getStore } from '../shared/storage';

export const run = handle(async (_context: Context, req: HttpRequest) => {
  const store = getStore();
  if (!store) return notConfigured();

  const season = queryValue(req, 'season') || defaultSeason();
  if (!season) return badRequest('missing_season');

  const { rows, model, updatedAt } = await readLeaderboard(store, season);

  // Tell the caller which row is theirs so the site can highlight it without a
  // second request. An unidentified caller simply gets no highlight.
  let you: string | null = null;
  try {
    const resolution = await resolvePlayer(store, season, headerMap(req));
    you = resolution.player?.id ?? null;
  } catch {
    /* identification is a nicety here, never a reason to fail the board */
  }

  return ok({
    season,
    updatedAt,
    you,
    model,
    rows,
    count: rows.filter(r => !r.isModel).length,
  });
});

export default run;
