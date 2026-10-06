import { blockVerdict, SIGNIFICANCE_T, type ScorecardBlock } from '@/lib/football-scorecard';
import { formatDecimal, formatInteger, formatLongDate, formatSigned } from '@/lib/football-format';

// The words /desporto/liga/modelo and the Liga methodology print about the
// model's evaluation, built from market_scorecard.json so no sentence can
// disagree with the numbers next to it (audit round 1, B2: a hard-coded
// paragraph said the opposite of the generated verdict above it).
//
// One reading rule for the whole page: a difference counts as real only when
// it is at least twice its standard error (SIGNIFICANCE_T).

const pt = (locale: string) => locale !== 'en';

/** A t statistic with a true minus sign (U+2212), as the rest of the page prints negatives. */
function tStat(v: number, locale: string): string {
  return formatDecimal(v, locale, 2).replace(/^-/, '−');
}

/** "duas" / "twice" for the 2 SE rule, so the sentence never reads "passa de 2 vezes". */
function ruleWords(locale: string): string {
  if (SIGNIFICANCE_T === 2) return pt(locale) ? 'duas vezes' : 'twice';
  return pt(locale) ? `${SIGNIFICANCE_T} vezes` : `${SIGNIFICANCE_T} times`;
}

/* ------------------------------------------------------------ model names */

/**
 * The model in plain words. Readers never see the repository codenames
 * (`bivcross`, `joint_sot`); those live on /dados, next to the `model` field
 * that carries them.
 */
const MODEL_PLAIN: Record<string, { pt: string; en: string }> = {
  bivcross: {
    pt: 'o modelo atual (Poisson bivariado com remates à baliza)',
    en: 'the current model (bivariate Poisson with shots on target)',
  },
  joint_sot: {
    pt: 'o modelo anterior, usado até agosto de 2026',
    en: 'the previous model, used until August 2026',
  },
};

export function modelPlainName(model: string | null | undefined, locale: string): string {
  const entry = model ? MODEL_PLAIN[model] : undefined;
  if (entry) return pt(locale) ? entry.pt : entry.en;
  return pt(locale) ? 'um modelo sem descrição publicada' : 'a model with no published description';
}

/* ----------------------------------------------------- predicted matchdays */

export interface EvaluatedCheckpoint {
  checkpoint: number;
  matchday_predicted?: number;
  delta: number;
}

/**
 * The matchdays whose games were scored. A reference matchday N is fitted on
 * the games played up to N and forecasts N + 1, so the reader-facing label is
 * the predicted matchday, not the checkpoint (M-06).
 */
export function predictedMatchday(cp: { checkpoint: number; matchday_predicted?: number }): number {
  return Number.isFinite(cp.matchday_predicted) ? (cp.matchday_predicted as number) : cp.checkpoint + 1;
}

/** "2 a 11, 15, 19, 23, 27 e 31" / "2–11, 15, 19, 23, 27 and 31". */
export function matchdayListPhrase(matchdays: number[], locale: string): string {
  const sorted = [...new Set(matchdays)].filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return '';
  const runs: Array<[number, number]> = [];
  for (const md of sorted) {
    const last = runs[runs.length - 1];
    if (last && md === last[1] + 1) last[1] = md;
    else runs.push([md, md]);
  }
  const parts = runs.map(([a, b]) => {
    if (a === b) return `${a}`;
    if (b === a + 1) return pt(locale) ? `${a}, ${b}` : `${a}, ${b}`;
    return pt(locale) ? `${a} a ${b}` : `${a}–${b}`;
  });
  if (parts.length === 1) return parts[0];
  const conj = pt(locale) ? ' e ' : ' and ';
  return `${parts.slice(0, -1).join(', ')}${conj}${parts[parts.length - 1]}`;
}

/** "jogos das jornadas 2 a 11" / "games from matchdays 2–11". */
export function gamesOfMatchdays(matchdays: number[], locale: string): string {
  const list = matchdayListPhrase(matchdays, locale);
  if (!list) return '';
  const single = new Set(matchdays).size === 1;
  return pt(locale)
    ? `jogos ${single ? 'da jornada' : 'das jornadas'} ${list}`
    : `games from matchday${single ? '' : 's'} ${list}`;
}

/* ---------------------------------------------------------------- verdicts */

