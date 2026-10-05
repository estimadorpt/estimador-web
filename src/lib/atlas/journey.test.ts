import { describe, expect, it } from 'vitest';
import { MUNICIPALITIES } from './geography';
import { cameraPlace, closeExample, exampleRegion, initialJourney, journeyParams, openExample, readExample, scopeToExample, setScope, type Scope } from './journey';

const portugal: Scope = { region: 'Portugal', municipality: '', parish: '' };
const aveiroTown = MUNICIPALITIES.find(m => m.region === 'Aveiro')!;
const aguadaDeCima = aveiroTown.parishes[0].code;

describe('atlas journey: scope versus camera', () => {
  it('opening an example never changes the analysis scope', () => {
    const distribution = { ...initialJourney(portugal, 'distribution'), scope: portugal };
    const withExample = openExample(distribution, { municipality: aveiroTown.code, parish: aguadaDeCima, house: 19, person: 61 });
    expect(withExample.scope).toEqual(portugal); // still the national question
    expect(withExample.mode).toBe('map'); // camera enters the map to show the household
    expect(cameraPlace(withExample)).toEqual({ region: 'Aveiro', municipality: aveiroTown.code, parish: aguadaDeCima });
  });

  it('closing the example restores the exact prior question and mode', () => {
    const distribution = initialJourney(portugal, 'distribution');
    const withExample = openExample(distribution, { municipality: aveiroTown.code, parish: aguadaDeCima, house: 19, person: 61 });
    expect(closeExample(withExample)).toEqual(distribution);
  });

  it('opening a second example while one is open still restores the original mode', () => {
    const compare = initialJourney(portugal, 'compare');
    const first = openExample(compare, { municipality: aveiroTown.code, parish: aguadaDeCima, house: 1, person: 2 });
    const second = openExample(first, { municipality: aveiroTown.code, parish: aguadaDeCima, house: 3, person: 4 });
    expect(second.priorMode).toBe('compare');
    expect(closeExample(second).mode).toBe('compare');
  });

  it('an explicit place action changes scope and drops any open example', () => {
    const withExample = openExample(initialJourney(portugal, 'distribution'), { municipality: aveiroTown.code, parish: aguadaDeCima, house: 19, person: 61 });
    const next = setScope(withExample, { region: 'Aveiro', municipality: aveiroTown.code, parish: '' }, 'map');
    expect(next.example).toBeNull();
    expect(next.scope.region).toBe('Aveiro');
  });

  it('"analisar só X" promotes the open example\'s place to the scope', () => {
    const withExample = openExample(initialJourney(portugal, 'distribution'), { municipality: aveiroTown.code, parish: aguadaDeCima, house: 19, person: 61 });
    const promoted = scopeToExample(withExample);
    expect(promoted.scope).toEqual({ region: 'Aveiro', municipality: aveiroTown.code, parish: aguadaDeCima });
    expect(promoted.example).toBeNull();
  });

  it('camera mirrors the scope when no example is open', () => {
    const state = setScope(initialJourney(portugal, 'map'), { region: 'Aveiro', municipality: aveiroTown.code, parish: aguadaDeCima }, 'map');
    expect(cameraPlace(state)).toEqual(state.scope);
  });

  it('derives an example\'s region from its municipality', () => {
    expect(exampleRegion({ municipality: aveiroTown.code, parish: aguadaDeCima, house: 0, person: 0 })).toBe('Aveiro');
  });
});

describe('atlas journey: URL round trip', () => {
  it('encodes and reads back an open example, including the mode to restore', () => {
    const withExample = openExample(initialJourney(portugal, 'distribution'), { municipality: aveiroTown.code, parish: aguadaDeCima, house: 19, person: 61 });
    const params = new URLSearchParams(journeyParams(withExample));
    const read = readExample(params, portugal);
    expect(read.example).toEqual({ municipality: aveiroTown.code, parish: aguadaDeCima, house: 19, person: 61 });
    expect(read.priorMode).toBe('distribution');
  });

  it('omits example params entirely when none is open', () => {
    expect(journeyParams(initialJourney(portugal, 'map'))).toEqual({});
  });

  it('ignores a home id whose municipality does not exist', () => {
    const read = readExample(new URLSearchParams('home=19&exampleMunicipality=0000'), portugal);
    expect(read.example).toBeNull();
  });

  it('falls back to the scope\'s own place when the example omits municipality/parish', () => {
    const scoped: Scope = { region: 'Aveiro', municipality: aveiroTown.code, parish: aguadaDeCima };
    const read = readExample(new URLSearchParams('home=3'), scoped);
    expect(read.example).toEqual({ municipality: aveiroTown.code, parish: aguadaDeCima, house: 3, person: -1 });
  });
});
