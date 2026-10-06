'use client';
/**
 * Browser-side fetches of the compact population files. Each file is fetched
 * once per page load; the versioned path means the CDN may cache it forever.
 */
import { POPULATION_DATA_PATH } from '@/lib/config/population';
import type { GameEntry, GameIndex, ParishRecord, PopulationMeta, PopulationPlaces } from '@/types/population';

const cache = new Map<string, Promise<unknown>>();

/** Requests started by the parish shell's inline script, before hydration (`parishPrefetchScript` in prefetch.ts). */
declare global {
  interface Window { __populationPrefetch?: Record<string, Promise<Response>> }
}

/** A request the page's inline script already started for this URL, taken once. */
function prefetched(url: string): Promise<Response> | null {
  if (typeof window === 'undefined') return null;
  const started = window.__populationPrefetch?.[url];
  if (!started) return null;
  delete window.__populationPrefetch![url];
  return started;
}

export function fetchPopulationFile<T>(file: string, signal?: AbortSignal): Promise<T> {
  const url = `${POPULATION_DATA_PATH}/${file}`;
  let pending = cache.get(url) as Promise<T> | undefined;
  if (!pending) {
    pending = (prefetched(url) ?? fetch(url, { signal })).then(response => {
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return response.json() as Promise<T>;
    });
    pending.catch(() => cache.delete(url));
    cache.set(url, pending);
  }
  return pending;
}

export const fetchMeta = () => fetchPopulationFile<PopulationMeta>('meta.json');
export const fetchPlaces = () => fetchPopulationFile<PopulationPlaces>('places.json');
export const fetchParish = (code: string) => fetchPopulationFile<ParishRecord>(`parish/${code}.json`);
export const fetchGameIndex = () => fetchPopulationFile<GameIndex>('game/index.json');
export const fetchGameChunk = (chunk: number) =>
  fetchPopulationFile<GameEntry[]>(`game/chunk-${String(chunk).padStart(3, '0')}.json`);
export const fetchQueryLookup = (bucket: string) =>
  fetchPopulationFile<Record<string, [code: string, recipe: string]>>(`q/${bucket}.json`);
