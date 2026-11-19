// A published population release never changes in place
// (scripts/check-published-data.mjs, the deploy workflow).
//
// staticwebapp.config.json serves `/data/population/v*` with
// `cache-control: public, max-age=31536000, immutable`: a browser that has one
// of a release's files keeps it for a year without asking again. A deploy that
// changes a file of a release the site already serves therefore splits the
// readers in two, those who hold the old bytes and those who get the new ones,
// and no later deploy can reach the first group. Nothing else notices: every
// check and the smoke check read the new files.
//
// Each release folder has a `manifest.json` with the SHA-256 of every other
// file in it. Two comparisons answer for the whole folder: the folder against
// its own manifest (no file was edited by hand, added or dropped), and that
// manifest against the one the live site serves. The functions below make both
// from plain values, so the rule can be tested without the disk or the network.

import { createHash } from 'node:crypto';

/** Where the release folders live in the checkout, and under which path the site serves them. */
export const PUBLISHED_ROOT = 'public/data/population';
export const PUBLISHED_PATH = '/data/population';

/**
 * The owner's way through, once the consequence is accepted: the variable is
 * set to `<folder>@<the first 12 characters of the committed manifest's
 * SHA-256>` (several, comma-separated). The value names the content it
 * accepts, so it lets that one change through and no later one, even if it is
 * never removed. The line of a stopped run prints it (`changeToken`).
 */
export const ALLOW_VARIABLE = 'PUBLISHED_DATA_CHANGE_OK';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

/** The release folders among the names under PUBLISHED_ROOT: `v1.0.3`, `v1.2.0`… */
export function releaseFolders(names) {
  return names.filter(name => /^v\d/.test(name)).sort();
}

/** The address of a release's manifest on a host. */
export function manifestUrl(base, folder) {
  return `${base.replace(/\/+$/, '')}${PUBLISHED_PATH}/${folder}/manifest.json`;
}

/** The changes an `ALLOW_VARIABLE` value accepts, as it lists them. */
export function allowedChanges(value) {
  return (value ?? '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean);
}

/** What `ALLOW_VARIABLE` must say to accept this folder with this manifest: `v1.2.0@3fa9c1d2e4b7`. */
export function changeToken(folder, committed) {
  return `${folder}@${sha256(committed).slice(0, 12)}`;
}

/** The `files` list of a manifest (name → SHA-256), or null when the text is not one. */
function filesOf(text) {
  try {
    const files = JSON.parse(text)?.files;
    return files && typeof files === 'object' && !Array.isArray(files) ? files : null;
  } catch {
    return null;
  }
}

/**
 * How a folder differs from its own manifest, by file name, sorted:
 * `mismatched` (another hash), `missing` (listed and not there) and `unlisted`
 * (there and not listed). `hashes` maps every file in the folder, the manifest
 * itself apart, to its SHA-256. Null when the text is not a manifest.
 */
export function folderDifference(manifestText, hashes) {
  const files = filesOf(manifestText);
  if (!files) return null;
  const mismatched = [];
  const missing = [];
  for (const [name, hash] of Object.entries(files)) {
    if (!Object.hasOwn(hashes, name)) missing.push(name);
    else if (hashes[name] !== hash) mismatched.push(name);
  }
  const unlisted = Object.keys(hashes).filter(name => !Object.hasOwn(files, name));
  return { mismatched: mismatched.sort(), missing: missing.sort(), unlisted: unlisted.sort() };
}

/**
 * The files two manifests disagree on, by name, sorted: `changed` (another
 * hash), `added` (only in the committed one) and `removed` (only in the live
 * one). Null when either text is not a manifest.
 */
export function manifestDifference(committedText, liveText) {
  const committed = filesOf(committedText);
  const live = filesOf(liveText);
  if (!committed || !live) return null;
  const changed = [];
  const added = [];
  for (const [name, hash] of Object.entries(committed)) {
    if (!Object.hasOwn(live, name)) added.push(name);
    else if (live[name] !== hash) changed.push(name);
  }
  const removed = Object.keys(live).filter(name => !Object.hasOwn(committed, name));
  return { changed: changed.sort(), added: added.sort(), removed: removed.sort() };
}

/** A parsed JSON value with the keys of every object in order. */
function inOrder(value) {
  if (Array.isArray(value)) return value.map(inOrder);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, inOrder(value[key])]),
    );
  }
  return value;
}

/** Do two JSON texts say the same, whatever their spacing and the order of their keys? */
function sameContent(a, b) {
  try {
    return JSON.stringify(inOrder(JSON.parse(a))) === JSON.stringify(inOrder(JSON.parse(b)));
  } catch {
    return false;
  }
}

const some = (names, limit = 5) =>
  names.length > limit ? `${names.slice(0, limit).join(', ')} and ${names.length - limit} more` : names.join(', ');

/** "3 files changed (a.json, b.json, c.json), 1 file added (d.json)": every list that is not empty, five names at most. */
function inWords(lists) {
  return lists
    .filter(([, names]) => names.length)
    .map(([word, names]) => `${names.length} ${names.length === 1 ? 'file' : 'files'} ${word} (${some(names)})`)
    .join(', ');
}

