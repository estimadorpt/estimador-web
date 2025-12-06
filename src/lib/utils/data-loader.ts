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
  PresidentialTrajectoriesData,
  PresidentialPollsData,
  PresidentialHouseEffectsData
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
    const [forecast, winProbabilities, trends, trajectories, polls, houseEffects] = await Promise.all([
      loadJsonData<PresidentialForecastData>('presidential_forecast.json'),
      loadJsonData<PresidentialWinProbabilitiesData>('presidential_win_probabilities.json'),
      loadJsonData<PresidentialTrendsData>('presidential_trends.json'),
      loadJsonData<PresidentialTrajectoriesData>('presidential_trajectories.json'),
      loadJsonData<PresidentialPollsData>('presidential_polls.json').catch(() => ({ polls: [] })),
      loadJsonData<PresidentialHouseEffectsData>('presidential_house_effects.json').catch(() => ({ 
        pollsters: [], 
        candidates: [], 
        effects: {} 
      }))
    ]);

    return {
      forecast,
      winProbabilities,
      trends,
      trajectories,
      polls,
      houseEffects
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
      } as PresidentialHouseEffectsData
    };
  }
}