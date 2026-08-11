import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadPredictionGameData } from '@/lib/utils/football-data-loader';
import {
  buildFixtureIdIndex,
  gameFixtureId,
  historyFromServer,
  picksFromServer,
  picksToServer,
  probeGame,
  serverIdFor,
  signInHref,
  slugify,
  submitPicks,
} from '@/lib/utils/prediction-game-api';
import type { PickMap, ProbVector } from '@/lib/utils/prediction-game';

/**
 * The browser derives a server fixture id from team names rather than
 * downloading the 120 KB manifest. That shortcut is only safe while it agrees
 * with the manifest the model repo actually published, so the agreement is
 * asserted here against the real file.
 */
async function readManifest(): Promise<{
  season: string;
  matchdays: { matchday: number; fixtures: { id: string; home: string; away: string }[] }[];
} | null> {
  const dir = path.join(process.cwd(), 'public', 'data', 'football');
  const seasons = (await fs.readdir(dir)).filter(name => /^liga-\d{4}-\d{2}$/.test(name)).sort();
  for (const season of seasons.reverse()) {
    try {
      const file = path.join(dir, season, 'game_fixtures.json');
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      /* try an older season directory */
    }
  }
  return null;
}

describe('slugify — mirror of the model repo', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Sporting CP')).toBe('sporting-cp');
    expect(slugify('Vitoria SC')).toBe('vitoria-sc');
    expect(slugify('Academico Viseu')).toBe('academico-viseu');
  });

  it('folds the Portuguese accents the exporter folds', () => {
    expect(slugify('Famalicão')).toBe('famalicao');
    expect(slugify('Vitória SC')).toBe('vitoria-sc');
    expect(slugify('Estrela Amadora')).toBe('estrela-amadora');
  });

  it('collapses runs of punctuation and trims the edges', () => {
    expect(slugify('  A.C.  Milan!! ')).toBe('a-c-milan');
  });
});

