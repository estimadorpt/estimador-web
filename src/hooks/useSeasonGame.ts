"use client";

/**
 * Season-long play for "Contra o Modelo", layered on top of the local game.
 *
 * The rule this hook exists to enforce: when there is no backend, nothing
 * changes. `status` starts as `checking`, becomes `local` on any failure — no
 * API deployed, no storage account, offline, a slow probe — and only becomes
 * `online` when `/api/health` says `configured: true`. Every caller treats
 * anything but `online` as "the game you already had".
 *
 * When online, localStorage stays a write-through cache. The server is the
 * record of truth for scoring and the leaderboard; the browser copy is what
 * makes the page instant and what keeps working if the API goes away later.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PickMap, PredictionGameData } from '@/lib/utils/prediction-game';
import {
  buildFixtureIdIndex,
  claimSeason,
  clearCredentials,
  fetchLeaderboard,
  fetchMyPicks,
  historyFromServer,
  loadCredentials,
  picksToServer,
  probeGame,
  saveCredentials,
  setDisplayName as setDisplayNameRequest,
  signInHref,
  submitPicks,
  type ApiPlayer,
  type LeaderboardResponse,
  type RejectedPick,
  type StoredCredentials,
} from '@/lib/utils/prediction-game-api';

export type GameStatus = 'checking' | 'local' | 'online';
export type SyncState = 'idle' | 'saving' | 'saved' | 'error';

export interface SeasonGame {
  status: GameStatus;
  player: ApiPlayer | null;
  /** Signed in with the identity provider, as opposed to anonymous. */
  authenticated: boolean;
  /** Picks the server already holds, in local `home|away` key form. */
  serverPicks: PickMap | null;
  syncState: SyncState;
  rejected: RejectedPick[];
  leaderboard: LeaderboardResponse | null;
  deadline: string | null;
  /** Push the open round's picks. Debounced; safe to call on every keystroke. */
  push: (matchday: number, picks: PickMap, fixtureKeys: readonly string[]) => void;
  setDisplayName: (name: string) => Promise<void>;
  claim: () => Promise<{ ok: boolean; alreadyLinked: boolean } | null>;
  refreshLeaderboard: () => Promise<void>;
  forget: () => void;
  signInUrl: string;
}

const PUSH_DEBOUNCE_MS = 900;

