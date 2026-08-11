import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Unit tests for pure logic only (no DOM, no Next runtime). Scoped to src/ and
// api/src so the build output in .next/, out/ and api/dist is never picked up.
//
// The game API's scoring lives in api/src and is tested by this same run: it
// must agree with the model repo's rps_single, and a separate test runner would
// be one more thing to remember to execute.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    include: ['src/**/*.test.ts', 'api/src/**/*.test.ts'],
    environment: 'node',
  },
});
