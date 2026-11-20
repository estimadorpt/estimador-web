import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALLOW_VARIABLE,
  PUBLISHED_PATH,
  PUBLISHED_ROOT,
  allowedChanges,
  changeToken,
  differenceInWords,
  folderDifference,
  manifestDifference,
  manifestUrl,
  publishedReport,
  publishedVerdict,
  releaseFolders,
  sha256,
} from '../../scripts/lib/published-data.mjs';
import { POPULATION_DATA_DIR } from './config/population';

const ROOT = process.cwd();
const bytes = (value: unknown) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
const manifest = (files: Record<string, string>, extra: Record<string, unknown> = {}) =>
  bytes({ schema: 'estimador-population-web-manifest/v1', release_version: '1.2.0', ...extra, files });

const FILES = { 'meta.json': 'aa', 'places.json': 'bb', 'game/index.json': 'cc' };
const COMMITTED = manifest(FILES);
/** What the owner's variable must say to accept v1.2.0 as COMMITTED has it. */
const TOKEN = changeToken('v1.2.0', COMMITTED);
type Verdict = Parameters<typeof publishedVerdict>[0];
const verdict = (live: Verdict['live'], more: Partial<Verdict> = {}) =>
  publishedVerdict({ folder: 'v1.2.0', committed: COMMITTED, live, ...more });

describe('published population releases: the reason for the check', () => {
  it('is that the host serves every release folder immutable for a year', () => {
    // If this header ever stops saying "immutable", a release may change in place again and
    // scripts/check-published-data.mjs (with its step in the deploy workflow) can go.
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'staticwebapp.config.json'), 'utf8')) as {
      routes: { route: string; headers?: Record<string, string> }[];
    };
    const rule = config.routes.find(route => route.route === `${PUBLISHED_PATH}/v*`);
    expect(rule?.headers?.['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('reads the folders the site publishes, and each matches its own manifest file for file', () => {
    // A moved folder or a renamed field fails here, instead of leaving the check with nothing to read.
    const folders = releaseFolders(fs.readdirSync(path.join(ROOT, PUBLISHED_ROOT)));
    expect(folders).toContain(path.basename(POPULATION_DATA_DIR));
    expect(`public/data/${POPULATION_DATA_DIR}`).toBe(`${PUBLISHED_ROOT}/${path.basename(POPULATION_DATA_DIR)}`);
    for (const folder of folders) {
      const directory = path.join(ROOT, PUBLISHED_ROOT, folder);
      const hashes: Record<string, string> = {};
      const walk = (at: string) => {
        for (const entry of fs.readdirSync(at, { withFileTypes: true })) {
          const file = path.join(at, entry.name);
          if (entry.isDirectory()) walk(file);
          else hashes[path.relative(directory, file).split(path.sep).join('/')] = sha256(fs.readFileSync(file));
        }
      };
      walk(directory);
      delete hashes['manifest.json'];
      expect(Object.keys(hashes).length, folder).toBeGreaterThan(3000);
      const text = fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8');
      expect(folderDifference(text, hashes), folder).toEqual({ mismatched: [], missing: [], unlisted: [] });
    }
  });

  it('runs in the deploy workflow before the build and the upload', () => {
    const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/azure-static-web-apps.yml'), 'utf8');
    const check = workflow.indexOf('run: node scripts/check-published-data.mjs');
    expect(check).toBeGreaterThan(-1);
    expect(check).toBeLessThan(workflow.indexOf('run: npm run build'));
    expect(check).toBeLessThan(workflow.indexOf('uses: Azure/static-web-apps-deploy@v1'));
  });
});

