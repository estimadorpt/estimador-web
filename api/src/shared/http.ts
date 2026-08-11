/**
 * HTTP plumbing shared by every function.
 *
 * The contract the site depends on: an unconfigured backend answers with a
 * readable JSON body and `configured: false`, and a thrown error answers 500
 * with a body rather than an empty gateway failure. The browser treats both as
 * "stay in local-only mode".
 */

import type { Context, HttpRequest } from '@azure/functions';

export interface JsonResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

const NO_STORE = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export function json(status: number, body: unknown): JsonResponse {
  return { status, headers: { ...NO_STORE }, body };
}

export function ok(body: Record<string, unknown>): JsonResponse {
  return json(200, { ok: true, ...body });
}

export function badRequest(error: string, extra: Record<string, unknown> = {}): JsonResponse {
  return json(400, { ok: false, error, ...extra });
}

export function unauthorized(error = 'unauthorized'): JsonResponse {
  return json(401, { ok: false, error });
}

export function notFound(error = 'not_found'): JsonResponse {
  return json(404, { ok: false, error });
}

export function methodNotAllowed(): JsonResponse {
  return json(405, { ok: false, error: 'method_not_allowed' });
}

/**
 * The one response the frontend keys its whole fallback on.
 *
 * 503 rather than 500: this is a deliberate, healthy state for a site whose
 * backend has not been provisioned, and it must be distinguishable from a bug.
 */
export function notConfigured(): JsonResponse {
  return json(503, {
    ok: false,
    configured: false,
    error: 'not_configured',
    message:
      'The prediction game backend is not configured. Set the GAME_STORAGE_CONNECTION_STRING app setting to enable season-long play.',
  });
}

/** Read a JSON body whatever shape the host handed us. Never throws. */
export function readJsonBody(req: HttpRequest): Record<string, unknown> | null {
  const raw = req.body as unknown;
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'object' && !Buffer.isBuffer(raw)) {
    return raw as Record<string, unknown>;
  }
  try {
    const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
    const parsed = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Header lookup that does not care about case. */
export function headerMap(req: HttpRequest): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  const source = (req.headers || {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') out[key.toLowerCase()] = value;
  }
  return out;
}

export function queryValue(req: HttpRequest, name: string): string | undefined {
  const value = (req.query || {})[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function queryInt(req: HttpRequest, name: string): number | null {
  const raw = queryValue(req, name);
  if (raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/**
 * Wrap a handler so no failure mode reaches the client as an empty response.
 *
 * A storage outage, a malformed body, a bug — all become a JSON 500 that the
 * frontend can recognise and fall back from.
 */
export function handle(
  fn: (context: Context, req: HttpRequest) => Promise<JsonResponse>,
): (context: Context, req: HttpRequest) => Promise<void> {
  return async (context: Context, req: HttpRequest): Promise<void> => {
    try {
      context.res = await fn(context, req);
    } catch (error) {
      context.log.error('unhandled error', error);
      context.res = json(500, {
        ok: false,
        error: 'server_error',
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  };
}
