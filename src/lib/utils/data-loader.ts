import { promises as fs } from 'fs';
import path from 'path';
import {
  SeatData,
  TrendData,
  DistrictForecast,
  ContestedSummary,
  HouseEffect,
  PresidentialForecastData,
  PresidentialWinProbabilitiesData,
  PresidentialTrendsData,
  PresidentialSnapshotProbabilitiesData,
  PresidentialPollsData,
  PresidentialHouseEffectsData,
  PresidentialHeadToHeadData,
  PresidentialRunoffPairsData,
  PresidentialChangesData,
  PresidentialRunoffChangesData,
  SecondRoundForecastData,
  SecondRoundTrendsData,
  SecondRoundTrajectoriesData,
  SecondRoundValidVotesData,
  SecondRoundWinProbabilityData,
  SecondRoundBlankNullData
} from '@/types';

import { PRESIDENTIAL_2026, PRESIDENTIAL_2026_SECOND_ROUND_DATE } from '@/lib/config/elections';
import { leftBlocParties, rightBlocParties, majorityThreshold } from '@/lib/config/blocs';
import { calculateBlocMajorityProbability, calculatePartyMostSeatsProbability } from '@/lib/utils/probability-calculator';
import { recentTrendRows, summariseBlocs, summariseRunoff, summariseSeats, type RunoffSimulations } from '@/lib/election-aggregates';
import type { EconomyDashboard } from '@/types/economy-dashboard';
import type { EconomyStories } from '@/types/economy-stories';

