/**
 * Fail-closed validator for the producer's public contract v1
 * (estimador-microsynthesis src/portugal_synthpop/public_contract.py).
 *
 * Ported from the August `feature/populacao-launch` branch with one fix: a
 * freguesia code is six characters of [0-9A-Z], not six digits — Barcelos has
 * eight parishes coded 0302FA…0302FH, and the old regex rejected the whole
 * national bundle because of them.
 *
 * The site never ships the bundle itself. This runs in tests against every
 * response rebuilt from the compact files, which is how CI proves the pages
 * show the approved responses as they are.
 */
import type {
  GeographyLevel,
  PublicBundleV1,
  PublicDataStatus,
  PublicResponseV1,
  PublicSurface,
  QualityTier,
} from '@/types/population';

const DATA_STATUSES = new Set<PublicDataStatus>(['fixture', 'draft', 'release']);
const SURFACES = new Set<PublicSurface>(['story', 'scorecard', 'portrait', 'game', 'tabulator']);
const BACKENDS = new Set(['static_json', 'duckdb_wasm']);
const LEVELS = new Set<GeographyLevel>(['freguesia', 'municipio', 'national']);
const TIERS = new Set<QualityTier>(['A', 'B', 'C', 'suppressed', 'unscored']);
const DECISIONS = new Set(['publish', 'fallback', 'refuse']);
export const REASON_CODES = new Set([
  'population_below_500',
  'eval_incomplete',
  'joint_not_publication_grade',
  'cell_below_minimum',
  'field_unvalidated',
  'use_municipio_or_wait_for_v1_1',
]);
const PROVENANCE_CLASSES = new Set(['census_calibrated', 'derived', 'modelled', 'carried_forward', 'unvalidated']);
const FIELD = /^[A-Za-z][A-Za-z0-9_]*$/;
/** DICOFRE: six characters; Barcelos uses letters (0302FA…0302FH). */
export const FREGUESIA_CODE = /^[0-9A-Z]{6}$/;
/** A município as the contract writes it: DDCC00. */
export const MUNICIPIO_CODE = /^\d{6}$/;

function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object`);
  return value as Record<string, unknown>;
}

function string(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value) throw new Error(`${name} must be a non-empty string`);
  return value;
}

function strings(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
    throw new Error(`${name} must be a string array`);
  }
  return value;
}

function finite(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${name} must be finite`);
  return value;
}

function nullable(value: unknown): boolean {
  return value === null || value === undefined;
}

function geography(value: unknown, name: string): Record<string, unknown> {
  const geo = record(value, name);
  if (!LEVELS.has(geo.level as GeographyLevel)) throw new Error(`${name}.level is invalid`);
  const code = string(geo.code, `${name}.code`);
  if (geo.level === 'national') {
    if (code !== 'PT') throw new Error(`${name} national code must be PT`);
  } else if (geo.level === 'freguesia') {
    if (!FREGUESIA_CODE.test(code)) throw new Error(`${name} freguesia code is invalid`);
  } else if (!MUNICIPIO_CODE.test(code)) {
    throw new Error(`${name} município code is invalid`);
  }
  return geo;
}

function sameGeography(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  return left.level === right.level && left.code === right.code;
}

function validateQuery(value: unknown, releaseVersion: string): Record<string, unknown> {
  const query = record(value, 'response.query');
  if (query.contract_version !== '1.0') throw new Error('query contract_version must be 1.0');
  if (query.release_version !== releaseVersion) throw new Error('query release_version mismatch');
  geography(query.geography, 'query.geography');
  if (query.unit !== 'person' && query.unit !== 'household') throw new Error('query.unit is invalid');
  const dimensions = strings(query.dimensions, 'query.dimensions');
  if (
    dimensions.length < 1 ||
    dimensions.length > 3 ||
    new Set(dimensions).size !== dimensions.length ||
    dimensions.some(field => !FIELD.test(field))
  ) {
    throw new Error('query dimensions are invalid');
  }
  if (!Array.isArray(query.filters)) throw new Error('query.filters must be an array');
  const filterFields = new Set<string>();
  for (const filterValue of query.filters) {
    const filter = record(filterValue, 'query filter');
    const field = string(filter.field, 'query filter field');
    if (!FIELD.test(field) || filterFields.has(field)) throw new Error('query filter field is invalid');
    filterFields.add(field);
    if (filter.operator !== 'eq' && filter.operator !== 'in') throw new Error('query filter operator is invalid');
    const values = strings(filter.values, 'query filter values');
    if (!values.length || (filter.operator === 'eq' && values.length !== 1)) {
      throw new Error('query filter values are invalid');
    }
  }
  if (query.measure === 'count') {
    if (query.normalization !== 'none') throw new Error('count query normalization is invalid');
  } else if (query.measure !== 'share' || (query.normalization !== 'grand_total' && query.normalization !== 'row')) {
    throw new Error('share query normalization is invalid');
  }
  return query;
}

