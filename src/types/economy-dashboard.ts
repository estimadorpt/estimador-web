// Types for the "state of the Portuguese economy" dashboard feed produced by
// estimador-economics (schema: estimador-economy-dashboard/v1).
//
// HONESTY NOTE (load-bearing): this feed was adversarially audited to remove
// overclaims. Every tile carries a `label` (a badge) and a `honesty_note` (the
// caveat string) that the UI MUST render. Optional `*_pt` fields are reserved
// so a future Portuguese translation of the (currently English) caveat strings
// can be slotted in without a schema change. Every tile may instead arrive as
// `{ status: "unavailable", reason }`, so all fields are optional and the UI is
// null-safe.

export type TileStatus = 'ok' | 'unavailable' | (string & {});

export interface DashboardVintage {
  position?: string; // 'M1' | 'M2' | 'M3'
  pct_complete?: number;
  target_quarter?: string;
  coverage_by_month?: { m1?: number; m2?: number; m3?: number };
}

// Top-level bilingual narrative assembled by fixed rules from the published
// tiles (a presentation feature — no model, no new claim).
export interface DashboardNarrative {
  en?: string;
  pt?: string;
  generated_by?: string;
}

// ---- health_score (hero) ----------------------------------------------------

export type HealthVerdict =
  | 'contracting'
  | 'softening'
  | 'steady'
  | 'expanding'
  | 'strong'
  | (string & {});

export interface HealthScoreComponents {
  activity_subscore?: number;
  downside_subscore?: number;
  recession_cap?: number;
  blended_before_recession_cap?: number;
  weights?: {
    activity?: number;
    downside?: number;
    recession?: string;
  };
}

export interface HealthScoreTileData {
  status: TileStatus;
  label?: string;
  score_0_100?: number;
  verdict?: HealthVerdict;
  components?: HealthScoreComponents;
  inputs_used?: Record<string, number>;
  inputs_available?: Record<string, string>;
  honesty_note?: string;
  honesty_note_pt?: string;
  source_tiles?: Record<string, number | string>;
  reason?: string;
}

// ---- pulse (anchored) ---------------------------------------------------------
// The LEVEL is the monthly BdP "Coincident Activity" print (the anchor); the
// weekly index is demoted to a direction-only TILT under `components`.

export interface PulsePoint {
  date: string;
  value: number; // already in YoY GDP growth percent units (NOT a fraction)
}

export interface PulseTracking {
  corr_bdp_coincident_activity_insample?: number;
  lead_lag_verdict?: string;
  pseudo_rt_level_corr_yoy_gdp_inclcovid?: number;
  pseudo_rt_level_corr_yoy_gdp_exclcovid?: number;
  pseudo_rt_change_corr_yoy_gdp_inclcovid?: number;
  pseudo_rt_change_corr_yoy_gdp_exclcovid?: number;
  pseudo_rt_corr_bdp_coincident?: number;
  pseudo_rt_revision_stability?: number;
  incremental_vs_ar1_exclcovid_relrmse?: number;
  incremental_significant?: boolean;
}

export interface PulseAnchor {
  value?: number; // YoY % (BdP native units)
  date?: string;
  units?: string; // 'yoy_pct_bdp_native'
  source?: string;
  corr_yoy_gdp_exclcovid?: number;
}

export interface PulseTilt {
  value?: number; // pp change of the weekly index since the anchor print
  window_days?: number;
  direction?: 'up' | 'down' | 'flat' | (string & {});
}

export interface PulseAnchorHonesty {
  anchor_claim?: string;
  tilt_claim?: string;
  hybrid_validation?: string;
}

// The demoted weekly index, kept as a component (sparkline + tracking stats).
export interface PulseWeeklyIndex {
  indicator?: string;
  units?: string; // 'yoy_gdp_growth_pct'
  description?: string;
  latest?: { date: string; value: number };
  n_inputs?: number;
  inputs_used?: string[];
  weights?: Record<string, number>;
  trailing_52w_min?: number;
  trailing_52w_max?: number;
  tracking?: PulseTracking;
  history_recent?: PulsePoint[];
}

export interface PulseTileData {
  status: TileStatus;
  label?: string;
  lead?: string; // 'anchor'
  mode?: string; // 'anchored'
  anchor?: PulseAnchor;
  tilt?: PulseTilt;
  combined_read?: number; // anchor + tilt, YoY % — freshness overlay only
  anchor_honesty?: PulseAnchorHonesty;
  honesty_note?: string;
  honesty_note_pt?: string;
  components?: { weekly_index?: PulseWeeklyIndex };
  reason?: string;
}

// ---- contributions ----------------------------------------------------------

export interface ContributionDriver {
  variable: string;
  impact: number;
  surprise?: number;
  weight?: number;
}

export interface ContributionGroup {
  group: string;
  contribution: number; // q/q GDP growth fraction
  share?: number;
  top_drivers?: ContributionDriver[];
}

export interface ContributionsLevelDecomposition {
  target_quarter?: string;
  vintage_date?: string;
  nowcast?: number;
  prior?: number;
  explained?: number;
  residual?: number;
  identity_ok?: boolean;
  groups?: ContributionGroup[];
}

