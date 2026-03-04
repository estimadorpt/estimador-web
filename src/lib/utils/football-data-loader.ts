import { promises as fs } from 'fs';
import path from 'path';
import type { LigaPrediction, ScenarioData, LigaHistorical } from '@/types/football';

const FOOTBALL_DIR = 'football/liga-2025-26';

async function loadFootballJson<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'public', 'data', FOOTBALL_DIR, filename);
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// Find the latest matchday file (highest number)
async function findLatestMatchday(): Promise<number> {
  const dir = path.join(process.cwd(), 'public', 'data', FOOTBALL_DIR);
  const files = await fs.readdir(dir);
  const matchdayFiles = files
    .filter(f => /^md\d+\.json$/.test(f))
    .map(f => parseInt(f.match(/^md(\d+)\.json$/)![1]))
    .sort((a, b) => b - a);
  return matchdayFiles[0] || 0;
}

// Load latest matchday prediction + scenarios
export async function loadLigaData(_season?: string) {
  try {
    const latestMd = await findLatestMatchday();
    const [prediction, scenarios] = await Promise.all([
      loadFootballJson<LigaPrediction>(`md${latestMd}.json`),
      loadFootballJson<ScenarioData>(`md${latestMd}_scenarios.json`).catch(() => null),
    ]);
    return { prediction, scenarios, matchday: latestMd };
  } catch (error) {
    console.error('Error loading liga data:', error);
    return { prediction: null, scenarios: null, matchday: 0 };
  }
}

// Load all historical matchday files for time-series charts
export async function loadLigaHistorical(): Promise<LigaHistorical> {
  try {
    const dir = path.join(process.cwd(), 'public', 'data', FOOTBALL_DIR);
    const files = await fs.readdir(dir);
    const matchdayFiles = files
      .filter(f => /^md\d+\.json$/.test(f))
      .sort((a, b) => {
        const mdA = parseInt(a.match(/^md(\d+)\.json$/)![1]);
        const mdB = parseInt(b.match(/^md(\d+)\.json$/)![1]);
        return mdA - mdB;
      });

    const predictions = await Promise.all(
      matchdayFiles.map(f => loadFootballJson<LigaPrediction>(f))
    );
    return predictions;
  } catch (error) {
    console.error('Error loading historical liga data:', error);
    return [];
  }
}

// Lightweight loader for homepage summary
export async function loadLigaSummary() {
  try {
    const latestMd = await findLatestMatchday();
    const prediction = await loadFootballJson<LigaPrediction>(`md${latestMd}.json`);
    return {
      matchday: latestMd,
      season: prediction.season,
      timestamp: prediction.timestamp,
      top3: prediction.table.slice(0, 3),
      nextMatchday: prediction.next_matchday,
      totalTeams: prediction.table.length,
    };
  } catch (error) {
    console.error('Error loading liga summary:', error);
    return null;
  }
}
