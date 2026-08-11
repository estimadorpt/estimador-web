/**
 * POST /api/score — ingest the published manifest and settle every pick.
 *
 * Called by the model repo after each update:
 *
 *     uv run python scripts/export_game_fixtures.py --post-score
 *
 * with `x-game-admin-token` matching the GAME_ADMIN_TOKEN app setting. The
 * posted matchdays become the API's canonical record, which removes the
 * ordering dependency on the static-site deploy finishing first.
 *
 * A body-less call re-scores from what is already stored, which is the retry
 * path when a matchday's results land late or a result is corrected.
 */

import type { Context, HttpRequest } from '@azure/functions';
import { defaultSeason, runScoring, saveMatchdays } from '../shared/game';
import { badRequest, handle, headerMap, notConfigured, ok, unauthorized } from '../shared/http';
import { parseMatchday, type ManifestMatchday } from '../shared/manifest';
import { ADMIN_TOKEN_HEADER, secretsMatch, sha256 } from '../shared/identity';
import { getStore } from '../shared/storage';
import { readJsonBody } from '../shared/http';

export const run = handle(async (_context: Context, req: HttpRequest) => {
  const store = getStore();
  if (!store) return notConfigured();

  const expected = (process.env.GAME_ADMIN_TOKEN || '').trim();
  if (!expected) {
    // Refusing beats scoring on an unauthenticated request: whoever calls this
    // decides what the model was deemed to have predicted.
    return unauthorized('admin_token_not_configured');
  }
  const supplied = (headerMap(req)[ADMIN_TOKEN_HEADER] || '').trim();
  if (!supplied || !secretsMatch(sha256(expected), sha256(supplied))) {
    return unauthorized('bad_admin_token');
  }

  const body = readJsonBody(req) ?? {};
  const season = (typeof body.season === 'string' && body.season.trim()) || defaultSeason();
  if (!season) return badRequest('missing_season');

  let ingested = 0;
  if (Array.isArray(body.matchdays)) {
    const parsed = body.matchdays
      .map(parseMatchday)
      .filter((m): m is ManifestMatchday => m !== null);
    if (parsed.length === 0) return badRequest('no_usable_matchdays');
    ingested = await saveMatchdays(store, season, parsed);
  }

  const summary = await runScoring(store, season);
  return ok({ ingested, ...summary });
});

export default run;