export interface ContributionsRevisionDecomposition {
  vintage_old?: string;
  vintage_new?: string;
  target_quarter?: string;
  nowcast_old?: number;
  nowcast_new?: number;
  revision?: number;
  groups?: ContributionGroup[];
}

export interface ContributionsTileData {
  status: TileStatus;
  label?: string;
  tile_label?: string;
  target_quarter?: string;
  vintage_date?: string;
  position?: string;
  pct_complete?: number;
  summary?: string;
  summary_pt?: string;
  note?: string;
  note_pt?: string;
  level_decomposition?: ContributionsLevelDecomposition;
  revision_decomposition?: ContributionsRevisionDecomposition;
  reason?: string;
}

// ---- recession --------------------------------------------------------------

export interface RecessionScorecard {
  brier?: number;
  brier_base_rate?: number;
  brier_skill_vs_base_rate?: number;
  brier_persistence?: number;
  brier_skill_vs_persistence?: number;
  auc?: number;
  n_oos?: number;
  n_oos_episodes?: number;
}

export interface RecessionProbPoint {
  quarter: string;
  p: number;
}

export interface RecessionProbabilityBlock {
  available?: boolean;
  probability?: number; // 0..1
  as_of_quarter?: string;
  horizon_quarters?: number;
  method?: string;
  probability_history?: RecessionProbPoint[];
  scorecard?: RecessionScorecard;
  signals_used?: string[];
  honesty_note?: string;
  honesty_note_pt?: string;
}

export interface SahmTripwire {
  available?: boolean;
  triggered?: boolean;
  latest_gap_pp?: number;
  threshold_pp?: number;
  k_std?: number;
  gap_std_pp?: number;
  recessions_caught?: number;
  n_recessions_in_window?: number;
  false_positive_episodes?: number;
  honesty_note?: string;
  honesty_note_pt?: string;
}

export interface RecessionTileData {
  status: TileStatus;
  label?: string;
  probability?: number;
  as_of_quarter?: string;
  recession_probability?: RecessionProbabilityBlock;
  leading_recession_probability?: RecessionProbabilityBlock;
  sahm_tripwire?: SahmTripwire;
  lead_signal?: string;
  reason?: string;
}

// ---- growth_at_risk ---------------------------------------------------------

export interface GarQuantiles {
  q05?: number;
  q10?: number;
  q50?: number;
  q90?: number;
  q95?: number;
}

export interface GrowthAtRiskTileData {
  status: TileStatus;
  label?: string;
  horizon_quarters?: number;
  as_of?: string;
  quantiles?: GarQuantiles;
  median?: number;
  downside_q05?: number;
  upside_q95?: number;
  downside_band?: [number, number];
  baseline_quantiles?: GarQuantiles;
  baseline_kind?: string;
  conditioning?: { stress?: number; activity?: number };
  stress_widens_downside?: boolean;
  n_train?: number;
  quantile_method?: string;
  honesty_note?: string;
  honesty_note_pt?: string;
  reason?: string;
}

// ---- official_quarterly (demoted) -------------------------------------------

export interface SectorComposite {
  name: string;
  value: number;
  indicators?: string[];
}

export interface ImpliedYoy {
  point_yoy?: number; // fraction
  ci_80?: [number, number];
  ci_95?: [number, number];
  published_lags_sum?: number;
  note?: string;
}

export interface OfficialQuarterlyTileData {
  status: TileStatus;
  label?: string; // 'early-indicative' | 'indicative' | 'preliminary'
  model?: string; // e.g. 'shrink_combo'
  target_quarter?: string;
  position?: string;
  pct_complete?: number;
  point_qoq?: number; // q/q GDP growth fraction
  ci_80?: [number, number];
  ci_95?: [number, number];
  se?: number;
  band_method?: string;
  band_calibrated?: boolean;
  band_shape?: string; // 'asymmetric' | 'symmetric'
  native_se?: number;
  is_meaningful?: boolean;
  implied_yoy?: ImpliedYoy;
  sector_composites?: SectorComposite[];
  combo_weights?: Record<string, number>; // member -> weight (sums ~1)
  combo_member_points?: Record<string, number>; // member -> q/q fraction
  honesty_note?: string;
  honesty_note_pt?: string;
  first_release_note?: string;
  reason?: string;
}

// ---- annual_outlook ----------------------------------------------------------

export interface AnnualOutlookBands {
  p10?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p90?: number;
}

export interface AnnualOutlookProbLadder {
  gt_0?: number;
  gt_1?: number;
  gt_2?: number;
  gt_3?: number;
  lt_0?: number;
}

export interface AnnualOutlookValidation {
  replay_years?: string;
  cov80_all?: number;
  cov80_excl_covid?: number;
  crps_skill_vs_climatology?: number;
  crps_skill_excl_covid?: number;
}

export interface ConsensusForecast {
  institution?: string;
  publication?: string;
  pub_date?: string;
  value_pct?: number;
  url?: string;
  percentile_on_our_distribution?: number;
}

