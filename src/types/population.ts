/**
 * Synthetic population of Portugal (estimador-microsynthesis), as the website
 * receives it.
 *
 * Two layers:
 * - the producer's public contract v1 (`PublicResponseV1` and friends), which
 *   is what every public number is, and
 * - the compact files `scripts/sync-population.py` writes under
 *   `public/data/population/v<release>/`, which rebuild those responses
 *   exactly (`rebuildResponse` in src/lib/population/compact.ts).
 */

// ---- contract v1 (producer: portugal_synthpop.public_contract) --------------

export type ContractVersion = '1.0';
export type PublicDataStatus = 'fixture' | 'draft' | 'release';
export type PublicSurface = 'story' | 'scorecard' | 'portrait' | 'game' | 'tabulator';
export type StorageBackend = 'static_json' | 'duckdb_wasm';
export type GeographyLevel = 'freguesia' | 'municipio' | 'national';
export type PublicationDecision = 'publish' | 'fallback' | 'refuse';
export type QualityTier = 'A' | 'B' | 'C' | 'suppressed' | 'unscored';
export type ReasonCode =
  | 'population_below_500'
  | 'eval_incomplete'
  | 'joint_not_publication_grade'
  | 'cell_below_minimum'
  | 'field_unvalidated'
  | 'use_municipio_or_wait_for_v1_1';

export interface GeographyRef {
  level: GeographyLevel;
  code: string;
  name?: string | null;
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'in';
  values: string[];
}

export interface PublicQueryV1 {
  contract_version: ContractVersion;
  release_version: string;
  geography: GeographyRef;
  unit: 'person' | 'household';
  dimensions: string[];
  filters: QueryFilter[];
  measure: 'count' | 'share';
  normalization: 'none' | 'grand_total' | 'row';
}

export interface PublicVariation {
  type: 'model_run' | 'calibrated_interval';
  lower: number;
  upper: number;
  runs: number | null;
  calibrated: boolean;
  interpretation_pt: string;
}

export interface PublicCell {
  coordinates: Record<string, string>;
  count: number | null;
  share: number | null;
  display_value: string;
  suppressed: boolean;
  suppression_reason: string | null;
  variation: PublicVariation | null;
}

export interface PublicProvenance {
  data_vintage: string;
  calibration_source: string;
  record_type: 'synthetic';
  method_version: string;
  model_sha256: string | null;
  pipeline_stages: string[];
  fields: Record<string, string>;
}

export interface PublicDisplay {
  rounding: 'exact' | 'nearest_10' | 'nearest_100' | 'whole_percent' | 'one_decimal_percent';
  locale: string;
  suppressed_label: string;
}

export interface PublicResponseV1 {
  contract_version: ContractVersion;
  data_status: PublicDataStatus;
  query: PublicQueryV1;
  query_id: string;
  resolved_geography: GeographyRef;
  quality: {
    decision: PublicationDecision;
    requested_tier: QualityTier;
    resolved_tier: QualityTier | null;
    reasons: string[];
    fallback_geography: GeographyRef | null;
    minimum_cell: number;
  };
  display: PublicDisplay;
  cells: PublicCell[];
  provenance: PublicProvenance;
  links: {
    canonical_path: string;
    methodology_path: string;
    quality_path: string;
    download_path?: string | null;
  };
}

export interface PublicBundleV1 {
  contract_version: ContractVersion;
  release_version: string;
  data_vintage: string;
  data_status: PublicDataStatus;
  storage_backends: StorageBackend[];
  responses: PublicResponseV1[];
  surfaces: Array<{ surface: PublicSurface; query_ids: string[] }>;
}

// ---- compact web files (scripts/sync-population.py) --------------------------

/** One approved query template ("recipe"), keyed by name in meta.json. */
export interface PopulationRecipe {
  unit: 'person' | 'household';
  dimensions: string[];
  filters: QueryFilter[];
  measure: 'share';
  normalization: 'grand_total' | 'row';
  minimum_tier: QualityTier;
  surfaces: PublicSurface[];
}

/** The eight portrait recipes, in the producer's manifest order. */
export type PortraitRecipe =
  | 'elders_alone'
  | 'who_lives_alone'
  | 'multigenerational'
  | 'age'
  | 'employment'
  | 'education'
  | 'household_size'
  | 'household_type';