/** One verdict per block, in words, with the 2 SE rule spelled out. */
export function verdictLine(block: ScorecardBlock, locale: string): string {
  const t = tStat(block.t, locale);
  const p = pt(locale);
  switch (blockVerdict(block)) {
    case 'market_ahead':
      return p
        ? `O mercado está à frente: a diferença passa de duas vezes o seu erro padrão (t = ${t}).`
        : `The market is ahead: the gap is more than twice its standard error (t = ${t}).`;
    case 'model_ahead':
      return p
        ? `O modelo está à frente: a diferença passa de duas vezes o seu erro padrão (t = ${t}).`
        : `The model is ahead: the gap is more than twice its standard error (t = ${t}).`;
    case 'tie_market_sign':
      return p
        ? `Empate técnico: o sinal favorece o mercado, mas a diferença fica abaixo de duas vezes o erro padrão (t = ${t}).`
        : `A statistical tie: the sign favours the market, but the gap is under twice its standard error (t = ${t}).`;
    case 'tie_model_sign':
      return p
        ? `Empate técnico: o sinal favorece o modelo, mas a diferença fica abaixo de duas vezes o erro padrão (t = ${t}).`
        : `A statistical tie: the sign favours the model, but the gap is under twice its standard error (t = ${t}).`;
    default:
      return p
        ? `Empate técnico: a diferença é menor do que o seu próprio erro padrão (t = ${t}).`
        : `A statistical tie: the gap is smaller than its own standard error (t = ${t}).`;
  }
}

/** The short form for a sentence that names several blocks at once. */
function verdictShort(block: ScorecardBlock, locale: string): string {
  const p = pt(locale);
  switch (blockVerdict(block)) {
    case 'market_ahead':
      return p ? 'o mercado está à frente' : 'the market is ahead';
    case 'model_ahead':
      return p ? 'o modelo está à frente' : 'the model is ahead';
    default:
      return p ? 'é um empate técnico' : 'it is a statistical tie';
  }
}

export interface ScorecardForCopy {
  overall: ScorecardBlock;
  overall_vs_open?: ScorecardBlock;
  close_vs_open?: { n: number; delta: number; se: number; t: number };
  checkpoints: Array<ScorecardBlock & { checkpoint: number; matchday_predicted?: number; phase?: string }>;
  phases: {
    early: ScorecardBlock & { checkpoints: number[] };
    mid_late: ScorecardBlock & { checkpoints: number[] };
  };
}

/** The predicted matchdays behind a phase, from its checkpoints. */
export function phaseMatchdays(sc: ScorecardForCopy, phase: 'early' | 'mid_late'): number[] {
  const set = new Set(sc.phases[phase].checkpoints);
  return sc.checkpoints.filter(c => set.has(c.checkpoint)).map(predictedMatchday);
}

/**
 * The uncertainty note under "Como lemos isto", generated from the same
 * verdicts as the cards above it. With the October 2026 file: the market is
 * ahead overall and early in the season, and the rest is a statistical tie.
 */
export function uncertaintyNote(sc: ScorecardForCopy, locale: string): string {
  const p = pt(locale);
  const o = sc.overall;
  const early = sc.phases.early;
  const late = sc.phases.mid_late;
  const earlyGames = gamesOfMatchdays(phaseMatchdays(sc, 'early'), locale);
  const lateGames = gamesOfMatchdays(phaseMatchdays(sc, 'mid_late'), locale);
  const num = (v: number, d: number) => formatDecimal(v, locale, d);
  const sig = (v: number, d: number) => formatSigned(v, locale, d);
  const rule = p
    ? `Uma nota sobre incerteza, porque aqui ela decide tudo. Lemos uma diferença como real só quando passa de ${ruleWords(locale)} o seu erro padrão.`
    : `A note on uncertainty, because here it decides everything. We read a gap as real only when it is more than ${ruleWords(locale)} its standard error.`;
  const overall = p
    ? `No conjunto, a diferença é ${sig(o.delta, 4)} com um erro padrão de ${num(o.se, 4)} (t = ${tStat(o.t, locale)}): ${verdictShort(o, locale)}.`
    : `Overall, the gap is ${sig(o.delta, 4)} with a standard error of ${num(o.se, 4)} (t = ${tStat(o.t, locale)}): ${verdictShort(o, locale)}.`;
  const phases = p
    ? `No início da época (${earlyGames}), t = ${tStat(early.t, locale)}: ${verdictShort(early, locale)}. No resto da época (${lateGames}), t = ${tStat(late.t, locale)}: ${verdictShort(late, locale)}.`
    : `Early in the season (${earlyGames}), t = ${tStat(early.t, locale)}: ${verdictShort(early, locale)}. In the rest of the season (${lateGames}), t = ${tStat(late.t, locale)}: ${verdictShort(late, locale)}.`;
  return `${rule} ${overall} ${phases}`;
}

/**
 * How the closing line compares with the opening line, and how the model
 * compares with the opening line (M-03). Null when the file carries neither.
 */
