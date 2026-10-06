import type { AbstractIntlMessages } from 'next-intl';

/**
 * The message keys the browser may need, and nothing else.
 *
 * NextIntlClientProvider serialises whatever it is given into every page's
 * HTML and RSC payload. It used to get the whole catalogue (about 55 KB, the
 * dormant economy dashboard's model figures included) on all 236 pages,
 * although only a handful of client components call useTranslations; server
 * components read messages on the server and ship rendered text.
 *
 * These are the keys those client components read, key by key, so the
 * economy's unpublished strings stay out of the payload until a client
 * component actually renders them. client-messages.test.ts walks the import
 * graph of every route and fails when a client component reads a key that is
 * not listed here (add it), or when an entry no longer exists in the
 * catalogues. A bare namespace ("forecast") would pass the whole namespace;
 * prefer keys.
 *
 * For a client component that needs a new key: add it below. For a large
 * set that only one route needs, wrap that route in its own
 * NextIntlClientProvider with pickMessages(messages, [...CLIENT_MESSAGE_KEYS,
 * ...routeKeys]): a nested provider replaces the parent's messages rather than
 * merging them, so it must repeat the site-wide keys.
 */
export const CLIENT_MESSAGE_KEYS = [
  // Header (every page): navigation labels.
  'nav.home', 'nav.population', 'nav.economics', 'nav.economicsPreparing', 'nav.sport', 'nav.liga',
  'nav.elections', 'nav.about', 'nav.game',
  'elections.navPresidential', 'elections.navParliamentary', 'elections.navArchiveGuide',
  'elections.navMethodology',
  'articles.title', 'methodology.title',

  // Homepage economy panel and the economy page's banners (templates, no figures).
  'economics.updated', 'economics.staleBanner', 'economics.staleBannerDetail',
  'economics.quarterEndedNote', 'economics.positionNowNote', 'economics.staleNarrativeNote',
  'economics.howToRead', 'economics.honestyMethodologyLink',

  // Election charts: the legislativas page and the MDX pages that can embed them.
  'forecast.drawnSimulations', 'forecast.leftCoalition', 'forecast.rightCoalition',
  'forecast.majorityThresholdLabel', 'forecast.noSimulations', 'forecast.projectedSeats',
  'forecast.closeRace', 'forecast.districtsLoading', 'forecast.districtsUnit',
  'forecast.enscExplainer', 'forecast.enscTerm', 'forecast.likelyWinners',
  'forecast.likelyWinnersSubtitle', 'forecast.seatGain', 'forecast.seatLoss',
  'forecast.seatsInPlay', 'forecast.seatsInPlayLede', 'forecast.seatsInPlayTitle',
  'forecast.stableAllocation', 'forecast.totalDistricts', 'forecast.houseEffectsExplainer',
  'forecast.houseEffectsLoading', 'forecast.houseEffectsTerm', 'forecast.houseEffectsValuesNote',
  'forecast.pollsterHeader', 'forecast.voteShareLabel',

  // Presidential archive: model assumptions and the uncertainty explainer.
  'model.assumptions.title', 'model.assumptions.declared_voters', 'model.assumptions.house_effects',
  'model.assumptions.random_walk', 'model.uncertainty.title', 'model.uncertainty.description',
  'model.uncertainty.based_on_polls', 'model.uncertainty.ci_explanation', 'model.uncertainty.wider_bands',

  // Legislativas district map.
  'map.topTwoGap', 'map.voteShareByParty', 'map.voteShareCaption',
  'about.title',
  'nav.populationData',
  'nav.populationGame',
  'nav.populationMethodology',
  'nav.populationQuality',
  'nav.populationSearch',
  'forecast.seatChangeBaseline',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A copy of `messages` holding only the given dotted paths (a namespace or a
 * single key). Paths that do not exist are skipped; the test reports them.
 */
export function pickMessages(messages: AbstractIntlMessages, keys: readonly string[]): AbstractIntlMessages {
  const picked: Record<string, unknown> = {};
  for (const key of keys) {
    const parts = key.split('.');
    let source: unknown = messages;
    for (const part of parts) source = isRecord(source) ? source[part] : undefined;
    if (source === undefined) continue;
    let target = picked;
    for (const part of parts.slice(0, -1)) {
      if (!isRecord(target[part])) target[part] = {};
      target = target[part] as Record<string, unknown>;
    }
    target[parts[parts.length - 1]] = source;
  }
  return picked as AbstractIntlMessages;
}
