import { describe, expect, it } from 'vitest';
import { aboutPoints, chance, emigrationTitle, firstTitle, gapTitle, governTitle, majoritiesTitle, overviewLede, overviewTitle, pollsTitle, trendTitle } from './nowcast-copy';
import { leaderChangeShare, pollsterGaps, roundToTotal, voteShares } from './nowcast-summary';
import { pollOutlet } from './nowcast-polls';

const rows = [
  { party: 'PS', seats: 75, before: 58, lo: 59, hi: 92 },
  { party: 'CH', seats: 71, before: 60, lo: 56, hi: 88 },
  { party: 'AD', seats: 63, before: 91, lo: 49, hi: 78 },
];

describe('nowcast headings', () => {
  it('says who leads on seats and the largest change the margin does not cover', () => {
    expect(overviewTitle(rows, { PS: 0.53, CH: 0.35, AD: 0.1 }, 'pt')).toBe('PS e Chega disputam o primeiro lugar; a AD perderia 28 deputados');
    expect(overviewTitle(rows, { PS: 0.53, CH: 0.35, AD: 0.1 }, 'en')).toBe('PS and Chega vie for first place; AD would lose 28 seats');
    expect(overviewTitle(rows, { PS: 0.8, CH: 0.15, AD: 0.05 }, 'pt')).toBe('PS à frente do Chega; a AD perderia 28 deputados');
    expect(overviewTitle(rows, { PS: 0.95, CH: 0.05 }, 'pt')).toBe('O PS elegeria mais deputados; a AD perderia 28 deputados');
    // No change outside the margin: the lead alone.
    expect(overviewTitle(rows.map(r => ({ ...r, before: r.seats })), { PS: 0.53, CH: 0.35 }, 'pt')).toBe('PS e Chega disputam o primeiro lugar');
  });

  it('writes the standfirst with chances people say', () => {
    expect(overviewLede(rows, { PS: 0.526, CH: 0.347, AD: 0.104 }, { party: 'PS', reach: 0 }, 'maio de 2025', 'pt')).toBe(
      'Com base nas sondagens publicadas desde as eleições de maio de 2025, o PS elegeria cerca de 75 deputados, o Chega 71 e a AD 63. Nenhum partido alcança os 116 da maioria absoluta. O PS ficaria à frente uma vez em duas; o Chega, uma em três.',
    );
    expect(chance(0.61, 'pt')).toBe('em 61% dos casos');
    expect(chance(0.0545, 'pt')).toBe('uma vez em vinte');
    expect(chance(0.12, 'pt')).toBe('uma vez em oito');
    expect(chance(0.95, 'pt')).toBe('quase sempre');
    expect(chance(0.526, 'en')).toBe('about half the time');
    expect(aboutPoints(9.5, 'pt')).toBe('quase 10 pontos');
    expect(aboutPoints(9.2, 'pt')).toBe('mais de 9 pontos');
  });

  it('names who can govern without Chega, with fallbacks', () => {
    const m = (reach: number[]) => [['AD', 'IL'], ['PS', 'L', 'CDU', 'BE', 'PAN'], ['PS', 'AD']].map((parties, i) => ({ parties, reach: reach[i] }));
    expect(governTitle(m([0, 0, 0.99]), 'pt')).toBe('Sem o Chega, só um acordo entre PS e AD teria maioria');
    expect(governTitle(m([0, 0, 0.3]), 'pt')).toBe('Sem o Chega, nenhuma combinação alcança os 116 deputados');
    expect(governTitle(m([0.6, 0, 0.99]), 'pt')).toBe('Sem o Chega, haveria maioria com AD e IL ou com PS e AD');
    expect(majoritiesTitle(m([0, 0, 0.99]), 'pt')).toBe('PS e AD juntos chegam quase sempre à maioria; nem AD e IL nem a esquerda lá chegam');
    expect(majoritiesTitle(m([0.4, 0, 0.99]), 'pt')).toBe('Quem alcança os 116 deputados');
  });

  it('reads the latest polls as published', () => {
    const polls = [
      { name: 'Pitagórica', shares: { PS: 0.303, CH: 0.275, AD: 0.235 } },
      { name: 'CESOP–Católica', shares: { AD: 0.26, PS: 0.25, CH: 0.23 } },
      { name: 'Intercampus', shares: { PS: 0.282, CH: 0.238, AD: 0.229 } },
    ];
    expect(pollsTitle(polls, ['PS', 'CH', 'AD'], 'pt')).toBe('A CESOP–Católica põe a AD um ponto à frente; a Pitagórica e a Intercampus, o PS');
    expect(pollsTitle(polls.map(p => ({ ...p, shares: { PS: 0.3, CH: 0.2 } })), ['PS', 'CH'], 'pt')).toBe('As três sondagens mais recentes põem o PS à frente');
    expect(pollsTitle([polls[0], polls[1], { name: 'ICS/ISCTE', shares: { CH: 0.3, PS: 0.2 } }], ['PS', 'CH', 'AD'], 'pt')).toBe('As três sondagens mais recentes divergem sobre quem vai à frente');
  });

  it('writes the trend, pollster, seats and emigration headings', () => {
    expect(trendTitle([{ party: 'AD', change: -9.5 }, { party: 'PS', change: 5.2 }, { party: 'CH', change: 3.8 }], '2025', 'pt')).toBe('A AD caiu quase 10 pontos desde as eleições de 2025; PS e Chega subiram');
    expect(trendTitle([{ party: 'AD', change: -0.5 }], '2025', 'pt')).toBe('As sondagens desde as eleições de 2025');
    expect(gapTitle([{ name: 'Intercampus', polls: 15, gap: { AD: -3.4, PS: -1.8 }, above: { AD: 0, PS: 2 } }], 'pt')).toBe('A Intercampus dá sempre menos à AD do que a estimativa: 3,4 pontos, em média');
    expect(gapTitle([{ name: 'Intercampus', polls: 3, gap: { AD: -3.4 }, above: { AD: 0 } }], 'pt')).toBe('Nenhuma empresa se afasta muito da estimativa');
    expect(firstTitle({ PS: 0.526, CH: 0.347, AD: 0.104 }, 'pt')).toBe('O PS tem 53% de hipóteses de eleger mais deputados; o Chega, 35%');
    expect(emigrationTitle(0.0545, ['2024', '2025'], 'pt')).toBe('Repartir os 4 deputados da emigração como em 2024 ou em 2025 muda o vencedor uma vez em vinte');
    expect(emigrationTitle(0.004, ['2024', '2025'], 'pt')).toBe('Repartir os 4 deputados da emigração como em 2024 ou em 2025 quase nunca muda o vencedor');
  });
});

