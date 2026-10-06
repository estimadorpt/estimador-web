/**
 * The synthetic population release the site publishes.
 *
 * Bumping the release means: run `./scripts/sync-data.sh population` against the
 * new handoff (it writes public/data/population/v<release>/), change RELEASE
 * here, and update the download links. Old versioned data stays readable until
 * it is deleted, so shared links can say which release they used.
 */
export const POPULATION_RELEASE = '1.0.3';

/** Publication date of the release. */
export const POPULATION_PUBLISHED = '2026-10-05';

/**
 * Day 0 of Freguesia misteriosa (N.º 1, the curated parish 030857): the day the
 * site goes live, not the release date, so the public's first game is N.º 1.
 * scripts/sync-population.py reads this line and writes the same date into
 * game/index.json (a test checks they match). It must equal the first deploy
 * date: if the launch moves, change it here, re-run the sync, and only then
 * deploy. /data/population/v* is served immutable, so it cannot move after.
 */
export const POPULATION_GAME_EPOCH = '2026-10-06';

/** Where the compact files live, relative to the site root. */
export const POPULATION_DATA_PATH = `/data/population/v${POPULATION_RELEASE}`;

/** The same, as a directory under public/data for build-time loaders. */
export const POPULATION_DATA_DIR = `population/v${POPULATION_RELEASE}`;

const REPO = 'https://github.com/estimadorpt/pt-synthpop';
const ASSET = (name: string) => `${REPO}/releases/download/v${POPULATION_RELEASE}/${name}`;

/**
 * The microdata are too large for the website's host; they are published as a
 * GitHub release of a public data repository (Zenodo can mint a DOI from it).
 */
export const POPULATION_DOWNLOADS = {
  repository: REPO,
  release: `${REPO}/releases/tag/v${POPULATION_RELEASE}`,
  // Pinned to the release's tag, so the documents match the data the site serves.
  modelCard: `${REPO}/blob/v${POPULATION_RELEASE}/MODEL_CARD.md`,
  errata: `${REPO}/blob/v${POPULATION_RELEASE}/ERRATA.md`,
  /**
   * Every release on GitHub (v1.0.0, v1.0.1 and the current one; v1.0.2 was
   * never released there). All of 2026-10-05; the current one supersedes them.
   */
  releases: `${REPO}/releases`,
  issues: `${REPO}/issues`,
  files: [
    // Sizes of the GitHub release assets; the four single files are also in
    // release.json's package list (tested), the zip only on GitHub.
    { key: 'package', name: `pt-synthpop-v${POPULATION_RELEASE}.zip`, bytes: 181_731_672 },
    { key: 'persons', name: `pt-synthpop-v${POPULATION_RELEASE}-persons.parquet`, bytes: 78_216_701 },
    { key: 'households', name: `pt-synthpop-v${POPULATION_RELEASE}-households.parquet`, bytes: 6_766_320 },
    { key: 'quality', name: `pt-synthpop-v${POPULATION_RELEASE}-quality.csv`, bytes: 668_145 },
    { key: 'metadata', name: `pt-synthpop-v${POPULATION_RELEASE}-metadata.json`, bytes: 66_748 },
    { key: 'checksums', name: 'checksums.sha256', bytes: 7_318 },
    { key: 'sums', name: 'SHA256SUMS', bytes: 573 },
  ].map(file => ({ ...file, url: ASSET(file.name) })),
} as const;

/** Site routes of the population section (locale-less, trailing slash added by links). */
export const POPULATION_ROUTES = {
  hub: '/populacao',
  parish: (code: string) => `/populacao/freguesia/${code}`,
  region: (slug: string) => `/populacao/regiao/${slug}`,
  game: '/populacao/misteriosa',
  quality: '/populacao/qualidade',
  methodology: '/populacao/metodologia',
  data: '/populacao/dados',
  explainer: '/populacao/miniatura',
} as const;
