import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { POPULATION_DATA_DIR, POPULATION_RELEASE } from '@/lib/config/population';
import { isQueryId, parseCanonicalPath, queryBucket, targetFor } from './resolve';

const ID = 'q1_a003203a0ac9a3446835';
const R = POPULATION_RELEASE;

describe('parseCanonicalPath', () => {
  it('reads the producer canonical path, with or without a trailing slash or locale', () => {
    expect(parseCanonicalPath(`/populacao/v/${R}/q/${ID}`)).toEqual({ release: `${R}`, id: ID });
    expect(parseCanonicalPath(`/populacao/v/${R}/q/${ID}/`)).toEqual({ release: `${R}`, id: ID });
    expect(parseCanonicalPath(`/pt/populacao/v/${R}/q/${ID}`)).toEqual({ release: `${R}`, id: ID });
    expect(parseCanonicalPath(`/populacao/v/v${R}/q/${ID}`)).toEqual({ release: `${R}`, id: ID });
  });

  it('returns null for anything else, including the shell itself', () => {
    expect(parseCanonicalPath('/pt/populacao/consulta/')).toBeNull();
    expect(parseCanonicalPath(`/populacao/v/${R}/`)).toBeNull();
    expect(parseCanonicalPath(`/populacao/v/${R}/q/${ID}/extra`)).toBeNull();
    expect(parseCanonicalPath('/populacao/v/%E0%A4%A/q/x')).toBeNull();
  });

  it('keeps another release so the page can say so', () => {
    expect(parseCanonicalPath(`/populacao/v/0.9.0/q/${ID}`)?.release).toBe('0.9.0');
    // A link shared from the superseded v1.0.0 still parses, so the page can name its release.
    expect(parseCanonicalPath(`/populacao/v/1.0.0/q/${ID}`)?.release).toBe('1.0.0');
  });
});

describe('isQueryId / queryBucket', () => {
  it('accepts only contract-v1 ids', () => {
    expect(isQueryId(ID)).toBe(true);
    expect(isQueryId('q1_A003203A0AC9A3446835')).toBe(false);
    expect(isQueryId('q1_a003')).toBe(false);
    expect(isQueryId('../../meta')).toBe(false);
  });
  it('buckets by the first hex digit, as the sync script writes q/<x>.json', () => {
    expect(queryBucket(ID)).toBe('a');
  });
});

describe('targetFor', () => {
  it('sends a parish response to its card anchor', () => {
    expect(targetFor(['060318', 'education'], 'pt')).toBe('/pt/populacao/freguesia/060318/#escolaridade');
    expect(targetFor(['0302FA', 'elders_alone'], 'en')).toBe('/en/populacao/freguesia/0302FA/#vivem-sozinhas');
  });
  it('sends the national response to the hub age chart', () => {
    expect(targetFor(['PT', 'national_age'], 'pt')).toBe('/pt/populacao/#idade');
  });
  it('drops the anchor for an unknown recipe and refuses a malformed code', () => {
    expect(targetFor(['060318', 'something_else'], 'pt')).toBe('/pt/populacao/freguesia/060318/');
    expect(targetFor(['../x', 'age'], 'pt')).toBeNull();
    expect(targetFor(undefined, 'pt')).toBeNull();
  });

  it('resolves every published id to a page', () => {
    const dir = path.join(process.cwd(), 'public/data', POPULATION_DATA_DIR, 'q');
    let checked = 0;
    for (const bucket of '0123456789abcdef') {
      const lookup = JSON.parse(readFileSync(path.join(dir, `${bucket}.json`), 'utf8')) as Record<string, [string, string]>;
      for (const [id, entry] of Object.entries(lookup)) {
        expect(isQueryId(id)).toBe(true);
        expect(queryBucket(id)).toBe(bucket);
        const parsed = parseCanonicalPath(`/populacao/v/${POPULATION_RELEASE}/q/${id}`);
        expect(parsed).toEqual({ release: POPULATION_RELEASE, id });
        expect(targetFor(entry, 'pt')).not.toBeNull();
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