describe('nowcast figures', () => {
  it('rounds shares to a total', () => {
    expect(roundToTotal([29.88, 27.6, 24.99, 6.59, 3.81, 3.04, 2.44, 1.65], 100, 0.1).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
    const v = voteShares([0.5, 0.3, 0.2].map((mean, i) => ({ party: `P${i}`, mean, median: mean, lo90: mean, hi90: mean, lo50: mean, hi50: mean })));
    expect(v).toEqual({ P0: 50, P1: 30, P2: 20 });
  });

  it('counts how often the leader changes between two emigration patterns', () => {
    const draws = [
      { PS: 80, CH: 70, diaspora_scenario_applied: 'S_2024', original_sample_id: 0 },
      { PS: 79, CH: 72, diaspora_scenario_applied: 'S_2025', original_sample_id: 0 },
      { PS: 80, CH: 60, diaspora_scenario_applied: 'S_2024', original_sample_id: 1 },
      { PS: 79, CH: 62, diaspora_scenario_applied: 'S_2025', original_sample_id: 1 },
    ];
    expect(leaderChangeShare(draws, 'S_2024', 'S_2025', ['PS', 'CH'])).toBe(0);
    draws[1].CH = 81;
    expect(leaderChangeShare(draws, 'S_2024', 'S_2025', ['PS', 'CH'])).toBe(0.5);
  });

  it('compares each poll with the estimate of its week and counts a firm’s long polls as a tracker', () => {
    const trend = { dates: ['2026-01-05', '2026-01-12'], parties: { PS: { mean: [0.5, 0.5], low: [0, 0], high: [1, 1] }, CH: { mean: [0.5, 0.5], low: [0, 0], high: [1, 1] } } };
    const poll = (pollster: string, start: string, end: string, ps: number) => ({ pollster, fieldwork_start: start, fieldwork_end: end, sample_size: 800, shares: { PS: ps, CH: 1 - ps }, source_url: null });
    const gaps = pollsterGaps([poll('A', '2026-01-01', '2026-01-05', 0.55), poll('A', '2026-01-08', '2026-01-12', 0.53), poll('B', '2025-12-10', '2026-01-12', 0.5)], trend, ['PS', 'CH'], ['PS']);
    const a = gaps.find(g => g.pollster === 'A')!;
    expect(a.polls).toBe(2);
    expect(a.gap.PS).toBeCloseTo(4, 6);
    expect(a.above.PS).toBe(2);
    // One long poll is not a tracker.
    expect(gaps.find(g => g.pollster === 'B')!.tracking).toBe(false);
  });

  it('names an outlet only from its own site', () => {
    expect(pollOutlet('https://cnnportugal.iol.pt/politica/tracking-poll')).toEqual({ pt: 'a CNN Portugal', en: 'CNN Portugal' });
    expect(pollOutlet('https://www.rtp.pt/noticias/x')).toEqual({ pt: 'a RTP', en: 'RTP' });
    expect(pollOutlet('https://executivedigest.sapo.pt/x')).toBeNull();
    expect(pollOutlet(null)).toBeNull();
  });
});
