export interface SeatData {
  [party: string]: number;
}

export interface TrendData {
  date: string;
  party: string;
  metric: string;
  value: number;
}

export interface DistrictForecast {
  NAME_1: string;
  district_id: string;
  [key: string]: any;
}

export interface ContestedSeat {
  district: string;
  margin: number;
  [key: string]: any;
}