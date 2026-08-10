// Fixture slugs for the per-match pages (/desporto/liga/jogo/[slug]).
//
// Slugs are built from the team slugs in football.ts, e.g. "porto-alverca".
// IMPORTANT: never parse a slug back into team names — team slugs contain
// hyphens ("casa-pia", "rio-ave"), so "casa-pia-benfica" is not splittable.
// Always resolve a slug through the index built by buildFixtureIndex().

import { ligaTeamSlugs } from '@/lib/config/football';

/** Fallback slugifier for teams missing from ligaTeamSlugs. */
function slugifyTeam(team: string): string {
  return team
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'equipa';
}

/** Team slug used inside fixture slugs. */
export function teamSlug(team: string): string {
  return ligaTeamSlugs[team] ?? slugifyTeam(team);
}

/** Fixture slug, home team first: fixtureSlug("Porto", "Alverca") → "porto-alverca". */
export function fixtureSlug(home: string, away: string): string {
  return `${teamSlug(home)}-${teamSlug(away)}`;
}

/** Public URL path (locale is applied by the next-intl Link/router). */
export function fixtureHref(home: string, away: string): string {
  return `/desporto/liga/jogo/${fixtureSlug(home, away)}`;
}

export interface SluggableFixture {
  home: string;
  away: string;
  matchday: number;
}

/**
 * Assign unique slugs to a list of fixtures.
 *
 * Two different fixtures can only collide if a team name is missing from
 * ligaTeamSlugs and slugifies onto another team; the same pairing appearing
 * twice (e.g. the same fixture listed for two matchdays) also collides.
 * Both cases are disambiguated deterministically: "-jN" (matchday), then an
 * incrementing counter. Exact duplicates of the same fixture are dropped.
 */
export function assignFixtureSlugs<T extends SluggableFixture>(
  fixtures: T[],
): (T & { slug: string })[] {
  const used = new Set<string>();
  const seen = new Set<string>();
  const out: (T & { slug: string })[] = [];

  for (const fx of fixtures) {
    const identity = `${fx.home}|${fx.away}|${fx.matchday}`;
    if (seen.has(identity)) continue;
    seen.add(identity);

    const base = fixtureSlug(fx.home, fx.away);
    let slug = base;
    if (used.has(slug)) slug = `${base}-j${fx.matchday}`;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    out.push({ ...fx, slug });
  }

  return out;
}
