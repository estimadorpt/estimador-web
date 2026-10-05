import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { FeatureCollection, Geometry } from 'geojson';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { PopulationPlaces } from '@/types/population';
import { fitCamera, flightDuration, toScreen, zoomCamera, clampZoom, sameCamera } from './camera';
import { countryBounds, INSETS, mainBounds, mercator, project, shapesOf, unionBounds, type Bounds } from './geometry';
import {
  breadcrumb, byName, COUNTRY, geometryFiles, municipalityOfParish, parentView, REGION_IDS, REGION_NAMES, regionOfMunicipality,
  resolveInitialView, sameView, shortParishName, viewOfParish,
} from './levels';
import { placeLabels, textWidth } from './placement';
import { regionForFile, shapeOptionsForFile } from './load';

const GEO = path.resolve(import.meta.dirname, '../../../../public/data/population-geography');
const PLACES = path.resolve(import.meta.dirname, '../../../../public/data', POPULATION_DATA_DIR, 'places.json');
const read = <T,>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
type Collection = FeatureCollection<Geometry, { code: string; name: string }>;

const inside = (point: [number, number], [[x0, y0], [x1, y1]]: Bounds) => point[0] >= x0 && point[0] <= x1 && point[1] >= y0 && point[1] <= y1;
const overlaps = (a: Bounds, b: Bounds) => a[0][0] < b[1][0] && a[1][0] > b[0][0] && a[0][1] < b[1][1] && a[1][1] > b[0][1];

describe('parish → município → region', () => {
  it.each([
    ['0302FA', '0302', '03'],
    ['030201', '0302', '03'],
    ['010101', '0101', '01'],
    ['180101', '1801', '18'],
    ['410101', '4101', 'azores'],
    ['490101', '4901', 'azores'],
    ['310310', '3103', 'madeira'],
    ['320101', '3201', 'madeira'],
  ])('%s sits in município %s, region %s', (code, municipality, region) => {
    expect(municipalityOfParish(code)).toBe(municipality);
    expect(regionOfMunicipality(municipality)).toBe(region);
    expect(viewOfParish(code)).toEqual({ level: 'municipality', region, municipality });
  });

  it('every published parish resolves to geometry files that exist and contain it', () => {
    const places = read<PopulationPlaces>(PLACES);
    const regionOf = new Map(places.municipalities.map(([code, , region]) => [code, region]));
    const byFile = new Map<string, Set<string>>();
    for (const [code, , municipality] of places.parishes) {
      const view = viewOfParish(code);
      expect(view.level).toBe('municipality');
      if (view.level !== 'municipality') continue;
      expect(view.municipality).toBe(municipality);
      expect(view.region).toBe(regionOf.get(municipality));
      const file = geometryFiles(view)[2].replace('/data/population-geography', GEO);
      if (!byFile.has(file)) {
        expect(existsSync(file)).toBe(true);
        byFile.set(file, new Set(read<Collection>(file).features.map(f => f.properties.code)));
      }
      expect(byFile.get(file)!.has(code)).toBe(true);
    }
    expect(places.parishes.length).toBe(3092);
  });

  it('knows the twenty regions by the names places.json uses', () => {
    const places = read<PopulationPlaces>(PLACES);
    expect(Object.fromEntries(places.regions)).toEqual(REGION_NAMES);
    expect([...REGION_IDS].sort()).toEqual(places.regions.map(([id]) => id).sort());
  });
});

