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

/** Message key for a contributions group identifier, or undefined if unknown. */
export function groupKey(value?: string | null): string | undefined {
  return value ? GROUP_KEY[value] : undefined;
}