function validateVariation(value: unknown, point: number, measure: 'count' | 'share'): void {
  const variation = record(value, 'cell.variation');
  const lower = finite(variation.lower, 'variation.lower');
  const upper = finite(variation.upper, 'variation.upper');
  if (lower > upper || point < lower || point > upper) throw new Error('cell value must be inside its variation range');
  if (measure === 'count' && lower < 0) throw new Error('count variation cannot be negative');
  if (measure === 'share' && (lower < 0 || upper > 1)) throw new Error('share variation must stay in [0, 1]');
  if (variation.type === 'model_run') {
    if (variation.calibrated !== false) throw new Error('model-run variation cannot claim calibration');
    if (typeof variation.runs !== 'number' || !Number.isInteger(variation.runs) || variation.runs < 2) {
      throw new Error('model-run variation must include at least two runs');
    }
  } else if (variation.type === 'calibrated_interval') {
    if (variation.calibrated !== true) throw new Error('calibrated interval must claim calibration');
  } else {
    throw new Error('variation type is invalid');
  }
}

export interface ResponseContext {
  releaseVersion: string;
  dataVintage: string;
  dataStatus: PublicDataStatus;
}

/** Validates one response; throws on the first contract violation. */
export function parsePublicResponse(value: unknown, context: ResponseContext): PublicResponseV1 {
  const response = record(value, 'response');
  if (response.contract_version !== '1.0') throw new Error('response contract_version must be 1.0');
  if (response.data_status !== context.dataStatus) throw new Error('response data_status mismatch');
  const query = validateQuery(response.query, context.releaseVersion);
  const requestedGeography = geography(query.geography, 'query.geography');
  const resolvedGeography = geography(response.resolved_geography, 'response.resolved_geography');
  const provenance = record(response.provenance, 'response.provenance');
  if (provenance.data_vintage !== context.dataVintage) throw new Error('response data_vintage mismatch');
  if (provenance.record_type !== 'synthetic') throw new Error('record_type must be synthetic');
  if (context.dataStatus === 'release' && !provenance.model_sha256) throw new Error('release response must pin model_sha256');
  const queryId = string(response.query_id, 'response.query_id');
  if (!/^q1_[A-Za-z0-9_-]+$/.test(queryId)) throw new Error('response.query_id is invalid');

  const quality = record(response.quality, 'response.quality');
  if (!DECISIONS.has(quality.decision as string)) throw new Error('quality decision is invalid');
  if (!TIERS.has(quality.requested_tier as QualityTier)) throw new Error('requested quality tier is invalid');
  const reasons = strings(quality.reasons, 'quality.reasons');
  if (reasons.some(reason => !REASON_CODES.has(reason))) throw new Error('quality reason is invalid');
  if (typeof quality.minimum_cell !== 'number' || !Number.isInteger(quality.minimum_cell) || quality.minimum_cell < 1) {
    throw new Error('minimum_cell is invalid');
  }
  if (!Array.isArray(response.cells)) throw new Error('response.cells must be an array');
  const cells = response.cells;
  if (quality.decision === 'publish') {
    if (quality.requested_tier === 'suppressed' || quality.requested_tier === 'unscored') {
      throw new Error('suppressed or unscored response cannot publish');
    }
    if (!nullable(quality.fallback_geography) || !sameGeography(requestedGeography, resolvedGeography)) {
      throw new Error('publish geography is inconsistent');
    }
  } else if (quality.decision === 'fallback') {
    const fallback = geography(quality.fallback_geography, 'quality.fallback_geography');
    if (!quality.resolved_tier || !reasons.length || !sameGeography(fallback, resolvedGeography)) {
      throw new Error('fallback decision is incomplete');
    }
  } else {
    if (cells.length) throw new Error('refused response cannot contain cells');
    if (!reasons.length || !nullable(quality.fallback_geography) || !nullable(quality.resolved_tier)) {
      throw new Error('refusal decision is inconsistent');
    }
    if (!sameGeography(requestedGeography, resolvedGeography)) throw new Error('refusal must resolve at requested geography');
  }

  const display = record(response.display, 'response.display');
  const suppressedLabel = string(display.suppressed_label, 'display.suppressed_label');
  const measure = query.measure as 'count' | 'share';
  const allowedRounding =
    measure === 'count' ? new Set(['exact', 'nearest_10', 'nearest_100']) : new Set(['whole_percent', 'one_decimal_percent']);
  if (!allowedRounding.has(display.rounding as string)) throw new Error('display rounding is incompatible with measure');

  const dimensions = query.dimensions as string[];
  const expectedCoordinates = [...dimensions].sort();
  for (const cellValue of cells) {
    const cell = record(cellValue, 'response cell');
    const coordinates = record(cell.coordinates, 'cell.coordinates');
    if (JSON.stringify(Object.keys(coordinates).sort()) !== JSON.stringify(expectedCoordinates)) {
      throw new Error('cell coordinates do not match dimensions');
    }
    if (cell.suppressed === true) {
      if (
        !nullable(cell.count) ||
        !nullable(cell.share) ||
        cell.display_value !== suppressedLabel ||
        typeof cell.suppression_reason !== 'string' ||
        !nullable(cell.variation)
      ) {
        throw new Error('suppressed cell leaks a public value');
      }
      continue;
    }
    let point: number;
    if (measure === 'count') {
      point = finite(cell.count, 'cell.count');
      if (!Number.isInteger(point) || point < 0 || !nullable(cell.share)) throw new Error('count cell is invalid');
    } else {
      point = finite(cell.share, 'cell.share');
      if (point < 0 || point > 1 || !nullable(cell.count)) throw new Error('share cell is invalid');
    }
    string(cell.display_value, 'cell.display_value');
    if (!nullable(cell.variation)) validateVariation(cell.variation, point, measure);
  }

  const fields = record(provenance.fields, 'provenance.fields');
  const queriedFields = new Set(dimensions);
  for (const filterValue of query.filters as unknown[]) {
    queriedFields.add(string(record(filterValue, 'query filter').field, 'query filter field'));
  }
  for (const field of queriedFields) {
    if (!PROVENANCE_CLASSES.has(fields[field] as string)) throw new Error('provenance must classify every public field');
  }

  const links = record(response.links, 'response.links');
  if (links.canonical_path !== `/populacao/v/${context.releaseVersion}/q/${queryId}`) {
    throw new Error('canonical query path is stale');
  }
  return response as unknown as PublicResponseV1;
}

