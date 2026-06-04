// Types for the Portuguese GDP nowcast feed produced by estimador-economics
// (src/pipeline/daily.py -> nowcast_latest.json). Mirrors the honest, audited
// feed: one production model (supply_side_bridge) at quarter-end, an empirical
// error band (not calibrated CIs), and an operating-point/freshness gate.

export interface EconomicsHeadline {
  model: string;
  point: number; // q/q real GDP growth (log-diff fraction, e.g. 0.0039 = 0.39%)
  typical_error_band: [number, number];
  typical_error_pp: number;
  intervals_calibrated: boolean;
  operating_point: string; // 'M1' | 'M2' | 'M3'
  status: 'authoritative' | 'preliminary';
  caveat: string;
}

export interface EconomicsLatestOfficial {
  quarter: string; // e.g. '2026Q1'
  qoq_growth: number;
  source: string;
}

export interface EconomicsGdpHistoryPoint {
  quarter: string;
  qoq_growth: number;
}

export interface EconomicsDataAvailability {
  pct_complete: number;
  n_series: number;
  latest_date: string;
  data_age_days: number | null;
  stale: boolean;
}

export interface EconomicsNowcast {
  vintage_date: string;
  computed_at: string;
  target_quarter: string;
  headline?: EconomicsHeadline;
  latest_official?: EconomicsLatestOfficial;
  gdp_history?: EconomicsGdpHistoryPoint[];
  data_availability: EconomicsDataAvailability;
  vintage?: { position: string; pct_complete: number; calendar_date: string };
  model_status?: Record<string, string>;
}
