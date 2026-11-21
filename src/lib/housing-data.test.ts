import type { LicenceYear } from './housing-data';
import { describe, expect, it } from 'vitest';
import { housingDate, niceCeiling, oneDecimal, runHoldsFinding, yearsOverTwoYears, loadHousingLicensing, loadHousingShortLets } from './housing-data';

const y = (year: number, days: number): LicenceYear => ({
  year,
  new_build: { median_days: days, alvaras: 10 },
  all_licences: { median_days: days, alvaras: 10 },
  partial_year: false,
  after_simplex: year >= 2024,
} as LicenceYear);

describe('housing helpers', () => {
  it('returns the trailing run of years above two years', () => {
    expect(yearsOverTwoYears([y(2018, 800), y(2019, 700), y(2020, 760), y(2021, 900)]).map(r => r.year)).toEqual([2020, 2021]);
    expect(yearsOverTwoYears([y(2020, 700)])).toEqual([]);
    expect(yearsOverTwoYears([])).toEqual([]);
  });
  it('formats dates and decimals per locale', () => {
    expect(housingDate('2026-10-10', 'pt')).toMatch(/10 de outubro de 2026/);
    expect(housingDate('2026-10-10', 'en')).toMatch(/10 October 2026/);
    expect(oneDecimal(3.71, 'pt')).toBe('3,7');
    expect(oneDecimal(3.71, 'en')).toBe('3.7');
  });
  it('loads the published files sorted', () => {
    const lic = loadHousingLicensing();
    const sl = loadHousingShortLets();
    expect(lic).not.toBeNull();
    expect(sl).not.toBeNull();
    if (!lic || !sl) return;
    const years = lic.lisbon.by_alvara_year.map(r => r.year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    const ratios = sl.parishes.map(p => p.per_100_dwellings);
    expect(ratios).toEqual([...ratios].sort((a, b) => b - a));
  });
});

describe('niceCeiling', () => {
  it('rounds up past every value with room', () => {
    expect(niceCeiling([41000, 20000])).toBe(50000);
    expect(niceCeiling([])).toBe(10000);
  });
});

describe('runHoldsFinding', () => {
  it('needs two whole years past the line', () => {
    const whole = (year: number) => ({ year, partial_year: false }) as unknown as LicenceYear;
    const part = (year: number) => ({ year, partial_year: true }) as unknown as LicenceYear;
    expect(runHoldsFinding([whole(2024), whole(2025)])).toBe(true);
    expect(runHoldsFinding([whole(2025), part(2026)])).toBe(false);
    expect(runHoldsFinding([])).toBe(false);
  });
});
