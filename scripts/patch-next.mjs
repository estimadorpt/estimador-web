#!/usr/bin/env node
// Applies scripts/lib/patch-next.mjs to node_modules (postinstall and prebuild;
// idempotent). It fails when a Next upgrade changes the patched code.

import { patchNext } from './lib/patch-next.mjs';

const changed = patchNext();
console.log(changed.length ? `patch-next: patched ${changed.join(', ')}` : 'patch-next: already patched');
