import type { ElectionConfig } from '@/types';
import { getElectionById } from './elections';

export type HomepageMode = 'standard' | 'election';
export type HomeSection = 'population' | 'football' | 'economy' | 'elections';

export interface HomepageConfig {
  /** 'standard' leads with the population atlas; 'election' leads with one configured election. */
  mode: HomepageMode;
  /** The election that leads in election mode: an id from src/lib/config/elections.ts. */
  election?: string;
}

/**
 * Editorial setting for the homepage hierarchy.
 *
 * To lead with an election during coverage, change this to
 * `{ mode: 'election', election: 'presidential-2026' }` (an id that exists in
 * src/lib/config/elections.ts) and rebuild. Nothing else moves: the same four
 * sections are placed in a different order and size. If that election has no
 * published data, the build logs a warning and the page keeps the standard
 * layout, so an old archive is never dressed up as live coverage.
 *
 * For a local preview without editing this file:
 *   HOMEPAGE_MODE=election HOMEPAGE_ELECTION=presidential-2026 npm run build
 */
export const HOMEPAGE: HomepageConfig = { mode: 'standard' };

/** The configured setting, with the environment override used for previews. */
export function homepageConfig(env: Record<string, string | undefined> = process.env): HomepageConfig {
  const mode = env.HOMEPAGE_MODE;
  if (mode === 'election' || mode === 'standard') {
    return { mode, election: env.HOMEPAGE_ELECTION ?? HOMEPAGE.election };
  }
  return HOMEPAGE;
}

export interface HomepageLayout {
  lead: HomeSection;
  secondary: HomeSection;
  support: [HomeSection, HomeSection];
  /** The election on the lead, only in election mode with published data. */
  election?: ElectionConfig;
  /** Why an election-mode request was not honoured. */
  fallback?: 'unknown-election' | 'no-data';
}

export const STANDARD_LAYOUT: HomepageLayout = {
  lead: 'population',
  secondary: 'football',
  support: ['economy', 'elections'],
};

/**
 * Placement only. Election mode needs an election that exists in the registry
 * and has data behind it; anything less falls back to the standard layout and
 * says why, so the page never invents a live election.
 */
export function resolveHomepageLayout(
  config: HomepageConfig,
  readiness: { electionHasData: (id: string) => boolean },
): HomepageLayout {
  if (config.mode !== 'election') return STANDARD_LAYOUT;
  const election = config.election ? getElectionById(config.election) : undefined;
  if (!election) return { ...STANDARD_LAYOUT, fallback: 'unknown-election' };
  if (!readiness.electionHasData(election.id)) return { ...STANDARD_LAYOUT, fallback: 'no-data' };
  return { lead: 'elections', secondary: 'population', support: ['football', 'economy'], election };
}

/** Where each configured election lives on the site. */
export const ELECTION_ROUTES: Record<string, string> = {
  'presidential-2026': '/eleicoes/presidenciais',
  'parliamentary-2025': '/eleicoes/legislativas',
};
