import status from './housing-status.json';

/**
 * The one editorial switch for the housing page (/habitacao), on the model of
 * the economy's (economy-status.ts).
 *
 * `published: false` (src/lib/config/housing-status.json) means a draft: the
 * page is built and reachable by its address, but noindexed, left out of the
 * sitemap, and absent from the header, footer and homepage. Publishing is the
 * owner's call; before it, scripts/validate-data.mjs requires the Lisbon
 * licensing figures to come from the report, not the transcription.
 */
export const HOUSING_PUBLISHED: boolean = status.published === true;
