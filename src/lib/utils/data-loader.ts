import { promises as fs } from 'fs';
import path from 'path';
import { SeatData, TrendData, DistrictForecast, ContestedSeat } from '@/types';

// Load data from the public directory
export async function loadJsonData<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'public', 'data', filename);
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

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