export function openingLineSentence(sc: ScorecardForCopy, locale: string): string | null {
  const p = pt(locale);
  const cvo = sc.close_vs_open;
  const mvo = sc.overall_vs_open;
  if (!cvo && !mvo) return null;
  const num = (v: number, d: number) => formatDecimal(v, locale, d);
  const parts: string[] = [];
  if (cvo) {
    const sharper = cvo.delta < 0;
    parts.push(p
      ? `Na mesma amostra, a linha de fecho erra ${num(Math.abs(cvo.delta), 4)} ${sharper ? 'menos' : 'mais'} do que a de abertura (t = ${tStat(cvo.t, locale)}): ${Math.abs(cvo.t) >= SIGNIFICANCE_T ? 'o mercado afina-se até ao apito inicial' : 'uma diferença dentro do ruído'}.`
      : `In the same sample, the closing line errs ${num(Math.abs(cvo.delta), 4)} ${sharper ? 'less' : 'more'} than the opening line (t = ${tStat(cvo.t, locale)}): ${Math.abs(cvo.t) >= SIGNIFICANCE_T ? 'the market sharpens up to kick-off' : 'a gap inside the noise'}.`);
  }
  if (mvo) {
    parts.push(p
      ? `Contra a linha de abertura, o modelo fica a ${formatSigned(mvo.delta, locale, 4)} (t = ${tStat(mvo.t, locale)}): ${verdictShort(mvo, locale)}.`
      : `Against the opening line, the model is at ${formatSigned(mvo.delta, locale, 4)} (t = ${tStat(mvo.t, locale)}): ${verdictShort(mvo, locale)}.`);
  }
  return parts.join(' ');
}

/* -------------------------------------------------------------- crossings */

/** Every place where the sign of model − market flips between neighbours. */
export function crossings(checkpoints: EvaluatedCheckpoint[]): Array<{ before: number; after: number }> {
  const out: Array<{ before: number; after: number }> = [];
  for (let i = 1; i < checkpoints.length; i++) {
    const a = Math.sign(checkpoints[i - 1].delta);
    const b = Math.sign(checkpoints[i].delta);
    if (a !== 0 && b !== 0 && a !== b) {
      out.push({ before: predictedMatchday(checkpoints[i - 1]), after: predictedMatchday(checkpoints[i]) });
    }
  }
  return out;
}

/** "As duas linhas cruzam-se três vezes: entre as jornadas 2 e 3, …" (M-05). */
export function crossingSentence(checkpoints: EvaluatedCheckpoint[], locale: string): string | null {
  const list = crossings(checkpoints);
  if (!list.length) return null;
  const p = pt(locale);
  const pair = (c: { before: number; after: number }) =>
    p ? `entre as jornadas ${c.before} e ${c.after}` : `between matchdays ${c.before} and ${c.after}`;
  if (list.length === 1) {
    return p ? `As duas linhas cruzam-se uma vez, ${pair(list[0])}.` : `The two lines cross once, ${pair(list[0])}.`;
  }
  const words = p ? ['', '', 'duas', 'três', 'quatro', 'cinco'] : ['', '', 'twice', 'three times', 'four times', 'five times'];
  const count = words[list.length] ?? (p ? `${list.length}` : `${list.length} times`);
  const pairs = list.map(pair);
  const joined = `${pairs.slice(0, -1).join(', ')}${p ? ' e ' : ' and '}${pairs[pairs.length - 1]}`;
  return p
    ? `As duas linhas cruzam-se ${count} vezes: ${joined}.`
    : `The two lines cross ${count}: ${joined}.`;
}

/* ------------------------------------------------------------ calibration */

export interface PointsCalibrationBlock {
  model?: string;
  interval_mass: number;
  coverage: number;
  n_seasons: number;
  first_season: string;
  last_season: string;
  checkpoints?: number[];
  n_team_seasons?: number;
}

/**
 * The final-points interval check in words, for the methodology (M-08). The
 * export's `n_team_seasons` counts forecasts (team-seasons × checkpoints), so
 * the team-season count is derived from it rather than quoted as 972.
 */
export function pointsCalibrationSentence(c: PointsCalibrationBlock | null | undefined, locale: string): string | null {
  if (!c || !Number.isFinite(c.coverage) || !Number.isFinite(c.interval_mass)) return null;
  const p = pt(locale);
  const nominal = formatInteger(Math.round(c.interval_mass * 100), locale);
  const observed = formatDecimal(c.coverage * 100, locale, 1);
  const moments = c.checkpoints?.length ?? 0;
  const forecasts = c.n_team_seasons ?? null;
  const teamSeasons = forecasts && moments ? Math.round(forecasts / moments) : null;
  const range = `${p ? 'de' : 'from'} ${c.first_season} ${p ? 'a' : 'to'} ${c.last_season}`;
  const sample = teamSeasons && moments && forecasts
    ? p
      ? ` (${formatInteger(teamSeasons, locale)} equipa-épocas, avaliadas em ${moments} momentos da época: ${formatInteger(forecasts, locale)} previsões, que não são independentes entre si)`
      : ` (${formatInteger(teamSeasons, locale)} team-seasons, each checked at ${moments} points in the season: ${formatInteger(forecasts, locale)} forecasts, which are not independent of one another)`
    : '';
  return p
    ? `Em ${c.n_seasons} épocas passadas, ${range}${sample}, o intervalo de ${nominal}% para os pontos finais conteve o total real em ${observed}% dos casos.`
    : `Over ${c.n_seasons} past seasons, ${range}${sample}, the ${nominal}% interval for final points contained the real total ${observed}% of the time.`;
}

