import fs from 'node:fs';
import path from 'node:path';
import { HOUSING_PUBLISHED } from './config/housing-status';

/**
 * The housing page's two files (public/data/housing/), written by
 * estimador-housing's housing-page (./scripts/sync-data.sh housing). Records
 * only: counts, medians of recorded dates and ratios of published counts.
 */

export interface HousingSource {
  id: string;
  publisher: string;
  name: string;
  url: string;
  licence: string;
  credit?: string;
  snapshot?: string;
  last_alvara_date?: string | null;
  retrieved_at?: string;
}

export interface LicenceYear {
  year: number;
  new_build: { median_days: number | null; alvaras: number };
  all_licences: { median_days: number | null; alvaras: number };
  partial_year: boolean;
  after_simplex: boolean;
}

export interface NationalYear {
  year: number;
  licensed: number;
  completed: number;
  completed_provisional: boolean;
  completed_per_licensed_two_years_before: number | null;
}

export interface LicensingFile {
  schema: 'estimador.housing.licensing/1';
  generated_at: string;
  status: 'transcribed' | 'report';
  universe: { lisbon: string; national: string };
  sources: HousingSource[];
  caveats: string[];
  lisbon: {
    snapshot: string;
    simplex_date: string;
    overall: {
      years: [number, number];
      new_build: { median_days: number; p75_days: number | null; alvaras: number };
      all_licences: { median_days: number; p75_days: number | null; alvaras: number };
    };
    by_alvara_year: LicenceYear[];
  };
  national: NationalYear[];
}

export interface ShortLetsArea {
  code: string;
  name: string;
  registrations: number;
  classic_dwellings: number;
  per_100_dwellings: number;
}

export interface ShortLetsFile {
  schema: 'estimador.housing.short-lets/1';
  generated_at: string;
  universe: string;
  sources: HousingSource[];
  caveats: string[];
  snapshot: string;
  census_year: number;
  municipality: ShortLetsArea;
  parishes: ShortLetsArea[];
}

function readHousing<T>(file: string, schema: string): T | null {
  const full = path.join(process.cwd(), 'public/data/housing', file);
  let value: { schema?: string } | null = null;
  try {
    value = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (error) {
    // Once the page is published a missing or broken file must fail the build, never ship a 404.
    if (HOUSING_PUBLISHED) throw new Error(`housing: cannot read ${file}: ${String(error)}`);
    console.warn(`housing: ${file} missing or unreadable; /habitacao renders a 404 while unpublished`);
    return null;
  }
  if (value?.schema === schema) return value as T;
  if (HOUSING_PUBLISHED) throw new Error(`housing: ${file} is not ${schema}`);
  console.warn(`housing: ${file} is not ${schema}`);
  return null;
}

/** Ten-thousand ceiling over every value, so a resync never draws outside the frame. */
export function niceCeiling(values: number[], step = 10000): number {
  const top = Math.max(0, ...values);
  return Math.max(step, Math.ceil((top * 1.1) / step) * step);
}

/** The licensing file, its years in order (the charts and yearsOverTwoYears read them in order). */
export function loadHousingLicensing(): LicensingFile | null {
  const file = readHousing<LicensingFile>('licensing.json', 'estimador.housing.licensing/1');
  if (!file) return null;
  return {
    ...file,
    lisbon: { ...file.lisbon, by_alvara_year: [...file.lisbon.by_alvara_year].sort((a, b) => a.year - b.year) },
    national: [...file.national].sort((a, b) => a.year - b.year),
  };
}

/** The short-lets file, parishes from the highest ratio down (the finding names the first). */
export function loadHousingShortLets(): ShortLetsFile | null {
  const file = readHousing<ShortLetsFile>('short-lets-lisbon.json', 'estimador.housing.short-lets/1');
  if (!file) return null;
  return { ...file, parishes: [...file.parishes].sort((a, b) => b.per_100_dwellings - a.per_100_dwellings || a.name.localeCompare(b.name, 'pt')) };
}

/** Two years, the line the Lisbon finding is stated against. */
export const TWO_YEARS_DAYS = 730;

/**
 * The run of latest years whose new-build median passes two years, partial year
 * included (the chart and its note mark it). Empty when the latest year does not.
 */
export function yearsOverTwoYears(years: LicenceYear[]): LicenceYear[] {
  const run: LicenceYear[] = [];
  for (const y of [...years].reverse()) {
    if (y.new_build.median_days === null || y.new_build.median_days <= TWO_YEARS_DAYS) break;
    run.unshift(y);
  }
  return run;
}

/** Lisbon's short-let ratio thresholds (RMAL, 2.ª alteração, in force 6 Dec 2025). */
export const RMAL_THRESHOLDS = { relative: 5, absolute: 10 } as const;

/** "2 de novembro de 2026" / "2 November 2026": a full, absolute date. */
export function housingDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

/** One decimal in the locale's mark ("40,8" / "40.8"). */
export const oneDecimal = (value: number, locale: string) =>
  value.toLocaleString(locale === 'en' ? 'en-GB' : 'pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
