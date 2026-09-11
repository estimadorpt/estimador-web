// Types for the "data stories" feed produced by estimador-economics
// (schema: estimador-stories/v1, src/pipeline/stories.py).
//
// HONESTY NOTE (load-bearing): every value in this feed is computed from
// OFFICIAL source CSVs (INE, BdP, BCE, Eurostat, DGO) with explicit arithmetic —
// no model produces any number here. Each module carries a bilingual headline,
// a badge (official / official_calc / scenario), an as_of date and an
// honesty_note_i18n that the UI MUST render. Modules may arrive as
// { status: 'unavailable', reason } so all fields are optional and the UI is
// null-safe.

export interface LocalizedText {
  pt?: string;
  en?: string;
}

export type StoryBadgeKind = 'official' | 'official_calc' | 'scenario' | (string & {});

export interface StoryBadge {
  kind?: StoryBadgeKind;
  label?: LocalizedText;
}

export interface StoryModuleBase {
  status?: string; // 'ok' | 'unavailable'
  id?: string;
  title?: LocalizedText;
  badge?: StoryBadge | null;
  as_of?: string; // ISO date or 'YYYY-MM'
  headline?: LocalizedText;
  honesty_note_i18n?: LocalizedText;
  sources?: string[];
  reason?: string;
}

// ---- real_wages ---------------------------------------------------------------

export interface RealWagesModule extends StoryModuleBase {
  nominal_yoy?: {
    value_pct?: number;
    period?: string;
    source?: string;
    source_description?: string;
    stale?: boolean;
  };
  deflator?: { hicp_yoy_pct?: number; period?: string };
  real_yoy_pct?: number;
  purchasing_power_since_2021?: { index_jan2021_100?: number | null; note?: string };
  formula?: string;
}

// ---- mortgage_reset -------------------------------------------------------------

export interface MortgageFixing {
  month?: string;
  value_pct?: number;
}

export interface MortgageDecidedTenor {
  label?: string;
  reset_month?: string;
  fixing_old?: MortgageFixing;
  fixing_new?: MortgageFixing;
  rate_old_pct?: number;
  rate_new_pct?: number;
  instalment_old_eur?: number;
  instalment_new_eur?: number;
  delta_eur_month?: number;
  delta_pct?: number;
}

export interface MortgageScenario {
  euribor_pct?: number;
  instalment_eur?: number;
  delta_vs_decided_eur?: number;
}

export interface MortgageOpenTenor {
  label?: string;
  next_reset_month?: string;
  unknown_fixing_month?: string;
  scenarios?: {
    flat?: MortgageScenario;
    up_50bp?: MortgageScenario;
    down_50bp?: MortgageScenario;
  };
}

export interface MortgageContextItem {
  value?: number;
  period?: string;
  as_of?: string;
  stale?: boolean;
}

export interface MortgageResetModule extends StoryModuleBase {
  decided?: {
    badge?: StoryBadge;
    label?: LocalizedText;
    reset_month?: string;
    tenors?: Record<string, MortgageDecidedTenor>;
    note?: LocalizedText;
  };
  open?: {
    badge?: StoryBadge;
    label?: LocalizedText;
    tenors?: Record<string, MortgageOpenTenor>;
    note?: LocalizedText;
  };
  context?: Record<string, MortgageContextItem>;
  assumptions?: {
    principal_eur?: number;
    term_months?: number;
    spread_pp?: number;
    amortization?: string;
    fixing_rule?: string;
    caveat?: string;
  };
}

// ---- housing_affordability -------------------------------------------------------

export interface HousingModule extends StoryModuleBase {
  house_prices?: {
    yoy_pct?: number;
    period?: string;
    as_of?: string;
    age_days?: number;
    stale?: boolean;
    source?: string;
  };
  new_lease_rents?: {
    median_eur_m2?: number;
    period?: string;
    yoy_pct?: number;
    cumulative_since_2020q1_pct?: number;
    as_of?: string;
    source?: string;
  };
  growth_comparison?: {
    window?: string;
    new_lease_rents_pct?: number;
    hicp_pct?: number;
    wages_pct?: number | null;
    wages_window?: string | null;
  };
  hpi_vs_wages_2015_100?: {
    base?: string;
    method?: string;
    rows?: Array<{ year?: number; hpi?: number | null; wages?: number | null; hicp?: number | null }>;
  };
}

