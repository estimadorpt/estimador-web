import { promises as fs } from 'fs';
import path from 'path';
import type {
  LigaPrediction,
  ScenarioData,
  LigaHistorical,
  TeamDelta,
  DecisiveMatch,
  NextMatchdayScenarioMatch,
} from '@/types/football';
import { assignFixtureSlugs } from '@/lib/config/fixtures';
import { normaliseRatings, reconcilePlayerPages, type RatingKind } from '@/lib/utils/player-ratings';
import {
  fixtureKey,
  matchOutcome,
  normalizeProbs,
  type GameFixture,
  type GameRound,
  type PredictionGameData,
} from '@/lib/utils/prediction-game';
import type { GameFixturesData, GameFixtureEntry } from '@/lib/football-fixtures';

/** The current season's data directory under public/data. One constant for
 * every football loader, so the season rollover is a one-line change. */
export const FOOTBALL_DIR = 'football/liga-2026-27';

async function loadFootballJson<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'public', 'data', FOOTBALL_DIR, filename);
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// Read a JSON file from any season directory (archived seasons included)
async function loadSeasonJson<T>(season: string, filename: string): Promise<T> {
  const filePath = path.join(
    process.cwd(), 'public', 'data', 'football', `liga-${season}`, filename
  );
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// Prediction files are zero-padded (md01.json .. md34.json)
const mdFile = (md: number, suffix = '') => `md${String(md).padStart(2, '0')}${suffix}.json`;

// Find the latest matchday file (highest number)
async function findLatestMatchday(): Promise<number> {
  const dir = path.join(process.cwd(), 'public', 'data', FOOTBALL_DIR);
  const files = await fs.readdir(dir);
  const matchdayFiles = files
    .filter(f => /^md\d+\.json$/.test(f))
    .map(f => parseInt(f.match(/^md(\d+)\.json$/)![1]))
    .sort((a, b) => b - a);
  return matchdayFiles[0] || 0;
}

// Load latest matchday prediction + scenarios
export async function loadLigaData(_season?: string) {
  try {
    const latestMd = await findLatestMatchday();
    const [prediction, scenarios] = await Promise.all([
      loadFootballJson<LigaPrediction>(mdFile(latestMd)),
      loadFootballJson<ScenarioData>(mdFile(latestMd, '_scenarios')).catch(() => null),
    ]);
    return { prediction, scenarios, matchday: latestMd };
  } catch (error) {
    console.error('Error loading liga data:', error);
    return { prediction: null, scenarios: null, matchday: 0 };
  }
}

// Load all historical matchday files for time-series charts
export async function loadLigaHistorical(): Promise<LigaHistorical> {
  try {
    const dir = path.join(process.cwd(), 'public', 'data', FOOTBALL_DIR);
    const files = await fs.readdir(dir);
    const matchdayFiles = files
      .filter(f => /^md\d+\.json$/.test(f))
      .sort((a, b) => {
        const mdA = parseInt(a.match(/^md(\d+)\.json$/)![1]);
        const mdB = parseInt(b.match(/^md(\d+)\.json$/)![1]);
        return mdA - mdB;
      });

    const predictions = await Promise.all(
      matchdayFiles.map(f => loadFootballJson<LigaPrediction>(f))
    );
    return predictions;
  } catch (error) {
    console.error('Error loading historical liga data:', error);
    return [];
  }
}

// Load sampled complete seasons for the SeasonDraw widget (null if absent)
export async function loadLigaSamples() {
  try {
    return await loadFootballJson<import('@/components/charts/football/SeasonDraw').SeasonSamples>('samples.json');
  } catch {
    return null;
  }
}

// Load the Soccer Factor Model player ranking (null if absent)
export async function loadLigaPlayers() {
  try {
    return await loadFootballJson<import('@/components/charts/football/PlayerSkillRanking').PlayerSkillData>('players.json');
  } catch {
    return null;
  }
}

// Load the per-player detail payload behind the player pages (null if absent).
// Written by the model repo's scripts/export_players_detail.py; players.json
// stays the ranking, this file carries history and recent form.
//
// Returned reconciled with the ranking (reconcilePlayerPages): only players
// /jogadores lists, at its rank, from clubs in the current table. Every page,
// link and sitemap entry built from this loader therefore agrees with
// /jogadores even when the two files come from different model runs.
export async function loadLigaPlayersDetail() {
  try {
    const [data, ranking, { prediction }] = await Promise.all([
      loadFootballJson<
        import('@/components/charts/football/PlayerProfile').PlayerDetailData
      >('players_detail.json'),
      loadLigaPlayers(),
      loadLigaData(),
    ]);
    const currentTeams = new Set((prediction?.table ?? []).map(row => row.team));
    return reconcilePlayerPages(data, ranking, currentTeams);
  } catch {
    return null;
  }
}

/* --------------------------------------------- position-specific ratings */

/**
 * The three position-specific rating feeds, each written by its own model in
 * the model repo and each optional. One number cannot rank a goalkeeper
 * against a striker (ADR-019), so these are deliberately separate files with
 * separate scales — and any of them can be missing on any given build.
 *
 * Every loader returns null on absence, unparseable JSON or an unrecognised
 * shape. The hub page renders whichever ones came back.
 */
async function loadRatings(filename: string, kind: RatingKind) {
  try {
    const raw = await loadFootballJson<unknown>(filename);
    return normaliseRatings(raw, kind);
  } catch {
    return null;
  }
}

/** Goalkeepers: goals prevented above expectation. */
export async function loadGkRatings() {
  return loadRatings('gk_ratings.json', 'gk');
}

/**
 * Defenders: adjusted plus-minus. May legitimately carry no ranking at all —
 * `separable: false` with diagnostics is a result, not a failure.
 */
export async function loadDefRatings() {
  return loadRatings('def_ratings.json', 'def');
}

/** Outfield players: goals + assists contribution. */
export async function loadContribRatings() {
  return loadRatings('contrib_ratings.json', 'contrib');
}

/* ------------------------------------------- ADR-021 channels (2026-08) */

/**
 * Contested-possession ability: empirical-Bayes beta-binomial on aerial and
 * ground duels, defenders and midfielders, career-pooled. Cells that failed
 * a pre-registered gate carry `ranking: null` — the refusal is enforced in
 * the export, so the raw feed cannot be used to reconstruct a suppressed
 * ranking.
 */
export interface ContestedCell {
  channel: 'aerial' | 'ground';
  position: 'D' | 'M';
  n_players: number;
  positional_mean: number;
  separable: number;
  permutation_null: number;
  club_corr_raw: number | null;
  split_half: number | null;
  ships: boolean;
  ranking:
    | {
        rank: number;
        player: string;
        player_id: number;
        team: string | null;
        duels: number;
        won: number;
        rate_raw: number;
        theta: number;
        theta_lo: number;
        theta_hi: number;
        above_positional_mean: boolean;
        matches: number;
        role_cluster?: string;
      }[]
    | null;
}

export interface ContestedRatings {
  metric: string;
  interval_mass: number;
  seasons: string[];
  career_pooled: boolean;
  new_signing_note: string;
  not_a_defensive_rating: string;
  cells: ContestedCell[];
}

export async function loadContestedRatings(): Promise<ContestedRatings | null> {
  try {
    const raw = await loadFootballJson<ContestedRatings>('contested_ratings.json');
    return Array.isArray(raw?.cells) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * The three goalkeeper channels, published separately and never averaged:
 * cross intervention (separable), sweeping volume (a style axis — a third
 * of its persistence is the defensive line, and the feed says so) and
 * shot-stopping (a properly-powered null on three seasons of data).
 */
export interface GkChannelRow {
  rank: number;
  keeper: string;
  keeper_id: number;
  team: string | null;
  minutes: number;
  y: number;
  n: number;
  theta: number;
  theta_lo: number;
  theta_hi: number;
  p_above_average: number;
  separable: boolean;
}

export interface GkChannels {
  interval_mass: number;
  seasons: string[];
  no_composite_note: string;
  channels: {
    cross_intervention: {
      metric: string;
      /** Keepers in the fitted panel; the ranking lists the current subset. */
      n_fitted?: number;
      what: string;
      separable: number;
      expected_false_positives: number;
      split_half: number;
      teammate_r: number;
      season_to_season: number;
      travels_note: string;
      ships: boolean;
      ranking: GkChannelRow[] | null;
    };
    sweeping: {
      metric: string;
      style_axis: boolean;
      what: string;
      ships: boolean;
      ranking: GkChannelRow[] | null;
    };
    shot_stopping: {
      metric: string;
      /** Keepers in the fitted panel and their mean SoT faced — the null
       *  statement's denominators, published so no count is hardcoded. */
      n_fitted?: number;
      mean_sot_faced?: number;
      separable: number;
      expected_separators_precomputed: number;
      season_to_season_theta: number;
      ships: boolean;
      null_statement: string | null;
      ranking: GkChannelRow[] | null;
    };
  };
}

export async function loadGkChannels(): Promise<GkChannels | null> {
  try {
    const raw = await loadFootballJson<GkChannels>('gk_channels.json');
    return raw?.channels ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Slug used when no player detail is published at all. Static export refuses
 * to build a dynamic route whose generateStaticParams() returns an empty
 * array, so one page must always exist.
 */
export const NO_PLAYERS_SLUG = 'sem-jogadores';

/** Resolve one player page by slug (null when the slug is unknown). */
export async function loadPlayerBySlug(slug: string) {
  const data = await loadLigaPlayersDetail();
  if (!data) return null;
  const player = data.players.find(p => p.slug === slug);
  return player ? { player, data } : null;
}

/** Player name → page slug, for linking the ranking rows. Empty when absent. */
export async function loadPlayerSlugs(): Promise<Record<string, string>> {
  const data = await loadLigaPlayersDetail();
  if (!data) return {};
  return Object.fromEntries(data.players.map(p => [p.player, p.slug]));
}

/* ------------------------------------------------ per-match fixture pages */

// One upcoming fixture with everything the match page needs. Every field
// beyond home/away/matchday/slug is optional: feeds go stale independently.
export interface UpcomingFixture {
  slug: string;
  home: string;
  away: string;
  matchday: number;
  kickoff: string | null;
  /** False while `kickoff` is a placeholder (or unknown): show the day, not the hour. */
  kickoffConfirmed: boolean;
  /** True when the fixture is a leftover of the matchday already in progress. */
  inProgressMatchday: boolean;
  p_home: number | null;
  p_draw: number | null;
  p_away: number | null;
  /** Per-outcome conditional title/Europe/relegation probabilities, if published. */
  scenario: NextMatchdayScenarioMatch | null;
  /** Season-wide swing entry for this fixture, if it made the decisive list. */
  decisive: DecisiveMatch | null;
  /** Final score, when the fixture has already been played. */
  played: { home_goals: number; away_goals: number } | null;
}

/**
 * Slug used when the feed carries no fixtures at all (end of season, broken
 * publication). Static export refuses to build a dynamic route whose
 * generateStaticParams() returns an empty array, so one page must always exist.
 */
export const NO_FIXTURES_SLUG = 'sem-jogos';

// 1X2 from the scenario sim counts: matches_remaining carries no probabilities,
// but the conditional blocks record how many sims produced each outcome.
function probsFromConditionals(
  scenario: NextMatchdayScenarioMatch | null,
): { p_home: number | null; p_draw: number | null; p_away: number | null } {
  const none = { p_home: null, p_draw: null, p_away: null };
  if (!scenario?.conditionals) return none;
  const h = scenario.conditionals.H?.n_sims ?? 0;
  const d = scenario.conditionals.D?.n_sims ?? 0;
  const a = scenario.conditionals.A?.n_sims ?? 0;
  const total = h + d + a;
  if (total <= 0) return none;
  return { p_home: h / total, p_draw: d / total, p_away: a / total };
}

/**
 * Every fixture that still has to be played and is covered by the current
 * publication: leftovers of the matchday in progress first, then the whole of
 * the next matchday. Returns [] on any failure.
 */
export async function loadUpcomingFixtures(): Promise<UpcomingFixture[]> {
  try {
    const [{ prediction, scenarios }, manifest] = await Promise.all([
      loadLigaData(),
      loadGameFixtures(),
    ]);
    if (!prediction) return [];

    // Kickoffs live in the game manifest; the md files carry them only for
    // the round in progress, and never say whether they are confirmed.
    const manifestByKey = new Map<string, GameFixtureEntry>();
    for (const md of manifest?.matchdays ?? []) {
      for (const fx of md.fixtures ?? []) {
        manifestByKey.set(`${md.matchday}|${fx.home}|${fx.away}`, fx);
      }
    }
    const kickoffFor = (md: number, home: string, away: string, fallback: string | null) => {
      const fx = manifestByKey.get(`${md}|${home}|${away}`);
      if (fx?.kickoff) return { kickoff: fx.kickoff, kickoffConfirmed: fx.kickoff_confirmed === true };
      return { kickoff: fallback, kickoffConfirmed: false };
    };

    const scenarioMatches = scenarios?.next_matchday_scenarios?.matches ?? [];
    const findScenario = (home: string, away: string) =>
      scenarioMatches.find(m => m.home_team === home && m.away_team === away) ?? null;
    const findDecisive = (home: string, away: string, md: number) =>
      scenarios?.decisive_matches?.find(
        m => m.home_team === home && m.away_team === away && m.matchday === md,
      ) ?? null;

    const raw: Omit<UpcomingFixture, 'slug'>[] = [];

    for (const m of prediction.matches_remaining ?? []) {
      const scenario = findScenario(m.home, m.away);
      raw.push({
        home: m.home,
        away: m.away,
        matchday: prediction.matchday,
        ...kickoffFor(prediction.matchday, m.home, m.away, m.kickoff ?? null),
        inProgressMatchday: true,
        ...probsFromConditionals(scenario),
        scenario,
        decisive: findDecisive(m.home, m.away, prediction.matchday),
        played: null,
      });
    }

    const nextMd = prediction.next_matchday?.matchday ?? prediction.matchday + 1;
    for (const m of prediction.next_matchday?.matches ?? []) {
      raw.push({
        home: m.home,
        away: m.away,
        matchday: nextMd,
        ...kickoffFor(nextMd, m.home, m.away, null),
        inProgressMatchday: false,
        p_home: m.p_home ?? null,
        p_draw: m.p_draw ?? null,
        p_away: m.p_away ?? null,
        scenario: findScenario(m.home, m.away),
        decisive: findDecisive(m.home, m.away, nextMd),
        played: null,
      });
    }

    // End of season: nothing left to play. Fall back to the fixtures of the
    // matchday just finished so the route still has pages to generate.
    if (raw.length === 0) {
      for (const r of prediction.matchday_results ?? []) {
        raw.push({
          home: r.home,
          away: r.away,
          matchday: prediction.matchday,
          ...kickoffFor(prediction.matchday, r.home, r.away, null),
          inProgressMatchday: false,
          p_home: null,
          p_draw: null,
          p_away: null,
          scenario: findScenario(r.home, r.away),
          decisive: findDecisive(r.home, r.away, prediction.matchday),
          played:
            typeof r.home_goals === 'number' && typeof r.away_goals === 'number'
              ? { home_goals: r.home_goals, away_goals: r.away_goals }
              : null,
        });
      }
    }

    return assignFixtureSlugs(raw);
  } catch (error) {
    console.error('Error loading upcoming fixtures:', error);
    return [];
  }
}

/** Resolve one fixture page by slug (null when the slug is unknown). */
export async function loadFixtureBySlug(slug: string): Promise<UpcomingFixture | null> {
  const fixtures = await loadUpcomingFixtures();
  return fixtures.find(f => f.slug === slug) ?? null;
}

/* ------------------------------------------------- "Contra o Modelo" game */

/**
 * game_fixtures.json: the game's manifest, and the only file carrying every
 * fixture of the season with its real kickoff, its lock time, the model's
 * frozen pre-round probabilities and the result. The server scores against a
 * byte-identical copy (api/data/game_fixtures.json). Absence is a normal
 * outcome (an older season, a broken sync), so this returns null.
 */
export async function loadGameFixtures(): Promise<GameFixturesData | null> {
  try {
    const data = await loadFootballJson<GameFixturesData>('game_fixtures.json');
    return Array.isArray(data?.matchdays) ? data : null;
  } catch {
    return null;
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** One manifest fixture as a game fixture, or null when it was never priced. */
function gameFixtureFromManifest(fx: GameFixtureEntry): GameFixture | null {
  if (!isNum(fx.p_home) || !isNum(fx.p_draw) || !isNum(fx.p_away)) return null;
  const played = isNum(fx.home_goals) && isNum(fx.away_goals);
  return {
    key: fixtureKey(fx.home, fx.away),
    home: fx.home,
    away: fx.away,
    model: normalizeProbs([fx.p_home, fx.p_draw, fx.p_away]),
    kickoff: fx.kickoff ?? null,
    locksAt: fx.locks_at ?? null,
    kickoffConfirmed: fx.kickoff_confirmed === true,
    id: typeof fx.id === 'string' ? fx.id : undefined,
    probsSource: typeof fx.probs_source === 'string' ? fx.probs_source : null,
    result: played
      ? {
          homeGoals: fx.home_goals as number,
          awayGoals: fx.away_goals as number,
          outcome: matchOutcome(fx.home_goals as number, fx.away_goals as number),
        }
      : null,
  };
}

/**
 * Rounds straight from the manifest: every matchday with at least one priced
 * fixture, each fixture carrying the probabilities frozen when its round
 * opened (`probs_source`), its own lock time and its result. Past rounds
 * therefore show what the model said before the round, never what a later
 * md file says. Pure, exported for tests.
 */
export function roundsFromGameFixtures(manifest: GameFixturesData): GameRound[] {
  const rounds: GameRound[] = [];
  for (const md of manifest.matchdays ?? []) {
    const fixtures = (md.fixtures ?? [])
      .map(gameFixtureFromManifest)
      .filter((f): f is GameFixture => f !== null);
    if (fixtures.length === 0) continue;
    rounds.push({ matchday: md.matchday, fixtures });
  }
  return rounds.sort((a, b) => a.matchday - b.matchday);
}

/**
 * Fallback when the manifest is missing: rounds rebuilt from the md files.
 *
 *  - forecasts: md(M-1).json `next_matchday` is the model's pre-round call for
 *    matchday M. The earliest publication carrying a given matchday wins, so
 *    the opponent forecast can never have seen that round's results.
 *  - results:  keyed by the ordered (home, away) pair across every
 *    `matchday_results` array (an ordered pair occurs once per season).
 *  - kickoffs: from `matches_remaining`, the only place md files carry them.
 */
function roundsFromMatchdayFiles(predictions: LigaPrediction[]): GameRound[] {
  const results = new Map<string, { home_goals: number; away_goals: number }>();
  const kickoffs = new Map<string, string>();

  for (const p of predictions) {
    for (const r of p.matchday_results ?? []) {
      if (typeof r.home_goals !== 'number' || typeof r.away_goals !== 'number') continue;
      results.set(fixtureKey(r.home, r.away), {
        home_goals: r.home_goals,
        away_goals: r.away_goals,
      });
    }
    for (const m of p.matches_remaining ?? []) {
      if (m.kickoff) kickoffs.set(fixtureKey(m.home, m.away), m.kickoff);
    }
  }

  // Earliest publication wins; `predictions` is already ascending by matchday.
  const roundsByMd = new Map<number, GameRound>();
  for (const p of predictions) {
    const md = p.next_matchday?.matchday;
    const matches = p.next_matchday?.matches ?? [];
    if (typeof md !== 'number' || matches.length === 0) continue;
    if (roundsByMd.has(md)) continue;

    roundsByMd.set(md, {
      matchday: md,
      fixtures: matches.map(m => {
        const key = fixtureKey(m.home, m.away);
        const played = results.get(key) ?? null;
        return {
          key,
          home: m.home,
          away: m.away,
          model: normalizeProbs([m.p_home ?? 0, m.p_draw ?? 0, m.p_away ?? 0]),
          kickoff: kickoffs.get(key) ?? null,
          result: played
            ? {
                homeGoals: played.home_goals,
                awayGoals: played.away_goals,
                outcome: matchOutcome(played.home_goals, played.away_goals),
              }
            : null,
        };
      }),
    });
  }
  return [...roundsByMd.values()].sort((a, b) => a.matchday - b.matchday);
}

/**
 * Everything the prediction game needs.
 *
 * The manifest (game_fixtures.json) is the source: it is what the server
 * scores against, and the only file with each round's real deadline and the
 * model's frozen pre-round probabilities. The md files are only a fallback
 * for a build without the manifest.
 *
 * Returns null on any failure, like every other loader here.
 */
export async function loadPredictionGameData(): Promise<PredictionGameData | null> {
  try {
    const dir = path.join(process.cwd(), 'public', 'data', FOOTBALL_DIR);
    const files = await fs.readdir(dir);
    const matchdayNumbers = files
      .filter(f => /^md\d+\.json$/.test(f))
      .map(f => parseInt(f.match(/^md(\d+)\.json$/)![1], 10))
      .sort((a, b) => a - b);

    const [predictions, manifest] = await Promise.all([
      Promise.all(matchdayNumbers.map(md => loadFootballJson<LigaPrediction>(mdFile(md)))),
      loadGameFixtures(),
    ]);
    const latest = predictions[predictions.length - 1] ?? null;

    const fromManifest = manifest ? roundsFromGameFixtures(manifest) : [];
    const rounds = fromManifest.length > 0 ? fromManifest : roundsFromMatchdayFiles(predictions);
    if (rounds.length === 0) return null;

    return {
      season: manifest?.season ?? latest?.season ?? '',
      generatedAt: latest?.timestamp ?? manifest?.generated_at ?? '',
      rounds,
    };
  } catch (error) {
    console.error('Error loading prediction game data:', error);
    return null;
  }
}

// Load the model-vs-market backtest scorecard (null if absent)
export async function loadLigaMarketScorecard() {
  try {
    return await loadFootballJson<import('@/components/charts/football/MarketScorecard').MarketScorecardData>('market_scorecard.json');
  } catch {
    return null;
  }
}

// Load the Liga Portugal 2 export (null if absent).
//
// Liga 2 sits in its own directory because it is a different competition on a
// lighter model, not another view of the Primeira. One file holds either the
// running season or, before it kicks off, the completed one.
export async function loadLiga2(season = '2026-27') {
  try {
    const filePath = path.join(
      process.cwd(), 'public', 'data', 'football', `liga2-${season}`, 'liga2.json'
    );
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as
      import('@/components/charts/football/Liga2Table').Liga2Data;
  } catch {
    return null;
  }
}

// Load the injuries / suspensions snapshot (null if absent)
export async function loadLigaInjuries() {
  try {
    return await loadFootballJson<import('@/components/charts/football/InjuriesPanel').InjuriesData>('injuries.json');
  } catch {
    return null;
  }
}

/* ------------------------------------------------------- open data catalog */

export interface PublishedFile {
  name: string;
  bytes: number;
}

export interface PublishedSeason {
  season: string;
  /** URL path the files are served from, e.g. /data/football/liga-2026-27 */
  basePath: string;
  current: boolean;
  files: PublishedFile[];
}

// List the JSON files actually published under public/data/football/, so the
// open-data page documents what is really there rather than what we remember
// putting there. Returns [] on any failure.
export async function loadPublishedFootballData(): Promise<PublishedSeason[]> {
  try {
    const root = path.join(process.cwd(), 'public', 'data', 'football');
    const dirs = (await fs.readdir(root, { withFileTypes: true }))
      .filter(d => d.isDirectory() && d.name.startsWith('liga-'))
      .map(d => d.name)
      .sort()
      .reverse();

    const seasons: PublishedSeason[] = [];
    for (const dir of dirs) {
      const entries = await fs.readdir(path.join(root, dir));
      const files: PublishedFile[] = [];
      for (const name of entries.filter(f => f.endsWith('.json')).sort()) {
        const stat = await fs.stat(path.join(root, dir, name));
        files.push({ name, bytes: stat.size });
      }
      if (files.length === 0) continue;
      const season = dir.replace(/^liga-/, '');
      seasons.push({
        season,
        basePath: `/data/football/${dir}`,
        current: dir === FOOTBALL_DIR.split('/')[1],
        files,
      });
    }
    return seasons;
  } catch (error) {
    console.error('Error listing published football data:', error);
    return [];
  }
}

// Load the end-of-season review for a finished season (null if absent)
export async function loadSeasonReview(season: string) {
  try {
    return await loadSeasonJson<
      import('@/components/charts/football/SeasonReview').SeasonReviewData
    >(season, 'review.json');
  } catch {
    return null;
  }
}

// Load a specific matchday prediction
async function loadMatchdayPrediction(md: number): Promise<LigaPrediction | null> {
  try {
    return await loadFootballJson<LigaPrediction>(mdFile(md));
  } catch {
    return null;
  }
}

// Compute per-team deltas between current and baseline predictions
function computeDeltas(
  currentTable: LigaPrediction['table'],
  baselineTable: LigaPrediction['table'] | undefined,
): Record<string, TeamDelta> {
  const deltas: Record<string, TeamDelta> = {};
  if (!baselineTable) return deltas;

  const baselineLookup = new Map(baselineTable.map(t => [t.team, t]));

  for (const team of currentTable) {
    const baseline = baselineLookup.get(team.team);
    if (!baseline) continue;

    const champDelta = (team.p_champion - baseline.p_champion) * 100;
    const relegDelta = (team.p_relegation - baseline.p_relegation) * 100;
    const ptsDelta = team.mean_pts - baseline.mean_pts;

    deltas[team.team] = {
      team: team.team,
      p_champion_delta: Math.round(champDelta * 10) / 10,
      p_relegation_delta: Math.round(relegDelta * 10) / 10,
      mean_pts_delta: Math.round(ptsDelta * 10) / 10,
    };
  }

  return deltas;
}

// Load latest prediction with deltas compared to previous matchday
export async function loadLigaWithDeltas() {
  try {
    const latestMd = await findLatestMatchday();
    const [prediction, scenarios] = await Promise.all([
      loadFootballJson<LigaPrediction>(mdFile(latestMd)),
      loadFootballJson<ScenarioData>(mdFile(latestMd, '_scenarios')).catch(() => null),
    ]);

    // Load previous matchday as baseline
    const prevPrediction = latestMd > 1
      ? await loadMatchdayPrediction(latestMd - 1)
      : null;

    // Compute deltas
    const deltas = computeDeltas(prediction.table, prevPrediction?.table);

    return {
      prediction,
      scenarios,
      matchday: latestMd,
      prevPrediction,
      deltas,
    };
  } catch (error) {
    console.error('Error loading liga data with deltas:', error);
    return {
      prediction: null,
      scenarios: null,
      matchday: 0,
      prevPrediction: null,
      deltas: {} as Record<string, TeamDelta>,
    };
  }
}

// Lightweight loader for homepage summary
export async function loadLigaSummary() {
  try {
    const latestMd = await findLatestMatchday();
    const prediction = await loadFootballJson<LigaPrediction>(mdFile(latestMd));
    return {
      matchday: latestMd,
      season: prediction.season,
      timestamp: prediction.timestamp,
      top3: prediction.table.slice(0, 3),
      nextMatchday: prediction.next_matchday,
      totalTeams: prediction.table.length,
    };
  } catch (error) {
    console.error('Error loading liga summary:', error);
    return null;
  }
}
