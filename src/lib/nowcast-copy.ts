/**
 * The live nowcast's headings, written from the figures every time the daily job runs.
 * Each is a rule with a fallback that still reads right when the polls move; none pins a
 * value. Portuguese reads like a newspaper (PT-PT), English like en-GB.
 */

export type NowcastLocale = 'pt' | 'en';

/** The name a reader knows: Chega and Livre in full, the others by their usual letters. */
export function partyName(party: string): string {
  return ({ CH: 'Chega', L: 'Livre' } as Record<string, string>)[party] ?? party;
}

const FEMININE = new Set(['AD', 'IL', 'CDU']);
/** "o PS", "a AD". */
export const art = (p: string) => `${FEMININE.has(p) ? 'a' : 'o'} ${partyName(p)}`;
/** "O PS", "A AD". */
export const Art = (p: string) => `${FEMININE.has(p) ? 'A' : 'O'} ${partyName(p)}`;
/** "do PS", "da AD". */
export const deArt = (p: string) => `${FEMININE.has(p) ? 'da' : 'do'} ${partyName(p)}`;
/** "ao PS", "à AD". */
export const aArt = (p: string) => `${FEMININE.has(p) ? 'à' : 'ao'} ${partyName(p)}`;

/** Pollster names with their article in Portuguese: "a Intercampus", "o ICS/ISCTE". */
const MASCULINE_POLLSTERS = /^ICS/;
export const pollsterArt = (name: string) => `${MASCULINE_POLLSTERS.test(name) ? 'o' : 'a'} ${name}`;
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const FRACTIONS: Array<[number, string, string, string, string]> = [
  // value, pt (first mention), pt (short), en (first), en (short)
  [1 / 20, 'uma vez em vinte', 'uma em vinte', 'once in twenty', 'one in twenty'],
  [1 / 10, 'uma vez em dez', 'uma em dez', 'once in ten', 'one in ten'],
  [1 / 8, 'uma vez em oito', 'uma em oito', 'once in eight', 'one in eight'],
  [1 / 6, 'uma vez em seis', 'uma em seis', 'once in six', 'one in six'],
  [1 / 5, 'uma vez em cinco', 'uma em cinco', 'once in five', 'one in five'],
  [1 / 4, 'uma vez em quatro', 'uma em quatro', 'once in four', 'one in four'],
  [1 / 3, 'uma vez em três', 'uma em três', 'once in three', 'one in three'],
  [1 / 2, 'uma vez em duas', 'uma em duas', 'about half the time', 'half the time'],
  [2 / 3, 'duas vezes em três', 'duas em três', 'two times in three', 'two in three'],
  [3 / 4, 'três vezes em quatro', 'três em quatro', 'three times in four', 'three in four'],
  [4 / 5, 'quatro vezes em cinco', 'quatro em cinco', 'four times in five', 'four in five'],
  [9 / 10, 'nove vezes em dez', 'nove em dez', 'nine times in ten', 'nine in ten'],
];

/** A chance as people say it: "uma vez em duas" when it sits near a simple fraction, else "em 61% dos casos". */
export function chance(p: number, locale: NowcastLocale, short = false): string {
  if (p >= 0.93) return locale === 'pt' ? 'quase sempre' : 'almost every time';
  if (p < 0.02) return locale === 'pt' ? 'quase nunca' : 'almost never';
  const hit = FRACTIONS.find(([v]) => Math.abs(p - v) <= Math.max(0.01, v * 0.08));
  if (hit) return locale === 'pt' ? (short ? hit[2] : hit[1]) : (short ? hit[4] : hit[3]);
  const n = Math.round(p * 100);
  return locale === 'pt' ? `em ${n}% dos casos` : `in ${n}% of cases`;
}

/** "um ponto", "4 pontos", "menos de um ponto" (whole points). */
export function points(v: number, locale: NowcastLocale): string {
  const n = Math.round(Math.abs(v));
  if (n < 1) return locale === 'pt' ? 'menos de um ponto' : 'less than a point';
  if (n === 1) return locale === 'pt' ? 'um ponto' : 'one point';
  return locale === 'pt' ? `${n} pontos` : `${n} points`;
}

