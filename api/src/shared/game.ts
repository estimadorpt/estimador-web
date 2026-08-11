/**
 * Game logic that sits between the HTTP handlers and storage.
 *
 * Fixture identity, lock times and the model's frozen probabilities all come
 * from the manifest here — never from the request. A client can ask to store a
 * pick; it cannot tell the server what the deadline was.
 */

import {
  loadBundledManifest,
  matchdayDeadline,
  parseMatchday,
  playableMatchday,
  toScorable,
  fixtureIsOpen,
  fixtureHasResult,
  fixtureModelProbs,
  type ManifestFixture,
  type ManifestMatchday,
} from './manifest';
import {
  aggregateSeason,
  compareLeaderboard,
  scoreModelSlate,
  scoreRound,
  type MatchdayScoreRow,
} from './scoring';
import { odata } from '@azure/data-tables';
import {
  isTableNotFound,
  listPartition,
  roundKey,
  safeKey,
  seasonKey,
  tryGetEntity,
  type GameStore,
  type ManifestEntity,
  type PicksEntity,
  type ScoreEntity,
  type StandingEntity,
} from './storage';

/** The model competes on the leaderboard under a reserved row key. */
export const MODEL_ROW_KEY = '__model__';

export function defaultSeason(): string {
  const fromEnv = (process.env.GAME_SEASON || '').trim();
  if (fromEnv) return fromEnv;
  return loadBundledManifest()?.season || '';
}

function padMatchday(matchday: number): string {
  return String(matchday).padStart(2, '0');
}

/* --------------------------------------------------------------- manifest */

function bundledMatchday(season: string, matchday: number): ManifestMatchday | null {
  const bundled = loadBundledManifest();
  if (!bundled || bundled.season !== season) return null;
  return bundled.matchdays.find(m => m.matchday === matchday) ?? null;
}

/**
 * The authoritative block for one matchday.
 *
 * Storage first: `/api/score` writes what the model repo posted, so a fresh
 * publication takes effect without waiting for a static-site deploy. The
 * bundled copy is the cold-start fallback.
 */
export async function loadMatchday(
  store: GameStore,
  season: string,
  matchday: number,
): Promise<ManifestMatchday | null> {
  try {
    await store.ensure('manifest');
    const entity = await tryGetEntity<ManifestEntity>(
      store.table('manifest'),
      seasonKey(season),
      padMatchday(matchday),
    );
    if (entity?.fixtures) {
      const parsed = parseMatchday(JSON.parse(entity.fixtures));
      if (parsed) return parsed;
    }
  } catch {
    /* fall through to the bundled copy */
  }
  return bundledMatchday(season, matchday);
}

/** Every matchday we know about, storage taking precedence per matchday. */
export async function loadAllMatchdays(
  store: GameStore,
  season: string,
): Promise<ManifestMatchday[]> {
  const byNumber = new Map<number, ManifestMatchday>();

  const bundled = loadBundledManifest();
  if (bundled && bundled.season === season) {
    for (const md of bundled.matchdays) byNumber.set(md.matchday, md);
  }

  try {
    await store.ensure('manifest');
    const rows = await listPartition<ManifestEntity>(store.table('manifest'), seasonKey(season));
    for (const row of rows) {
      if (!row.fixtures) continue;
      try {
        const parsed = parseMatchday(JSON.parse(row.fixtures));
        if (parsed) byNumber.set(parsed.matchday, parsed);
      } catch {
        /* a corrupt row must not take the season down */
      }
    }
  } catch {
    /* storage unreachable — the bundled copy still answers */
  }

  return [...byNumber.values()].sort((a, b) => a.matchday - b.matchday);
}

export async function saveMatchdays(
  store: GameStore,
  season: string,
  matchdays: readonly ManifestMatchday[],
): Promise<number> {
  await store.ensure('manifest');
  const now = new Date().toISOString();
  let written = 0;
  for (const md of matchdays) {
    const entity: ManifestEntity = {
      partitionKey: seasonKey(season),
      rowKey: padMatchday(md.matchday),
      matchday: md.matchday,
      fixtures: JSON.stringify(md),
      updatedAt: now,
    };
    await store.table('manifest').upsertEntity(entity, 'Replace');
    written += 1;
  }
  return written;
}

/* ------------------------------------------------------------------ picks */

export type PickRecord = Record<string, [number, number, number]>;

export interface FixtureView {
  id: string;
  home: string;
  away: string;
  kickoff: string;
  locksAt: string;
  locked: boolean;
  /** The model's probabilities, revealed only once the fixture has locked. */
  model: [number, number, number] | null;
  result: { homeGoals: number; awayGoals: number } | null;
}

