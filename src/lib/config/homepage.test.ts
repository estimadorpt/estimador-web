import { describe, expect, it } from 'vitest';
import { HOMEPAGE, STANDARD_LAYOUT, homepageConfig, resolveHomepageLayout } from './homepage';

const withData = { electionHasData: () => true };
const withoutData = { electionHasData: () => false };

describe('homepage mode', () => {
  it('leads with the population atlas in standard mode', () => {
    expect(resolveHomepageLayout({ mode: 'standard' }, withData)).toEqual(STANDARD_LAYOUT);
  });

  it('leads with a configured election that has data', () => {
    const layout = resolveHomepageLayout({ mode: 'election', election: 'presidential-2026' }, withData);
    expect(layout.lead).toBe('elections');
    expect(layout.secondary).toBe('population');
    expect(layout.support).toEqual(['football', 'economy']);
    expect(layout.election?.id).toBe('presidential-2026');
    expect(layout.fallback).toBeUndefined();
  });

  it('falls back to the standard layout for an election that is not configured', () => {
    const layout = resolveHomepageLayout({ mode: 'election', election: 'municipal-2029' }, withData);
    expect(layout.lead).toBe('population');
    expect(layout.fallback).toBe('unknown-election');
  });

  it('falls back to the standard layout when the election has no published data', () => {
    const layout = resolveHomepageLayout({ mode: 'election', election: 'presidential-2026' }, withoutData);
    expect(layout.lead).toBe('population');
    expect(layout.election).toBeUndefined();
    expect(layout.fallback).toBe('no-data');
  });

  it('never leads with an election without an id', () => {
    expect(resolveHomepageLayout({ mode: 'election' }, withData).fallback).toBe('unknown-election');
  });

  it('honours the preview override and ignores anything else', () => {
    expect(homepageConfig({ HOMEPAGE_MODE: 'election', HOMEPAGE_ELECTION: 'presidential-2026' })).toEqual({ mode: 'election', election: 'presidential-2026' });
    expect(homepageConfig({ HOMEPAGE_MODE: 'carnival' })).toEqual(HOMEPAGE);
    expect(homepageConfig({})).toEqual(HOMEPAGE);
  });

  it('ships in standard mode', () => {
    expect(HOMEPAGE.mode).toBe('standard');
  });
});