describe('published population releases: a folder against its own manifest', () => {
  it('finds a file with another hash, a file that is missing and a file that is not listed', () => {
    expect(folderDifference(COMMITTED.toString(), FILES)).toEqual({ mismatched: [], missing: [], unlisted: [] });
    expect(folderDifference(COMMITTED.toString(), { 'meta.json': 'aa', 'places.json': 'EDITED', 'q/z.json': 'zz' })).toEqual({
      mismatched: ['places.json'],
      missing: ['game/index.json'],
      unlisted: ['q/z.json'],
    });
    expect(folderDifference('not json', FILES)).toBeNull();
    // A file named like something every object has is still only a file.
    expect(folderDifference(JSON.stringify({ files: {} }), { toString: 'aa' })).toEqual({ mismatched: [], missing: [], unlisted: ['toString'] });
  });

  it('stops a deploy on a folder edited by hand, whatever the live site says', () => {
    const local = folderDifference(COMMITTED.toString(), { ...FILES, 'places.json': 'EDITED' });
    for (const live of [{ status: 200, bytes: COMMITTED }, { status: 404, bytes: null }, { failure: 'no answer in time' }]) {
      const edited = verdict(live, { local });
      expect(edited.state).toBe('inconsistent');
      expect(edited.line).toBe(
        '/data/population/v1.2.0: the folder does not match its own manifest.json: 1 file with another hash (places.json). ' +
          'That is a hand edit or a half-finished sync: run the population sync again, or restore the folder.',
      );
    }
    const report = publishedReport([verdict({ failure: 'no answer in time' }, { local })]);
    expect(report.ok).toBe(false);
    expect(report.text.startsWith('A population release folder does not match its own manifest.')).toBe(true);
  });

  it('stops on a manifest that cannot be read, and is not opened by the owner’s variable', () => {
    const broken = publishedVerdict({
      folder: 'v1.2.0',
      committed: bytes('{'),
      live: { status: 200, bytes: COMMITTED },
      allowed: [changeToken('v1.2.0', bytes('{'))],
    });
    expect(broken.state).toBe('inconsistent');
    expect(broken.line).toContain('cannot be read as a release manifest');
    expect(verdict({ status: 200, bytes: COMMITTED }, { local: null }).state).toBe('inconsistent');
    const local = folderDifference(COMMITTED.toString(), { ...FILES, 'places.json': 'EDITED' });
    expect(verdict({ status: 200, bytes: COMMITTED }, { local, allowed: [TOKEN] }).state).toBe('inconsistent');
  });

  it('goes on to the live site when the folder matches its manifest', () => {
    const local = folderDifference(COMMITTED.toString(), FILES);
    expect(verdict({ status: 200, bytes: COMMITTED }, { local }).state).toBe('same');
    expect(verdict({ status: 404, bytes: null }, { local }).state).toBe('new');
  });
});