/** "quase 10 pontos" for 9,5 to 9,99; "mais de 9 pontos" for 9,0 to 9,49 (a newspaper's rounding). */
export function aboutPoints(v: number, locale: NowcastLocale): string {
  const x = Math.abs(v);
  const whole = Math.floor(x);
  if (x < 1) return points(x, locale);
  if (x - whole >= 0.5) return locale === 'pt' ? `quase ${whole + 1} pontos` : `almost ${whole + 1} points`;
  if (x - whole < 0.05) return points(whole, locale);
  return locale === 'pt' ? `mais de ${points(whole, 'pt')}` : `more than ${points(whole, 'en')}`;
}

export interface SeatChange { party: string; seats: number; before: number; lo: number; hi: number }

/**
 * The overview's h1: who leads on seats and how firmly, then the largest change since the
 * last election that the margin does not cover.
 */
export function overviewTitle(rows: readonly SeatChange[], first: Record<string, number>, locale: NowcastLocale): string {
  const byFirst = [...rows].sort((a, b) => (first[b.party] ?? 0) - (first[a.party] ?? 0));
  const [a, b] = byFirst;
  if (!a) return locale === 'pt' ? 'Próximas legislativas' : 'Next parliamentary election';
  const pa = first[a.party] ?? 0;
  const pb = b ? first[b.party] ?? 0 : 0;
  const lead = pa >= 0.9
    ? (locale === 'pt' ? `${Art(a.party)} elegeria mais deputados` : `${partyName(a.party)} would win the most seats`)
    : pa >= 0.7 || !b || pb < 0.2
      ? (locale === 'pt' ? (b ? `${partyName(a.party)} à frente ${deArt(b.party)}` : `${partyName(a.party)} à frente`) : `${partyName(a.party)} ahead${b ? ` of ${partyName(b.party)}` : ''}`)
      : (locale === 'pt' ? `${partyName(a.party)} e ${partyName(b.party)} disputam o primeiro lugar` : `${partyName(a.party)} and ${partyName(b.party)} vie for first place`);
  const clear = rows
    .filter(r => r.before < r.lo || r.before > r.hi)
    .sort((x, y) => Math.abs(y.seats - y.before) - Math.abs(x.seats - x.before))[0];
  if (!clear || Math.abs(clear.seats - clear.before) < 5) return lead;
  const n = Math.abs(clear.seats - clear.before);
  const lose = clear.seats < clear.before;
  const same = clear.party === a.party;
  return locale === 'pt'
    ? `${lead}; ${same ? '' : `${art(clear.party)} `}${lose ? 'perderia' : 'ganharia'} ${n} deputados`
    : `${lead}; ${same ? 'it' : partyName(clear.party)} would ${lose ? 'lose' : 'gain'} ${n} seats`;
}

/** The overview's standfirst: the seats of the top three, the majority, the odds of first place. */
export function overviewLede(top: ReadonlyArray<{ party: string; seats: number }>, first: Record<string, number>, majority: { party: string; reach: number }, since: string, locale: NowcastLocale): string {
  const [a, b, c] = top;
  if (!a || !b || !c) return '';
  const seatsLine = locale === 'pt'
    ? `Com base nas sondagens publicadas desde as eleições de ${since}, ${art(a.party)} elegeria cerca de ${a.seats} deputados, ${art(b.party)} ${b.seats} e ${art(c.party)} ${c.seats}.`
    : `On the polls published since the ${since} election, ${partyName(a.party)} would win about ${a.seats} seats, ${partyName(b.party)} ${b.seats} and ${partyName(c.party)} ${c.seats}.`;
  const majorityLine = majority.reach < 0.05
    ? (locale === 'pt' ? 'Nenhum partido alcança os 116 da maioria absoluta.' : 'No party reaches the 116 seats of an absolute majority.')
    : (locale === 'pt'
      ? `${Art(majority.party)} alcançaria a maioria absoluta em ${Math.round(majority.reach * 100)}% dos casos.`
      : `${partyName(majority.party)} would win an absolute majority in ${Math.round(majority.reach * 100)}% of cases.`);
  const ranked = Object.entries(first).filter(([, p]) => p > 0).sort((x, y) => y[1] - x[1]);
  const [one, two] = ranked;
  const oddsLine = !one
    ? ''
    : one[1] >= 0.9
      ? (locale === 'pt' ? `${Art(one[0])} ficaria à frente ${chance(one[1], 'pt')}.` : `${partyName(one[0])} would come first ${chance(one[1], 'en')}.`)
      : two
        ? (locale === 'pt'
          ? `${Art(one[0])} ficaria à frente ${chance(one[1], 'pt')}; ${art(two[0])}, ${chance(two[1], 'pt', true)}.`
          : `${partyName(one[0])} would come first ${chance(one[1], 'en')}; ${partyName(two[0])}, ${chance(two[1], 'en', true)}.`)
        : '';
  return [seatsLine, majorityLine, oddsLine].filter(Boolean).join(' ');
}

