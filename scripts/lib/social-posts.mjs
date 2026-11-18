/**
 * The words of an estimador.pt social post, written from the published files.
 *
 * Nothing here is authored per run: a post is a fixed template filled with
 * the same figures, in the same words, that the page it links to prints (the
 * title finding from football-brand.mjs, percentages from og-render.mjs's
 * formatPercent, the reading time in Lisbon). No language model writes a
 * number. A sentence whose figures are missing is left out, not guessed.
 *
 * The voice is the site's: sentence case, the finding first, tu, no emoji,
 * no exclamation marks, no question to the reader, one link.
 */

import { teamName, titleFinding, titleSeasons } from './football-brand.mjs';
import { formatPercent, formatCount, formatReadingTime } from './og-render.mjs';

export const SITE = 'https://estimador.pt';

/** X counts every link as 23 characters; Bluesky counts graphemes up to 300. */
export const LIMITS = { x: 280, bluesky: 300 };
const X_LINK_LENGTH = 23;

/** A change in percentage points as the site prints it (formatPp): one decimal under 10 pp, U+2212 for minus. */
export function formatPp(delta, locale = 'pt') {
  const pp = delta * 100;
  const abs = Math.abs(pp);
  if (abs < 0.05) return '0 pp';
  const digits = abs < 9.95 ? 1 : 0;
  const text = abs.toFixed(digits).replace('.', locale === 'en' ? '.' : ',');
  return `${pp > 0 ? '+' : '−'}${text} pp`;
}

/** The smallest title move worth a sentence: under 2 pp is noise between two forecasts. */
export const MOVE_MIN = 0.02;

/** The club whose title share moved most since the previous forecast, if any moved by MOVE_MIN or more. */
export function biggestTitleMove(current, previous) {
  if (!previous?.table) return null;
  const before = Object.fromEntries(previous.table.map(row => [row.team, row.p_champion]));
  let best = null;
  for (const row of current.table ?? []) {
    if (typeof before[row.team] !== 'number') continue;
    const delta = row.p_champion - before[row.team];
    if (!best || Math.abs(delta) > Math.abs(best.delta)) best = { team: row.team, before: before[row.team], now: row.p_champion, delta };
  }
  return best && Math.abs(best.delta) >= MOVE_MIN ? best : null;
}

/** "25%" with the site's percent rule. */
function pct(value, locale) {
  return `${formatPercent(value, locale)}%`;
}

/**
 * The Liga post for one forecast: the finding as the first line, the count of
 * seasons behind it with the forecast's date, the biggest title move, the link.
 * Returns { id, text, link, alt }.
 */
export function ligaPost({ current, previous = null, scenarios = null, locale = 'pt' }) {
  const pt = locale !== 'en';
  const leader = [...current.table].sort((a, b) => b.p_champion - a.p_champion)[0];
  const seasons = titleSeasons(leader.team, leader.p_champion, current.n_sims, scenarios?.victory_paths);
  const when = formatReadingTime(current.timestamp, locale);
  const link = `${SITE}/${pt ? 'pt' : 'en'}/desporto/liga/`;

  const finding = `${titleFinding(leader.team, leader.p_champion, locale)}.`;
  const count = current.n_sims
    ? pt
      ? `Em ${formatCount(seasons)} de ${formatCount(current.n_sims)} épocas simuladas, na previsão da jornada ${current.matchday}${when ? ` (${when})` : ''}.`
      : `In ${formatCount(seasons, 'en')} of ${formatCount(current.n_sims, 'en')} simulated seasons, in the matchday ${current.matchday} forecast${when ? ` (${when})` : ''}.`
    : null;

  const move = biggestTitleMove(current, previous);
  const moveLine = move
    ? pt
      ? `A maior mudança no título: ${teamName(move.team)}, de ${pct(move.before, locale)} para ${pct(move.now, locale)} (${formatPp(move.delta, locale)}).`
      : `The biggest title move: ${teamName(move.team)}, from ${pct(move.before, locale)} to ${pct(move.now, locale)} (${formatPp(move.delta, locale)}).`
    : null;

  const text = [finding, count, moveLine, link].filter(Boolean).join('\n\n');
  const alt = pt
    ? `Cartão da Liga Portugal, jornada ${current.matchday}: ${finding} Probabilidade de título de cada candidato numa régua de 0 a 100%.`
    : `Liga Portugal card, matchday ${current.matchday}: ${finding} Each contender's title chance on a 0 to 100% ruler.`;

  return { id: `liga-${current.season}-md${String(current.matchday).padStart(2, '0')}${pt ? '' : '-en'}`, text, link, alt };
}

/** Length as X counts it: every URL is 23 characters. */
export function xLength(text) {
  return [...text.replace(/https?:\/\/\S+/g, 'x'.repeat(X_LINK_LENGTH))].length;
}

/** Length as Bluesky counts it: graphemes. */
export function blueskyLength(text) {
  const segmenter = new Intl.Segmenter('pt', { granularity: 'grapheme' });
  return [...segmenter.segment(text)].length;
}

/**
 * The text for one network: the full post if it fits, else the post without
 * its move line, else without the count. The finding and the link always stay.
 */
export function fitTo(network, post) {
  const measure = network === 'x' ? xLength : blueskyLength;
  const limit = LIMITS[network];
  const parts = post.text.split('\n\n');
  const [finding, link] = [parts[0], parts[parts.length - 1]];
  const middle = parts.slice(1, -1);
  // Drop the move line first, then the count: the finding and the link always stay.
  const candidates = [parts, [finding, ...middle.slice(0, 1), link], [finding, link]];
  for (const candidate of candidates) {
    const text = candidate.join('\n\n');
    if (measure(text) <= limit) return text;
  }
  throw new Error(`${post.id}: even the finding and link exceed ${network}'s ${limit}`);
}

/** Bluesky's link facet: the byte range of the URL in UTF-8, so it renders as a link. */
export function linkFacets(text) {
  const facets = [];
  const encoder = new TextEncoder();
  for (const match of text.matchAll(/https?:\/\/\S+/g)) {
    const byteStart = encoder.encode(text.slice(0, match.index)).length;
    const byteEnd = byteStart + encoder.encode(match[0]).length;
    facets.push({ index: { byteStart, byteEnd }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: match[0] }] });
  }
  return facets;
}