describe('published population releases: the manifest against the live site', () => {
  it('finds the release folders among the names', () => {
    expect(releaseFolders(['v1.2.0', '.DS_Store', 'v1.0.3', 'geography', 'vintage'])).toEqual(['v1.0.3', 'v1.2.0']);
    expect(releaseFolders([])).toEqual([]);
  });

  it('asks the live site for the manifest of a release', () => {
    expect(manifestUrl('https://estimador.pt', 'v1.0.3')).toBe('https://estimador.pt/data/population/v1.0.3/manifest.json');
    expect(manifestUrl('https://estimador.pt//', 'v1.2.0')).toBe('https://estimador.pt/data/population/v1.2.0/manifest.json');
  });

  it('passes a release the live site serves byte for byte', () => {
    const same = verdict({ status: 200, bytes: COMMITTED });
    expect(same.state).toBe('same');
    expect(same.line).toBe('/data/population/v1.2.0: the same as the live site.');
  });

  it('passes a release that is not on the site yet', () => {
    const fresh = verdict({ status: 404, bytes: null });
    expect(fresh.state).toBe('new');
    expect(fresh.line).toContain('a new release');
  });

  it('stops a deploy that changes a file of a release the site already serves, and names the file', () => {
    const live = manifest({ ...FILES, 'places.json': 'OLD' });
    const changed = verdict({ status: 200, bytes: live });
    expect(changed.state).toBe('changed');
    expect(changed.line).toContain('1 file changed (places.json)');
    expect(changed.line).toContain('new release number');
    expect(changed.line).toContain(`${ALLOW_VARIABLE}=${TOKEN} on this step lets this one change through.`);
    expect(publishedReport([changed]).ok).toBe(false);
    expect(publishedReport([changed]).text.startsWith('A published population release was changed in place.\n- /data/population/v1.2.0: ')).toBe(true);
  });

  it('stops on a file added to or taken from a published release, and on a manifest that alone differs', () => {
    const fewer = verdict({ status: 200, bytes: manifest({ 'meta.json': 'aa', 'places.json': 'bb' }) });
    expect(fewer.state).toBe('changed');
    expect(fewer.line).toContain('1 file added (game/index.json)');
    const more = verdict({ status: 200, bytes: manifest({ ...FILES, 'q/a.json': 'dd' }) });
    expect(more.state).toBe('changed');
    expect(more.line).toContain('1 file removed (q/a.json)');
    const relabelled = verdict({ status: 200, bytes: manifest(FILES, { data_status: 'draft' }) });
    expect(relabelled.state).toBe('changed');
    expect(relabelled.line).toContain('the same files, and another manifest');
  });

  it('lets a change through only where the owner accepted that very change, and still says what it costs', () => {
    expect(TOKEN).toMatch(/^v1\.2\.0@[0-9a-f]{12}$/);
    const live = manifest({ ...FILES, 'places.json': 'OLD' });
    const accepted = verdict({ status: 200, bytes: live }, { allowed: allowedChanges(` v1.0.3@0123456789ab, ${TOKEN} ,`) });
    expect(accepted.state).toBe('allowed');
    expect(accepted.line).toContain(`Allowed by ${ALLOW_VARIABLE}=${TOKEN}.`);
    expect(accepted.line).toContain('keep the old ones for up to a year');
    expect(publishedReport([accepted]).ok).toBe(true);
    expect(publishedReport([accepted]).text.startsWith(`A published population release was changed in place, and ${ALLOW_VARIABLE} lets it through.`)).toBe(true);
    // The folder's name alone opens nothing, nor does another folder's value.
    expect(verdict({ status: 200, bytes: live }, { allowed: allowedChanges('v1.2.0') }).state).toBe('changed');
    expect(verdict({ status: 200, bytes: live }, { allowed: allowedChanges(changeToken('v1.0.3', COMMITTED)) }).state).toBe('changed');
    expect(allowedChanges(undefined)).toEqual([]);
    expect(allowedChanges('')).toEqual([]);
  });

  it('opens nothing later: a second change to the same folder needs the owner again', () => {
    const live = manifest({ ...FILES, 'places.json': 'OLD' });
    const again = manifest({ ...FILES, 'places.json': 'EDITED AGAIN' });
    const later = publishedVerdict({ folder: 'v1.2.0', committed: again, live: { status: 200, bytes: live }, allowed: [TOKEN] });
    expect(later.state).toBe('changed');
    expect(later.line).toContain(`${ALLOW_VARIABLE}=${changeToken('v1.2.0', again)}`);
    expect(changeToken('v1.2.0', again)).not.toBe(TOKEN);
  });

  it('passes two manifests that are written differently and say the same', () => {
    // No file a reader holds has changed: only the manifest's spacing or the order of its keys.
    const spaced = bytes(`${JSON.stringify(JSON.parse(COMMITTED.toString()), null, 2)}\n`);
    const reordered = bytes({ files: { 'game/index.json': 'cc', 'places.json': 'bb', 'meta.json': 'aa' }, release_version: '1.2.0', schema: 'estimador-population-web-manifest/v1' });
    for (const live of [spaced, reordered]) {
      expect(sha256(live)).not.toBe(sha256(COMMITTED));
      const same = verdict({ status: 200, bytes: live });
      expect(same.state).toBe('same');
      expect(same.line).toBe('/data/population/v1.2.0: the same as the live site (the two manifests are written differently and say the same).');
    }
  });

  it('never stops a deploy because the site could not be asked', () => {
    // 18 November 2026: the name did not resolve, and the app answered 404 on every path.
    const noAnswer = verdict({ failure: 'its name does not resolve (EAI_AGAIN: the DNS servers gave no usable answer)' });
    expect(noAnswer.state).toBe('unknown');
    expect(noAnswer.line).toBe(
      '/data/population/v1.2.0: the live site did not answer: its name does not resolve (EAI_AGAIN: the DNS servers gave no usable answer). Nothing was compared.',
    );
    const notServing = verdict({ status: 404, bytes: null }, { hostServes: false });
    expect(notServing.state).toBe('unknown');
    expect(notServing.line).toContain('robots.txt');
    expect(verdict({ status: 503, bytes: null }).state).toBe('unknown');
    expect(verdict({ status: 302, bytes: null }).state).toBe('unknown');
    // A page that answers 200 for every address is not a manifest, and proves nothing.
    expect(verdict({ status: 200, bytes: bytes('<!doctype html><title>Parked</title>') }).state).toBe('unknown');
    expect(verdict({ status: 200, bytes: bytes({ files: [] }) }).state).toBe('unknown');
    const report = publishedReport([noAnswer, notServing]);
    expect(report.ok).toBe(true);
    expect(report.text.startsWith('The population releases could not be compared with the live site.')).toBe(true);
  });

  it('says so when every release was compared and none changed', () => {
    const report = publishedReport([verdict({ status: 200, bytes: COMMITTED }), verdict({ status: 404, bytes: null })]);
    expect(report.ok).toBe(true);
    expect(report.text.startsWith('No published population release was changed in place.')).toBe(true);
  });

  it('names at most five files of a long difference', () => {
    const names = Array.from({ length: 8 }, (_, i) => `parish/0${i}.json`);
    expect(differenceInWords({ changed: names, added: [], removed: [] })).toBe(
      '8 files changed (parish/00.json, parish/01.json, parish/02.json, parish/03.json, parish/04.json and 3 more)',
    );
    expect(manifestDifference('not json', JSON.stringify({ files: {} }))).toBeNull();
    expect(manifestDifference(JSON.stringify({ files: { b: '1', a: '1' } }), JSON.stringify({ files: { a: '2', c: '1' } }))).toEqual({
      changed: ['a'],
      added: ['b'],
      removed: ['c'],
    });
  });
});