describe('level resolution', () => {
  it('opens on a focused parish first, then a region, then the country', () => {
    expect(resolveInitialView({ focusParish: '0302fa', initialRegion: '01' })).toEqual({ level: 'municipality', region: '03', municipality: '0302' });
    expect(resolveInitialView({ focusParish: 'nope', initialRegion: 'azores' })).toEqual({ level: 'region', region: 'azores' });
    expect(resolveInitialView({ initialRegion: '19' })).toEqual(COUNTRY);
    expect(resolveInitialView({ focusParish: '990101' })).toEqual(COUNTRY);
    expect(resolveInitialView({})).toEqual(COUNTRY);
  });

  it('steps up one level at a time and names the way back', () => {
    const view = { level: 'municipality', region: '01', municipality: '0101' } as const;
    expect(parentView(view)).toEqual({ level: 'region', region: '01' });
    expect(parentView({ level: 'region', region: '01' })).toEqual(COUNTRY);
    expect(parentView(COUNTRY)).toBeNull();
    const crumbs = breadcrumb(view, { region: () => undefined, municipality: code => (code === '0101' ? 'Águeda' : undefined) });
    expect(crumbs.map(c => c.label)).toEqual(['Portugal', 'Aveiro', 'Águeda']);
    expect(sameView(crumbs[1].view, { level: 'region', region: '01' })).toBe(true);
    expect(sameView(view, { level: 'municipality', region: '01', municipality: '0102' })).toBe(false);
  });

  it('loads geometry coarsest first, one file per level', () => {
    expect(geometryFiles(COUNTRY)).toEqual(['/data/population-geography/country.json']);
    expect(geometryFiles({ level: 'municipality', region: 'madeira', municipality: '3103' })).toEqual([
      '/data/population-geography/country.json',
      '/data/population-geography/municipalities/madeira.json',
      '/data/population-geography/parishes/3103.json',
    ]);
    expect(regionForFile('/x/country.json')('azores')).toBe('azores');
    expect(regionForFile('/x/municipalities/madeira.json')('3103')).toBe('madeira');
    expect(regionForFile('/x/parishes/4901.json')('490101')).toBe('azores');
  });

  it('orders lists alphabetically in Portuguese and shortens union names for labels', () => {
    expect(byName([{ n: 'Évora' }, { n: 'Faro' }, { n: 'Aveiro' }, { n: 'Açores' }], x => x.n).map(x => x.n)).toEqual(['Açores', 'Aveiro', 'Évora', 'Faro']);
    expect(shortParishName('União das freguesias de Negreiros e Chavão')).toBe('Negreiros e Chavão');
    expect(shortParishName('Aborim')).toBe('Aborim');
  });
});

describe('camera', () => {
  const viewports = [{ width: 390, height: 421 }, { width: 1280, height: 560 }, { width: 900, height: 560 }];
  const extents: Bounds[] = [[[-3400, -16300], [-2100, -13900]], [[10, 20], [50, 800]], [[1, 1], [1.001, 1.001]]];

  it.each(viewports)('frames an extent inside a $width×$height map with its padding', viewport => {
    for (const bounds of extents) {
      const camera = fitCamera(bounds, viewport, 24);
      for (const corner of bounds) {
        const [x, y] = toScreen(corner, camera, viewport);
        expect(x).toBeGreaterThanOrEqual(24 - 1e-6);
        expect(x).toBeLessThanOrEqual(viewport.width - 24 + 1e-6);
        expect(y).toBeGreaterThanOrEqual(24 - 1e-6);
        expect(y).toBeLessThanOrEqual(viewport.height - 24 + 1e-6);
      }
    }
  });

  it('keeps every flight between 300 and 900 ms', () => {
    const viewport = { width: 1280, height: 560 };
    const country = { x: -3000, y: -15000, k: 0.2 };
    const parish = { x: -2900, y: -14800, k: 60 };
    const near = { x: -2905, y: -14800, k: 50 };
    expect(flightDuration(country, parish, viewport)).toBeLessThanOrEqual(900);
    expect(flightDuration(parish, near, viewport)).toBeGreaterThanOrEqual(300);
    expect(flightDuration(country, parish, viewport)).toBe(flightDuration(parish, country, viewport));
  });

  it('zooms about the pointer and never past the level’s framing', () => {
    const viewport = { width: 800, height: 500 };
    const camera = { x: 0, y: 0, k: 1 };
    const anchor: [number, number] = [600, 100];
    const zoomed = zoomCamera(camera, 2, viewport, anchor);
    const before = [camera.x + (anchor[0] - 400) / camera.k, camera.y + (anchor[1] - 250) / camera.k];
    expect(toScreen(before as [number, number], zoomed, viewport)[0]).toBeCloseTo(anchor[0]);
    expect(toScreen(before as [number, number], zoomed, viewport)[1]).toBeCloseTo(anchor[1]);
    expect(clampZoom({ ...camera, k: 0.5 }, camera).k).toBe(1);
    expect(clampZoom({ ...camera, k: 50 }, camera, 10).k).toBe(10);
    expect(sameCamera(camera, { x: 0.0001, y: 0, k: 1 })).toBe(true);
  });
});