// ---- savings_gap -----------------------------------------------------------------

export interface SavingsChartPoint {
  month?: string;
  deposit_new_time_pct?: number | null;
  overnight_pct?: number | null;
  euribor_6m_pct?: number | null;
  hicp_yoy_pct?: number | null;
}

export interface SavingsGapModule extends StoryModuleBase {
  deposit_rate_new_time?: { value_pct?: number; period?: string; stale?: boolean };
  deposit_rate_overnight?: { value_pct?: number; period?: string };
  euribor_6m?: { value_pct?: number; period?: string };
  hicp_yoy?: { value_pct?: number; period?: string };
  real_deposit_return_pct?: number;
  chart_monthly?: SavingsChartPoint[];
}

// ---- food_basket -----------------------------------------------------------------

export interface FoodAggregate {
  label?: LocalizedText;
  yoy_pct?: number;
  period?: string;
}

export interface FoodItem {
  id?: string;
  label?: LocalizedText;
  yoy_pct?: number;
  period?: string;
  cumulative_5y_pct?: number;
}

export interface FoodBasketModule extends StoryModuleBase {
  aggregates?: Record<string, FoodAggregate>;
  items_ranked?: FoodItem[];
  cumulative_since_5y?: {
    window_years?: number;
    badge?: StoryBadge;
    rows?: Array<{ id?: string; label?: LocalizedText; cumulative_pct?: number; window?: string }>;
  };
}

// ---- tourism_pulse ---------------------------------------------------------------

export interface TourismModule extends StoryModuleBase {
  total?: { value?: number; period?: string; yoy_pct?: number };
  non_residents?: { value?: number; period?: string; yoy_pct?: number; share_of_total_pct?: number };
  same_month_record?: {
    rank?: number;
    n_years?: number;
    first_year?: number;
    prev_best_year?: number;
    prev_best_value?: number;
  };
}

// ---- public_accounts -------------------------------------------------------------

export interface TaxRolling12m {
  label?: LocalizedText;
  rolling_12m_sum_meur?: number;
  rolling_12m_nominal_growth_pct?: number;
  rolling_12m_real_growth_pct?: number;
  period?: string;
  as_of?: string;
}

export interface PublicAccountsModule extends StoryModuleBase {
  taxes_rolling_12m?: Record<string, TaxRolling12m>;
  debt?: {
    level_meur?: number;
    period?: string;
    as_of?: string;
    change_12m_meur?: number;
    change_12m_pct?: number;
    path_last_24m?: Array<{ month?: string; value_meur?: number }>;
    ratio_note?: LocalizedText;
  };
}

// ---- release_calendar ------------------------------------------------------------

export interface ReleaseEntry {
  id?: string;
  source?: string;
  name?: LocalizedText;
  date_estimated?: string;
  estimated?: boolean;
  rule?: string;
  updates?: LocalizedText;
}

export interface ReleaseCalendarModule extends StoryModuleBase {
  entries?: ReleaseEntry[];
}

// ---- top level -------------------------------------------------------------------

export interface EconomyStoriesModules {
  real_wages?: RealWagesModule;
  mortgage_reset?: MortgageResetModule;
  housing_affordability?: HousingModule;
  savings_gap?: SavingsGapModule;
  food_basket?: FoodBasketModule;
  tourism_pulse?: TourismModule;
  public_accounts?: PublicAccountsModule;
  release_calendar?: ReleaseCalendarModule;
}

export interface EconomyStories {
  schema?: string;
  as_of?: string;
  generated_at?: string;
  disclaimer?: LocalizedText;
  badges_legend?: Record<string, LocalizedText>;
  modules?: EconomyStoriesModules;
}

/** A module is renderable when it exists and is not explicitly unavailable.
 *  (Narrows to an "available" subtype so the negative branch keeps the module
 *  type instead of `never` — same pattern as isTileAvailable.) */
export function isModuleAvailable<T extends { status?: string }>(
  mod: T | undefined | null
): mod is T & { status?: 'ok' } {
  return !!mod && mod.status !== 'unavailable';
}

/** Resolve a bilingual payload string for a locale (falls back across locales). */
export function pickText(locale: string, text?: LocalizedText | null): string | undefined {
  if (!text) return undefined;
  return locale === 'pt' ? text.pt ?? text.en : text.en ?? text.pt;
}
