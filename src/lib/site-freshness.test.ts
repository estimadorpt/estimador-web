import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEPLOY_GRACE_MINUTES,
  MATCH_MINUTES,
  MISSED_GAMES_FOR_ALARM,
  STALE_AFTER_HOURS,
  deployProblems,
  forecastProblems,
  kickoffs,
  latestPastKickoff,
  lisbonTime,
  liveProblems,
  missedGames,
  report,
  seasonFolders,
} from '../../scripts/lib/freshness.mjs';

const at = (iso: string) => Date.parse(iso);
const HOUR = 3_600_000;
const MINUTE = 60_000;

// Round 11 as it was played (four of its games), and the start of round 12.
const fixtures = {
  generated_at: '2026-11-14T14:02:23Z',
  matchdays: [
    {
      matchday: 11,
      fixtures: [
        { home: 'Famalicao', away: 'Arouca', kickoff: '2026-11-06T20:45:00Z' },
        { home: 'Vitoria SC', away: 'Porto', kickoff: '2026-11-08T18:00:00Z' },
        { home: 'Rio Ave', away: 'SC Braga', kickoff: '2026-11-08T20:30:00Z' },
        { home: 'Estrela Amadora', away: 'Benfica', kickoff: '2026-11-08T20:30:00Z' },
      ],
    },
    {
      matchday: 12,
      fixtures: [
        { home: 'Maritimo', away: 'Nacional', kickoff: '2026-11-27T20:15:00Z' },
        { home: 'Porto', away: 'Estoril', kickoff: '2026-11-28T18:00:00Z' },
      ],
    },
  ],
};
const LAST_KICKOFF = at('2026-11-08T20:30:00Z');
/** The job's commit after Sunday's 15:30 games: three games of round 11 were still to be played. */
const COMMIT_BEFORE_THE_EVENING = '2026-11-08T17:35:00Z';
/** The job's commit once the round was over. */
const COMMIT_AFTER_THE_ROUND = '2026-11-08T22:33:00Z';

describe('site freshness: the games the forecasts must follow', () => {
  it('reads the last game that has kicked off', () => {
    expect(latestPastKickoff(fixtures, at('2026-11-18T23:00:00Z'))).toEqual({
      home: 'Estrela Amadora',
      away: 'Benfica',
      at: LAST_KICKOFF,
      confirmed: true,
    });
    expect(latestPastKickoff(fixtures, at('2026-11-27T20:15:00Z'))?.home).toBe('Maritimo');
    expect(latestPastKickoff(fixtures, at('2026-08-01T00:00:00Z'))).toBeNull();
  });

  it('reads every game of the published season file', () => {
    const football = path.join(process.cwd(), 'public/data/football');
    const season = seasonFolders(fs.readdirSync(football)).find(name =>
      fs.existsSync(path.join(football, name, 'game_fixtures.json')),
    );
    expect(season).toMatch(/^liga-\d{4}-\d{2}$/);
    const published = JSON.parse(fs.readFileSync(path.join(football, season as string, 'game_fixtures.json'), 'utf8'));
    // If the producer renames a field, the check would read no games and never
    // raise the alarm: fail here instead. Every game the file lists must come
    // out with its two clubs and a kickoff the check can read.
    const listed = (published.matchdays ?? []).flatMap((matchday: { fixtures?: unknown[] }) => matchday.fixtures ?? []);
    const read = kickoffs(published);
    expect(listed.length).toBeGreaterThan(0);
    expect(read).toHaveLength(listed.length);
    expect(read.every(game => typeof game.home === 'string' && typeof game.away === 'string')).toBe(true);
    expect(typeof published.generated_at).toBe('string');
  });

  it('does not count placeholder dates as games', () => {
    const round15 = (confirmed: boolean) => ({
      matchdays: [
        ...fixtures.matchdays,
        {
          matchday: 15,
          fixtures: [
            { home: 'Famalicao', away: 'Porto', kickoff: '2026-12-20T00:00:00Z', kickoff_confirmed: confirmed },
            { home: 'Benfica', away: 'Arouca', kickoff: '2026-12-20T00:00:00Z', kickoff_confirmed: confirmed },
          ],
        },
      ],
    });
    const afterThePlaceholder = at('2026-12-23T09:00:00Z');
    const commitAfterRound12 = '2026-11-28T22:10:00Z';
    expect(kickoffs(round15(false)).at(-1)?.confirmed).toBe(false);
    expect(latestPastKickoff(round15(false), afterThePlaceholder)?.home).toBe('Porto');
    // The job published after round 12 and the league then moved round 15: no alarm.
    expect(
      forecastProblems({ fixtures: round15(false), lastDataCommit: commitAfterRound12, now: afterThePlaceholder }),
    ).toEqual([]);
    // With announced times the same two games would be a stop.
    expect(
      forecastProblems({ fixtures: round15(true), lastDataCommit: commitAfterRound12, now: afterThePlaceholder }),
    ).toHaveLength(1);
  });

  it('lists the season folders newest first and ignores Liga 2', () => {
    expect(seasonFolders(['liga-2025-26', 'liga2-2026-27', 'liga-2026-27'])).toEqual(['liga-2026-27', 'liga-2025-26']);
    expect(seasonFolders(['liga2-2026-27'])).toEqual([]);
  });
});

