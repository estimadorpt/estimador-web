import { describe, expect, it } from 'vitest';
import { resolveInitialClub } from './club-preference';

const slugs = ['sporting', 'benfica', 'arouca', 'porto'];

describe('resolveInitialClub', () => {
  it('prefers a valid ?club= query value over a stored preference', () => {
    expect(resolveInitialClub('benfica', 'sporting', slugs)).toBe('benfica');
  });

  it('falls back to the stored preference when there is no query value', () => {
    expect(resolveInitialClub(null, 'arouca', slugs)).toBe('arouca');
    expect(resolveInitialClub(undefined, 'arouca', slugs)).toBe('arouca');
  });

  it('ignores an unknown query slug and falls back to the stored preference', () => {
    expect(resolveInitialClub('not-a-club', 'porto', slugs)).toBe('porto');
  });

  it('ignores an unknown stored slug', () => {
    expect(resolveInitialClub(null, 'not-a-club', slugs)).toBeNull();
  });

  it('returns null when neither source names a valid club', () => {
    expect(resolveInitialClub(null, null, slugs)).toBeNull();
    expect(resolveInitialClub(undefined, undefined, slugs)).toBeNull();
  });
});
