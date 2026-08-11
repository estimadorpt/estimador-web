/**
 * The probe the site makes on mount.
 *
 * Always 200, even when nothing is configured — this is the one endpoint whose
 * job is to report the truth about the backend rather than to fail. Anything
 * other than `configured: true` puts the browser in local-only mode.
 */

import type { Context, HttpRequest } from '@azure/functions';
import { defaultSeason, loadAllMatchdays, currentMatchday, deadlineFor } from '../shared/game';
import { handle, headerMap, json, queryValue } from '../shared/http';
import { readPrincipal } from '../shared/identity';
import { getStore, isConfigured } from '../shared/storage';

export const run = handle(async (_context: Context, req: HttpRequest) => {
  const season = queryValue(req, 'season') || defaultSeason();
  const configured = isConfigured();
  const principal = readPrincipal(headerMap(req)['x-ms-client-principal']);

  const body: Record<string, unknown> = {
    ok: true,
    configured,
    season,
    serverTime: new Date().toISOString(),
    authenticated: principal !== null,
    authProvider: principal?.identityProvider ?? null,
  };

  const store = getStore();
  if (!configured || !store || !season) {
    return json(200, { ...body, reason: configured ? 'no_season' : 'no_storage' });
  }

  try {
    const matchdays = await loadAllMatchdays(store, season);
    const open = currentMatchday(matchdays, Date.now());
    body.matchdays = matchdays.length;
    body.openMatchday = open;
    body.deadline = open === null ? null : deadlineFor(matchdays, open);
  } catch (error) {
    // A storage hiccup on the probe should degrade the game, not 500 the page.
    body.configured = false;
    body.reason = 'storage_unavailable';
    body.detail = error instanceof Error ? error.message : 'unknown error';
  }

  return json(200, body);
});

export default run;
