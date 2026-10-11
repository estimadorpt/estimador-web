import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR } from '@/lib/config/population';
import type { PopulationPlaces } from '@/types/population';
import { REAL_PARISH } from './copy';

const places = JSON.parse(readFileSync(path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'places.json'), 'utf8')) as PopulationPlaces;

describe('the real parish the explainer ends on', () => {
  it('exists in the release under the name and município the page prints', () => {
    const row = places.parishes.find(p => p[0] === REAL_PARISH.code);
    expect(row?.[1]).toBe(REAL_PARISH.name);
    const municipality = places.municipalities.find(m => m[0] === row?.[2]);
    expect(municipality?.[1]).toBe(REAL_PARISH.municipality);
  });
});
