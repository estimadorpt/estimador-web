/**
 * Geometry for the parish map: one plane for the whole country.
 *
 * Coordinates are Web Mercator at a fixed scale (the mainland is about 1,170
 * units wide), so a shape's path is computed once, whatever the camera does.
 * The two autonomous regions are drawn as insets beside the mainland: every
 * point of the Azores and of Madeira goes through an affine move (and, for the
 * Azores, a reduction) into its box, at every level, so a region, its
 * municípios and its parishes always line up.
 *
 * The CAOP 2021 boundaries come from public/data/population-geography (DGT,
 * CC BY 4.0); nothing here changes them beyond projection and rounding.
 */
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';

export type Point = [number, number];
export type Bounds = [Point, Point];

const SCALE = 20000;
const RAD = Math.PI / 180;

/** Plain Web Mercator in map units (y grows southwards, as on screen). */
export function mercator(lon: number, lat: number): Point {
  return [SCALE * lon * RAD, -SCALE * Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))];
}

function boxOf(lonLat: [number, number, number, number]): Bounds {
  const [west, south, east, north] = lonLat;
  const a = mercator(west, south);
  const b = mercator(east, north);
  return [[a[0], b[1]], [b[0], a[1]]];
}

/** Mainland Portugal, and the parts of the archipelagos an inset frames (the Selvagens are left to the edge of Madeira's). */
const MAINLAND = boxOf([-9.53, 36.96, -6.19, 42.16]);
const AZORES_SOURCE = boxOf([-31.27, 36.93, -25.01, 39.73]);
const MADEIRA_SOURCE = boxOf([-17.27, 32.40, -16.27, 33.13]);

export interface Inset {
  region: 'azores' | 'madeira';
  scale: number;
  source: Bounds;
  /** Where the inset sits in the map plane. */
  box: Bounds;
}

function placeInset(region: Inset['region'], source: Bounds, scale: number, right: number, top: number): Inset {
  const width = (source[1][0] - source[0][0]) * scale;
  const height = (source[1][1] - source[0][1]) * scale;
  return { region, scale, source, box: [[right - width, top], [right, top + height]] };
}

const MAINLAND_WIDTH = MAINLAND[1][0] - MAINLAND[0][0];
const MAINLAND_HEIGHT = MAINLAND[1][1] - MAINLAND[0][1];
const GAP = MAINLAND_WIDTH * 0.08;

/**
 * The Azores at a little under half the mainland's scale, to the west and a
 * third of the way down; Madeira at the mainland's own scale, to the
 * south-west, level with the Algarve.
 */
export const INSETS: Record<Inset['region'], Inset> = {
  azores: placeInset('azores', AZORES_SOURCE, 0.42, MAINLAND[0][0] - GAP, MAINLAND[0][1] + MAINLAND_HEIGHT * 0.28),
  madeira: placeInset('madeira', MADEIRA_SOURCE, 1, MAINLAND[0][0] - GAP - MAINLAND_WIDTH * 0.12, MAINLAND[1][1] - MAINLAND_HEIGHT * 0.2),
};

/** Project a longitude/latitude into the map plane, through the region's inset if it has one. */
export function project(lon: number, lat: number, region: string): Point {
  const point = mercator(lon, lat);
  const inset = region === 'azores' || region === 'madeira' ? INSETS[region] : null;
  if (!inset) return point;
  const [[sx0, sy0], [sx1, sy1]] = inset.source;
  const [[bx0, by0], [bx1, by1]] = inset.box;
  return [
    (bx0 + bx1) / 2 + (point[0] - (sx0 + sx1) / 2) * inset.scale,
    (by0 + by1) / 2 + (point[1] - (sy0 + sy1) / 2) * inset.scale,
  ];
}

export function unionBounds(list: Bounds[]): Bounds | null {
  if (!list.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [[a, b], [c, d]] of list) {
    x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c); y1 = Math.max(y1, d);
  }
  return [[x0, y0], [x1, y1]];
}

function ringBounds(ring: Point[]): Bounds {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [[x0, y0], [x1, y1]];
}

/** Signed shoelace area and centroid of a closed ring. */
function ringAreaCentroid(ring: Point[]): { area: number; centroid: Point } {
  let twice = 0, cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const cross = xj * yi - xi * yj;
    twice += cross;
    cx += (xj + xi) * cross;
    cy += (yj + yi) * cross;
  }
  if (Math.abs(twice) < 1e-12) {
    const [[x0, y0], [x1, y1]] = ringBounds(ring);
    return { area: 0, centroid: [(x0 + x1) / 2, (y0 + y1) / 2] };
  }
  return { area: Math.abs(twice / 2), centroid: [cx / (3 * twice), cy / (3 * twice)] };
}

function boundsGap(a: Bounds, b: Bounds): number {
  const dx = Math.max(0, a[0][0] - b[1][0], b[0][0] - a[1][0]);
  const dy = Math.max(0, a[0][1] - b[1][1], b[0][1] - a[1][1]);
  return Math.hypot(dx, dy);
}

