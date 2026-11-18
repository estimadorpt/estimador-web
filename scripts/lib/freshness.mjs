// The rules behind the daily "is the site still updating?" check
// (scripts/check-freshness.mjs, .github/workflows/site-freshness.yml).
//
// The site is a static export: nothing on it moves unless a commit reaches
// `main` and its deploy succeeds. Two things have stopped that without anyone
// noticing. A data sync that makes `npm run check` fail turns every later
// deploy red (24 October to 1 November 2026, eight days). And the job on the
// Mac that publishes the Liga forecasts can stop, or not be scheduled for the
// day a game is played, so no commit arrives at all. Each function below
// answers one of those questions from plain values, so the rules can be tested
// without the network.

/** A game this old, with no forecast file made after it, was missed. */
export const STALE_AFTER_HOURS = 36;

/**
 * Kickoff to final whistle is never shorter than this (two halves and the
 * interval), so a data commit made sooner cannot know the game's result.
 */
export const MATCH_MINUTES = 105;

/**
 * How many missed games make a stop. One game with nothing after it is usually
 * a postponement (it keeps its date in the file until it is rescheduled, and
 * the job commits nothing when there is no result); two or more is a job that
 * did not run.
 */
export const MISSED_GAMES_FOR_ALARM = 2;

/** How long a deploy may run, and how long the live site may trail `main`. */
export const DEPLOY_GRACE_MINUTES = 60;

const HOUR = 3_600_000;
const MINUTE = 60_000;

const LISBON = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Lisbon',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** "14 Nov 2026, 14:02" in Lisbon time: the clock the owner reads. */
export function lisbonTime(instant) {
  return LISBON.format(new Date(instant));
}

/**
 * The `liga-YYYY-YY` folders among directory names, newest first. The check
 * reads the newest one that already has a fixtures file: a new season's folder
 * can appear before its calendar does.
 */
export function seasonFolders(names) {
  return names.filter(name => /^liga-\d{4}-\d{2}$/.test(name)).sort().reverse();
}

/**
 * Every game in a game_fixtures.json as { home, away, at, confirmed }, oldest
 * first (at = epoch ms). A round whose times the league has not announced
 * carries `kickoff_confirmed: false` and a placeholder date.
 */
export function kickoffs(fixturesJson) {
  return (fixturesJson?.matchdays ?? [])
    .flatMap(matchday => matchday.fixtures ?? [])
    .map(fixture => ({
      home: fixture.home,
      away: fixture.away,
      at: Date.parse(fixture.kickoff),
      confirmed: fixture.kickoff_confirmed !== false,
    }))
    .filter(game => Number.isFinite(game.at))
    .sort((a, b) => a.at - b.at);
}

/**
 * The last game that has kicked off by `now`, or null before the season's
 * first. Placeholder dates do not count: a round that is moved before its times
 * are announced would otherwise look like a game nobody followed. The next
 * round's times are always announced weeks ahead, so a stopped job is still
 * caught at the first round it misses.
 */
export function latestPastKickoff(fixturesJson, now) {
  return kickoffs(fixturesJson).filter(game => game.confirmed && game.at <= now).at(-1) ?? null;
}

/**
 * The games no forecast followed: kicked off more than STALE_AFTER_HOURS ago,
 * with the newest data commit made before they could have ended. Oldest first.
 */
export function missedGames(fixturesJson, lastDataCommit, now) {
  const committed = Date.parse(lastDataCommit);
  if (!Number.isFinite(committed)) return [];
  return kickoffs(fixturesJson).filter(
    game =>
      game.confirmed &&
      now - game.at > STALE_AFTER_HOURS * HOUR &&
      committed < game.at + MATCH_MINUTES * MINUTE,
  );
}