/**
 * Fixtures as the browser may see them.
 *
 * The model's probabilities are withheld while a fixture is still open. The
 * site already hides them in the UI; withholding them at the source means a
 * player cannot read them out of the network tab and copy the model.
 */
export function fixtureViews(md: ManifestMatchday, nowMs: number): FixtureView[] {
  return md.fixtures.map(f => {
    const open = fixtureIsOpen(f, nowMs);
    return {
      id: f.id,
      home: f.home,
      away: f.away,
      kickoff: f.kickoff,
      locksAt: f.locks_at,
      locked: !open,
      model: open ? null : fixtureModelProbs(f),
      result: fixtureHasResult(f)
        ? { homeGoals: f.home_goals as number, awayGoals: f.away_goals as number }
        : null,
    };
  });
}

export function parseStoredPicks(entity: PicksEntity | null): PickRecord {
  if (!entity?.picks) return {};
  try {
    const parsed = JSON.parse(entity.picks) as Record<string, unknown>;
    const out: PickRecord = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (
        Array.isArray(value) &&
        value.length === 3 &&
        value.every(x => typeof x === 'number' && Number.isFinite(x) && x >= 0)
      ) {
        out[id] = [value[0], value[1], value[2]] as [number, number, number];
      }
    }
    return out;
  } catch {
    return {};
  }
}

export interface RejectedPick {
  fixtureId: string;
  reason: 'unknown_fixture' | 'locked' | 'invalid_probabilities' | 'not_priced';
  locksAt?: string;
}

export interface ValidationResult {
  accepted: PickRecord;
  rejected: RejectedPick[];
}

/**
 * Decide, fixture by fixture, what the server is willing to store.
 *
 * `nowMs` is the server's clock. The request cannot influence it, and a lock
 * we cannot parse counts as closed.
 */
export function validatePicks(
  md: ManifestMatchday,
  submitted: unknown,
  nowMs: number,
): ValidationResult {
  const accepted: PickRecord = {};
  const rejected: RejectedPick[] = [];

  if (typeof submitted !== 'object' || submitted === null) {
    return { accepted, rejected };
  }

  const byId = new Map<string, ManifestFixture>(md.fixtures.map(f => [f.id, f]));

  for (const [fixtureId, value] of Object.entries(submitted as Record<string, unknown>)) {
    const fixture = byId.get(fixtureId);
    if (!fixture) {
      rejected.push({ fixtureId, reason: 'unknown_fixture' });
      continue;
    }
    if (!fixtureIsOpen(fixture, nowMs)) {
      rejected.push({ fixtureId, reason: 'locked', locksAt: fixture.locks_at });
      continue;
    }
    if (!fixtureModelProbs(fixture)) {
      // Nothing to compete against until the model has published this round.
      rejected.push({ fixtureId, reason: 'not_priced' });
      continue;
    }
    if (
      !Array.isArray(value) ||
      value.length !== 3 ||
      !value.every(x => typeof x === 'number' && Number.isFinite(x) && x >= 0)
    ) {
      rejected.push({ fixtureId, reason: 'invalid_probabilities' });
      continue;
    }
    const total = (value as number[]).reduce((s, x) => s + x, 0);
    if (!(total > 1e-9)) {
      rejected.push({ fixtureId, reason: 'invalid_probabilities' });
      continue;
    }
    accepted[fixtureId] = [
      (value as number[])[0] / total,
      (value as number[])[1] / total,
      (value as number[])[2] / total,
    ];
  }

  return { accepted, rejected };
}

/**
 * Merge a submission into what is already stored.
 *
 * Stored picks for fixtures that have since locked are kept verbatim: a later
 * request must never be able to rewrite history, even by accident.
 */
export function mergePicks(
  md: ManifestMatchday,
  stored: PickRecord,
  accepted: PickRecord,
): PickRecord {
  return { ...stored, ...accepted };
}

export async function loadPicks(
  store: GameStore,
  season: string,
  matchday: number,
  playerId: string,
): Promise<PicksEntity | null> {
  await store.ensure('picks');
  return tryGetEntity<PicksEntity>(
    store.table('picks'),
    roundKey(season, matchday),
    safeKey(playerId),
  );
}

/**
 * Every matchday of this season the player has picks for, in one query.
 *
 * Picks are partitioned per matchday, so a per-matchday point read would be 34
 * round trips for a page load. The padded matchday suffix makes the season's
 * partitions a contiguous range, which turns the whole history into a single
 * range scan.
 */
