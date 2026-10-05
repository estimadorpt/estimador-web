import { promises as fs } from 'fs';
import path from 'path';
import type { GameFixturesData } from '@/lib/football-fixtures';

// Mirrors src/lib/utils/football-data-loader.ts's own FOOTBALL_DIR constant.
// Duplicated rather than imported so this file (owned by the homepage/club
// football surfaces) does not reach into a loader shared by every other
// football route; both point at the same current-season directory.
const FOOTBALL_DIR = 'football/liga-2026-27';

/**
 * game_fixtures.json is the only file carrying a fixture's own kickoff and
 * confirmation status (see football-fixtures.ts's header comment). Not every
 * season/build publishes it, so absence is a normal outcome, not an error.
 */
export async function loadGameFixtures(): Promise<GameFixturesData | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', FOOTBALL_DIR, 'game_fixtures.json');
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as GameFixturesData;
  } catch {
    return null;
  }
}
