import { municipalityFor } from './geography';

/**
 * The analysis scope: the place whose people are counted. Only an explicit
 * place action (a region/municipality/parish choice) may change it.
 */
export type Scope = { region: string; municipality: string; parish: string };
export type Mode = 'map' | 'distribution' | 'compare';

/**
 * One illustrative address the camera is currently showing, drawn from the
 * scope's cohort. It carries its own municipality/parish because a national
 * scope's household can live anywhere in the country.
 */
export type ExampleHouse = { municipality: string; parish: string; house: number; person: number };

export type Journey = { scope: Scope; mode: Mode; example: ExampleHouse | null; priorMode: Mode };

export function initialJourney(scope: Scope, mode: Mode): Journey {
  return { scope, mode, example: null, priorMode: mode };
}

/** The district that owns an example's municipality. */
export function exampleRegion(example: ExampleHouse): string | undefined {
  return municipalityFor(example.municipality)?.region;
}

/**
 * Opening an illustrative household moves the camera only. The scope that
 * produced the cohort answer (its count and denominator) is untouched, so
 * the original question stays visible behind the example. Opening a second
 * example while one is already open keeps the mode to restore on close.
 */
export function openExample(state: Journey, example: ExampleHouse): Journey {
  return { ...state, example, mode: 'map', priorMode: state.example ? state.priorMode : state.mode };
}

/** Closing the example (or zooming past it) restores the question exactly as it was. */
export function closeExample(state: Journey): Journey {
  return state.example ? { ...state, example: null, mode: state.priorMode } : state;
}

/** Only an explicit place action may change what is being counted. */
export function setScope(state: Journey, scope: Partial<Scope>, mode: Mode = state.mode): Journey {
  return { scope: { ...state.scope, ...scope }, mode, example: null, priorMode: mode };
}

/** Switching view (Territory/People/Compare) is an explicit action too: it drops any open example. */
export function changeMode(state: Journey, mode: Mode): Journey {
  return { ...state, mode, example: null, priorMode: mode };
}

/** "Analisar só {place}": promote the open example's address to the analysis scope. */
export function scopeToExample(state: Journey): Journey {
  if (!state.example) return state;
  const region = exampleRegion(state.example);
  if (!region) return state;
  return { scope: { region, municipality: state.example.municipality, parish: state.example.parish }, mode: 'map', example: null, priorMode: 'map' };
}

/** The place the camera/map should render: the open example, or the scope itself. */
export function cameraPlace(state: Journey): Scope {
  if (!state.example) return state.scope;
  return { region: exampleRegion(state.example) ?? state.scope.region, municipality: state.example.municipality, parish: state.example.parish };
}

/** Query params for the open example only; the scope/mode/cohort are encoded elsewhere. */
export function journeyParams(state: Journey): Record<string, string> {
  if (!state.example) return {};
  const params: Record<string, string> = { home: String(state.example.house), exampleMunicipality: state.example.municipality, exampleParish: state.example.parish };
  if (state.example.person >= 0) params.person = String(state.example.person);
  if (state.priorMode !== state.mode) params.qmode = state.priorMode;
  return params;
}

const MODES: Mode[] = ['map', 'distribution', 'compare'];
function parseMode(value: string | null): Mode | null {
  return MODES.includes(value as Mode) ? (value as Mode) : null;
}

/** Reads the open example (if any) from a URL already resolved to a scope. */
export function readExample(query: URLSearchParams, scope: Scope): { example: ExampleHouse | null; priorMode: Mode | null } {
  const house = query.has('home') ? Number(query.get('home')) : NaN;
  if (!Number.isInteger(house)) return { example: null, priorMode: null };
  const municipality = query.get('exampleMunicipality') || scope.municipality;
  if (!municipalityFor(municipality)) return { example: null, priorMode: null };
  const parish = query.get('exampleParish') || scope.parish;
  const person = query.has('person') ? Number(query.get('person')) : NaN;
  return { example: { municipality, parish, house, person: Number.isInteger(person) ? person : -1 }, priorMode: parseMode(query.get('qmode')) };
}
