// game_fixtures.json is the only file carrying a fixture's own kickoff and
// confirmation status (see football-fixtures.ts's header comment). The loader
// lives with every other football loader so the season directory is defined
// once (FOOTBALL_DIR); this module keeps the import path the homepage and
// club surfaces already use.
export { loadGameFixtures } from '@/lib/utils/football-data-loader';