const GROUP_NAME: Record<string, [string, string]> = {
  'PS+AD': ['um acordo entre PS e AD', 'a deal between PS and AD'],
  'AD+IL': ['AD e IL', 'AD and IL'],
  'PS+L+CDU+BE+PAN': ['a esquerda', 'the left'],
};
const groupName = (parties: readonly string[], locale: NowcastLocale) => {
  const g = GROUP_NAME[parties.join('+')];
  return g ? g[locale === 'pt' ? 0 : 1] : parties.map(partyName).join(locale === 'pt' ? ' e ' : ' and ');
};

/** Who can govern without Chega: the groups that reach 116 in at least half the scenarios. */
export function governTitle(majorities: ReadonlyArray<{ parties: readonly string[]; reach: number }>, locale: NowcastLocale): string {
  const reach = majorities.filter(m => m.reach >= 0.5);
  if (reach.length === 0) return locale === 'pt' ? 'Sem o Chega, nenhuma combinação alcança os 116 deputados' : 'Without Chega, no combination reaches 116 seats';
  if (reach.length === 1) {
    return locale === 'pt'
      ? `Sem o Chega, só ${groupName(reach[0].parties, 'pt')} teria maioria`
      : `Without Chega, only ${groupName(reach[0].parties, 'en')} would have a majority`;
  }
  const plain = reach.map(m => m.parties.map(partyName).join(locale === 'pt' ? ' e ' : ' and '));
  return locale === 'pt' ? `Sem o Chega, haveria maioria com ${plain.join(' ou com ')}` : `Without Chega, either ${plain.join(' or ')} would have a majority`;
}

export interface PublishedPoll { name: string; shares: Record<string, number> }

