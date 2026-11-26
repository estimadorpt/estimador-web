import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { mostSeatsShares, nowcastProblems, onModelBase, parliamentSeats, rankedByMostSeats, recentMove, seatRanges, seatSum, weeklyFrom, type NowcastFile } from './legislative-nowcast';

const PARTIES = ['PS', 'CH', 'AD'];

describe('mostSeatsShares', () => {
  it('counts outright leaders and leaves a tie for first to no one', () => {
    const draws = [
      { PS: 80, CH: 70, AD: 60 },
      { PS: 70, CH: 80, AD: 60 },
      { PS: 75, CH: 75, AD: 60 },
      { PS: 90, CH: 60, AD: 60 },
    ];
    const { outright, tie } = mostSeatsShares(draws, PARTIES);
    expect(outright).toEqual({ PS: 0.5, CH: 0.25, AD: 0 });
    expect(tie).toBe(0.25);
    expect(rankedByMostSeats(outright, PARTIES)).toEqual(['PS', 'CH', 'AD']);
  });

  it('reads no share from an empty file', () => {
    expect(Number.isNaN(mostSeatsShares([], PARTIES).tie)).toBe(true);
  });
});

describe('seatRanges', () => {
  it('gives each party its median and central 90% in whole seats, largest first', () => {
    const draws = Array.from({ length: 101 }, (_, i) => ({ PS: 50 + i, CH: 40, AD: 140 - i }));
    const [first, second] = seatRanges(draws, PARTIES);
    expect(first).toEqual({ party: 'PS', median: 100, lo90: 55, hi90: 145 });
    expect(second.party).toBe('AD');
    expect(seatRanges([], PARTIES)).toEqual([]);
  });
});

describe('seatSum', () => {
  it('adds the parties draw by draw and counts the draws at the threshold', () => {
    const draws = Array.from({ length: 101 }, (_, i) => ({ PS: 50 + i, CH: 40, AD: 10 }));
    expect(seatSum(draws, ['PS', 'AD'], 116)).toEqual({ parties: ['PS', 'AD'], median: 110, lo90: 65, hi90: 155, reach: 45 / 101 });
  });
});

describe('parliamentSeats', () => {
  it('rounds the mean seats so the parties fill the house, in the order given', () => {
    const draws = [{ PS: 76, CH: 70, AD: 62, IL: 11, L: 5, CDU: 3, BE: 2, PAN: 1 }, { PS: 77, CH: 70, AD: 64, IL: 10, L: 4, CDU: 3, BE: 1, PAN: 1 }];
    const house = parliamentSeats(draws, ['BE', 'CDU', 'L', 'PAN', 'PS', 'AD', 'IL', 'CH'], 230);
    expect(house.map(p => p.party)).toEqual(['BE', 'CDU', 'L', 'PAN', 'PS', 'AD', 'IL', 'CH']);
    expect(house.reduce((sum, p) => sum + p.seats, 0)).toBe(230);
    expect(house.find(p => p.party === 'CH')?.seats).toBe(70);
  });
});

describe('recentMove', () => {
  it('finds the largest move over the last four weeks', () => {
    const trend = {
      dates: ['2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23'],
      parties: {
        PS: { mean: [0.29, 0.296, 0.299, 0.3, 0.3, 0.298], low: [], high: [] },
        CH: { mean: [0.284, 0.28, 0.279, 0.278, 0.271, 0.257], low: [], high: [] },
      },
    };
    const move = recentMove(trend);
    expect(move?.party).toBe('CH');
    expect(move?.since).toBe('2026-10-26');
    expect(move?.move).toBeCloseTo(-0.023);
  });
});

describe('onModelBase', () => {
  it('puts a poll on the modelled parties only, as the estimate is', () => {
    const shares = onModelBase({ PS: 0.3, CH: 0.25, AD: 0.25, Others: 0.2 }, PARTIES);
    expect(shares.PS).toBeCloseTo(0.375);
    expect(Object.keys(shares)).toEqual(['PS', 'CH', 'AD']);
    expect(onModelBase({ Others: 1 }, PARTIES)).toEqual({});
  });
});

describe('weeklyFrom', () => {
  it('finds where the saved path turns weekly', () => {
    expect(weeklyFrom(['2025-05-18', '2025-06-09', '2025-07-07', '2025-07-14', '2025-07-21'])).toBe('2025-07-07');
    expect(weeklyFrom(['2026-11-09', '2026-11-16', '2026-11-23'])).toBeNull();
  });
});

describe('the published nowcast file', () => {
  // Invariants only: the daily job rewrites the file, so no value is pinned here.
  const file = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/elections/legislative-nowcast/nowcast.json'), 'utf8')) as NowcastFile;

  it('passes the checks the loader and validate-data apply', () => {
    expect(nowcastProblems(file)).toEqual([]);
  });

  it('lists every modelled party once, largest median first, in the trend and the previous result', () => {
    const parties = file.national.map(r => r.party);
    expect(new Set(parties).size).toBe(parties.length);
    expect(file.parties).toEqual(parties);
    const medians = file.national.map(r => r.median);
    expect([...medians].sort((a, b) => b - a)).toEqual(medians);
    for (const party of parties) {
      expect(file.trend.parties[party]?.mean).toHaveLength(file.trend.dates.length);
      expect(file.previous.shares[party]).toBeTypeOf('number');
    }
  });

  it('starts the trend at the previous election and keeps its dates in order', () => {
    expect(file.trend.dates[0]).toBe(file.previous.date);
    expect([...file.trend.dates].sort()).toEqual(file.trend.dates);
  });

  it('refuses a scenario run or a run that did not converge', () => {
    expect(nowcastProblems({ ...file, run: { ...file.run, bias_form: 'static' } })).toContain('bias form static is a scenario');
    expect(nowcastProblems({ ...file, run: { ...file.run, diagnostics: { ...file.run.diagnostics, passes_gate: false } } }))
      .toContain('the run did not pass the convergence gate');
  });
});