describe('site freshness: did a forecast follow the games?', () => {
  it('is quiet between rounds, however old the last commit', () => {
    expect(
      forecastProblems({ fixtures, lastDataCommit: COMMIT_AFTER_THE_ROUND, now: at('2026-11-26T09:00:00Z') }),
    ).toEqual([]);
  });

  it('is quiet while the round is being played and for the day and a half after it', () => {
    const justInside = LAST_KICKOFF + STALE_AFTER_HOURS * HOUR;
    // Vitoria SC – Porto is old enough by then, but one game alone is not a stop.
    expect(missedGames(fixtures, COMMIT_BEFORE_THE_EVENING, justInside).map(game => game.home)).toEqual(['Vitoria SC']);
    expect(forecastProblems({ fixtures, lastDataCommit: COMMIT_BEFORE_THE_EVENING, now: justInside })).toEqual([]);
  });

  it('raises the alarm when games were played and nothing followed', () => {
    const now = LAST_KICKOFF + STALE_AFTER_HOURS * HOUR + 1;
    expect(missedGames(fixtures, COMMIT_BEFORE_THE_EVENING, now)).toHaveLength(3);
    const problems = forecastProblems({ fixtures, lastDataCommit: COMMIT_BEFORE_THE_EVENING, now });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('3 games have kicked off since');
    expect(problems[0]).toContain('Vitoria SC – Porto (8 Nov 2026, 18:00)');
    expect(problems[0]).toContain('Estrela Amadora – Benfica (8 Nov 2026, 20:30)');
    expect(problems[0]).toContain('are from 8 Nov 2026, 17:35');
    expect(problems[0]).toContain('estimador-publish.err.log');
  });

  it('takes one game with nothing after it for a postponement', () => {
    // Round 12's Friday game is in the file, old enough, and no commit followed
    // it; Saturday's game is not yet a day and a half old.
    const sundayMorning = at('2026-11-29T09:00:00Z');
    expect(MISSED_GAMES_FOR_ALARM).toBe(2);
    expect(missedGames(fixtures, COMMIT_AFTER_THE_ROUND, sundayMorning).map(game => game.home)).toEqual(['Maritimo']);
    expect(forecastProblems({ fixtures, lastDataCommit: COMMIT_AFTER_THE_ROUND, now: sundayMorning })).toEqual([]);
    // A day later the second game is: the job missed the round.
    const mondayMorning = at('2026-11-30T09:00:00Z');
    expect(forecastProblems({ fixtures, lastDataCommit: COMMIT_AFTER_THE_ROUND, now: mondayMorning })).toHaveLength(1);
  });

  it('counts a commit as following a game only once the game could be over', () => {
    const now = at('2026-11-12T09:00:00Z');
    const tooEarly = new Date(LAST_KICKOFF + MATCH_MINUTES * MINUTE - 1).toISOString();
    const afterTheGames = new Date(LAST_KICKOFF + MATCH_MINUTES * MINUTE).toISOString();
    expect(missedGames(fixtures, tooEarly, now).map(game => game.home)).toEqual(['Rio Ave', 'Estrela Amadora']);
    expect(forecastProblems({ fixtures, lastDataCommit: tooEarly, now })).toHaveLength(1);
    expect(forecastProblems({ fixtures, lastDataCommit: afterTheGames, now })).toEqual([]);
  });

  it('says nothing when it has nothing to compare', () => {
    expect(forecastProblems({ fixtures, lastDataCommit: null, now: at('2026-11-12T09:00:00Z') })).toEqual([]);
    expect(
      forecastProblems({ fixtures: {}, lastDataCommit: COMMIT_BEFORE_THE_EVENING, now: at('2026-11-12T09:00:00Z') }),
    ).toEqual([]);
  });
});