export async function listPlayerPicks(
  store: GameStore,
  season: string,
  playerId: string,
): Promise<Record<number, PickRecord>> {
  await store.ensure('picks');
  const key = seasonKey(season);
  const lo = `${key}_00`;
  const hi = `${key}_99`;
  const id = safeKey(playerId);

  const out: Record<number, PickRecord> = {};
  try {
    const iterator = store.table('picks').listEntities<PicksEntity>({
      queryOptions: {
        filter: odata`RowKey eq ${id} and PartitionKey ge ${lo} and PartitionKey le ${hi}`,
      },
    });
    for await (const entity of iterator) {
      const picks = parseStoredPicks(entity as unknown as PicksEntity);
      if (Object.keys(picks).length === 0) continue;
      const matchday = Number(entity.matchday);
      if (Number.isFinite(matchday)) out[matchday] = picks;
    }
  } catch (error) {
    // Nobody has ever played: an empty history, not a failed page load.
    if (!isTableNotFound(error)) throw error;
  }
  return out;
}

export async function savePicks(
  store: GameStore,
  season: string,
  matchday: number,
  playerId: string,
  picks: PickRecord,
  displayName: string,
  meta: unknown,
): Promise<void> {
  await store.ensure('picks');
  const entity: PicksEntity = {
    partitionKey: roundKey(season, matchday),
    rowKey: safeKey(playerId),
    matchday,
    picks: JSON.stringify(picks),
    displayName,
    updatedAt: new Date().toISOString(),
  };
  if (meta !== undefined && meta !== null) {
    const encoded = JSON.stringify(meta);
    // Table Storage caps a string property at 64 KB; UI state that big is a
    // bug, and dropping it costs nothing that matters.
    if (encoded.length <= 30000) entity.meta = encoded;
  }
  await store.table('picks').upsertEntity(entity, 'Replace');
}

/* ---------------------------------------------------------------- scoring */

/**
 * Build a standings row.
 *
 * Means are stored as plain numbers rather than nulls — Azure Tables has no
 * null — and `matches` is what tells a reader whether the zero is real. The
 * model's row carries no head-to-head fields: it does not beat itself.
 */
function standingEntity(
  partition: string,
  rowKey: string,
  displayName: string,
  isModel: boolean,
  rows: readonly MatchdayScoreRow[],
  now: string,
): StandingEntity {
  const agg = aggregateSeason(rows);
  return {
    partitionKey: partition,
    rowKey,
    displayName,
    isModel,
    updatedAt: now,
    matches: agg.matches,
    matchdays: agg.matchdays,
    userTotal: agg.userTotal,
    modelTotal: agg.modelTotal,
    userMean: agg.userMean ?? 0,
    modelMean: agg.modelMean ?? 0,
    roundsWon: isModel ? 0 : agg.roundsWon,
    roundsCounted: isModel ? 0 : agg.roundsCounted,
    edge: isModel ? 0 : agg.edge,
  };
}

export interface ScoringSummary {
  season: string;
  matchdaysScored: number[];
  playersScored: number;
  standings: number;
  ranAt: string;
}

/**
 * Re-score the whole season and rebuild the leaderboard.
 *
 * Idempotent by construction: it derives everything from the manifest plus the
 * stored picks, so running it twice, or after a late result correction, lands
 * on the same numbers.
 */