export interface AnnualOutlookConsensus {
  available?: boolean;
  forecasts?: ConsensusForecast[];
  note?: string;
}

export interface AnnualOutlookNowcastSeed {
  point_qoq?: number;
  sigma?: number;
  source?: string;
  band_calibrated?: boolean;
}

export interface AnnualOutlookTileData {
  status: TileStatus;
  label?: string; // 'annual outlook'
  target_year?: number;
  published_through?: string;
  nowcast_quarter?: string;
  nowcast_source?: string;
  point?: number; // percent (annual average real GDP growth)
  median?: number; // percent
  bands?: AnnualOutlookBands; // percent
  prob_ladder?: AnnualOutlookProbLadder; // 0..1
  carryover_floor?: number; // percent
  n_sims?: number;
  validation?: AnnualOutlookValidation;
  honesty_note?: string;
  honesty_note_pt?: string;
  units?: string;
  nowcast_seed?: AnnualOutlookNowcastSeed;
  consensus?: AnnualOutlookConsensus;
  reason?: string;
}

// ---- track_record -------------------------------------------------------------

export interface TrackRecordBacktestRow {
  quarter?: string;
  horizon?: string; // 'M1' | 'M2' | 'M3'
  model?: string;
  our_call?: number; // fraction
  ar1?: number; // fraction
  first_release?: number; // fraction
  latest_outturn?: number; // fraction
  abs_error?: number;
  hit80?: boolean;
  covid?: boolean;
}

export interface TrackRecordEraStats {
  n_scored?: number;
  rmse_pp_vs_first_release?: number;
  rel_vs_ar1_first_release?: number;
  rmse_pp_vs_latest?: number;
  rel_vs_ar1_latest?: number;
  band_hit_rate_80?: number;
}

export interface TrackRecordHorizonSummary {
  n?: number;
  n_covid?: number;
  excl_covid?: TrackRecordEraStats;
  incl_covid?: TrackRecordEraStats;
}

export interface TrackRecordBacktestEra {
  label?: string;
  definition_genuine?: string;
  sources?: string[];
  notes?: string[];
  rows?: TrackRecordBacktestRow[];
  summary?: Record<string, TrackRecordHorizonSummary>; // keyed by horizon
}

export interface TrackRecordLiveRow {
  date?: string;
  target_quarter?: string;
  position?: string;
  model?: string;
  our_call?: number; // fraction
  ci_80?: [number, number] | null;
  outturn?: number | null;
}

export interface TrackRecordLiveSummary {
  n_records?: number;
  n_days?: number;
  n_with_outturn?: number;
  rmse_pp_vs_first_release?: number | null;
  rel_vs_ar1_first_release?: number | null;
  band_hit_rate_80?: number | null;
  note?: string;
}

export interface TrackRecordLiveEra {
  label?: string;
  source?: string;
  started?: string;
  rows?: TrackRecordLiveRow[];
  summary?: TrackRecordLiveSummary;
}

export interface TrackRecordTileData {
  status: TileStatus;
  label?: string; // 'track record'
  as_of?: string;
  framing?: string; // verbatim two-era framing string — render as-is
  eras?: {
    backtest?: TrackRecordBacktestEra;
    live?: TrackRecordLiveEra;
  };
  honesty_note?: string;
  honesty_note_pt?: string;
  reason?: string;
}

// ---- labour -------------------------------------------------------------------

export interface LabourTileData {
  status: TileStatus;
  label?: string; // 'labour market'
  verdict?: 'improving' | 'stable' | 'deteriorating' | (string & {});
  verdict_rule?: string;
  unemployment_rate?: {
    level_pct?: number;
    level_date?: string;
    change_3m_pp?: number;
    change_as_of?: string;
  };
  iefp_registered_unemployment?: {
    change_3m_persons?: number;
    change_as_of?: string;
  };
  employment_expectations?: {
    value?: number;
    date?: string;
  };
  honesty_note?: string;
  honesty_note_pt?: string;
  reason?: string;
}

// ---- top level --------------------------------------------------------------

export interface EconomyDashboardTiles {
  health_score?: HealthScoreTileData;
  pulse?: PulseTileData;
  contributions?: ContributionsTileData;
  recession?: RecessionTileData;
  growth_at_risk?: GrowthAtRiskTileData;
  official_quarterly?: OfficialQuarterlyTileData;
  annual_outlook?: AnnualOutlookTileData;
  track_record?: TrackRecordTileData;
  labour?: LabourTileData;
}

export interface EconomyDashboard {
  schema?: string;
  as_of?: string;
  vintage_date?: string;
  disclaimer?: string;
  disclaimer_pt?: string;
  narrative?: DashboardNarrative;
  vintage?: DashboardVintage;
  tiles?: EconomyDashboardTiles;
}

// A tile is renderable when it exists and is not explicitly unavailable.
export function isTileAvailable<T extends { status?: TileStatus }>(
  tile: T | undefined | null
): tile is T {
  return !!tile && tile.status !== 'unavailable';
}
