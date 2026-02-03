import { promises as fs } from 'fs';
import path from 'path';
import {
  SeatData,
  TrendData,
  DistrictForecast,
  ContestedSeat,
  PresidentialForecastData,
  PresidentialWinProbabilitiesData,
  PresidentialTrendsData,
  PresidentialSnapshotProbabilitiesData,
  PresidentialTrajectoriesData,
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

// Load data from the public directory
export async function loadJsonData<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'public', 'data', filename);
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// Parliamentary forecast data loader
export async function loadForecastData() {
  try {
    const [seatData, nationalTrends, districtForecast, contestedSeats, houseEffects] = await Promise.all([
      loadJsonData<SeatData[]>('seat_forecast_simulations.json'),
      loadJsonData<TrendData[]>('national_trends.json'),
      loadJsonData<any[]>('district_forecast.json'),
      loadJsonData<any>('contested_summary.json'),
      loadJsonData<any[]>('house_effects.json').catch(() => [])
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
      districtForecast: [] as any[],
      contestedSeats: {} as any,
      houseEffects: [] as any[]
    };
  }
}

// Presidential forecast data loader
export async function loadPresidentialData() {
  try {
    const [forecast, winProbabilities, trends, snapshotProbabilities, trajectories, polls, houseEffects, headToHead, electionDayRunoffPairs, snapshotRunoffPairs, changes, runoffChanges] = await Promise.all([
      loadJsonData<PresidentialForecastData>('presidential_forecast.json'),
      loadJsonData<PresidentialWinProbabilitiesData>('presidential_win_probabilities.json'),
      loadJsonData<PresidentialTrendsData>('presidential_trends.json'),
      loadJsonData<PresidentialSnapshotProbabilitiesData>('presidential_snapshot_probabilities.json').catch(() => ({
        election_date: '2026-01-18',
        dates: [],
        metric: 'first_round_leader_probability',
        candidates: {}
      })),
      loadJsonData<PresidentialTrajectoriesData>('presidential_trajectories.json'),
      loadJsonData<PresidentialPollsData>('presidential_polls.json').catch(() => ({ polls: [] })),
      loadJsonData<PresidentialHouseEffectsData>('presidential_house_effects.json').catch(() => ({ 
        pollsters: [], 
        candidates: [], 
        effects: {} 
      })),
      loadJsonData<PresidentialHeadToHeadData>('presidential_head_to_head.json').catch(() => ({
        election_date: '2026-01-18',
        candidate_a: '',
        candidate_b: '',
        color_a: '#000000',
        color_b: '#000000',
        dates: [],
        probability_a_leads: []
      })),
      loadJsonData<PresidentialRunoffPairsData>('presidential_runoff_pairs.json').catch(() => ({
        election_date: '2026-01-18',
        pairs: [],
        matrix: { candidates: [], colors: [], probabilities: [] }
      })),
      // Try to load snapshot runoff pairs (computed at last poll date from full posterior)
      loadJsonData<PresidentialRunoffPairsData>('presidential_snapshot_runoff_pairs.json').catch(() => null),
      // Load leading probability changes since last poll
      loadJsonData<PresidentialChangesData>('presidential_changes.json').catch(() => null),
      // Load runoff probability changes since last poll
      loadJsonData<PresidentialRunoffChangesData>('presidential_runoff_changes.json').catch(() => null)
    ]);

    // Calculate last poll date
    let lastPollDate = forecast.election_date;
    if (polls.polls.length > 0) {
      lastPollDate = polls.polls[0].date;
      for (const poll of polls.polls) {
        if (poll.date > lastPollDate) {
          lastPollDate = poll.date;
        }
      }
    }

    // Use snapshot runoff pairs (computed at last poll date from full posterior)
    // if available, otherwise fall back to election day runoff pairs
    const runoffPairs = snapshotRunoffPairs || electionDayRunoffPairs;

    return {
      forecast,
      winProbabilities,
      trends,
      snapshotProbabilities,
      trajectories,
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
    // Return empty default data
    return {
      forecast: {
        election_date: '2026-01-18',
        updated_at: new Date().toISOString(),
        candidates: []
      } as PresidentialForecastData,
      winProbabilities: {
        election_date: '2026-01-18',
        second_round_probability: 1.0,
        candidates: []
      } as PresidentialWinProbabilitiesData,
      trends: {
        election_date: '2026-01-18',
        dates: [],
        candidates: {}
      } as PresidentialTrendsData,
      snapshotProbabilities: {
        election_date: '2026-01-18',
        dates: [],
        metric: 'first_round_leader_probability',
        candidates: {}
      } as PresidentialSnapshotProbabilitiesData,
      trajectories: {
        election_date: '2026-01-18',
        dates: [],
        n_samples: 0,
        candidates: {}
      } as PresidentialTrajectoriesData,
      polls: {
        polls: []
      } as PresidentialPollsData,
      houseEffects: {
        pollsters: [],
        candidates: [],
        effects: {}
      } as PresidentialHouseEffectsData,
      headToHead: {
        election_date: '2026-01-18',
        candidate_a: '',
        candidate_b: '',
        color_a: '#000000',
        color_b: '#000000',
        dates: [],
        probability_a_leads: []
      } as PresidentialHeadToHeadData,
      runoffPairs: {
        election_date: '2026-01-18',
        pairs: [],
        matrix: { candidates: [], colors: [], probabilities: [] }
      } as PresidentialRunoffPairsData,
      changes: null as PresidentialChangesData | null,
      runoffChanges: null as PresidentialRunoffChangesData | null,
      lastPollDate: '2026-01-18'
    };
  }
}

// Second round forecast data loader
export async function loadSecondRoundData() {
  try {
    const [forecast, trends, trajectories, validVotes, winProbability, blankNull] =
      await Promise.all([
        loadJsonData<SecondRoundForecastData>('second_round_forecast.json'),
        loadJsonData<SecondRoundTrendsData>('second_round_trends.json'),
        loadJsonData<SecondRoundTrajectoriesData>('second_round_trajectories.json'),
        loadJsonData<SecondRoundValidVotesData>('second_round_valid_votes.json'),
        loadJsonData<SecondRoundWinProbabilityData>('second_round_win_probability.json'),
        loadJsonData<SecondRoundBlankNullData>('second_round_blank_null.json'),
      ]);

    return { forecast, trends, trajectories, validVotes, winProbability, blankNull };
  } catch (error) {
    console.error('Error loading second round data:', error);
    return {
      forecast: {
        election_type: 'presidential',
        election_date: '2026-02-08',
        updated_at: new Date().toISOString(),
        candidates: []
      } as SecondRoundForecastData,
      trends: {
        election_type: 'presidential',
        election_date: '2026-02-08',
        dates: [],
        candidates: {}
      } as SecondRoundTrendsData,
      trajectories: {
        election_type: 'presidential',
        election_date: '2026-02-08',
        dates: [],
        n_samples: 0,
        candidates: {}
      } as SecondRoundTrajectoriesData,
      validVotes: {
        election_type: 'presidential',
        election_date: '2026-02-08',
        updated_at: new Date().toISOString(),
        candidates: []
      } as SecondRoundValidVotesData,
      winProbability: {
        election_date: '2026-02-08',
        candidates: []
      } as SecondRoundWinProbabilityData,
      blankNull: {
        election_date: '2026-02-08',
        name: 'Blank/Null',
        color: '#A9A9A9',
        mean: 0,
        ci_lower: 0,
        ci_upper: 0
      } as SecondRoundBlankNullData
    };
  }
}