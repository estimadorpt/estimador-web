// Types for the "synthetic population of Portugal" surfaces (schema family
// estimador-populacao-*/v1) produced from the estimador-microsynthesis release
// (package-release) and evaluation (evaluate-all) outputs.
//
// HONESTY NOTE (load-bearing): the scorecard is a *feed* with `status`/`scope`
// precisely so the 50-parish reference numbers shown now can be swapped for the
// national eval when it lands, without a code change. Every field is optional
// and the UI must be null-safe: a whole-feed failure returns null (page shows an
// honest "unavailable"), and any sub-block may arrive `{ status: 'unavailable' }`.

export type FeedStatus = 'ok' | 'preliminary' | 'unavailable' | (string & {});

/**
 * A published quantity with an optional replicate-derived interval. When
 * `n_replicates` < 2 the interval is absent and the value is a point estimate
 * whose precision is not certified (see adaptivePrecision -> confidence 'point').
 */
export interface ReplicateInterval {
  value: number;
  lo?: number;
  hi?: number;
  n_replicates?: number;
}

// ---- scorecard (L0) ---------------------------------------------------------

export interface ScorecardProvenance {
  run?: string;
  engine?: string; // 'vae'
  model_version?: string; // e.g. 'v7d2fix'
  model_sha256?: string;
  code_commit?: string;
  census_vintage?: string; // 'INE Censos 2021'
  config?: {
    p1_oversample?: number;
    g1_eta?: number;
    child_gate_dual?: boolean;
    n_constraints?: number; // 14
  };
  n_parishes?: number;
  n_persons?: number;
  n_households?: number;
  n_replicates?: number; // 1 now, 3 if R=3 lands
}

export interface ScorecardHeadline {
  // person-level pooled SRMSE median (lower is better)
  person_srmse_own?: ReplicateInterval;
  person_srmse_common?: ReplicateInterval;
  marital_srmse?: ReplicateInterval;
  // signed child deficit as a fraction (negative = under-count of children)
  child_deficit?: ReplicateInterval;
  n_failures?: number;
  gate_threshold?: number; // e.g. 0.10 or 0.12
  passes_gate?: boolean;
  // fraction of parishes whose per-stratum result sits inside its pre-registered band
  coverage_in_band?: number;
}

export interface ScorecardStratum {
  key: string; // district code / nuts2 / size-band id
  label: string;
  label_en?: string;
  kind: 'distrito' | 'nuts2' | 'size_band' | (string & {});
  n_parishes?: number;
  person_srmse_median?: ReplicateInterval;
  in_band?: boolean;
  note?: string;
  note_pt?: string;
}

export interface ScorecardConstraint {
  key: string; // e.g. 'p_marital'
  label: string;
  label_en?: string;
  srmse_median?: ReplicateInterval;
  was_constrained?: boolean;
}

export interface ScorecardRetrodiction {
  status: FeedStatus;
  headline?: string;
  headline_pt?: string;
  metrics?: Record<string, number | string>;
  source_url?: string;
}

export interface ScorecardExternalCheck {
  key: string; // 'iefp' | 'seg_social' | 'dgeec'
  label: string;
  label_en?: string;
  synth_value?: number;
  official_value?: number;
  rel_error?: number;
  source?: string;
  note?: string;
  note_pt?: string;
}

// schema estimador-populacao-scorecard/v1
export interface PopulacaoScorecard {
  status: FeedStatus;
  schema?: string;
  scope: string; // PT scope label, e.g. 'referência 50 freguesias (Aveiro)'
  scope_en?: string;
  generated_at?: string;
  provenance?: ScorecardProvenance;
  headline?: ScorecardHeadline;
  strata?: ScorecardStratum[];
  constraints?: ScorecardConstraint[];
  retrodiction?: ScorecardRetrodiction;
  external_checks?: ScorecardExternalCheck[];
  novelty?: {
    household_novel_pct?: number;
    person_verbatim_pct?: number;
    note?: string;
    note_pt?: string;
  };
  // free-form honesty caveats the UI must render, bilingual
  honesty_notes?: { pt?: string; en?: string }[];
}

// ---- tabulator (L1) ---------------------------------------------------------

export type GeoLevel = 'nacional' | 'distrito' | 'municipio' | 'freguesia';
export type TabMeasure = 'count' | 'share';

/**
 * The canonical query tuple. `encodeQuery` maps it to a stable, order-independent
 * slug for citable permalinks; `decodeQuery` is its inverse.
 */
export interface TabQuery {
  geo: string; // geography code ('' = whole country) or DICOFRE / municipio / district code
  geoLevel: GeoLevel;
  dims: string[]; // 1..3 variable ids (persons or households columns)
  measure: TabMeasure;
  filters?: Record<string, string>; // dim -> category value
  v: string; // schema version, TAB_SCHEMA_VERSION
}

// One geography entry in the tabulator manifest (drives the geo picker + suppression).
export interface ManifestGeo {
  code: string;
  name: string;
  level: GeoLevel;
  parent?: string;
  population?: number;
  suppressed?: boolean;
  fallback_geography?: string;
}

// A tabulable variable (persons or households column) with its bilingual categories.
export interface ManifestVariable {
  id: string; // column name in the parquet
  entity: 'person' | 'household';
  label: string;
  label_en?: string;
  categories?: { code: string; label: string; label_en?: string }[];
  ordered?: boolean;
}

// schema estimador-populacao-manifest/v1
export interface PopulacaoManifest {
  status: FeedStatus;
  schema?: string;
  release_version?: string;
  generated_at?: string;
  data_tier?: 'duckdb-wasm' | 'static' | (string & {});
  parquet_glob?: string; // e.g. 'data/demographics/release/persons/district=*/part-0.parquet'
  min_cell?: number; // suppression floor for tiny cells
  variables?: ManifestVariable[];
  geographies?: ManifestGeo[];
  featured?: { slug: string; label: string; label_en?: string }[];
}
