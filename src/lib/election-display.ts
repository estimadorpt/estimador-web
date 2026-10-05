export type ElectionLocale = 'pt' | 'en';

export function electionLocale(locale: string): ElectionLocale {
  return locale === 'en' ? 'en' : 'pt';
}

export function formatElectionPercent(value: number, locale: string, digits = 1): string {
  return (value * 100).toLocaleString(electionLocale(locale) === 'pt' ? 'pt-PT' : 'en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + '%';
}

export function formatElectionDate(value: string | Date, locale: string): string {
  return new Date(value).toLocaleDateString(electionLocale(locale) === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** The data files publish quantiles, so labels must describe those exact spans. */
export function credibleIntervalLabel(lowerQuantile: number, upperQuantile: number, locale: string): string {
  const coverage = Math.round((upperQuantile - lowerQuantile) * 100);
  const quantiles = `P${(lowerQuantile * 100).toFixed(lowerQuantile * 100 % 1 === 0 ? 0 : 1)}–P${(upperQuantile * 100).toFixed(upperQuantile * 100 % 1 === 0 ? 0 : 1)}`;
  return electionLocale(locale) === 'pt' ? `Intervalo de credibilidade de ${coverage}% (${quantiles})` : `${coverage}% credible interval (${quantiles})`;
}

/**
 * Two panels can legitimately show different percentages for the same
 * candidate because they use different denominators. State the denominator
 * beside the number instead of letting two visually identical percentages
 * disagree silently.
 */
export function voteShareScopeLabel(scope: 'validVotes' | 'allBallots', locale: string): string {
  const pt = electionLocale(locale) === 'pt';
  return scope === 'validVotes'
    ? (pt ? 'dos votos válidos' : 'of valid votes')
    : (pt ? 'incluindo brancos e nulos' : 'including blank and void ballots');
}

/**
 * Two panels can also disagree because they answer different questions in
 * time: a current snapshot versus a projection to election day. Name the
 * horizon beside the number rather than letting the ranges look comparable.
 */
export function estimateHorizonLabel(kind: 'current' | 'electionDay', locale: string): string {
  const pt = electionLocale(locale) === 'pt';
  return kind === 'current'
    ? (pt ? 'estimativa atual' : 'current estimate')
    : (pt ? 'previsão para o dia da eleição' : 'forecast for election day');
}
