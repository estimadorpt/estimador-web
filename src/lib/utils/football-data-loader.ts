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

const FOOTBALL_DIR = 'football/liga-2026-27';

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

/* ------------------------------------------------ per-match fixture pages */

// One upcoming fixture with everything the match page needs. Every field
// beyond home/away/matchday/slug is optional: feeds go stale independently.
export interface UpcomingFixture {
  slug: string;
  home: string;
  away: string;
  matchday: number;
  kickoff: string | null;
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
    const { prediction, scenarios } = await loadLigaData();
    if (!prediction) return [];

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
        kickoff: m.kickoff ?? null,
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
        kickoff: null,
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
          kickoff: null,
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

// Load the model-vs-market backtest scorecard (null if absent)
export async function loadLigaMarketScorecard() {
  try {
    return await loadFootballJson<import('@/components/charts/football/MarketScorecard').MarketScorecardData>('market_scorecard.json');
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

// Load the shareable matchday cards (null if absent).
//
// The manifest is written by the model repo (scripts/publish_cards.py) and the
// PNGs are copied into public/images/cards/. The two can drift — a manifest
// entry whose image never arrived is dropped here rather than published as a
// broken image.
export async function loadLigaCards() {
  try {
    const manifest = await loadFootballJson<
      import('@/components/charts/football/ShareCards').CardsManifest
    >('cards.json');
    if (!manifest?.cards?.length) return null;

    const present = await Promise.all(
      manifest.cards.map(async card => {
        try {
          await fs.access(
            path.join(process.cwd(), 'public', 'images', 'cards', card.file)
          );
          return card;
        } catch {
          return null;
        }
      })
    );
    const cards = present.filter((c): c is NonNullable<typeof c> => c !== null);
    return cards.length > 0 ? { ...manifest, cards } : null;
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
