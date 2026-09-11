// Routing maps: economy-dashboard data identifiers -> i18n message keys (the
// `economics` namespace). Per repo convention the JSON carries only data and
// identifiers; ALL display strings live in messages/{pt,en}.json. These helpers
// return the message KEY (or undefined) so the caller resolves it with its own
// `t`; unknown identifiers fall back to the raw value at the call site.

const LABEL_KEY: Record<string, string> = {
  'state of the economy': 'labelStateOfEconomy',
  preliminary: 'labelPreliminary',
  'risk context, not a forecast': 'labelRiskContext',
  'recession risk': 'labelRecessionRisk',
  // honest in-quarter maturity labels — MUST stay visible on the tile badge
  'early-indicative': 'labelEarlyIndicative',
  indicative: 'labelIndicative',
  'annual outlook': 'labelAnnualOutlook',
  'track record': 'labelTrackRecord',
  'labour market': 'labelLabourMarket',
  // inflation tile (PR-1 gated): the label states which branch is live
  'inflation — official-data tracker': 'labelInflationTracker',
  'inflation — estimativa indicativa': 'labelInflationIndicative',
};

const GROUP_KEY: Record<string, string> = {
  'Activity Indicators': 'groupActivityIndicators',
  Surveys: 'groupSurveys',
  Energy: 'groupEnergy',
  'Google Trends': 'groupGoogleTrends',
  Financial: 'groupFinancial',
  Prices: 'groupPrices',
  External: 'groupExternal',
  Consumption: 'groupConsumption',
  Labour: 'groupLabour',
  'Real Activity': 'groupRealActivity',
  'Credit & Monetary': 'groupCreditMonetary',
  Other: 'groupOther',
};

/** Message key for a tile `label` identifier, or undefined if unknown. */
export function labelKey(value?: string): string | undefined {
  return value ? LABEL_KEY[value] : undefined;
}

/**
 * Resolve a producer-supplied honesty note for a locale.
 * Preference order (defensive — the bilingual fields ship incrementally):
 *   1. `honesty_note_i18n[locale]` (new bilingual object)
 *   2. legacy `*_pt` sidecar when locale is 'pt'
 *   3. the plain (English) note
 * Returns undefined if nothing is present so callers can fall back to their
 * i18n message-file default.
 */
export function pickNote(
  locale: string,
  i18n?: { en?: string; pt?: string },
  plain?: string,
  legacyPt?: string
): string | undefined {
  const localized = locale === 'pt' ? i18n?.pt : i18n?.en;
  if (localized) return localized;
  if (locale === 'pt' && legacyPt) return legacyPt;
  return i18n?.en ?? plain ?? undefined;
}

/** Message key for a contributions group identifier, or undefined if unknown. */
export function groupKey(value?: string | null): string | undefined {
  return value ? GROUP_KEY[value] : undefined;
}

/**
 * The narrative's `generated_by` is an identifier the producer keeps stable;
 * known values route to a message key so the Portuguese page reads in
 * Portuguese. Unknown values render verbatim.
 */
const GENERATED_BY_KEY: Record<string, string> = {
  'fixed-rule template over the published tiles (no model, no new claim)': 'narrativeByTemplate',
};

export function generatedByKey(value?: string | null): string | undefined {
  return value ? GENERATED_BY_KEY[value] : undefined;
}

/**
 * A short producer label, only if it is in the page's language: the
 * bilingual object's entry for the locale, or the verbatim (English) text on
 * the English page. Portuguese pages drop an English-only label rather than
 * show it, because the surrounding heading already says what the block is.
 */
export function pickOwnLanguage(
  locale: string,
  i18n?: { en?: string; pt?: string },
  plain?: string
): string | undefined {
  if (locale === 'pt') return i18n?.pt || undefined;
  return i18n?.en ?? plain ?? undefined;
}
