import { describe, expect, it } from 'vitest';
import { POPULATION_RELEASE } from '@/lib/config/population';
import type { PublicResponseV1 } from '@/types/population';
import { assertPublishable, parsePublicResponse } from './contract';

const context = { releaseVersion: POPULATION_RELEASE, dataVintage: 'INE Censos 2021', dataStatus: 'release' as const };

function response(overrides: Partial<PublicResponseV1> = {}, code = '010103'): PublicResponseV1 {
  return {
    contract_version: '1.0',
    data_status: 'release',
    query: {
      contract_version: '1.0',
      release_version: POPULATION_RELEASE,
      geography: { level: 'freguesia', code, name: 'X' },
      unit: 'person',
      dimensions: ['living_alone'],
      filters: [{ field: 'age_story_band', operator: 'eq', values: ['65_plus'] }],
      measure: 'share',
      normalization: 'grand_total',
    },
    query_id: 'q1_0123456789abcdef0123',
    resolved_geography: { level: 'freguesia', code, name: 'X' },
    quality: { decision: 'publish', requested_tier: 'A', resolved_tier: 'A', reasons: [], fallback_geography: null, minimum_cell: 10 },
    display: { rounding: 'one_decimal_percent', locale: 'pt-PT', suppressed_label: 'Suprimido' },
    cells: [
      { coordinates: { living_alone: 'yes' }, count: null, share: 0.2, display_value: '20.0%', suppressed: false, suppression_reason: null, variation: null },
      { coordinates: { living_alone: 'no' }, count: null, share: null, display_value: 'Suprimido', suppressed: true, suppression_reason: 'cell_below_minimum', variation: null },
    ],
    provenance: {
      data_vintage: 'INE Censos 2021',
      calibration_source: 'INE Censos 2021 constraints',
      record_type: 'synthetic',
      method_version: 'm',
      model_sha256: 'abc',
      pipeline_stages: [],
      fields: { living_alone: 'derived', age_story_band: 'derived' },
    },
    links: {
      canonical_path: `/populacao/v/${POPULATION_RELEASE}/q/q1_0123456789abcdef0123`,
      methodology_path: '/populacao/metodologia',
      quality_path: '/populacao/qualidade',
      download_path: null,
    },
    ...overrides,
  };
}

describe('contract v1 validator', () => {
  it('accepts the Barcelos parishes coded with letters', () => {
    expect(() => parsePublicResponse(response({}, '0302FA'), context)).not.toThrow();
  });

  it('rejects a refusal that carries cells', () => {
    const refused = response({
      quality: { decision: 'refuse', requested_tier: 'B', resolved_tier: null, reasons: ['joint_not_publication_grade'], fallback_geography: null, minimum_cell: 10 },
    });
    expect(() => parsePublicResponse(refused, context)).toThrow(/refused/);
  });

  it('rejects a suppressed cell that leaks its value', () => {
    const leaky = response();
    leaky.cells[1] = { ...leaky.cells[1], share: 0.05 };
    expect(() => parsePublicResponse(leaky, context)).toThrow(/leaks/);
  });

  it('rejects an unknown reason code and a stale canonical path', () => {
    const unknown = response({ quality: { ...response().quality, reasons: ['because'] } });
    expect(() => parsePublicResponse(unknown, context)).toThrow(/reason/);
    const stale = response({ links: { ...response().links, canonical_path: '/populacao/v/0.9/q/x' } });
    expect(() => parsePublicResponse(stale, context)).toThrow(/canonical/);
  });

  it('requires a município fallback to resolve to the município', () => {
    const fallback = response({
      resolved_geography: { level: 'municipio', code: '010100', name: null },
      quality: { decision: 'fallback', requested_tier: 'C', resolved_tier: 'B', reasons: ['joint_not_publication_grade'], fallback_geography: { level: 'municipio', code: '010100', name: null }, minimum_cell: 10 },
    });
    expect(() => parsePublicResponse(fallback, context)).not.toThrow();
    expect(() => parsePublicResponse({ ...fallback, resolved_geography: { level: 'municipio', code: '010200', name: null } }, context)).toThrow(/fallback/);
  });

  it('refuses an unknown contract major version', () => {
    expect(() => assertPublishable({ data_status: 'release', contract_version: '2.0' })).toThrow(/not supported/);
  });
});