/**
 * The title-probability check from the model repo's assessment of
 * 25 September 2026 (estimador-football docs/research/2026-09-model-assessment.md
 * §1–2). It is not in any exported file, so it is kept here, dated, with its
 * source; update it when the assessment is re-run.
 */
export const TITLE_CALIBRATION = {
  assessedOn: '2026-09-25',
  firstSeason: '2017-18',
  lastSeason: '2025-26',
  leadPoints: 3,
  cells: 19,
  cellsSeasons: 8,
  modelMean: 0.56,
  leadersWon: 0.74,
  modelMeanClean: 0.63,
  leadersWonClean: 0.82,
  /** md07 2026-27, Porto: production and the range of untestable alternatives. */
  livePorto: 0.5149,
  livePortoAltLow: 0.574,
  livePortoAltHigh: 0.623,
} as const;
/**
 * The title-probability finding in plain words (audit F-H2), from the model
 * repo's assessment of 25 September 2026. Shared with the Liga methodology.
 */
export function titleCalibrationParagraphs(locale: string): string[] {
  const pt = locale !== "en";
  const c = TITLE_CALIBRATION;
  const pct = (v: number) => `${formatInteger(Math.round(v * 100), locale)}%`;
  const assessed = formatLongDate(c.assessedOn, locale);
  return pt
    ? [
        `Verificámos o que acontece às equipas que lideram. Nas épocas de ${c.firstSeason} a ${c.lastSeason}, houve ${c.cells} momentos avaliados (em ${c.cellsSeasons} épocas) em que uma equipa liderava com ${c.leadPoints} ou mais pontos de vantagem. O modelo deu-lhes, em média, ${pct(c.modelMean)} de probabilidade de serem campeãs; foram campeãs em ${pct(c.leadersWon)} desses casos. Sem dois casos da primeira jornada que resultam de um erro nos dados, os números são ${pct(c.modelMeanClean)} e ${pct(c.leadersWonClean)}.`,
        `Ou seja: o modelo tende a subestimar quem lidera. A amostra é pequena (${c.cells} casos), por isso o tamanho exato da diferença é incerto, mas o sentido repete-se. Também não sabemos ainda corrigi-lo: nenhuma das alternativas testadas passou nos nossos testes, e por isso o modelo publicado não mudou. Algumas dessas alternativas, que os testes não conseguem distinguir do modelo atual, dariam ao Porto, na previsão da jornada 7 de 2026-27, entre ${pct(c.livePortoAltLow)} e ${pct(c.livePortoAltHigh)}, em vez de ${pct(c.livePorto)}.`,
        `Lê as probabilidades de título como uma estimativa provavelmente conservadora para quem vai à frente. As probabilidades de despromoção não foram verificadas desta forma. (Avaliação interna de ${assessed}.)`,
      ]
    : [
        `We checked what happens to the teams in front. Across the ${c.firstSeason} to ${c.lastSeason} seasons there were ${c.cells} evaluated moments (in ${c.cellsSeasons} seasons) when a team led by ${c.leadPoints} or more points. The model gave them, on average, a ${pct(c.modelMean)} chance of winning the title; they won it ${pct(c.leadersWon)} of the time. Leaving out two matchday-one cases caused by a data error, the figures are ${pct(c.modelMeanClean)} and ${pct(c.leadersWonClean)}.`,
        `In other words: the model tends to underrate the leader. The sample is small (${c.cells} cases), so the exact size of the gap is uncertain, but the direction holds. Nor do we know how to fix it yet: none of the alternatives tested passed our checks, so the published model has not changed. Some of those alternatives, which the checks cannot tell apart from the current model, would have given Porto between ${pct(c.livePortoAltLow)} and ${pct(c.livePortoAltHigh)} in the 2026-27 matchday 7 forecast, instead of ${pct(c.livePorto)}.`,
        `Read the title probabilities as a probably conservative estimate for whoever is in front. Relegation probabilities have not been checked this way. (Internal assessment of ${assessed}.)`,
      ];
}