const diagonal = ([[x0, y0], [x1, y1]]: Bounds) => Math.hypot(x1 - x0, y1 - y0);

export interface Piece {
  area: number;
  bounds: Bounds;
  centroid: Point;
}

/**
 * The extent a camera should frame for a shape: its pieces, largest first,
 * dropping only small pieces (under 5% of the area) that lie far from the
 * rest — the Selvagens, 280 km south of Funchal, but not Corvo beside Flores
 * nor the Berlengas off Peniche.
 */
export function mainBounds(pieces: Piece[]): Bounds | null {
  if (!pieces.length) return null;
  const sorted = [...pieces].sort((a, b) => b.area - a.area);
  const total = sorted.reduce((sum, piece) => sum + piece.area, 0);
  let accepted = sorted[0].bounds;
  const rejected: Piece[] = [];
  for (const piece of sorted.slice(1)) {
    if (total > 0 && piece.area / total >= 0.05) accepted = unionBounds([accepted, piece.bounds])!;
    else rejected.push(piece);
  }
  // Small pieces join if they sit near what is already framed; one pass in
  // size order, so a chain of islets does not drag the frame out to sea.
  for (const piece of rejected) {
    if (boundsGap(piece.bounds, accepted) <= diagonal(accepted) * 1.5) accepted = unionBounds([accepted, piece.bounds])!;
  }
  return accepted;
}

export interface MapShape {
  code: string;
  name: string;
  /** Region id ("01"…"18", "azores", "madeira"). */
  region: string;
  /** SVG path in map units. */
  d: string;
  bounds: Bounds;
  /** What a camera frames for this shape (see mainBounds). */
  fit: Bounds;
  /** Where a label goes: the centroid of the largest piece (parishes use the INE interior point instead). */
  label: Point;
}

const round = (value: number) => Math.round(value * 100) / 100;

function polygonsOf(geometry: Geometry): Position[][][] {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  if (geometry.type === 'GeometryCollection') return geometry.geometries.flatMap(polygonsOf);
  return [];
}

export interface ShapeOptions {
  /**
   * Rings (pieces or holes) smaller than this, in square map units, are left
   * out. The country file is a dissolve of the parishes and carries thousands
   * of sliver holes and sub-pixel rocks that would speckle the regions; about
   * 16.5 units² make a km² on the mainland.
   */
  minRingArea?: number;
}

/** Project one CAOP feature into a drawable shape. */
export function shapeOf(feature: Feature<Geometry, { code: string; name: string }>, region: string, options: ShapeOptions = {}): MapShape {
  const shape = drawShape(feature, region, options.minRingArea ?? 0);
  // Never filter a shape away entirely.
  return shape ?? drawShape(feature, region, 0)!;
}

function drawShape(feature: Feature<Geometry, { code: string; name: string }>, region: string, minRingArea: number): MapShape | null {
  const parts: string[] = [];
  const pieces: Piece[] = [];
  for (const polygon of polygonsOf(feature.geometry)) {
    let skipHoles = false;
    polygon.forEach((ring, index) => {
      if (index > 0 && skipHoles) return;
      const projected: Point[] = [];
      let path = '';
      let previous = '';
      for (const position of ring) {
        const [x, y] = project(position[0], position[1], region);
        const key = `${round(x)} ${round(y)}`;
        if (key === previous) continue;
        previous = key;
        projected.push([x, y]);
        path += `${path ? 'L' : 'M'}${key}`;
      }
      if (projected.length < 3) { if (index === 0) skipHoles = true; return; }
      const { area, centroid } = ringAreaCentroid(projected);
      if (area < minRingArea) { if (index === 0) skipHoles = true; return; }
      parts.push(`${path}Z`);
      if (index === 0) pieces.push({ area, centroid, bounds: ringBounds(projected) });
    });
  }
  if (!pieces.length) return null;
  const bounds = unionBounds(pieces.map(piece => piece.bounds)) ?? [[0, 0], [0, 0]];
  const largest = pieces.reduce<Piece | null>((best, piece) => (!best || piece.area > best.area ? piece : best), null);
  return {
    code: feature.properties.code,
    name: feature.properties.name,
    region,
    d: parts.join(''),
    bounds,
    fit: mainBounds(pieces) ?? bounds,
    label: largest?.centroid ?? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
  };
}

export function shapesOf(collection: FeatureCollection<Geometry, { code: string; name: string }>, regionFor: (code: string) => string, options: ShapeOptions = {}): MapShape[] {
  return collection.features.map(feature => shapeOf(feature, regionFor(feature.properties.code), options));
}

/** The plane the country view frames: mainland plus both insets. */
export function countryBounds(shapes: MapShape[]): Bounds | null {
  return unionBounds(shapes.map(shape => shape.fit));
}

/** An inset's frame, a little larger than its box. */
export function insetFrame(region: Inset['region']): Bounds {
  const [[x0, y0], [x1, y1]] = INSETS[region].box;
  const pad = MAINLAND_WIDTH * 0.035;
  return [[x0 - pad, y0 - pad], [x1 + pad, y1 + pad]];
}
