import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { mostSeatsShares, nowcastProblems, rankedByMostSeats, seatRanges, weeklyFrom, type NowcastFile } from './legislative-nowcast';

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