export function useSeasonGame(data: PredictionGameData): SeasonGame {
  const season = data.season;

  const [status, setStatus] = useState<GameStatus>('checking');
  const [player, setPlayer] = useState<ApiPlayer | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [serverPicks, setServerPicks] = useState<PickMap | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [rejected, setRejected] = useState<RejectedPick[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);

  const credentials = useRef<StoredCredentials | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ matchday: number; picks: Record<string, [number, number, number]> } | null>(
    null,
  );
  const alive = useRef(true);

  const index = useMemo(() => buildFixtureIdIndex(data), [data]);

  /* ------------------------------------------------------------- discovery */

  useEffect(() => {
    alive.current = true;

    (async () => {
      const health = await probeGame(season);
      if (!alive.current) return;
      if (!health) {
        setStatus('local');
        return;
      }

      credentials.current = loadCredentials(season);
      setAuthenticated(health.authenticated);
      setDeadline(health.deadline ?? null);

      // Claim only when there is an anonymous season in this browser to weld
      // onto the identity. A signed-in visitor with nothing local is resolved
      // by the ordinary /api/picks call below — claiming here would mint an
      // empty player for anyone who merely happens to be logged in.
      if (health.authenticated && credentials.current) {
        const claimed = await claimSeason({ season, credentials: credentials.current });
        if (claimed?.ok && claimed.player) {
          if (claimed.secret) {
            credentials.current = {
              season,
              playerId: claimed.player.id,
              secret: claimed.secret,
              displayName: claimed.player.displayName,
            };
            saveCredentials(credentials.current);
          }
          if (!alive.current) return;
          setPlayer(claimed.player);
        }
      }

      const mine = await fetchMyPicks(season, credentials.current);
      if (!alive.current) return;

      if (mine?.ok) {
        if (mine.player) setPlayer(mine.player);
        setDeadline(mine.deadline ?? null);
        setServerPicks(historyFromServer(index, mine.history || {}));
      } else {
        // No stored season yet — an empty map, not a failure. The first pick
        // will create the player.
        setServerPicks({});
      }

      setStatus('online');
      const board = await fetchLeaderboard(season, credentials.current);
      if (alive.current && board?.ok) setLeaderboard(board);
    })();

    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [season, index]);

  /* ----------------------------------------------------------------- push */

  const flush = useCallback(async () => {
    const job = pending.current;
    pending.current = null;
    if (!job) return;

    setSyncState('saving');
    const response = await submitPicks({
      season,
      matchday: job.matchday,
      picks: job.picks,
      credentials: credentials.current,
      displayName: credentials.current?.displayName || undefined,
    });

    if (!alive.current) return;

    if (!response?.ok) {
      setSyncState('error');
      return;
    }

    // The secret comes back exactly once, when the player is created.
    if (response.secret && response.player) {
      credentials.current = {
        season,
        playerId: response.player.id,
        secret: response.secret,
        displayName: response.player.displayName,
      };
      saveCredentials(credentials.current);
    }
    if (response.player) setPlayer(response.player);
    setRejected(response.rejected || []);
    setSyncState('saved');
  }, [season]);

  const push = useCallback(
    (matchday: number, picks: PickMap, fixtureKeys: readonly string[]) => {
      if (status !== 'online') return;
      const payload = picksToServer(index, matchday, picks, fixtureKeys);
      if (Object.keys(payload).length === 0) return;

      pending.current = { matchday, picks: payload };
      setSyncState('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, PUSH_DEBOUNCE_MS);
    },
    [status, index, flush],
  );

  /* ---------------------------------------------------------------- admin */

  const setDisplayName = useCallback(
    async (name: string) => {
      if (status !== 'online') return;
      const trimmed = name.trim();
      if (!trimmed) return;

      const response = await setDisplayNameRequest({
        season,
        displayName: trimmed,
        credentials: credentials.current,
      });
      if (!response?.ok || !response.player) return;

      // Naming yourself is what creates the account, so this is one of the two
      // moments the secret can arrive.
      credentials.current = {
        season,
        playerId: response.player.id,
        secret: response.secret ?? credentials.current?.secret ?? '',
        displayName: response.player.displayName,
      };
      if (credentials.current.secret) saveCredentials(credentials.current);
      setPlayer(response.player);
    },
    [status, season],
  );

  const claim = useCallback(async () => {
    if (status !== 'online') return null;
    const response = await claimSeason({ season, credentials: credentials.current });
    if (!response?.ok) return null;

    if (response.secret && response.player) {
      credentials.current = {
        season,
        playerId: response.player.id,
        secret: response.secret,
        displayName: response.player.displayName,
      };
      saveCredentials(credentials.current);
    }
    setPlayer(response.player);
    setAuthenticated(true);

    const mine = await fetchMyPicks(season, credentials.current);
    if (mine?.ok) setServerPicks(historyFromServer(index, mine.history || {}));

    return { ok: true, alreadyLinked: response.alreadyLinked };
  }, [status, season, index]);

  const refreshLeaderboard = useCallback(async () => {
    if (status !== 'online') return;
    const board = await fetchLeaderboard(season, credentials.current);
    if (board?.ok) setLeaderboard(board);
  }, [status, season]);

  const forget = useCallback(() => {
    clearCredentials();
    credentials.current = null;
    setPlayer(null);
    setServerPicks({});
  }, []);

  return {
    status,
    player,
    authenticated,
    serverPicks,
    syncState,
    rejected,
    leaderboard,
    deadline,
    push,
    setDisplayName,
    claim,
    refreshLeaderboard,
    forget,
    signInUrl: signInHref(),
  };
}
