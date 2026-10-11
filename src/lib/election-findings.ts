/**
 * The archives' findings, read from their own files: each headline that
 * states a result (instead of asking a question) gets its figure here, so the
 * homepage, the archive guide and the archive pages say the same thing.
 * Nothing is computed that the files do not already hold: a share of the
 * simulations, a published probability, the most likely pair.
 */

/** The candidate with the highest win probability (the runoff's). */
export function likeliestWinner<T extends { name: string; win_probability: number }>(candidates: readonly T[]): T | null {
  return [...candidates].sort((a, b) => b.win_probability - a.win_probability)[0] ?? null;
}

/** The most likely runoff pair, as published (presidential_runoff_pairs.json). */
export function likeliestPair<T extends { candidate_a: string; candidate_b: string; probability: number }>(pairs: readonly T[]): T | null {
  return [...pairs].sort((a, b) => b.probability - a.probability)[0] ?? null;
}

/**
 * Who was ahead in the head-to-head at the forecast's last poll: the last
 * value on or before the cutoff, read the way the chart reads it (the
 * candidate with a probability of 0.5 or more of leading, and that probability).
 */
export function headToHeadAtCutoff(
  data: { dates: string[]; probability_a_leads: number[]; candidate_a: string; candidate_b: string },
  cutoff?: string | null,
): { leader: string; other: string; probability: number; date: string } | null {
  const end = cutoff ? data.dates.findIndex(d => d.slice(0, 10) > cutoff.slice(0, 10)) : -1;
  const last = (end === -1 ? data.dates.length : end) - 1;
  if (last < 0) return null;
  const p = data.probability_a_leads[last];
  if (typeof p !== 'number') return null;
  return p >= 0.5
    ? { leader: data.candidate_a, other: data.candidate_b, probability: p, date: data.dates[last] }
    : { leader: data.candidate_b, other: data.candidate_a, probability: 1 - p, date: data.dates[last] };
}

/** The party with most seats in the most draws, and the share of draws it leads (ties count for no one). */
export function mostSeats(draws: Array<Record<string, number>>): { party: string; share: number } | null {
  if (!draws.length) return null;
  const parties = Object.keys(draws[0]).filter(k => typeof draws[0][k] === 'number' && !/scenario|sample|_id$/.test(k));
  const wins: Record<string, number> = {};
  for (const draw of draws) {
    const ranked = parties.map(p => [p, draw[p]] as const).sort((a, b) => b[1] - a[1]);
    if (ranked.length > 1 && ranked[0][1] > ranked[1][1]) wins[ranked[0][0]] = (wins[ranked[0][0]] ?? 0) + 1;
  }
  const [party, count] = Object.entries(wins).sort((a, b) => b[1] - a[1])[0] ?? [];
  return party ? { party, share: count / draws.length } : null;
}

/** "A AD", "O PS": the party as the subject of a Portuguese sentence. */
export function partyWithArticle(party: string, locale: string): string {
  if (locale === 'en') return party;
  const feminine = new Set(['AD', 'IL', 'CDU']);
  return `${feminine.has(party) ? 'A' : 'O'} ${party}`;
}
