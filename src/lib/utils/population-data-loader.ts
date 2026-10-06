/**
 * Build-time loaders for the synthetic population (server components only).
 * They read the compact files scripts/sync-population.py writes and return
 * null when a file is missing, so a page can render an honest unavailable
 * state; a fixture or unknown contract fails the production build instead.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import { assertPublishable } from '@/lib/population/contract';
import type {
  NationalRecord,
  ParishRecord,
  PopulationMeta,
  PopulationPlaces,
  PopulationReleaseInfo,
  PopulationScorecard,
} from '@/types/population';

async function read<T>(file: string): Promise<T | null> {
  try {
    const text = await fs.readFile(path.join(process.cwd(), 'public', 'data', POPULATION_DATA_DIR, file), 'utf8');
    return JSON.parse(text) as T;
  } catch (error) {
    console.error(`population data unavailable: ${file}`, error);
    return null;
  }
}

export async function loadPopulationMeta(): Promise<PopulationMeta | null> {
  const meta = await read<PopulationMeta>('meta.json');
  if (meta) assertPublishable(meta);
  return meta;
}

export const loadPopulationPlaces = () => read<PopulationPlaces>('places.json');
export const loadPopulationNational = () => read<NationalRecord>('national.json');
export const loadPopulationScorecard = () => read<PopulationScorecard>('scorecard.json');
export const loadPopulationRelease = () => read<PopulationReleaseInfo>('release.json');
export const loadParishRecord = (code: string) => read<ParishRecord>(`parish/${code}.json`);