/**
 * Did the forecasts follow the football? `lastDataCommit` is the time of the
 * newest commit on `main` that touched the season's folder. Between rounds it
 * stays old for weeks, which is fine: the test is only whether a commit came
 * after the games that were played. The job on the Mac commits when there is a
 * new result, so one game with nothing after it is taken for a postponement
 * and two for a job that did not run (MISSED_GAMES_FOR_ALARM).
 */
export function forecastProblems({ fixtures, lastDataCommit, now }) {
  const missed = missedGames(fixtures, lastDataCommit, now);
  if (missed.length < MISSED_GAMES_FOR_ALARM) return [];
  const game = match => `${match.home} – ${match.away} (${lisbonTime(match.at)})`;
  return [
    `The forecasts stopped following the games. The newest forecast files on \`main\` are from ` +
      `${lisbonTime(Date.parse(lastDataCommit))}, and ${missed.length} games have kicked off since, from ` +
      `${game(missed[0])} to ${game(missed.at(-1))}. ` +
      'The publishing job on the Mac did not run or did not push: check that the Mac is on and awake, ' +
      'that the job is scheduled for the days these games were played, ' +
      'then read `~/Library/Logs/estimador-publish.err.log`.',
  ];
}

/**
 * Did the last push to `main` deploy? `run` is the newest run of the deploy
 * workflow for a push to `main`, as the GitHub API returns it, or null.
 */
export function deployProblems({ run, now }) {
  if (!run) return [];
  const started = Date.parse(run.run_started_at ?? run.created_at);
  const where = `run ${run.run_number} of ${lisbonTime(started)} (${run.html_url})`;
  if (run.status !== 'completed') {
    return now - started > DEPLOY_GRACE_MINUTES * MINUTE
      ? [`The last deploy from \`main\` has been running for more than ${DEPLOY_GRACE_MINUTES} minutes: ${where}.`]
      : [];
  }
  if (run.conclusion === 'success') return [];
  return [
    `The last deploy from \`main\` did not succeed (${run.conclusion}): ${where}. ` +
      'Nothing pushed since then is on the site. Open the run, fix the first failing check, and push.',
  ];
}

/**
 * Does the live site serve what `main` holds? Compares the `generated_at` of
 * the fixtures file on both sides, once a deploy has had time to finish.
 * `pageStatus` and `fixturesStatus` are the HTTP statuses of the Portuguese
 * homepage and of the live fixtures file (null when the host did not answer).
 */
export function liveProblems({ base, pageStatus, fixturesStatus, mainGeneratedAt, liveGeneratedAt, lastDataCommit, now }) {
  if (pageStatus !== 200) {
    return [pageStatus == null ? `${base}/pt/ did not answer.` : `${base}/pt/ answered ${pageStatus} instead of 200.`];
  }
  if (fixturesStatus !== 200) {
    return [
      `The live site ${fixturesStatus == null ? 'did not answer' : `answered ${fixturesStatus}`} ` +
        'for the Liga fixtures file, which `main` has.',
    ];
  }
  const committed = Date.parse(lastDataCommit);
  const settled = !Number.isFinite(committed) || now - committed > DEPLOY_GRACE_MINUTES * MINUTE;
  if (settled && mainGeneratedAt && liveGeneratedAt !== mainGeneratedAt) {
    return [
      `The live site is behind \`main\`: it serves forecasts generated at ${liveGeneratedAt ?? 'an unknown time'}, ` +
        `and \`main\` has ${mainGeneratedAt}. The last deploy did not reach the host.`,
    ];
  }
  return [];
}

/** The Markdown the workflow posts in the alert issue, or prints when all is well. */
export function report({ problems, facts, now }) {
  const lines = problems.length
    ? ['estimador.pt has stopped updating.', '', ...problems.map(problem => `- ${problem}`)]
    : ['estimador.pt is updating.'];
  lines.push('', `Checked on ${lisbonTime(now)} (Lisbon time).`, ...facts.map(fact => `- ${fact}`));
  return `${lines.join('\n')}\n`;
}
