import { formatDecimal, formatInteger } from '@/lib/football-format';

// Words for the model-vs-market scorecard, derived from the file rather than
// typed in. The scorecard is re-run whenever the production model changes, so
// every count, season range and verdict on /desporto/liga/modelo and the
// cards that point to it must come from market_scorecard.json; and the page
// must say which model was evaluated, because it has not always been the one
// publishing the forecasts (FB-05: joint_sot evaluated, bivcross published).

export interface ScorecardBlock {
  n: number;
  delta: number;
  se: number;
  t: number;
}

/** A difference counts as real only beyond twice its standard error. */
export const SIGNIFICANCE_T = 2;

/** What each model identifier is, in words. Unknown ids are printed as-is. */
const MODEL_DESCRIPTIONS: Record<string, { pt: string; en: string }> = {
  joint_sot: {
    pt: 'joint_sot, o modelo usado até agosto de 2026',
    en: 'joint_sot, the model used until August 2026',
  },
  bivcross: {
    pt: 'bivcross, Poisson bivariado com remates à baliza',
    en: 'bivcross, bivariate Poisson with shots on target',
  },
};

export function describeModel(model: string | null | undefined, locale: string): string {
  if (!model) return locale === 'en' ? 'unnamed model' : 'modelo sem nome';
  return MODEL_DESCRIPTIONS[model]?.[locale === 'en' ? 'en' : 'pt'] ?? model;
}

/** Whether the evaluated model is the one producing the published forecasts. */
export function evaluatesCurrentModel(
  scorecardModel: string | null | undefined,
  forecastModel: string | null | undefined,
): boolean {
  return Boolean(scorecardModel && forecastModel && scorecardModel === forecastModel);
}

export type BlockVerdict = 'model_ahead' | 'market_ahead' | 'tie_model_sign' | 'tie_market_sign' | 'tie';

/** delta is model RPS minus market RPS: positive means the model errs more. */
export function blockVerdict(block: ScorecardBlock): BlockVerdict {
  const t = Number.isFinite(block.t) ? block.t : block.se > 0 ? block.delta / block.se : 0;
  if (t >= SIGNIFICANCE_T) return 'market_ahead';
  if (t <= -SIGNIFICANCE_T) return 'model_ahead';
  if (Math.abs(t) < 1) return 'tie';
  return t < 0 ? 'tie_model_sign' : 'tie_market_sign';
}

export function verdictSentence(block: ScorecardBlock, locale: string, tLabel: string): string {
  const pt = locale !== 'en';
  switch (blockVerdict(block)) {
    case 'market_ahead':
      return pt
        ? `O mercado está à frente, e a diferença sobrevive ao erro padrão (t = ${tLabel}).`
        : `The market is ahead, and the gap survives its standard error (t = ${tLabel}).`;
    case 'model_ahead':
      return pt
        ? `O modelo está à frente, e a diferença sobrevive ao erro padrão (t = ${tLabel}).`
        : `The model is ahead, and the gap survives its standard error (t = ${tLabel}).`;
    case 'tie_model_sign':
      return pt
        ? 'O modelo iguala a linha de fecho: o sinal é favorável, mas dentro do ruído.'
        : 'The model matches the closing line: the sign favours it, but stays inside the noise.';
    case 'tie_market_sign':
      return pt
        ? 'Empate técnico: o sinal favorece o mercado, mas fica dentro do ruído.'
        : 'A statistical tie: the sign favours the market, but stays inside the noise.';
    default:
      return pt
        ? 'A diferença é menor do que o seu próprio erro padrão: indistinguível de zero.'
        : 'The gap is smaller than its own standard error: indistinguishable from zero.';
  }
}

/**
 * The final-points interval check the model export carries under
 * market_scorecard.json → calibration: how often the published interval of
 * `interval_mass` contained the real final points total, over `n_seasons`
 * seasons. Every figure in the sentence under the league table comes from here.
 */
export interface PointsCalibration {
  model?: string;
  interval_mass: number;
  coverage: number;
  n_seasons: number;
  first_season: string;
  last_season: string;
}

/** The bookmakers whose closing prices the comparison used, in words. */
const BOOKMAKERS: Record<string, string> = {
  pinnacle: 'Pinnacle',
  b365: 'Bet365',
};

/**
 * "Pinnacle em 773 jogos, Bet365 em 37" — the market's sources with their
 * match counts, largest first, read from market_sources. Null when the file
 * has none; a single source is just its name.
 */
export function marketSourcesPhrase(sources: Record<string, number> | null | undefined, locale: string): string | null {
  const entries = Object.entries(sources ?? {}).filter(([, n]) => Number.isFinite(n) && n > 0).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  const pt = locale !== 'en';
  const name = (key: string) => BOOKMAKERS[key] ?? key;
  if (entries.length === 1) return name(entries[0][0]);
  return entries.map(([key, n], i) => (pt
    ? `${name(key)} em ${formatInteger(n, locale)}${i === 0 ? ' jogos' : ''}`
    : `${name(key)} for ${formatInteger(n, locale)}${i === 0 ? ' matches' : ''}`)).join(', ');
}

/** The scorecard's own season span: first_season/last_season, else the season list. */
export function scorecardSeasonRange(
  sc: { seasons?: string[]; first_season?: string; last_season?: string },
  locale: string,
): string {
  if (sc.first_season && sc.last_season) return seasonRange([sc.first_season, sc.last_season], locale);
  return seasonRange(sc.seasons ?? [], locale);
}

/** "2017-18 a 2024-25" / "2017-18 to 2024-25". */
export function seasonRange(seasons: string[], locale: string): string {
  if (!seasons.length) return '';
  const first = seasons[0];
  const last = seasons[seasons.length - 1];
  if (first === last) return first;
  return `${first} ${locale === 'en' ? 'to' : 'a'} ${last}`;
}

/** First reference matchday where the sign of model − market flips, or null. */
export function crossoverMatchday(
  checkpoints: Array<{ checkpoint: number; delta: number }>,
): { before: number; after: number } | null {
  for (let i = 1; i < checkpoints.length; i++) {
    if (Math.sign(checkpoints[i - 1].delta) !== Math.sign(checkpoints[i].delta)) {
      return { before: checkpoints[i - 1].checkpoint, after: checkpoints[i].checkpoint };
    }
  }
  return null;
}

/**
 * The final-points calibration line under the league table, read from the
 * export's calibration block (market_scorecard.json). The measured coverage is
 * quoted only for the model it was measured on; for any other model, or when
 * the file carries no check, the sentence says the check has not been run,
 * rather than borrowing another model's figure (FB-MISS-02).
 */
export function calibrationSentence(
  calibration: PointsCalibration | null | undefined,
  model: string | null | undefined,
  locale: string,
): string {
  const pt = locale !== 'en';
  const c = calibration;
  if (c && model && c.model === model && Number.isFinite(c.coverage) && Number.isFinite(c.interval_mass)) {
    const nominal = formatInteger(Math.round(c.interval_mass * 100), locale);
    const observed = formatDecimal(c.coverage * 100, locale, 1);
    const range = seasonRange([c.first_season, c.last_season], locale);
    return pt
      ? `Em ${c.n_seasons} épocas (${range}), o intervalo de ${nominal}% conteve o total final de pontos em ${observed}% dos casos.`
      : `Over ${c.n_seasons} seasons (${range}), the ${nominal}% interval contained the final points total ${observed}% of the time.`;
  }
  return pt
    ? 'A calibração destes intervalos ainda não foi medida para o modelo que produz esta previsão.'
    : 'The calibration of these intervals has not been measured yet for the model behind this forecast.';
}