describe('site freshness: did the last push to main deploy?', () => {
  const run = {
    run_number: 316,
    status: 'completed',
    conclusion: 'success',
    run_started_at: '2026-11-14T14:02:40Z',
    html_url: 'https://github.com/estimadorpt/estimador-web/actions/runs/1',
  };
  const now = at('2026-11-18T23:00:00Z');

  it('is quiet after a green deploy', () => {
    expect(deployProblems({ run, now })).toEqual([]);
  });

  it('raises the alarm after a failed one, with the run to open', () => {
    const problems = deployProblems({ run: { ...run, conclusion: 'failure' }, now });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('run 316');
    expect(problems[0]).toContain(run.html_url);
  });

  it('lets a deploy run for an hour before calling it stuck', () => {
    const running = { ...run, status: 'in_progress', conclusion: null };
    const started = at(run.run_started_at);
    expect(deployProblems({ run: running, now: started + DEPLOY_GRACE_MINUTES * MINUTE })).toEqual([]);
    expect(deployProblems({ run: running, now: started + DEPLOY_GRACE_MINUTES * MINUTE + 1 })).toHaveLength(1);
  });

  it('says nothing when no run was found', () => {
    expect(deployProblems({ run: null, now })).toEqual([]);
  });
});

describe('site freshness: does the live site serve what main holds?', () => {
  const base = 'https://estimador.pt';
  const healthy = {
    base,
    pageStatus: 200,
    fixturesStatus: 200,
    mainGeneratedAt: '2026-11-14T14:02:23Z',
    liveGeneratedAt: '2026-11-14T14:02:23Z',
    lastDataCommit: '2026-11-14T14:02:26Z',
    now: at('2026-11-18T23:00:00Z'),
  };

  it('is quiet when both sides agree', () => {
    expect(liveProblems(healthy)).toEqual([]);
  });

  it('raises the alarm when the host is down or the file is missing', () => {
    expect(liveProblems({ ...healthy, pageStatus: 503 })[0]).toContain('answered 503');
    expect(liveProblems({ ...healthy, pageStatus: null })[0]).toBe('https://estimador.pt/pt/ did not answer.');
    expect(liveProblems({ ...healthy, fixturesStatus: null, liveGeneratedAt: null })[0]).toContain('did not answer');
    expect(liveProblems({ ...healthy, fixturesStatus: 404, liveGeneratedAt: null })[0]).toContain('answered 404');
  });

  it('raises the alarm when the live site trails main after the deploy had its hour', () => {
    const behind = { ...healthy, liveGeneratedAt: '2026-11-08T22:33:30Z' };
    expect(liveProblems(behind)).toHaveLength(1);
    expect(liveProblems(behind)[0]).toContain('2026-11-08T22:33:30Z');
  });

  it('gives a fresh commit an hour to reach the host', () => {
    const commit = at('2026-11-14T14:02:26Z');
    const behind = { ...healthy, liveGeneratedAt: '2026-11-08T22:33:30Z' };
    expect(liveProblems({ ...behind, now: commit + DEPLOY_GRACE_MINUTES * MINUTE })).toEqual([]);
    expect(liveProblems({ ...behind, now: commit + DEPLOY_GRACE_MINUTES * MINUTE + 1 })).toHaveLength(1);
  });
});

describe('site freshness: the report', () => {
  const now = at('2026-11-18T23:00:00Z');

  it('writes Lisbon time, winter and summer', () => {
    expect(lisbonTime(at('2026-11-14T14:02:26Z'))).toBe('14 Nov 2026, 14:02');
    expect(lisbonTime(at('2026-08-14T14:02:26Z'))).toBe('14 Aug 2026, 15:02');
  });

  it('leads with the verdict and lists what it read', () => {
    const fine = report({ problems: [], facts: ['Last deploy: green.'], now });
    expect(fine.split('\n')[0]).toBe('estimador.pt is updating.');
    expect(fine).toContain('- Last deploy: green.');
    expect(fine).toContain('Checked on 18 Nov 2026, 23:00 (Lisbon time).');

    const stopped = report({ problems: ['The last deploy failed.'], facts: [], now });
    expect(stopped.split('\n')[0]).toBe('estimador.pt has stopped updating.');
    expect(stopped).toContain('- The last deploy failed.');
  });
});