describe('gameFixtureId', () => {
  it('pads the matchday to two digits', () => {
    expect(gameFixtureId(2, 'Sporting CP', 'Vitoria SC')).toBe(
      'md02-sporting-cp-vs-vitoria-sc',
    );
    expect(gameFixtureId(34, 'Casa Pia', 'Academico Viseu')).toBe(
      'md34-casa-pia-vs-academico-viseu',
    );
  });

  it('is direction-sensitive — home and away are not interchangeable', () => {
    expect(gameFixtureId(2, 'Porto', 'Benfica')).not.toBe(gameFixtureId(2, 'Benfica', 'Porto'));
  });

  it('reproduces every id in the published manifest', async () => {
    const manifest = await readManifest();
    expect(manifest).not.toBeNull();

    let checked = 0;
    for (const md of manifest!.matchdays) {
      for (const fixture of md.fixtures) {
        expect(gameFixtureId(md.matchday, fixture.home, fixture.away)).toBe(fixture.id);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(100);
  });
});

describe('buildFixtureIdIndex', () => {
  it('maps every published fixture in both directions', async () => {
    const data = (await loadPredictionGameData())!;
    const index = buildFixtureIdIndex(data);

    for (const round of data.rounds) {
      for (const fixture of round.fixtures) {
        const id = serverIdFor(index, round.matchday, fixture.key);
        expect(id).toBeTruthy();
        expect(index.toLocal.get(id!)).toBe(fixture.key);
        expect(index.matchdayOf.get(id!)).toBe(round.matchday);
      }
    }
  });

  it('agrees with the manifest for the rounds both files describe', async () => {
    const data = (await loadPredictionGameData())!;
    const manifest = await readManifest();
    const index = buildFixtureIdIndex(data);

    const published = new Set(
      manifest!.matchdays.flatMap(md => md.fixtures.map(f => f.id)),
    );
    for (const id of index.toLocal.keys()) {
      expect(published.has(id)).toBe(true);
    }
  });
});

describe('pick translation', () => {
  const index = buildFixtureIdIndex({
    season: '2026-27',
    generatedAt: '',
    rounds: [
      {
        matchday: 2,
        fixtures: [
          {
            key: 'Sporting CP|Vitoria SC',
            home: 'Sporting CP',
            away: 'Vitoria SC',
            model: [0.7, 0.2, 0.1],
            kickoff: null,
            result: null,
          },
          {
            key: 'Porto|Benfica',
            home: 'Porto',
            away: 'Benfica',
            model: [0.4, 0.3, 0.3],
            kickoff: null,
            result: null,
          },
        ],
      },
    ],
  });

  const picks: PickMap = {
    'Sporting CP|Vitoria SC': { p: [0.8, 0.15, 0.05] as ProbVector, pick: 'H' },
  };

  it('sends only the fixtures of the round that were picked', () => {
    const out = picksToServer(index, 2, picks, [
      'Sporting CP|Vitoria SC',
      'Porto|Benfica',
    ]);
    expect(Object.keys(out)).toEqual(['md02-sporting-cp-vs-vitoria-sc']);
    expect(out['md02-sporting-cp-vs-vitoria-sc']).toEqual([0.8, 0.15, 0.05]);
  });

  it('round-trips back to local keys', () => {
    const out = picksToServer(index, 2, picks, ['Sporting CP|Vitoria SC']);
    const back = picksFromServer(index, out);
    expect(back['Sporting CP|Vitoria SC'].p).toEqual([0.8, 0.15, 0.05]);
  });

  it('drops server picks for fixtures this page does not know about', () => {
    const back = picksFromServer(index, {
      'md99-nowhere-vs-nobody': [1, 0, 0],
    } as Record<string, ProbVector>);
    expect(back).toEqual({});
  });

  it('flattens a season history into one pick map', () => {
    const flat = historyFromServer(index, {
      '2': { 'md02-porto-vs-benfica': [0.5, 0.3, 0.2] as ProbVector },
    });
    expect(flat['Porto|Benfica'].p).toEqual([0.5, 0.3, 0.2]);
  });

  it('survives a null-ish history without throwing', () => {
    expect(
      historyFromServer(index, undefined as unknown as Record<string, Record<string, ProbVector>>),
    ).toEqual({});
  });
});

describe('signInHref', () => {
  it('sends the player back where they were', () => {
    expect(signInHref('/pt/desporto/liga/jogo-previsoes')).toBe(
      '/.auth/login/github?post_login_redirect_uri=%2Fpt%2Fdesporto%2Fliga%2Fjogo-previsoes',
    );
  });
});

/**
 * The fallback contract. Every one of these is a live production state — a
 * static host with no API, a deployed API with no storage account, a phone on
 * a dead connection — and every one of them must land the player in the
 * local-only game rather than on a broken page.
 */
describe('probeGame — degrades on anything short of a configured backend', () => {
  const original = globalThis.fetch;

  function stub(impl: () => Promise<Response> | never) {
    globalThis.fetch = (async () => impl()) as unknown as typeof fetch;
  }

  function jsonResponse(status: number, body: unknown): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => 'application/json; charset=utf-8' },
      json: async () => body,
    } as unknown as Response;
  }

  afterEach(() => {
    globalThis.fetch = original;
  });

  it('returns null when the host serves the SPA 404 page instead of JSON', async () => {
    stub(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        headers: { get: () => 'text/html' },
        json: async () => ({}),
      } as unknown as Response),
    );
    expect(await probeGame('2026-27')).toBeNull();
  });

  it('returns null when the API is deployed but unconfigured', async () => {
    stub(() => jsonResponse(200, { ok: true, configured: false, reason: 'no_storage' }));
    expect(await probeGame('2026-27')).toBeNull();
  });

  it('returns null when storage answers 503', async () => {
    stub(() => jsonResponse(503, { ok: false, configured: false, error: 'not_configured' }));
    expect(await probeGame('2026-27')).toBeNull();
  });

  it('returns null when the network throws', async () => {
    stub(() => {
      throw new Error('offline');
    });
    expect(await probeGame('2026-27')).toBeNull();
  });

  it('returns the health payload only when configured is true', async () => {
    stub(() =>
      jsonResponse(200, {
        ok: true,
        configured: true,
        season: '2026-27',
        serverTime: '2026-08-11T12:00:00Z',
        authenticated: false,
        authProvider: null,
        openMatchday: 2,
      }),
    );
    const health = await probeGame('2026-27');
    expect(health?.configured).toBe(true);
    expect(health?.openMatchday).toBe(2);
  });

  it('never throws out of a write, so a failed sync cannot break the page', async () => {
    stub(() => {
      throw new Error('offline');
    });
    await expect(
      submitPicks({
        season: '2026-27',
        matchday: 2,
        picks: { 'md02-porto-vs-benfica': [0.5, 0.3, 0.2] },
        credentials: null,
      }),
    ).resolves.toBeNull();
  });
});
