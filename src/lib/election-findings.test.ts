import { describe, expect, it } from 'vitest';
import { headToHeadAtCutoff, likeliestPair, likeliestWinner, mostSeats, partyWithArticle } from './election-findings';

describe('election findings', () => {
  it('reads the head-to-head at the last poll, from the leader’s side', () => {
    const data = { dates: ['2026-01-14', '2026-01-15', '2026-01-16'], probability_a_leads: [0.6, 0.42, 0.7], candidate_a: 'A', candidate_b: 'B' };
    expect(headToHeadAtCutoff(data, '2026-01-15')).toEqual({ leader: 'B', other: 'A', probability: 1 - 0.42, date: '2026-01-15' });
    expect(headToHeadAtCutoff(data, null)?.leader).toBe('A');
    expect(headToHeadAtCutoff(data, '2026-01-01')).toBeNull();
  });

  it('picks the likeliest winner and pair whatever the file order', () => {
    expect(likeliestWinner([{ name: 'A', win_probability: 0.2 }, { name: 'B', win_probability: 0.8 }])?.name).toBe('B');
    expect(likeliestPair([{ candidate_a: 'A', candidate_b: 'B', probability: 0.1 }, { candidate_a: 'A', candidate_b: 'C', probability: 0.4 }])?.candidate_b).toBe('C');
    expect(likeliestWinner([])).toBeNull();
  });

  it('counts the draws each party leads outright, ties for no one', () => {
    const draws = [{ AD: 90, PS: 60, sample_id: 1 }, { AD: 70, PS: 80, sample_id: 2 }, { AD: 75, PS: 75, sample_id: 3 }, { AD: 88, PS: 70, sample_id: 4 }];
    expect(mostSeats(draws)).toEqual({ party: 'AD', share: 0.5 });
    expect(partyWithArticle('AD', 'pt')).toBe('A AD');
    expect(partyWithArticle('PS', 'pt')).toBe('O PS');
    expect(partyWithArticle('PS', 'en')).toBe('PS');
  });
});
