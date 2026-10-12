// One fix to Next 15.5's client router, for a static export.
//
// A link inside the site fetches the target page's RSC payload first
// (`/pt/populacao/index.txt`). When that fetch fails (a dropped connection, a
// network change on a phone, a blocked request), Next falls back to a full page
// load, but of the payload's address, not the page's, so the reader lands on a
// screen of raw RSC text at /pt/populacao/index.txt. Every other fallback in
// the same function strips the `.txt` first (`doMpaNavigation`); the catch
// block does not. Next 16 fixed it (the catch returns `originalUrl`); 15.5.27,
// the last 15.5, has not. The fix sends the catch through doMpaNavigation, in
// the CommonJS and ESM builds of the file. Delete this script with the move to
// Next 16.

import fs from 'node:fs';
import path from 'node:path';

export const NEXT_ROUTER_FILES = [
  'next/dist/client/components/router-reducer/fetch-server-response.js',
  'next/dist/esm/client/components/router-reducer/fetch-server-response.js',
];

const BROKEN = /(\} catch \(err\) \{[\s\S]{0,900}?return \{\s*flightData: )url\.toString\(\)(,)/;
const FIXED = /\} catch \(err\) \{[\s\S]{0,900}?return \{\s*flightData: doMpaNavigation\(url\)\.flightData,/;

/** The patched source; throws when the code no longer looks like Next 15.5's. */
export function patchFetchServerResponse(source) {
  if (FIXED.test(source)) return source;
  if (!BROKEN.test(source)) {
    throw new Error('fetch-server-response.js changed: check whether a failed RSC fetch still navigates to the .txt address');
  }
  return source.replace(BROKEN, '$1doMpaNavigation(url).flightData$2');
}

/** Patches the installed files in place; returns the paths it changed. */
export function patchNext(nodeModules = path.join(process.cwd(), 'node_modules')) {
  const changed = [];
  for (const file of NEXT_ROUTER_FILES) {
    const full = path.join(nodeModules, file);
    const source = fs.readFileSync(full, 'utf8');
    const patched = patchFetchServerResponse(source);
    if (patched !== source) {
      fs.writeFileSync(full, patched);
      changed.push(file);
    }
  }
  return changed;
}
