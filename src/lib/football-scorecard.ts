import { LIGA_POINTS_CALIBRATION } from '@/lib/config/football';

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
 * The final-points calibration line under the league table. The measured
 * coverage is quoted only for the model it was measured on; for any other
 * model the sentence says the check has not been run, rather than borrowing
 * another model's figure (FB-MISS-02: the table quoted the retired model's
 * 92,7% under bivcross forecasts).
 */
export function calibrationSentence(model: string | null | undefined, locale: string): string {
  const pt = locale !== 'en';
  const c = LIGA_POINTS_CALIBRATION;
  if (model && model === c.model) {
    const nominal = Math.round(c.nominal * 100);
    const observed = Math.round(c.observed * 100);
    return pt
      ? `Numa verificação de ${c.checked.pt}, em ${c.nSeasons} épocas (${c.firstSeason} a ${c.lastSeason}), o intervalo de ${nominal}% conteve o total real de pontos em ${observed}% dos casos.`
      : `In a ${c.checked.en} check over ${c.nSeasons} seasons (${c.firstSeason} to ${c.lastSeason}), the ${nominal}% interval contained the real points total ${observed}% of the time.`;
  }
  return pt
    ? 'A calibração destes intervalos ainda não foi medida para o modelo que produz esta previsão.'
    : 'The calibration of these intervals has not been measured yet for the model behind this forecast.';
}
