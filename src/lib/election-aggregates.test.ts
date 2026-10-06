import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  compactTrendSeries,
  dotsPerRowToFit,
  everyKthIndex,
  noBlocMajorityShare,
  seatSumArithmetic,
  stackDots,
  quantileSorted,
  recentTrendRows,
  summariseBlocs,
  summariseDraws,
  summariseRunoff,
  summariseSeats,
} from './election-aggregates';

const ELECTIONS = path.join(process.cwd(), 'public/data/elections');
// Raw simulation draws are build-only inputs, kept outside public/.
const BUILD_ONLY_ELECTIONS = path.join(process.cwd(), 'data/build-only/elections');
const readJson = <T,>(relative: string): T => JSON.parse(readFileSync(path.join(ELECTIONS, relative), 'utf8')) as T;
const readBuildOnlyJson = <T,>(relative: string): T =>
  JSON.parse(readFileSync(path.join(BUILD_ONLY_ELECTIONS, relative), 'utf8')) as T;

describe('quantiles and subsamples', () => {
  it('uses the exports’ own index convention, ⌊n·p⌋', () => {
    const sorted = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(quantileSorted(sorted, 0.05)).toBe(0);
    expect(quantileSorted(sorted, 0.5)).toBe(5);
    expect(quantileSorted(sorted, 0.95)).toBe(9);
    expect(quantileSorted([], 0.5)).toBeNaN();
  });

  it('draws the same evenly spaced subsample on every call', () => {
    expect(everyKthIndex(10, 5)).toEqual([0, 2, 4, 6, 8]);
    expect(everyKthIndex(8000, 800)).toHaveLength(800);
    expect(everyKthIndex(9000, 800)).toEqual(everyKthIndex(9000, 800));
    expect(everyKthIndex(3, 800)).toEqual([0, 1, 2]);
  });

  it('summarises from every draw, not from the subsample', () => {
    const s = summariseDraws([4, 1, 3, 2, 0]);
    expect(s.mean).toBe(2);
    expect(s.median).toBe(2);
  });
});

describe('runoff simulations', () => {
  const input = {
    dates: ['2026-02-07', '2026-02-08'],
    n_samples: 4,
    candidates: {
      A: { color: '#111', trajectories: [[0, 0.60], [0, 0.50], [0, 0.45], [0, 0.66]] },
      B: { color: '#222', trajectories: [[0, 0.35], [0, 0.45], [0, 0.45], [0, 0.30]] },
      'Blank/Null': { color: '#999', trajectories: [[0, 0.05], [0, 0.05], [0, 0.10], [0, 0.04]] },
    },
  };

  it('reads election day as a share of the valid vote, so 50% is a real majority', () => {
    const r = summariseRunoff(input)!;
    expect(r.total).toBe(4);
    expect(r.date).toBe('2026-02-08');
    const a = r.candidates.find(c => c.name === 'A')!;
    // 0.60 / 0.95, 0.50 / 0.95, 0.45 / 0.90, 0.66 / 0.96
    expect(a.sample[0]).toBeCloseTo(0.6316, 4);
    expect(a.sample[2]).toBe(0.5);
    expect(r.candidates.every(c => c.sample.length === r.drawn)).toBe(true);
    // The two candidates' valid shares add to one in every drawn simulation.
    const b = r.candidates.find(c => c.name === 'B')!;
    a.sample.forEach((v, i) => expect(v + b.sample[i]).toBeCloseTo(1, 3));
  });

  it('counts scenarios over every simulation', () => {
    const r = summariseRunoff(input)!;
    // margins: 0.263, 0.053, 0, 0.375 → two under 10 points
    expect(r.closeRace).toBe(0.5);
    // runner-up B above 40%: 0.474 and 0.5 → two of four
    expect(r.runnerUpAbove40).toBe(0.5);
    expect(r.candidates[0].name).toBe('A');
  });

  it('refuses anything but a two-candidate runoff', () => {
    expect(summariseRunoff({ dates: [], n_samples: 0, candidates: {} })).toBeNull();
  });

  it('matches the published valid-vote summary on the archived file', () => {
    const traj = readBuildOnlyJson<Parameters<typeof summariseRunoff>[0]>('presidential-2026/second_round_trajectories.json');
    const valid = readJson<{ candidates: Array<{ name: string; median: number; ci_lower: number; ci_upper: number }> }>('presidential-2026/second_round_valid_votes.json');
    const r = summariseRunoff(traj)!;
    expect(r.total).toBe(8000);
    expect(r.drawn).toBe(800);
    for (const published of valid.candidates) {
      const ours = r.candidates.find(c => c.name === published.name)!;
      expect(ours.summary.median).toBeCloseTo(published.median, 3);
      // The beeswarm's dots stay inside the published 95% interval's neighbourhood.
      expect(ours.summary.p5).toBeGreaterThan(published.ci_lower - 0.001);
      expect(ours.summary.p95).toBeLessThan(published.ci_upper + 0.001);
    }
    // The payload handed to the page is small: 800 draws per candidate, not 8000 × 19 × 3.
    expect(JSON.stringify(r).length).toBeLessThan(20000);
  });
});