/** Validates a whole bundle (used by tests; the site never loads the bundle). */
export function parsePublicBundle(value: unknown): PublicBundleV1 {
  const bundle = record(value, 'public bundle');
  if (bundle.contract_version !== '1.0') throw new Error('bundle contract_version must be 1.0');
  const releaseVersion = string(bundle.release_version, 'bundle.release_version');
  const dataVintage = string(bundle.data_vintage, 'bundle.data_vintage');
  if (!DATA_STATUSES.has(bundle.data_status as PublicDataStatus)) throw new Error('bundle.data_status is invalid');
  const dataStatus = bundle.data_status as PublicDataStatus;
  const backends = strings(bundle.storage_backends, 'bundle.storage_backends');
  if (!backends.length || backends.some(backend => !BACKENDS.has(backend))) throw new Error('bundle.storage_backends is invalid');
  if (new Set(backends).size !== backends.length) throw new Error('storage backends must be unique');
  if (!Array.isArray(bundle.responses) || !bundle.responses.length) throw new Error('bundle.responses must be non-empty');
  const responses = bundle.responses.map(response => parsePublicResponse(response, { releaseVersion, dataVintage, dataStatus }));
  const responseIds = responses.map(response => response.query_id);
  if (new Set(responseIds).size !== responseIds.length) throw new Error('query IDs must be unique');
  const known = new Set(responseIds);
  if (!Array.isArray(bundle.surfaces)) throw new Error('bundle.surfaces must be an array');
  const seen = new Set<string>();
  for (const bindingValue of bundle.surfaces) {
    const binding = record(bindingValue, 'surface binding');
    if (!SURFACES.has(binding.surface as PublicSurface)) throw new Error('unknown public surface');
    if (seen.has(binding.surface as string)) throw new Error('public surfaces must be unique');
    seen.add(binding.surface as string);
    const ids = strings(binding.query_ids, 'surface query_ids');
    if (!ids.length || new Set(ids).size !== ids.length || ids.some(id => !known.has(id))) {
      throw new Error('surface references an unknown query');
    }
  }
  for (const surface of SURFACES) {
    if (!seen.has(surface)) throw new Error(`bundle is missing ${surface}`);
  }
  return bundle as unknown as PublicBundleV1;
}

/**
 * A production build must never publish fixture or draft data, and must refuse
 * a contract major version it does not know.
 */
export function assertPublishable(meta: { data_status: string; contract_version: string }): void {
  if (!meta.contract_version.startsWith('1.')) {
    throw new Error(`population contract ${meta.contract_version} is not supported by this site (expects 1.x)`);
  }
  if (meta.data_status !== 'release' && process.env.NODE_ENV === 'production') {
    throw new Error(`population data_status "${meta.data_status}" cannot be published`);
  }
}