export async function runScoring(store: GameStore, season: string): Promise<ScoringSummary> {
  const matchdays = await loadAllMatchdays(store, season);
  // The very first run happens before anybody has posted a pick, so the picks
  // table may not exist yet — reading it is part of the job either way.
  await store.ensure('picks');
  await store.ensure('scores');
  await store.ensure('standings');

  const now = new Date().toISOString();
  const perPlayer = new Map<string, { displayName: string; rows: MatchdayScoreRow[] }>();
  const modelRows: MatchdayScoreRow[] = [];
  const scoredMatchdays: number[] = [];

  for (const md of matchdays) {
    const scorable = md.fixtures.map(toScorable);
    const slate = scoreModelSlate(scorable);
    if (slate.matches === 0) continue;

    scoredMatchdays.push(md.matchday);
    modelRows.push({
      matchday: md.matchday,
      matches: slate.matches,
      userTotal: slate.total,
      modelTotal: slate.total,
      beatModel: false,
    });

    const partition = roundKey(season, md.matchday);
    const entries = await listPartition<PicksEntity>(store.table('picks'), partition);

    // The model's own row for this matchday, so /api/leaderboard can show it.
    await store.table('scores').upsertEntity(
      {
        partitionKey: partition,
        rowKey: MODEL_ROW_KEY,
        matchday: md.matchday,
        matches: slate.matches,
        userTotal: slate.total,
        modelTotal: slate.total,
        beatModel: false,
        scoredAt: now,
      } satisfies ScoreEntity,
      'Replace',
    );

    for (const entry of entries) {
      if (entry.rowKey === MODEL_ROW_KEY) continue;
      const picks = parseStoredPicks(entry);
      const score = scoreRound(scorable, picks);

      await store.table('scores').upsertEntity(
        {
          partitionKey: partition,
          rowKey: entry.rowKey,
          matchday: md.matchday,
          matches: score.matches,
          userTotal: score.userTotal,
          modelTotal: score.modelTotal,
          beatModel: score.beatModel,
          scoredAt: now,
        } satisfies ScoreEntity,
        'Replace',
      );

      if (score.matches === 0) continue;
      const bucket = perPlayer.get(entry.rowKey) ?? {
        displayName: entry.displayName || 'Jogador',
        rows: [],
      };
      bucket.displayName = entry.displayName || bucket.displayName;
      bucket.rows.push({ matchday: md.matchday, ...score });
      perPlayer.set(entry.rowKey, bucket);
    }
  }

  /* ------------------------------------------------------------ standings */

  const partition = seasonKey(season);
  const existing = await listPartition<StandingEntity>(store.table('standings'), partition);
  const keep = new Set<string>();

  for (const [playerId, bucket] of perPlayer) {
    keep.add(playerId);
    await store
      .table('standings')
      .upsertEntity(
        standingEntity(partition, playerId, bucket.displayName, false, bucket.rows, now),
        'Replace',
      );
  }

  keep.add(MODEL_ROW_KEY);
  await store
    .table('standings')
    .upsertEntity(
      standingEntity(partition, MODEL_ROW_KEY, 'Modelo', true, modelRows, now),
      'Replace',
    );

  // A player whose picks were deleted must not linger on the leaderboard.
  for (const row of existing) {
    if (!keep.has(row.rowKey)) {
      await store.table('standings').deleteEntity(partition, row.rowKey);
    }
  }

  return {
    season,
    matchdaysScored: scoredMatchdays,
    playersScored: perPlayer.size,
    standings: keep.size,
    ranAt: now,
  };
}

/* ------------------------------------------------------------ leaderboard */

export interface LeaderboardRow {
  rank: number | null;
  playerId: string;
  displayName: string;
  isModel: boolean;
  matches: number;
  matchdays: number;
  totalRps: number;
  meanRps: number | null;
  /** The model scored on this player's own subset of fixtures. */
  modelTotalRps: number;
  modelMeanRps: number | null;
  roundsWon: number;
  roundsCounted: number;
  edge: number;
}

function toRow(entity: StandingEntity): LeaderboardRow {
  const matches = entity.matches ?? 0;
  return {
    rank: null,
    playerId: entity.rowKey,
    displayName: entity.displayName,
    isModel: !!entity.isModel,
    matches,
    matchdays: entity.matchdays ?? 0,
    totalRps: entity.userTotal ?? 0,
    // A stored zero mean is only meaningful when something was actually
    // scored; otherwise it would rank a player who never played in first.
    meanRps: matches > 0 ? entity.userMean ?? null : null,
    modelTotalRps: entity.modelTotal ?? 0,
    modelMeanRps: matches > 0 ? entity.modelMean ?? null : null,
    roundsWon: entity.roundsWon ?? 0,
    roundsCounted: entity.roundsCounted ?? 0,
    edge: entity.edge ?? 0,
  };
}

export async function readLeaderboard(
  store: GameStore,
  season: string,
): Promise<{ rows: LeaderboardRow[]; model: LeaderboardRow | null; updatedAt: string | null }> {
  await store.ensure('standings');
  const entities = await listPartition<StandingEntity>(store.table('standings'), seasonKey(season));

  let updatedAt: string | null = null;
  for (const e of entities) {
    if (e.updatedAt && (!updatedAt || e.updatedAt > updatedAt)) updatedAt = e.updatedAt;
  }

  const all = entities.map(toRow);
  const model = all.find(r => r.isModel) ?? null;

  // The model is ranked alongside everyone else — being above or below it is
  // the whole point — but it does not consume a human rank number.
  const ranked = all
    .slice()
    .sort((a, b) =>
      compareLeaderboard(
        { userMean: a.meanRps, matchdays: a.matchdays, displayName: a.displayName },
        { userMean: b.meanRps, matchdays: b.matchdays, displayName: b.displayName },
      ),
    );

  let rank = 0;
  for (const row of ranked) {
    if (row.isModel) continue;
    rank += 1;
    row.rank = rank;
  }

  return { rows: ranked, model, updatedAt };
}

/* --------------------------------------------------------------- schedule */

export function currentMatchday(matchdays: readonly ManifestMatchday[], nowMs: number): number | null {
  return playableMatchday(matchdays, nowMs);
}

export function deadlineFor(matchdays: readonly ManifestMatchday[], matchday: number): string | null {
  const md = matchdays.find(m => m.matchday === matchday);
  return md ? matchdayDeadline(md) : null;
}
