import { formatDecimal } from '@/lib/football-format';

/**
 * How each mdNN.json's `next_matchday` compares with the prediction game's
 * record of the same round (game_fixtures.json), for /desporto/liga/dados.
 *
 * The page used to say that `next_matchday` "stays frozen at the first
 * version". In 2026-27 that is not true of md01, md03 and md04, whose
 * next_matchday differs from the game's frozen odds by up to 0,2 pp, and some
 * files list only part of the next round (audit FA3-06). The sentence is now
 * read from the files, so it stays true when the next ones land.
 */

interface Odds {
  home: string;
  away: string;
  p_home?: number | null;
  p_draw?: number | null;
  p_away?: number | null;
}

export interface MatchdayFileNext {
  /** "md03.json" */
  file: string;
  next_matchday?: { matchday?: number; matches?: Odds[] } | null;
}

export interface GameRoundLike {
  matchday: number;
  fixtures?: Odds[];
}

export interface NextMatchdayComparison {
  file: string;
  matchday: number;
  /** Largest gap on any of the three probabilities, 0–1 scale. */
  maxDiff: number;
  /** The round's games the file lists, of the round's total. */
  listed: number;
  total: number;
}

/** Both sides publish four decimals: anything under half a unit is the same number. */
const SAME = 0.00005;

export function compareNextMatchdays(files: MatchdayFileNext[], rounds: GameRoundLike[]): NextMatchdayComparison[] {
  const byRound = new Map(rounds.map(r => [r.matchday, r]));
  const out: NextMatchdayComparison[] = [];
  for (const f of files) {
    const md = f.next_matchday?.matchday;
    const round = typeof md === 'number' ? byRound.get(md) : undefined;
    if (!round || typeof md !== 'number') continue;
    const fixtures = round.fixtures ?? [];
    const record = new Map(fixtures.map(x => [`${x.home}|${x.away}`, x]));
    let maxDiff = 0;
    let listed = 0;
    for (const m of f.next_matchday?.matches ?? []) {
      const x = record.get(`${m.home}|${m.away}`);
      if (!x) continue; // a postponed game from an earlier round
      listed += 1;
      for (const k of ['p_home', 'p_draw', 'p_away'] as const) {
        const a = m[k];
        const b = x[k];
        if (typeof a === 'number' && typeof b === 'number') maxDiff = Math.max(maxDiff, Math.abs(a - b));
      }
    }
    out.push({ file: f.file, matchday: md, maxDiff, listed, total: fixtures.length });
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

function join(items: string[], locale: string): string {
  return new Intl.ListFormat(locale === 'en' ? 'en-GB' : 'pt-PT', { type: 'conjunction' }).format(items);
}

const stem = (file: string) => file.replace(/\.json$/, '');

/**
 * "O next_matchday de md01, md03 e md04 difere do registo do jogo
 * (game_fixtures.json) em até 0,2 pp; nos outros coincide." Null when there
 * is nothing to compare.
 */
export function nextMatchdayDriftSentence(rows: NextMatchdayComparison[], locale: string): string | null {
  if (!rows.length) return null;
  const pt = locale !== 'en';
  const differ = rows.filter(r => r.maxDiff > SAME);
  if (!differ.length) {
    return pt
      ? 'O next_matchday de cada ficheiro coincide com o registo do jogo (game_fixtures.json).'
      : "Every file's next_matchday matches the game's record (game_fixtures.json).";
  }
  const max = Math.max(...differ.map(r => r.maxDiff)) * 100;
  const amount = `${formatDecimal(max, locale, max < 0.05 ? 2 : 1)} pp`;
  const names = join(differ.map(r => stem(r.file)), locale);
  const rest = differ.length < rows.length;
  return pt
    ? `O next_matchday de ${names} difere do registo do jogo (game_fixtures.json) em até ${amount}${rest ? '; nos outros coincide' : ''}. O registo do jogo é o que conta.`
    : `The next_matchday of ${names} differs from the game's record (game_fixtures.json) by up to ${amount}${rest ? '; in the others it matches' : ''}. The game's record is the one that counts.`;
}

/** "md03, md04 e md05 trazem 6, 7 e 8 dos 9 jogos da jornada seguinte." Null when every file lists its whole round. */
export function nextMatchdayPartialSentence(rows: NextMatchdayComparison[], locale: string): string | null {
  const partial = rows.filter(r => r.listed < r.total);
  if (!partial.length) return null;
  const pt = locale !== 'en';
  const totals = new Set(partial.map(r => r.total));
  const names = join(partial.map(r => stem(r.file)), locale);
  const counts = join(partial.map(r => String(r.listed)), locale);
  if (totals.size === 1) {
    const total = partial[0].total;
    return pt
      ? `Nem sempre traz a jornada inteira: ${names} ${partial.length > 1 ? 'trazem' : 'traz'} ${counts} dos ${total} jogos.`
      : `It does not always carry the whole round: ${names} ${partial.length > 1 ? 'carry' : 'carries'} ${counts} of the ${total} games.`;
  }
  const each = join(partial.map(r => `${stem(r.file)} ${r.listed}/${r.total}`), locale);
  return pt
    ? `Nem sempre traz a jornada inteira: ${each}.`
    : `It does not always carry the whole round: ${each}.`;
}
