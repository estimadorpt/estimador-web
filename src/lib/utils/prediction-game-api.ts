/**
 * Client for the season-long "Contra o Modelo" backend.
 *
 * Everything here is optional. The game works with no backend at all — that is
 * the mode the site shipped in, and it stays the fallback. If `/api/health`
 * does not answer `configured: true`, nothing below is used again and the
 * component behaves exactly as it did before.
 *
 * No function here throws. A network failure, a 404 because no API is
 * deployed, a 503 because no storage account exists — all of them return a
 * value that means "stay local".
 */

import type { PickMap, PredictionGameData, ProbVector } from './prediction-game';

const BASE = '/api';

/** Give up quickly: a slow probe must not delay the playable UI. */
const PROBE_TIMEOUT_MS = 6000;
const REQUEST_TIMEOUT_MS = 12000;

/* ----------------------------------------------------------- fixture ids */

/**
 * Mirror of `slugify` in the model repo
 * (estimador-football/src/liga_predict/analysis/game.py).
 *
 * The accent table is copied rather than replaced with a Unicode normalise so
 * the two implementations fail in the same way on the same input. Published
 * team names are ASCII today; the test suite checks every id we derive against
 * the real manifest, so a name that broke this would fail the build rather
 * than silently mis-key a pick.
 */
export function slugify(name: string): string {
  const accents: Record<string, string> = {
    á: 'a', à: 'a', ã: 'a', â: 'a', ä: 'a',
    é: 'e', ê: 'e', è: 'e',
    í: 'i', ì: 'i',
    ó: 'o', õ: 'o', ô: 'o', ò: 'o',
    ú: 'u', ù: 'u', ü: 'u',
    ç: 'c', ñ: 'n',
  };
  let text = String(name).trim().toLowerCase();
  for (const [from, to] of Object.entries(accents)) {
    text = text.split(from).join(to);
  }
  return text.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** `md02-sporting-cp-vs-vitoria-sc` — the server's identity for a fixture. */
export function gameFixtureId(matchday: number, home: string, away: string): string {
  return `md${String(matchday).padStart(2, '0')}-${slugify(home)}-vs-${slugify(away)}`;
}

export interface FixtureIdIndex {
  /** local `home|away` key, scoped by matchday, to the server's fixture id */
  toServer: Map<string, string>;
  /** server fixture id back to the local `home|away` key */
  toLocal: Map<string, string>;
  /** server fixture id to the matchday it belongs to */
  matchdayOf: Map<string, number>;
}

/**
 * Build both directions of the id mapping from the data already on the page.
 *
 * Deriving it from `PredictionGameData` rather than downloading the 120 KB
 * manifest keeps the page weight unchanged, and the server rejects any id it
 * does not recognise, so a mismatch is a reported rejection rather than a
 * corrupted season.
 */
export function buildFixtureIdIndex(data: PredictionGameData): FixtureIdIndex {
  const toServer = new Map<string, string>();
  const toLocal = new Map<string, string>();
  const matchdayOf = new Map<string, number>();

  for (const round of data.rounds) {
    for (const fixture of round.fixtures) {
      const id = gameFixtureId(round.matchday, fixture.home, fixture.away);
      toServer.set(`${round.matchday}|${fixture.key}`, id);
      toLocal.set(id, fixture.key);
      matchdayOf.set(id, round.matchday);
    }
  }

  return { toServer, toLocal, matchdayOf };
}

export function serverIdFor(
  index: FixtureIdIndex,
  matchday: number,
  fixtureKey: string,
): string | undefined {
  return index.toServer.get(`${matchday}|${fixtureKey}`);
}

/* ------------------------------------------------------------ credentials */

export const CREDENTIALS_KEY = 'estimador:contra-o-modelo:player:v1';

export interface StoredCredentials {
  season: string;
  playerId: string;
  secret: string;
  displayName: string;
}

/**
 * The anonymous identity, held only in this browser.
 *
 * The secret is the whole account: whoever has it owns the season. It is minted
 * server-side, shown to nobody, and can be traded for a durable identity by
 * signing in and calling `claimSeason`.
 */
export function loadCredentials(season: string): StoredCredentials | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CREDENTIALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCredentials>;
    if (parsed?.season !== season) return null;
    if (typeof parsed.playerId !== 'string' || typeof parsed.secret !== 'string') return null;
    return {
      season,
      playerId: parsed.playerId,
      secret: parsed.secret,
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : '',
    };
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: StoredCredentials): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch {
    /* private mode — the player stays anonymous for this session only */
  }
}