describe('parliamentary seats', () => {
  const draws = [
    { PS: 60, AD: 90, IL: 10, diaspora_scenario_applied: 'S_2024' },
    { PS: 70, AD: 85, IL: 8 },
    { PS: 58, AD: 95, IL: 12 },
    { PS: 66, AD: 88, IL: 9 },
  ];

  it('summarises each party over every draw', () => {
    const stats = summariseSeats(draws, ['PS', 'AD', 'IL']);
    expect(stats.map(s => s.party)).toEqual(['AD', 'PS', 'IL']);
    expect(stats[0].mean).toBe(90);
    expect(stats[0].max).toBe(95);
  });

  it('adds blocs up per draw and reports the majority share', () => {
    const blocs = summariseBlocs(draws, [{ key: 'right', parties: ['AD', 'IL'] }, { key: 'left', parties: ['PS'] }], 100, 2);
    expect(blocs.total).toBe(4);
    expect(blocs.drawn).toBe(2);
    const right = blocs.blocs[0];
    // 100, 93, 107, 97
    expect(right.majority).toBe(0.5);
    expect(right.sample).toEqual([100, 107]);
    expect(blocs.blocs[1].majority).toBe(0);
  });

  it('agrees with the published archive: 9000 draws, 230 seats each', () => {
    const sims = readBuildOnlyJson<Array<Record<string, number | string>>>('parliamentary-2025/seat_forecast_simulations.json');
    const parties = ['PS', 'CH', 'IL', 'BE', 'CDU', 'PAN', 'L', 'AD'];
    const blocs = summariseBlocs(sims, [{ key: 'all', parties }], 116);
    expect(blocs.total).toBe(9000);
    expect(blocs.blocs[0].summary.p5).toBe(230);
    expect(blocs.blocs[0].summary.p95).toBe(230);
  });
});

describe('trend window', () => {
  it('keeps the two years before the latest date', () => {
    const rows = [
      { date: '2009-10-15', v: 1 },
      { date: '2023-05-17', v: 2 },
      { date: '2023-05-18', v: 3 },
      { date: '2025-05-18', v: 4 },
    ];
    expect(recentTrendRows(rows).map(r => r.v)).toEqual([3, 4]);
    expect(recentTrendRows([])).toEqual([]);
  });
});

describe('trend series in columns', () => {
  const rows = [
    { date: '2025-05-18', party: 'AD', metric: 'vote_share_mean', value: 0.34216 },
    { date: '2025-05-18', party: 'AD', metric: 'vote_share_low', value: 0.31 },
    { date: '2025-05-18', party: 'AD', metric: 'vote_share_high', value: 0.37 },
    { date: '2025-05-15', party: 'AD', metric: 'vote_share_mean', value: 0.33 },
    { date: '2025-05-15', party: 'PS', metric: 'vote_share_mean', value: 0.27 },
    { date: '2025-05-15', party: 'PS', metric: 'other_metric', value: 9 },
  ];

  it('keeps every value on its own date, with null where the file has none', () => {
    const series = compactTrendSeries(rows);
    expect(series.dates).toEqual(['2025-05-15', '2025-05-18']);
    expect(series.parties.AD).toEqual({ mean: [0.33, 0.3422], low: [null, 0.31], high: [null, 0.37] });
    expect(series.parties.PS.mean).toEqual([0.27, null]);
  });

  it('carries the published window in far fewer bytes than the long rows', () => {
    const trends = recentTrendRows(readJson<{ date: string; party: string; metric: string; value: number }[]>('parliamentary-2025/national_trends.json'));
    const series = compactTrendSeries(trends);
    const values = Object.values(series.parties).flatMap(p => [...p.mean, ...p.low, ...p.high]).filter(v => v != null);
    expect(values.length).toBe(trends.length);
    expect(JSON.stringify(series).length).toBeLessThan(JSON.stringify(trends).length / 4);
  });
});

describe('majority arithmetic', () => {
  const draws = [
    { AD: 90, IL: 10, CH: 50, PS: 60 },
    { AD: 110, IL: 8, CH: 40, PS: 50 },
    { AD: 80, IL: 6, CH: 60, PS: 70 },
  ];

  it('counts the draws in which no bloc reaches the threshold', () => {
    expect(noBlocMajorityShare(draws, [['AD', 'IL'], ['PS']], 116)).toBeCloseTo(2 / 3);
    expect(noBlocMajorityShare([], [['AD']], 116)).toBeNaN();
  });

  it('gives the median and the reach of a seat sum', () => {
    expect(seatSumArithmetic(draws, ['AD', 'CH'], 116)).toEqual({ median: 140, reach: 1 });
  });

  it('reproduces the archived 2025 figures: no bloc majority, AD + CH at 138', () => {
    const seats = readBuildOnlyJson<Record<string, number>[]>('parliamentary-2025/seat_forecast_simulations.json');
    expect(noBlocMajorityShare(seats, [['AD', 'IL'], ['PS', 'BE', 'CDU', 'L']], 116)).toBe(1);
    expect(seatSumArithmetic(seats, ['AD', 'CH'], 116)).toEqual({ median: 138, reach: 1 });
  });
});

describe('dot histogram', () => {
  it('stacks equal values side by side, then upwards', () => {
    const { dots, rows } = stackDots([5, 5, 5, 6], 2);
    expect(dots).toEqual([
      { value: 5, col: 0, row: 0 },
      { value: 5, col: 1, row: 0 },
      { value: 5, col: 0, row: 1 },
      { value: 6, col: 0, row: 0 },
    ]);
    expect(rows).toBe(2);
  });

  it('sets enough dots per row for the tallest column to fit', () => {
    // 100 dots, 10px per seat, 140px tall: 1 per row needs 1000px, 3 per row 34 × 3.3 ≈ 113px.
    expect(dotsPerRowToFit(100, 10, 140)).toBe(3);
    expect(dotsPerRowToFit(10, 10, 140)).toBe(1);
    expect(dotsPerRowToFit(10_000, 10, 140, 4)).toBe(4);
  });
});