export type RecipeName = PortraitRecipe | 'national_age';

/**
 * A cell as written by the sync: [coordinate values in dimension order, share,
 * display_value] and, for a suppressed cell, the suppression reason. `share` is
 * null exactly when the cell is suppressed.
 */
export type CompactCell =
  | [values: string[], share: number, display: string]
  | [values: string[], share: null, display: string, reason: string];

export interface CompactResponse {
  id: string;
  decision: PublicationDecision;
  requested_tier: QualityTier;
  resolved_tier: QualityTier | null;
  reasons: ReasonCode[];
  cells: CompactCell[];
  /** The município code (DDCC00) the response resolved to, on a fallback. */
  resolved?: string;
}

export interface ParishRecord {
  code: string;
  /** Upper-case CAOP name, as in the query (it is part of the query_id hash). */
  caop_name: string;
  tier: 'A' | 'B' | 'C';
  status: 'publish' | 'fallback';
  fallback: { code: string; name: string } | null;
  /**
   * The parish's place facts, so its page can draw the hero from this one
   * file before places.json arrives (written by the sync from v1.0.3 on).
   */
  place?: ParishPlace;
  responses: Record<PortraitRecipe, CompactResponse>;
}

export interface ParishPlace {
  /** The CAOP 2021 display name ("Aguada de Cima"). */
  name: string;
  /** Município code (DDCC). */
  municipality: string;
  municipality_name: string;
  /** Region id ("01"…"18", "azores", "madeira"). */
  region: string;
  region_name: string;
  level: 'p' | 'f';
  /** INE, Censos 2021: residents. */
  census_population: number;
  /** The generated population's households (each collective living quarter counts as one). Not INE's. */
  generated_households: number;
  /** quality.csv: the count the quality tier was decided on (the smaller of the generated and INE counts). */
  publication_population: number;
  /** quality.csv's one worst table (code, e.g. `srmse_p_age_single`) and its SRMSE, verbatim (MR2-03). */
  worst_constraint?: string;
  worst_constraint_srmse?: number;
}

export interface NationalRecord {
  code: 'PT';
  name: string;
  recipe: 'national_age';
  response: CompactResponse;
}

export interface PopulationMeta {
  schema: 'estimador-population-web/v1';
  release_version: string;
  contract_version: ContractVersion;
  data_status: PublicDataStatus;
  data_vintage: string;
  published: string;
  provenance: PublicProvenance;
  display: PublicDisplay;
  links: { methodology_path: string; quality_path: string; download_path?: string | null };
  minimum_cell: number;
  recipes: Record<RecipeName, PopulationRecipe>;
  recipe_order: PortraitRecipe[];
  reasons: Record<ReasonCode, { pt: string; en: string }>;
  honesty: {
    portrait: { pt: string; en: string };
    game: { message_pt: string; message_en: string; ranking_claims: boolean };
  };
  coordinates: Record<string, string[]>;
  counts: {
    persons: number;
    households: number;
    parishes: number;
    municipalities: number;
    tiers: Record<'A' | 'B' | 'C', number>;
    /** Only the decisions the release takes (publish only since v1.0.1). */
    decisions: Partial<Record<PublicationDecision, number>>;
    responses: number;
    suppressed_cells: number;
  };
}

/**
 * [code, name, municipality (DDCC), tier, level ("p" parish figures, "f"
 * município), INE residents, generated households, lat, lon, publication
 * population]. The household
 * count is the generated population's (each collective living quarter counts
 * as one household), never INE's: only the residents carry "(INE)".
 */
export type PlaceRow = [
  code: string,
  name: string,
  municipality: string,
  tier: 'A' | 'B' | 'C',
  level: 'p' | 'f',
  censusPopulation: number,
  generatedHouseholds: number,
  lat: number,
  lon: number,
  /** quality.csv: the count the tier was decided on (the smaller of the generated and INE counts). */
  publicationPopulation: number,
];

export interface PopulationPlaces {
  release_version: string;
  geography: {
    vintage: string;
    source: string;
    source_url: string;
    license: string;
    license_url: string;
    points: string;
  };
  population_source: string;
  /** Where the household column comes from (the generated population, not INE). */
  households_source?: string;
  columns: string[];
  /** [regionId ("01"…"18", "azores", "madeira"), name] */
  regions: Array<[string, string]>;
  /** [code (DDCC), name, regionId] */
  municipalities: Array<[string, string, string]>;
  parishes: PlaceRow[];
}