export function clearCredentials(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CREDENTIALS_KEY);
  } catch {
    /* nothing we can do */
  }
}

/* --------------------------------------------------------------- requests */

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  credentials?: StoredCredentials | null;
  timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  if (typeof fetch === 'undefined') return null;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS)
    : null;

  const headers: Record<string, string> = { accept: 'application/json' };
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.credentials) {
    headers['x-game-player-id'] = options.credentials.playerId;
    headers['x-game-secret'] = options.credentials.secret;
  }

  try {
    const response = await fetch(`${BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller?.signal,
      credentials: 'same-origin',
    });

    // A static host with no API answers 404 with HTML. Anything that is not
    // JSON means there is no backend here.
    const type = response.headers.get('content-type') || '';
    if (!type.includes('json')) return null;

    const payload = (await response.json()) as T & { ok?: boolean };
    if (!response.ok && payload?.ok !== true) {
      return { ...(payload as object), ok: false } as T;
    }
    return payload;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ types */

export interface HealthResponse {
  ok: boolean;
  configured: boolean;
  season: string;
  serverTime: string;
  authenticated: boolean;
  authProvider: string | null;
  openMatchday?: number | null;
  deadline?: string | null;
  reason?: string;
}

export interface ApiPlayer {
  id: string;
  displayName: string;
  authenticated: boolean;
  authProvider?: string;
}

export interface PicksResponse {
  ok: boolean;
  season: string;
  matchday: number | null;
  serverTime: string;
  player: ApiPlayer | null;
  openMatchday: number | null;
  deadline: string | null;
  picks: Record<string, ProbVector>;
  history: Record<string, Record<string, ProbVector>>;
  error?: string;
}

export interface RejectedPick {
  fixtureId: string;
  reason: 'unknown_fixture' | 'locked' | 'invalid_probabilities' | 'not_priced';
  locksAt?: string;
}

export interface SubmitResponse {
  ok: boolean;
  season: string;
  matchday: number;
  player: ApiPlayer;
  secret?: string;
  accepted: string[];
  rejected: RejectedPick[];
  picks: Record<string, ProbVector>;
  error?: string;
}

export interface LeaderboardRow {
  rank: number | null;
  playerId: string;
  displayName: string;
  isModel: boolean;
  matches: number;
  matchdays: number;
  totalRps: number;
  meanRps: number | null;
  modelTotalRps: number;
  modelMeanRps: number | null;
  roundsWon: number;
  roundsCounted: number;
  edge: number;
}

export interface LeaderboardResponse {
  ok: boolean;
  season: string;
  updatedAt: string | null;
  you: string | null;
  model: LeaderboardRow | null;
  rows: LeaderboardRow[];
  count: number;
  error?: string;
}

export interface ClaimResponse {
  ok: boolean;
  season: string;
  player: ApiPlayer;
  secret?: string;
  claimed: boolean;
  created?: boolean;
  alreadyLinked: boolean;
  supersededPlayerId: string | null;
  error?: string;
}

/* --------------------------------------------------------------- endpoints */

/** The single probe the whole online mode hangs off. */
export async function probeGame(season: string): Promise<HealthResponse | null> {
  const health = await request<HealthResponse>(
    `/health?season=${encodeURIComponent(season)}`,
    { timeoutMs: PROBE_TIMEOUT_MS },
  );
  if (!health || health.configured !== true) return null;
  return health;
}

export async function fetchMyPicks(
  season: string,
  credentials: StoredCredentials | null,
  matchday?: number | null,
): Promise<PicksResponse | null> {
  const params = new URLSearchParams({ season });
  if (matchday !== undefined && matchday !== null) params.set('matchday', String(matchday));
  return request<PicksResponse>(`/picks?${params.toString()}`, { credentials });
}

export async function submitPicks(input: {
  season: string;
  matchday: number;
  picks: Record<string, ProbVector>;
  meta?: unknown;
  displayName?: string;
  credentials: StoredCredentials | null;
}): Promise<SubmitResponse | null> {
  return request<SubmitResponse>('/picks', {
    method: 'POST',
    credentials: input.credentials,
    body: {
      season: input.season,
      matchday: input.matchday,
      picks: input.picks,
      meta: input.meta,
      displayName: input.displayName,
    },
  });
}

export interface PlayerResponse {
  ok: boolean;
  season: string;
  player: ApiPlayer | null;
  secret?: string;
  error?: string;
}

/**
 * Set the name shown on the leaderboard, creating the player if this is the
 * first thing they have ever done. Lets a first-timer be somebody before a
 * matchday is open.
 */
export async function setDisplayName(input: {
  season: string;
  displayName: string;
  credentials: StoredCredentials | null;
}): Promise<PlayerResponse | null> {
  return request<PlayerResponse>('/player', {
    method: 'POST',
    credentials: input.credentials,
    body: { season: input.season, displayName: input.displayName },
  });
}

export async function fetchLeaderboard(
  season: string,
  credentials: StoredCredentials | null,
): Promise<LeaderboardResponse | null> {
  return request<LeaderboardResponse>(
    `/leaderboard?season=${encodeURIComponent(season)}`,
    { credentials },
  );
}

export async function claimSeason(input: {
  season: string;
  displayName?: string;
  credentials: StoredCredentials | null;
}): Promise<ClaimResponse | null> {
  return request<ClaimResponse>('/claim', {
    method: 'POST',
    credentials: input.credentials,
    body: { season: input.season, displayName: input.displayName },
  });
}

/** Where the sign-in button points. Static Web Apps handles the rest. */
export function signInHref(returnTo?: string): string {
  const target =
    returnTo ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  return `/.auth/login/github?post_login_redirect_uri=${encodeURIComponent(target)}`;
}

export const SIGN_OUT_HREF = '/.auth/logout';

/* ---------------------------------------------------------------- mapping */

/** Local pick map (keyed `home|away`) to the server's fixture ids. */
export function picksToServer(
  index: FixtureIdIndex,
  matchday: number,
  picks: PickMap,
  fixtureKeys: readonly string[],
): Record<string, ProbVector> {
  const out: Record<string, ProbVector> = {};
  for (const key of fixtureKeys) {
    const pick = picks[key];
    if (!pick) continue;
    const id = serverIdFor(index, matchday, key);
    if (!id) continue;
    out[id] = pick.p;
  }
  return out;
}

/** Server picks back into the local pick map shape. */
export function picksFromServer(
  index: FixtureIdIndex,
  serverPicks: Record<string, ProbVector>,
): PickMap {
  const out: PickMap = {};
  for (const [id, probs] of Object.entries(serverPicks)) {
    const key = index.toLocal.get(id);
    if (!key) continue;
    if (!Array.isArray(probs) || probs.length !== 3) continue;
    out[key] = { p: [probs[0], probs[1], probs[2]] };
  }
  return out;
}

/** Flatten `{matchday: {fixtureId: probs}}` into one local pick map. */
export function historyFromServer(
  index: FixtureIdIndex,
  history: Record<string, Record<string, ProbVector>>,
): PickMap {
  const out: PickMap = {};
  for (const round of Object.values(history || {})) {
    Object.assign(out, picksFromServer(index, round));
  }
  return out;
}
