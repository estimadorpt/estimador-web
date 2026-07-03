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