export interface GameIndex {
  schema: string;
  release_version: string;
  /** Day 0 (Europe/Lisbon calendar date) of Freguesia Misteriosa. */
  epoch: string;
  candidates: number;
  chunk_size: number;
  chunks: number;
  eligible_tiers: string[];
  curation_rule: string;
  honesty: { message_pt: string; message_en: string; ranking_claims: boolean };
  geography: Record<string, unknown>;
}

export interface GameEntry {
  order: number;
  code: string;
  tier: 'A' | 'B' | 'C';
  responses: Record<PortraitRecipe, CompactResponse>;
}

export interface ScorecardValue {
  value: number;
  lo: number | null;
  hi: number | null;
  n_replicates: number;
  measured?: boolean;
  calibrated: boolean;
  variation_type: string;
}

export interface PopulationScorecard {
  schema: string;
  status: 'ok' | 'preliminary';
  scope: string;
  scope_en: string;
  generated_at: string;
  headline: {
    person_srmse_own: ScorecardValue;
    person_srmse_common: ScorecardValue;
    marital_srmse: ScorecardValue;
    child_deficit: ScorecardValue;
    n_failures: number;
    passes_gate: boolean;
    /** Share strictly inside a pre-registered range (0 when every band sits below it, i.e. better). Never shown. */
    coverage_in_band: number;
    /**
     * From v1.0.2: the producer's own reading of the size bands against their
     * pre-registered (informational) ranges, in words. Not rendered:
     * informational ranges from an earlier engine and an out-of-fit check (MR2-02).
     */
    band_reading?: {
      pt: string;
      en: string;
      share_at_or_better_than_range: number;
      parishes_by_position: Record<'below' | 'inside' | 'above', number>;
      ranges_gate_release: boolean;
    };
  };
  constraints: Array<{ key: string; label: string; label_en: string; srmse_median: ScorecardValue; was_constrained: boolean }>;
  /**
   * Size-band strata. `in_band`, `acceptance` and `release_decision` are
   * internal (informational ranges; `in_band` is false for a band *better*
   * than its range) and are never rendered as a pass/fail. From v1.0.2 each
   * band carries `band_position` and a producer note in words (`note_pt` /
   * `note_en`; before v1.0.2 `note_pt` held a status code, so the site reads
   * the notes only when `band_position` is present).
   */
  strata: Array<{
    key: string;
    kind: string;
    label: string;
    label_en: string;
    n_parishes: number;
    person_srmse_median: ScorecardValue;
    band_position?: 'below' | 'inside' | 'above';
    note_pt?: string;
    note_en?: string;
    [internal: string]: unknown;
  }>;
  retrodiction: { status: string; reason?: string };
  external_checks: unknown[];
  novelty: { household_novel_pct: number; person_verbatim_pct: number; [extra: string]: unknown };
  privacy: {
    status: string;
    person_membership_excess_auc: number;
    attribute_inference_excess: number;
    person_dcr?: Record<string, unknown>;
  };
  honesty_notes: Array<{ pt: string; en: string }>;
  provenance: {
    n_persons: number;
    n_households: number;
    n_parishes: number;
    n_replicates: number;
    model_sha256: string;
    code_commit: string;
    model_version: string;
    census_vintage: string;
    [extra: string]: unknown;
  };
}

export interface ReleaseColumn {
  description: string;
  label_map?: string | null;
  provenance: string;
}

export interface PopulationReleaseInfo {
  name: string;
  version: string;
  published: string;
  license: string;
  census_vintage: string;
  geography_vintage: Record<string, unknown>;
  run_started: string;
  engine: string;
  model_version: string;
  model_sha256: string;
  code_commit: string;
  counts: Record<string, number>;
  quality_summary: Record<string, number>;
  quality_tier_policy: Record<string, unknown>;
  attribution: { pt: string; en: string; cite_as: string };
  column_dictionary: { households: Record<string, ReleaseColumn>; persons: Record<string, ReleaseColumn> };
  label_maps: Record<string, Record<string, string>>;
  checksums_sha256: string;
  package_bytes: number;
  files: Array<{ path: string; bytes: number; sha256: string }>;
}
