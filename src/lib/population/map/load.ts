/**
 * Browser fetch of the map's geometry, one file per level, projected once and
 * kept for the page's lifetime (switching back to a region costs nothing).
 */
import type { FeatureCollection, Geometry } from 'geojson';
import { regionOfCode } from '@/lib/population/places';
import { shapesOf, type MapShape, type ShapeOptions } from './geometry';
import { GEOGRAPHY_PATH } from './levels';

type Collection = FeatureCollection<Geometry, { code: string; name: string }>;

const cache = new Map<string, Promise<MapShape[]>>();

/** Region of a feature in a given file: the country file's codes are region ids; municipality files are per region; parish codes carry their district. */
export function regionForFile(url: string): (code: string) => string {
  if (url.endsWith('/country.json')) return code => code;
  const municipal = url.match(/\/municipalities\/([^/]+)\.json$/);
  if (municipal) return () => municipal[1];
  return code => regionOfCode(code);
}

/**
 * The country file is drawn behind every level and never closer than a
 * region's framing, so its slivers and rocks under about 0.1 km² go (they halve
 * its vertices). Municipality and parish files are drawn as they are.
 */
export function shapeOptionsForFile(url: string): ShapeOptions {
  return url.endsWith('/country.json') ? { minRingArea: 1.5 } : {};
}

export function loadShapes(url: string): Promise<MapShape[]> {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`${response.status} ${url}`);
        return response.json() as Promise<Collection>;
      })
      .then(data => {
        if (data?.type !== 'FeatureCollection') throw new Error(`Not a FeatureCollection: ${url}`);
        return shapesOf(data, regionForFile(url), shapeOptionsForFile(url));
      });
    pending.catch(() => cache.delete(url));
    cache.set(url, pending);
  }
  return pending;
}

export { GEOGRAPHY_PATH };