/** What two manifests disagree on, in words. */
export function differenceInWords({ changed, added, removed }) {
  return (
    inWords([
      ['changed', changed],
      ['added', added],
      ['removed', removed],
    ]) || 'the same files, and another manifest (its release, status or source hashes)'
  );
}

/**
 * What to make of one release folder, as `{ folder, state, line }`.
 *
 * `committed` is the manifest in the checkout (bytes) and `local` what
 * `folderDifference` found between it and the folder's files (leave it out to
 * skip that comparison). `live` is what the site answered for the manifest:
 * `{ status, bytes }`, or `{ failure }` in words when there was no HTTP answer;
 * it is not read when the folder is inconsistent. `hostServes` says whether
 * the host serves its own files at all (its robots.txt answered 200): on
 * 18 November 2026 the app answered 404 on every path, and a 404 then says
 * nothing about a release. `allowed` lists the changes the owner accepted
 * (`allowedChanges`): a change passes only when its own `changeToken` is there.
 *
 * States, the first two of which stop a deploy:
 * - `inconsistent`: the folder does not match its own manifest, whatever the
 *   site serves;
 * - `changed`: the manifest differs from the one the live site serves;
 * - `allowed`: changed, and accepted;
 * - `same` (byte for byte, or two manifests that are written differently and
 *   say the same: no file a reader holds has changed), and `new` (not on the
 *   site yet);
 * - `unknown`: the site could not be asked, or what it answered is not a
 *   manifest. That is not a reason to stop (the smoke check reports a site
 *   that is down): only two manifests that can both be read and that differ
 *   stop a deploy.
 */
export function publishedVerdict({ folder, committed, local = undefined, live, hostServes = true, allowed = [] }) {
  const where = `${PUBLISHED_PATH}/${folder}`;
  const committedText = Buffer.from(committed).toString('utf8');
  if (!filesOf(committedText) || local === null) {
    return {
      folder,
      state: 'inconsistent',
      line: `${where}: the manifest.json in the checkout cannot be read as a release manifest. Run the population sync again, or restore the folder.`,
    };
  }
  if (local && (local.mismatched.length || local.missing.length || local.unlisted.length)) {
    const words = inWords([
      ['with another hash', local.mismatched],
      ['missing', local.missing],
      ['not listed', local.unlisted],
    ]);
    return {
      folder,
      state: 'inconsistent',
      line:
        `${where}: the folder does not match its own manifest.json: ${words}. ` +
        'That is a hand edit or a half-finished sync: run the population sync again, or restore the folder.',
    };
  }
  if (live.failure) {
    return { folder, state: 'unknown', line: `${where}: the live site did not answer: ${live.failure}. Nothing was compared.` };
  }
  if (live.status === 404) {
    return hostServes
      ? { folder, state: 'new', line: `${where}: not on the live site yet, a new release.` }
      : {
          folder,
          state: 'unknown',
          line: `${where}: the live site answered 404 and does not serve its own robots.txt either. Nothing was compared.`,
        };
  }
  if (live.status !== 200) {
    return { folder, state: 'unknown', line: `${where}: the live site answered ${live.status} for the manifest. Nothing was compared.` };
  }
  if (sha256(live.bytes) === sha256(committed)) {
    return { folder, state: 'same', line: `${where}: the same as the live site.` };
  }
  const liveText = Buffer.from(live.bytes).toString('utf8');
  const difference = manifestDifference(committedText, liveText);
  if (!difference) {
    return {
      folder,
      state: 'unknown',
      line: `${where}: the live site answered 200 with something that is not a release manifest. Nothing was compared.`,
    };
  }
  if (sameContent(committedText, liveText)) {
    return { folder, state: 'same', line: `${where}: the same as the live site (the two manifests are written differently and say the same).` };
  }
  const words = differenceInWords(difference);
  const token = changeToken(folder, committed);
  if (allowed.includes(token)) {
    return {
      folder,
      state: 'allowed',
      line:
        `${where}: differs from the live site: ${words}. Allowed by ${ALLOW_VARIABLE}=${token}. ` +
        'Readers who already hold these files keep the old ones for up to a year.',
    };
  }
  return {
    folder,
    state: 'changed',
    line:
      `${where}: differs from what the live site already serves: ${words}. ` +
      'A published release is served immutable for a year, so readers who hold its files would keep the old ones ' +
      'and no deploy could reach them. Publish the correction as a new release number (as v1.0.1 to v1.0.3 were) ' +
      `and leave this folder as it is. Only on the owner's word: ${ALLOW_VARIABLE}=${token} on this step lets this one change through.`,
  };
}

/** The lines the check prints, and whether the deploy may go on. */
export function publishedReport(verdicts) {
  const has = state => verdicts.some(verdict => verdict.state === state);
  const headline = has('changed')
    ? 'A published population release was changed in place.'
    : has('inconsistent')
      ? 'A population release folder does not match its own manifest.'
      : has('allowed')
        ? `A published population release was changed in place, and ${ALLOW_VARIABLE} lets it through.`
        : verdicts.some(verdict => verdict.state !== 'unknown')
          ? 'No published population release was changed in place.'
          : 'The population releases could not be compared with the live site.';
  return {
    ok: !has('changed') && !has('inconsistent'),
    text: `${[headline, ...verdicts.map(verdict => `- ${verdict.line}`)].join('\n')}\n`,
  };
}
