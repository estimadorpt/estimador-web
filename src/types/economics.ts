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

// Intra-quarter "firm up" trajectory: how the current-quarter nowcast evolves
// as data arrives (M1 -> M2 -> M3). A TIMELINESS/transparency view, NOT an
// accuracy gain — only the M3 (quarter-end) read has verified skill. M1/M2 are
// preliminary and not yet better than a naive benchmark, which the per-vintage
// status + reliability copy makes explicit.
export interface EconomicsTrajectorySector {
  name: string;
  value: number; // sector composite, q/q log-diff fraction
}

export interface EconomicsTrajectoryVintage {
  vintage: 'M1' | 'M2' | 'M3';
  label: string; // ASCII fallback; PT/EN display comes from i18n stepM1/M2/M3
  as_of: string | null; // ISO date; null when pending
  point: number | null; // q/q log-diff fraction; null when status === 'pending'
  pct_complete: number; // data completeness at this vintage
  status: 'preliminary' | 'authoritative' | 'pending';
  rel_rmse_vs_ar1: number | null; // certified eval-card lookup (M1=1.03, M2=1.00, M3=0.78)
  typical_error_band: [number, number] | null; // point +/- 1.0pp; null when pending
  sector_composites: EconomicsTrajectorySector[];
  gap_to_outturn?: number | null; // only present in the convergence demo
}

export interface EconomicsTrajectorySectorDelta {
  from: string;
  to: string;
  by_sector: { name: string; delta: number }[];
}

export interface EconomicsCurrentQuarterTrajectory {
  target_quarter: string;
  current_position: string; // mirrors vintage.position
  note: string;
  vintages: EconomicsTrajectoryVintage[];
  sector_deltas: EconomicsTrajectorySectorDelta[];
}

export interface EconomicsLastCompletedQuarterTrajectory {
  target_quarter: string;
  official_outturn: number; // Eurostat namq_10_gdp q/q log-diff
  note: string;
  vintages: EconomicsTrajectoryVintage[];
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
  current_quarter_trajectory?: EconomicsCurrentQuarterTrajectory;
  last_completed_quarter_trajectory?: EconomicsLastCompletedQuarterTrajectory;
}