// Load data from the public directory
export async function loadJsonData<T>(filename: string, subdirectory?: string): Promise<T> {
  const filePath = subdirectory
    ? path.join(process.cwd(), 'public', 'data', subdirectory, filename)
    : path.join(process.cwd(), 'public', 'data', filename);
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

/**
 * Build-only inputs: raw simulation draws the pages reduce on the server
 * (summariseRunoff, summariseSeats). They live outside public/ so the static
 * export never ships them; no page fetches them at runtime.
 */
export async function loadBuildOnlyJson<T>(filename: string, subdirectory: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'data', 'build-only', subdirectory, filename);
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

const PRESIDENTIAL_DIR = 'elections/presidential-2026';
const PARLIAMENTARY_DIR = 'elections/parliamentary-2025';
const ECONOMICS_DIR = 'economics';

export async function loadEconomyStories(): Promise<EconomyStories | null> {
  try {
    return await loadJsonData<EconomyStories>('stories.json', ECONOMICS_DIR);
  } catch (error) {
    console.error('Error loading economy stories data:', error);
    return null;
  }
}

// "State of the economy" dashboard loader (schema estimador-economy-dashboard/v1).
// Returns null on any failure so the page renders an honest "unavailable" state
// rather than crash. Individual tiles are guarded separately at render time.
export async function loadEconomyDashboard(): Promise<EconomyDashboard | null> {
  try {
    return await loadJsonData<EconomyDashboard>('dashboard.json', ECONOMICS_DIR);
  } catch (error) {
    console.error('Error loading economy dashboard data:', error);
    return null;
  }
}

// Parliamentary forecast data loader. Returns the raw draws: the homepage only
// asks whether the archive has data. The archive page reads the aggregated
// loadParliamentaryArchive below instead, so no draw reaches a browser.
export async function loadForecastData() {
  try {
    const [seatData, nationalTrends, districtForecast, contestedSeats, houseEffects] = await Promise.all([
      loadBuildOnlyJson<SeatData[]>('seat_forecast_simulations.json', PARLIAMENTARY_DIR),
      loadJsonData<TrendData[]>('national_trends.json', PARLIAMENTARY_DIR),
      loadJsonData<DistrictForecast[]>('district_forecast.json', PARLIAMENTARY_DIR),
      loadJsonData<ContestedSummary>('contested_summary.json', PARLIAMENTARY_DIR),
      loadJsonData<HouseEffect[]>('house_effects.json', PARLIAMENTARY_DIR).catch(() => [])
    ]);

    return {
      seatData,
      nationalTrends,
      districtForecast,
      contestedSeats,
      houseEffects
    };
  } catch (error) {
    console.error('Error loading forecast data:', error);
    return {
      seatData: [] as SeatData[],
      nationalTrends: [] as TrendData[],
      districtForecast: [] as DistrictForecast[],
      contestedSeats: { districts: {} } as ContestedSummary,
      houseEffects: [] as HouseEffect[]
    };
  }
}

/** Parties drawn by the archive's seat chart. */
const PARLIAMENTARY_PARTIES = ['AD', 'PS', 'CH', 'IL', 'L', 'BE', 'CDU', 'PAN'];

/**
 * The parliamentary 2025 archive, summarised on the server: probabilities,
 * bloc and party seat distributions from all 9000 draws, a fixed 800-draw
 * subsample for the dot plot, and the two-year trend window the chart shows.
 * `available` is false when a required file is missing, and the page then
 * says so instead of drawing zeros.
 */
export async function loadParliamentaryArchive() {
  const { seatData, nationalTrends, districtForecast, contestedSeats, houseEffects } = await loadForecastData();
  const trends = recentTrendRows(nationalTrends);
  return {
    available: seatData.length > 0 && nationalTrends.length > 0,
    simulations: seatData.length,
    probabilities: {
      adMostSeats: calculatePartyMostSeatsProbability(seatData, 'AD', ['PS', 'CH']),
      psMostSeats: calculatePartyMostSeatsProbability(seatData, 'PS', ['AD', 'CH']),
      rightMajority: calculateBlocMajorityProbability(seatData, rightBlocParties, majorityThreshold),
      leftMajority: calculateBlocMajorityProbability(seatData, leftBlocParties, majorityThreshold),
    },
    blocs: summariseBlocs(seatData, [
      { key: 'left', parties: leftBlocParties },
      { key: 'right', parties: rightBlocParties },
    ], majorityThreshold),
    seats: summariseSeats(seatData, PARLIAMENTARY_PARTIES),
    trends,
    /** Estimate dates inside the trend window (what the chart's caption counts). */
    trendDates: new Set(trends.map(row => row.date)).size,
    districtForecast,
    contestedSeats,
    houseEffects,
  };
}

export type ParliamentaryArchive = Awaited<ReturnType<typeof loadParliamentaryArchive>>;

const EMPTY_PRESIDENTIAL_TRENDS = { election_date: PRESIDENTIAL_2026.date, dates: [] as string[], candidates: {} };

/**
 * Presidential 2026 first-round archive. `available` is false when a required
 * file is missing: the fallbacks carry no date and no probability, so nothing
 * can be shown as "updated" on the build date or as ">99%" by accident.
 */
export async function loadPresidentialData() {
  try {
    const [forecast, winProbabilities, trends, snapshotProbabilities, polls, houseEffects, headToHead, electionDayRunoffPairs, snapshotRunoffPairs, changes, runoffChanges] = await Promise.all([
      loadJsonData<PresidentialForecastData>('presidential_forecast.json', PRESIDENTIAL_DIR),
      loadJsonData<PresidentialWinProbabilitiesData>('presidential_win_probabilities.json', PRESIDENTIAL_DIR),
      loadJsonData<PresidentialTrendsData>('presidential_trends.json', PRESIDENTIAL_DIR),
      loadJsonData<PresidentialSnapshotProbabilitiesData>('presidential_snapshot_probabilities.json', PRESIDENTIAL_DIR).catch(() => ({
        ...EMPTY_PRESIDENTIAL_TRENDS,
        metric: 'first_round_leader_probability',
      }) as PresidentialSnapshotProbabilitiesData),
      loadJsonData<PresidentialPollsData>('presidential_polls.json', PRESIDENTIAL_DIR),
      loadJsonData<PresidentialHouseEffectsData>('presidential_house_effects.json', PRESIDENTIAL_DIR).catch(() => ({
        pollsters: [],
        candidates: [],
        effects: {}
      })),
      loadJsonData<PresidentialHeadToHeadData>('presidential_head_to_head.json', PRESIDENTIAL_DIR).catch(() => ({
        election_date: PRESIDENTIAL_2026.date,
        candidate_a: '',
        candidate_b: '',
        color_a: '',
        color_b: '',
        dates: [],
        probability_a_leads: []
      })),
      loadJsonData<PresidentialRunoffPairsData>('presidential_runoff_pairs.json', PRESIDENTIAL_DIR).catch(() => ({
        election_date: PRESIDENTIAL_2026.date,
        pairs: [],
        matrix: { candidates: [], colors: [], probabilities: [] }
      })),
      // Snapshot runoff pairs, computed at the last poll date from the full posterior
      loadJsonData<PresidentialRunoffPairsData>('presidential_snapshot_runoff_pairs.json', PRESIDENTIAL_DIR).catch(() => null),
      // Leading-probability changes since the previous poll
      loadJsonData<PresidentialChangesData>('presidential_changes.json', PRESIDENTIAL_DIR).catch(() => null),
      // Runoff-probability changes since the previous poll
      loadJsonData<PresidentialRunoffChangesData>('presidential_runoff_changes.json', PRESIDENTIAL_DIR).catch(() => null)
    ]);

    // The last poll the forecast saw
    const lastPollDate = polls.polls.reduce<string | null>((latest, poll) => (!latest || poll.date > latest ? poll.date : latest), null);

    // Snapshot runoff pairs (at the last poll date) when published, otherwise
    // the election-day pairs
    const runoffPairs = snapshotRunoffPairs || electionDayRunoffPairs;

    return {
      available: forecast.candidates.length > 0,
      forecast,
      winProbabilities,
      trends,
      snapshotProbabilities,
      polls,
      houseEffects,
      headToHead,
      runoffPairs,
      changes,
      runoffChanges,
      lastPollDate
    };
  } catch (error) {
    console.error('Error loading presidential forecast data:', error);
    return {
      available: false,
      forecast: { election_date: PRESIDENTIAL_2026.date, updated_at: '', candidates: [] } as PresidentialForecastData,
      winProbabilities: { election_date: PRESIDENTIAL_2026.date, second_round_probability: NaN, candidates: [] } as PresidentialWinProbabilitiesData,
      trends: EMPTY_PRESIDENTIAL_TRENDS as PresidentialTrendsData,
      snapshotProbabilities: { ...EMPTY_PRESIDENTIAL_TRENDS, metric: 'first_round_leader_probability' } as PresidentialSnapshotProbabilitiesData,
      polls: { polls: [] } as PresidentialPollsData,
      houseEffects: { pollsters: [], candidates: [], effects: {} } as PresidentialHouseEffectsData,
      headToHead: { election_date: PRESIDENTIAL_2026.date, candidate_a: '', candidate_b: '', color_a: '', color_b: '', dates: [], probability_a_leads: [] } as PresidentialHeadToHeadData,
      runoffPairs: { election_date: PRESIDENTIAL_2026.date, pairs: [], matrix: { candidates: [], colors: [], probabilities: [] } } as PresidentialRunoffPairsData,
      changes: null as PresidentialChangesData | null,
      runoffChanges: null as PresidentialRunoffChangesData | null,
      lastPollDate: null as string | null
    };
  }
}

/**
 * Presidential 2026 runoff archive. The 8000 simulated trajectories are read
 * here and reduced to election-day valid-vote summaries plus an 800-draw
 * subsample (summariseRunoff), so the page no longer ships the raw file.
 */
export async function loadSecondRoundData() {
  try {
    const [forecast, trends, trajectories, validVotes, winProbability, blankNull] =
      await Promise.all([
        loadJsonData<SecondRoundForecastData>('second_round_forecast.json', PRESIDENTIAL_DIR),
        loadJsonData<SecondRoundTrendsData>('second_round_trends.json', PRESIDENTIAL_DIR),
        loadBuildOnlyJson<SecondRoundTrajectoriesData>('second_round_trajectories.json', PRESIDENTIAL_DIR),
        loadJsonData<SecondRoundValidVotesData>('second_round_valid_votes.json', PRESIDENTIAL_DIR),
        loadJsonData<SecondRoundWinProbabilityData>('second_round_win_probability.json', PRESIDENTIAL_DIR),
        loadJsonData<SecondRoundBlankNullData>('second_round_blank_null.json', PRESIDENTIAL_DIR),
      ]);

    const simulations = summariseRunoff(trajectories);
    return {
      available: forecast.candidates.length > 0 && simulations !== null,
      forecast,
      trends,
      simulations,
      validVotes,
      winProbability,
      blankNull: blankNull as SecondRoundBlankNullData | null,
    };
  } catch (error) {
    console.error('Error loading second round data:', error);
    const date = PRESIDENTIAL_2026_SECOND_ROUND_DATE;
    return {
      available: false,
      forecast: { election_type: 'presidential', election_date: date, updated_at: '', candidates: [] } as SecondRoundForecastData,
      trends: { election_type: 'presidential', election_date: date, dates: [], candidates: {} } as SecondRoundTrendsData,
      simulations: null as RunoffSimulations | null,
      validVotes: { election_type: 'presidential', election_date: date, updated_at: '', candidates: [] } as SecondRoundValidVotesData,
      winProbability: { election_date: date, candidates: [] } as SecondRoundWinProbabilityData,
      blankNull: null as SecondRoundBlankNullData | null,
    };
  }
}

export type SecondRoundArchive = Awaited<ReturnType<typeof loadSecondRoundData>>;
