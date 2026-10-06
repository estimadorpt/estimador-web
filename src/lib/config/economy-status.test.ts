import { describe, expect, it } from 'vitest';
import status from './economy-status.json';
import { ECONOMY_PUBLISHED, economyState } from './economy-status';

const now = new Date('2026-10-05T12:00:00Z');

describe('economy status flag', () => {
  it('reads the editorial flag from the JSON file the OG script also reads', () => {
    expect(ECONOMY_PUBLISHED).toBe(status.published === true);
  });

  it('is in preparation while unpublished, however fresh the data is', () => {
    expect(economyState('2026-10-02', false, now)).toBe('preparing');
    expect(economyState(null, false, now)).toBe('preparing');
  });

  it('is live when published and the data is current', () => {
    expect(economyState('2026-10-02', true, now)).toBe('live');
  });

  it('pauses when published but the last run is past the staleness guard', () => {
    expect(economyState('2026-07-03', true, now)).toBe('paused');
  });
});