/** The latest polls as published: who each puts ahead, and the one that disagrees. */
export function pollsTitle(polls: readonly PublishedPoll[], parties: readonly string[], locale: NowcastLocale): string {
  const leaders = polls.map(poll => {
    const ranked = parties.filter(p => poll.shares[p] != null).sort((a, b) => (poll.shares[b] ?? 0) - (poll.shares[a] ?? 0));
    return { name: poll.name, leader: ranked[0], gap: 100 * ((poll.shares[ranked[0]] ?? 0) - (poll.shares[ranked[1]] ?? 0)) };
  });
  const distinct = [...new Set(leaders.map(l => l.leader))];
  const n = polls.length;
  const howMany = locale === 'pt' ? ({ 2: 'As duas', 3: 'As três', 4: 'As quatro', 5: 'As cinco' } as Record<number, string>)[n] ?? `As ${n}` : ({ 2: 'The two', 3: 'The three', 4: 'The four', 5: 'The five' } as Record<number, string>)[n] ?? `The ${n}`;
  if (distinct.length === 1 && leaders[0]) {
    return locale === 'pt'
      ? `${howMany} sondagens mais recentes põem ${art(leaders[0].leader)} à frente`
      : `${howMany} latest polls put ${partyName(leaders[0].leader)} ahead`;
  }
  if (distinct.length === 2) {
    const counts = distinct.map(p => leaders.filter(l => l.leader === p).length);
    const odd = distinct[counts[0] <= counts[1] ? 0 : 1];
    const main = distinct.find(p => p !== odd)!;
    const oddPolls = leaders.filter(l => l.leader === odd);
    const others = leaders.filter(l => l.leader === main);
    if (oddPolls.length === 1) {
      const o = oddPolls[0];
      const list = (xs: string[], pt: boolean) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${pt ? 'e' : 'and'} ${xs.at(-1)}`);
      return locale === 'pt'
        ? `${cap(pollsterArt(o.name))} põe ${art(odd)} ${points(o.gap, 'pt')} à frente; ${list(others.map(x => pollsterArt(x.name)), true)}, ${art(main)}`
        : `${o.name} puts ${partyName(odd)} ${points(o.gap, 'en')} ahead; ${list(others.map(x => x.name), false)}, ${partyName(main)}`;
    }
  }
  return locale === 'pt' ? `${howMany} sondagens mais recentes divergem sobre quem vai à frente` : `${howMany} latest polls disagree on who leads`;
}

/** The trend page's h1: who fell and who rose clearly since the last election (two points or more). */
export function trendTitle(changes: ReadonlyArray<{ party: string; change: number }>, year: string, locale: NowcastLocale): string {
  const fell = changes.filter(c => c.change <= -2).sort((a, b) => a.change - b.change);
  const rose = changes.filter(c => c.change >= 2).sort((a, b) => b.change - a.change);
  const names = (xs: typeof rose) => xs.map(x => partyName(x.party)).join(locale === 'pt' ? ' e ' : ' and ');
  if (fell[0] && rose.length > 0) {
    return locale === 'pt'
      ? `${Art(fell[0].party)} caiu ${aboutPoints(fell[0].change, 'pt')} desde as eleições de ${year}; ${names(rose)} ${rose.length > 1 ? 'subiram' : 'subiu'}`
      : `${partyName(fell[0].party)} is down ${aboutPoints(fell[0].change, 'en')} since the ${year} election; ${names(rose)} ${rose.length > 1 ? 'are' : 'is'} up`;
  }
  if (rose[0]) {
    return locale === 'pt'
      ? `${Art(rose[0].party)} subiu ${aboutPoints(rose[0].change, 'pt')} desde as eleições de ${year}`
      : `${partyName(rose[0].party)} is up ${aboutPoints(rose[0].change, 'en')} since the ${year} election`;
  }
  if (fell[0]) {
    return locale === 'pt'
      ? `${Art(fell[0].party)} caiu ${aboutPoints(fell[0].change, 'pt')} desde as eleições de ${year}`
      : `${partyName(fell[0].party)} is down ${aboutPoints(fell[0].change, 'en')} since the ${year} election`;
  }
  return locale === 'pt' ? `As sondagens desde as eleições de ${year}` : `The polls since the ${year} election`;
}

export interface GapRow { name: string; polls: number; gap: Record<string, number>; above: Record<string, number> }

/** The pollster block's h2: the firm whose lean is largest and most regular (five polls or more, at least four in five on one side). */
export function gapTitle(rows: readonly GapRow[], locale: NowcastLocale): string {
  const candidates = rows.flatMap(r => Object.entries(r.gap).map(([party, g]) => ({ r, party, g, side: g > 0 ? r.above[party] : r.polls - r.above[party] })))
    .filter(c => c.r.polls >= 5 && Number.isFinite(c.g) && Math.abs(c.g) >= 1.5 && c.side >= 0.8 * c.r.polls)
    .sort((a, b) => Math.abs(b.g) - Math.abs(a.g));
  const top = candidates[0];
  if (!top) return locale === 'pt' ? 'Nenhuma empresa se afasta muito da estimativa' : 'No pollster strays far from the estimate';
  const always = top.side === top.r.polls;
  const g = Math.abs(top.g).toFixed(1);
  return locale === 'pt'
    ? `${cap(pollsterArt(top.r.name))} dá ${always ? 'sempre ' : 'quase sempre '}${top.g < 0 ? 'menos' : 'mais'} ${aArt(top.party)} do que a estimativa: ${g.replace('.', ',')} pontos, em média`
    : `${top.r.name} ${always ? 'always' : 'almost always'} has ${partyName(top.party)} ${top.g < 0 ? 'below' : 'above'} the estimate: by ${g} points on average`;
}

/** The seats page's h1: the odds of first place. */
export function firstTitle(first: Record<string, number>, locale: NowcastLocale): string {
  const ranked = Object.entries(first).filter(([, p]) => p > 0).sort((x, y) => y[1] - x[1]);
  const [one, two] = ranked;
  if (!one) return locale === 'pt' ? 'Quem elege mais deputados' : 'Who wins the most seats';
  const pct = (p: number) => (p > 0.99 ? (locale === 'pt' ? 'mais de 99%' : 'over 99%') : `${Math.round(p * 100)}%`);
  if (!two || one[1] > 0.99) {
    return locale === 'pt' ? `${Art(one[0])} tem ${pct(one[1])} de hipóteses de eleger mais deputados` : (one[1] > 0.99 ? `${partyName(one[0])} is more than 99% likely to win the most seats` : `${partyName(one[0])} has a ${pct(one[1])} chance of winning the most seats`);
  }
  return locale === 'pt'
    ? `${Art(one[0])} tem ${pct(one[1])} de hipóteses de eleger mais deputados; ${art(two[0])}, ${pct(two[1])}`
    : `${partyName(one[0])} has a ${pct(one[1])} chance of winning the most seats; ${partyName(two[0])}, ${pct(two[1])}`;
}

/** The majorities block: which groups without Chega reach 116 almost always, and which almost never. */
export function majoritiesTitle(majorities: ReadonlyArray<{ parties: readonly string[]; reach: number }>, locale: NowcastLocale): string {
  const sure = majorities.filter(m => m.reach >= 0.9);
  const never = majorities.filter(m => m.reach < 0.05);
  const name = (m: { parties: readonly string[] }) => {
    const key = m.parties.join('+');
    if (key === 'PS+AD') return locale === 'pt' ? 'PS e AD juntos' : 'PS and AD together';
    return groupName(m.parties, locale);
  };
  if (sure.length === 1 && never.length === majorities.length - 1 && never.length > 0) {
    return locale === 'pt'
      ? `${cap(name(sure[0]))} chegam quase sempre à maioria; nem ${never.map(name).join(' nem ')} lá chegam`
      : `${cap(name(sure[0]))} almost always reach a majority; neither ${never.map(name).join(' nor ')} does`;
  }
  return locale === 'pt' ? 'Quem alcança os 116 deputados' : 'Who reaches 116 seats';
}

/** The emigration block: how often the choice between the two recent patterns changes the winner. */
export function emigrationTitle(share: number, years: readonly string[], locale: NowcastLocale): string {
  if (!Number.isFinite(share) || years.length < 2) return locale === 'pt' ? 'Os 4 deputados da emigração' : 'The 4 emigration seats';
  const [a, b] = years;
  const pt = `muda o vencedor ${chance(share, 'pt')}`.replace('muda o vencedor quase nunca', 'quase nunca muda o vencedor').replace('muda o vencedor quase sempre', 'quase sempre muda o vencedor');
  const en = `changes the winner ${chance(share, 'en')}`.replace('changes the winner almost never', 'almost never changes the winner').replace('changes the winner almost every time', 'almost always changes the winner');
  return locale === 'pt'
    ? `Repartir os 4 deputados da emigração como em ${a} ou em ${b} ${pt}`
    : `Sharing out the 4 emigration seats as in ${a} or as in ${b} ${en}`;
}

/** The lead histogram's heading: how far ahead in votes the leader must be to win more seats than the runner-up. */
export function leadTitle(h: { a: string; b: string; crossover: number | null }, locale: NowcastLocale): string {
  const x = h.crossover;
  if (x == null || x > 5 || x < -5) {
    return locale === 'pt'
      ? `Quem fica em primeiro, conforme a vantagem ${deArt(h.a)} sobre ${art(h.b)}`
      : `Who comes first, by ${partyName(h.a)}'s lead over ${partyName(h.b)}`;
  }
  if (x === 0) {
    return locale === 'pt'
      ? `Basta ${aArt(h.a)} ter mais votos do que ${art(h.b)} para eleger mais deputados`
      : `${partyName(h.a)} needs only more votes than ${partyName(h.b)} to win more seats`;
  }
  if (x > 0) {
    return locale === 'pt'
      ? `Para eleger mais deputados do que ${art(h.b)}, ${art(h.a)} precisa de cerca de ${points(x, 'pt')} de vantagem nos votos`
      : `To win more seats than ${partyName(h.b)}, ${partyName(h.a)} needs a lead of about ${points(x, 'en')} in votes`;
  }
  return locale === 'pt'
    ? `${Art(h.a)} elege mais deputados do que ${art(h.b)} mesmo com até ${points(-x, 'pt')} a menos nos votos`
    : `${partyName(h.a)} wins more seats than ${partyName(h.b)} even up to ${points(-x, 'en')} behind in votes`;
}