describe('the plane and its insets', () => {
  const mainland: Bounds = [mercator(-9.53, 42.16), mercator(-6.19, 36.96)];

  it('leaves the mainland where Mercator puts it', () => {
    expect(project(-8.6, 41.15, '13')).toEqual(mercator(-8.6, 41.15));
  });

  it('moves the archipelagos into boxes west of the mainland that do not overlap it or each other', () => {
    expect(overlaps(INSETS.azores.box, mainland)).toBe(false);
    expect(overlaps(INSETS.madeira.box, mainland)).toBe(false);
    expect(overlaps(INSETS.azores.box, INSETS.madeira.box)).toBe(false);
    for (const [lon, lat] of [[-31.11, 39.7], [-25.1, 36.97], [-25.67, 37.75], [-28.0, 38.6]]) expect(inside(project(lon, lat, 'azores'), INSETS.azores.box)).toBe(true);
    for (const [lon, lat] of [[-16.92, 32.65], [-16.34, 33.07], [-17.2, 32.8]]) expect(inside(project(lon, lat, 'madeira'), INSETS.madeira.box)).toBe(true);
  });

  it('frames the archipelagos without the far islets, but keeps Corvo', () => {
    const country = shapesOf(read<Collection>(path.join(GEO, 'country.json')), code => code, shapeOptionsForFile('/x/country.json'));
    expect(country).toHaveLength(20);
    const azores = country.find(s => s.code === 'azores')!;
    const madeira = country.find(s => s.code === 'madeira')!;
    expect(inside(project(-31.11, 39.7, 'azores'), azores.fit)).toBe(true);
    expect(inside(project(-15.86, 30.14, 'madeira'), madeira.bounds)).toBe(true);
    expect(inside(project(-15.86, 30.14, 'madeira'), madeira.fit)).toBe(false);
    const whole = countryBounds(country)!;
    for (const box of [INSETS.azores.box, INSETS.madeira.box]) {
      const grown = unionBounds([whole, box])!;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) expect(Math.abs(grown[i][j] - whole[i][j])).toBeLessThan(1);
    }
    // The mainland's own extent sets the other three sides.
    expect(whole[1][0]).toBeCloseTo(mainland[1][0], -1);
    expect(whole[0][1]).toBeCloseTo(mainland[0][1], -1);
    expect(whole[1][1]).toBeCloseTo(mainland[1][1], -1);
  });

  it('frames Funchal and its Sé without the Selvagens', () => {
    const funchal = shapesOf(read<Collection>(path.join(GEO, 'municipalities/madeira.json')), () => 'madeira').find(s => s.code === '3103')!;
    const span = funchal.fit[1][1] - funchal.fit[0][1];
    expect(span).toBeLessThan((funchal.bounds[1][1] - funchal.bounds[0][1]) / 5);
    const parishes = shapesOf(read<Collection>(path.join(GEO, 'parishes/3103.json')), code => regionOfMunicipality(code));
    expect(parishes.every(p => p.region === 'madeira')).toBe(true);
    for (const parish of parishes) expect(overlaps(parish.fit, funchal.fit) || inside(parish.label, funchal.fit)).toBe(true);
  });

  it('draws the country without the dissolve’s slivers, and nothing else changes', () => {
    const data = read<Collection>(path.join(GEO, 'country.json'));
    const raw = shapesOf(data, code => code);
    const clean = shapesOf(data, code => code, shapeOptionsForFile('/x/country.json'));
    const rings = (list: typeof raw) => list.reduce((n, s) => n + (s.d.match(/Z/g)?.length ?? 0), 0);
    const vertices = (list: typeof raw) => list.reduce((n, s) => n + (s.d.match(/[ML]/g)?.length ?? 0), 0);
    expect(rings(raw)).toBeGreaterThan(3000);
    expect(rings(clean)).toBeLessThan(150);
    expect(vertices(clean)).toBeLessThan(vertices(raw) * 0.6);
    for (const [index, shape] of clean.entries()) {
      expect(shape.code).toBe(raw[index].code);
      // Rocks under 0.1 km² leave the frame by at most a couple of km.
      const span = Math.hypot(raw[index].fit[1][0] - raw[index].fit[0][0], raw[index].fit[1][1] - raw[index].fit[0][1]);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) expect(Math.abs(shape.fit[i][j] - raw[index].fit[i][j])).toBeLessThan(span * 0.02);
    }
    // Corvo and the Selvagens are islands, not slivers.
    expect(inside(project(-31.11, 39.7, 'azores'), clean.find(s => s.code === 'azores')!.bounds)).toBe(true);
    expect(inside(project(-15.86, 30.14, 'madeira'), clean.find(s => s.code === 'madeira')!.bounds)).toBe(true);
    // Municipality and parish files are drawn as they are.
    expect(shapeOptionsForFile('/x/municipalities/01.json')).toEqual({});
    expect(shapeOptionsForFile('/x/parishes/0101.json')).toEqual({});
  });

  it('never filters a shape away entirely', () => {
    const tiny: Collection = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { code: 'x', name: 'X' }, geometry: { type: 'Polygon', coordinates: [[[-8, 40], [-7.9999, 40], [-7.9999, 40.0001], [-8, 40]]] } }] };
    const [shape] = shapesOf(tiny, () => '01', { minRingArea: 1e6 });
    expect(shape.d).toMatch(/^M.+Z$/);
  });

  it('drops a small far piece but keeps a small near one', () => {
    const big = { area: 100, bounds: [[0, 0], [10, 10]] as Bounds, centroid: [5, 5] as [number, number] };
    const near = { area: 1, bounds: [[12, 0], [13, 1]] as Bounds, centroid: [12.5, 0.5] as [number, number] };
    const far = { area: 1, bounds: [[200, 200], [201, 201]] as Bounds, centroid: [200.5, 200.5] as [number, number] };
    expect(mainBounds([big, near, far])).toEqual([[0, 0], [13, 10]]);
    expect(mainBounds([far, big])).toEqual([[0, 0], [10, 10]]);
  });

  it('projects every parish file into closed paths of reasonable size', () => {
    const barcelos = shapesOf(read<Collection>(path.join(GEO, 'parishes/0302.json')), code => regionOfMunicipality(code));
    expect(barcelos.length).toBe(61);
    expect(barcelos.find(s => s.code === '0302FA')?.d).toMatch(/^M.+Z$/);
  });
});

describe('labels', () => {
  it('places a name only where it fits and never on top of another', () => {
    const viewport = { width: 600, height: 400 };
    const camera = { x: 0, y: 0, k: 1 };
    const placed = placeLabels([
      { code: 'a', text: 'Castelo Branco', at: [0, 0], bounds: [[-150, -50], [150, 50]] },
      { code: 'b', text: 'Faro', at: [5, 2], bounds: [[-60, -20], [60, 20]] },
      { code: 'c', text: 'Uma freguesia de nome muito comprido', at: [100, 150], bounds: [[90, 140], [110, 160]] },
      { code: 'd', text: 'Beja', at: [-200, -150], bounds: [[-240, -180], [-160, -120]] },
    ], camera, viewport);
    expect(placed.map(p => p.code).sort()).toEqual(['a', 'd']);
    expect(textWidth('Beja')).toBeGreaterThan(20);
  });
});
