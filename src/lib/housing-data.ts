import fs from 'node:fs';
import path from 'node:path';

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
  try {
    const value = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/housing', file), 'utf8'));
    return value?.schema === schema ? (value as T) : null;
  } catch {
    return null;
  }
}

export const loadHousingLicensing = () => readHousing<LicensingFile>('licensing.json', 'estimador.housing.licensing/1');
export const loadHousingShortLets = () => readHousing<ShortLetsFile>('short-lets-lisbon.json', 'estimador.housing.short-lets/1');

/** Two years, the line the Lisbon finding is stated against. */
export const TWO_YEARS_DAYS = 730;

/** The run of latest whole-or-partial years whose new-build median passes two years. */
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
