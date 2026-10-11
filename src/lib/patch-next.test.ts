import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { NEXT_ROUTER_FILES, patchFetchServerResponse } from '../../scripts/lib/patch-next.mjs';

const installed = (file: string) => fs.readFileSync(path.join(process.cwd(), 'node_modules', file), 'utf8');
const catchBlock = (source: string) => source.slice(source.indexOf('} catch (err) {'));

describe('patch-next: a failed RSC fetch falls back to the page, not its .txt', () => {
  it.each(NEXT_ROUTER_FILES)('finds its target in the installed %s', file => {
    const patched = catchBlock(patchFetchServerResponse(installed(file)));
    expect(patched).toMatch(/flightData: doMpaNavigation\(url\)\.flightData,/);
    expect(patched).not.toMatch(/flightData: url\.toString\(\)/);
  });

  it('is idempotent', () => {
    const once = patchFetchServerResponse(installed(NEXT_ROUTER_FILES[0]));
    expect(patchFetchServerResponse(once)).toBe(once);
  });

  it('refuses code it does not recognise', () => {
    expect(() => patchFetchServerResponse('export {}')).toThrow(/changed/);
  });
});
